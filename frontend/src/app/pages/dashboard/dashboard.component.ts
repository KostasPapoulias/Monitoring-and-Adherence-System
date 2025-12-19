import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MedicationsService } from 'src/app/global/services/medications/medications.service';
import { AdherenceService } from 'src/app/global/services/adherence/adherence.service';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';
import { ReportSummaryModel } from 'src/app/global/models/reports/report-summary.model';
import { PersonasService } from 'src/app/global/services/personas/personas.service';
import { PersonaModel } from 'src/app/global/models/personas/persona.model';
import { PersonaStateService } from 'src/app/global/services/personas/persona-state.service';
import { PresenceService, PresenceState } from 'src/app/global/services/presence/presence.service';
import { FaceRecognitionService } from 'src/app/global/services/face/face-recognition.service';
import { MOCK_MEDICATIONS, MOCK_PERSONAS, MOCK_POSTPONED, MOCK_SUMMARY } from 'src/app/global/mock/mock-data';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('bgVideo', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  medications: MedicationModel[] = [];
  summary: ReportSummaryModel = new ReportSummaryModel();
  personas: PersonaModel[] = [];
  selectedPersonaId: string | null = null;
  postponedEvents: any[] = [];
  nextMedication: MedicationModel | null = null;
  nextTime: string | null = null;
  private readonly actionableWindowMinutes = 100;
  presence: PresenceState | null = null;
  isWallDisplay = false;
  isMobile = false;
  viewMode: 'general' | 'detailed' = 'general';
  detailedPersona: any = null;
  detailedMeds: any[] = [];
  todaysMeds: MedicationModel[] = [];
  scanning = false;
  proximity: 'near' | 'far' | null = null;
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  // action modal state
  selectedMedication: MedicationModel | null = null;
  selectedScheduledAt: Date | null = null;
  actionError: string | null = null;
  // med status for visual feedback
  medStatuses: Map<string, 'postponed' | 'confirmed'> = new Map();

  constructor(
    private meds: MedicationsService,
    private adherence: AdherenceService,
    private personasSvc: PersonasService,
    private personaState: PersonaStateService,
    private presenceSvc: PresenceService,
    private face: FaceRecognitionService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;
    const qpPersona = this.route.snapshot.queryParamMap.get('personaId');
    if (qpPersona) {
      this.selectedPersonaId = qpPersona;
      this.personaState.set(qpPersona);
    }
    // BACKEND PULL DISABLED: presence subscription
    // this.presenceSvc.state().subscribe(state => {
    //   this.presence = state;
    //   this.isWallDisplay = state?.device === 'wall-display';
    //   this.viewMode = (state?.viewMode || 'general') as any;
    //   this.detailedPersona = state?.persona || null;
    //   this.detailedMeds = state?.meds || [];
    //   if (state?.persona?._id) {
    //     this.selectedPersonaId = state.persona._id;
    //   }
    //   console.log('[dashboard] presence state', state);
    // });

    // BACKEND PULL DISABLED: personas list
    // this.personasSvc.list().subscribe(list => {
    //   this.personas = list;
    //   const stored = this.personaState.current() || (list[0]?._id ?? null);
    //   if (stored) { this.onPersonaChange(stored); }
    // });
    this.personas = [...(MOCK_PERSONAS as any[])];
    {
      const stored = this.personaState.current() || (this.personas[0]?._id ?? null);
      if (stored) { this.onPersonaChange(stored); this.refreshData(stored); }
    }
    // BACKEND PULL DISABLED: persona state stream
    // this.personaState.get().subscribe(id => { if (id) this.refreshData(id); });

    // BACKEND PULL DISABLED: background face scan
    // if (!this.isMobile) {
    //   this.startBackgroundScan();
    // }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  onPersonaChange(id: string) {
    this.selectedPersonaId = id;
    this.personaState.set(id);
    this.medStatuses.clear();

    this.viewMode = 'detailed'; 
  this.isWallDisplay = true;
  this.detailedPersona = this.personas.find(p => p._id === id);
  }

  private async startBackgroundScan() {
    if (this.scanning) return;
    this.scanning = true;
    try {
      if (!this.face.modelsAreLoaded()) {
        await this.face.loadModels();
      }
      await this.startCamera();
      this.loopCompare();
    } catch (e) {
      console.error('Background scan init failed', e);
      this.scanning = false;
    }
  }

  private async startCamera() {
    const video = await this.waitForVideoEl();
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 }, audio: false });
    video.srcObject = this.stream;
    video.width = 320;
    video.height = 240;
    await video.play();
  }

  private async waitForVideoEl(timeoutMs = 1500): Promise<HTMLVideoElement> {
    const start = performance.now();
    while (!this.videoRef || !this.videoRef.nativeElement) {
      await new Promise((r) => requestAnimationFrame(r));
      if (performance.now() - start > timeoutMs) {
        throw new Error('Video element not ready');
      }
    }
    return this.videoRef.nativeElement;
  }

  private stopCamera() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.scanning = false;
  }

  private loopCompare = async () => {
    if (!this.scanning || !this.videoRef?.nativeElement) return;
    try {
      const det = await this.face.detectOnly(this.videoRef.nativeElement);
      console.log('[dashboard] face detectOnly', det);
      if (!det.detected) {
        this.proximity = null;
        // BACKEND PULL DISABLED: presence update
        // this.presenceSvc.update({ present: false, device: 'wall-display' }).subscribe();
      } else {
        this.proximity = det.proximity || null;
        const distanceMeters = this.proximity === 'near' ? 1 : this.proximity === 'far' ? 3 : null;
        const personaId = this.personaState.current();
        // BACKEND PULL DISABLED: presence update
        // this.presenceSvc.update({ present: true, device: 'wall-display', distanceMeters, personaId }).subscribe();
      }
    } catch (err) {
      console.error('Background compare error', err);
    }
    this.rafId = requestAnimationFrame(this.loopCompare);
  };

  private refreshData(userId: string) {
    // BACKEND PULL DISABLED: replace with mock data
    // this.meds.getAll().subscribe(ms => {
    //   this.medications = ms.filter(m => m.userId === userId);
    //   this.computeTodaysMeds();
    // });
    // this.adherence.summary({ userId }).subscribe(s => this.summary = s);
    // this.adherence.list({ userId, type: 'postponed' }).subscribe(evts => this.postponedEvents = evts || []);
    this.medications = (MOCK_MEDICATIONS as any[]).filter(m => m.userId === userId) as any;
    this.computeTodaysMeds();
    this.summary = { ...(MOCK_SUMMARY as any) };
    this.postponedEvents = [...(MOCK_POSTPONED as any[])];
    this.computeNextMedication();
  }

  private computeTodaysMeds() {
    const now = new Date();
    const todayMeds: { med: MedicationModel; time: string; date: Date }[] = [];
    for (const m of this.medications) {
      for (const t of m.times || []) {
        const [hh, mm] = t.split(':').map(x => parseInt(x, 10));
        const dt = new Date(now);
        dt.setHours(hh || 0, mm || 0, 0, 0);
        todayMeds.push({ med: m, time: t, date: dt });
      }
    }
    // sort by earliest time
    todayMeds.sort((a, b) => a.date.getTime() - b.date.getTime());
    this.todaysMeds = todayMeds.map(tm => tm.med);
  }

  private computeNextMedication() {
    const now = new Date();
    let best: { med: MedicationModel; time: string; date: Date } | null = null;
    for (const m of this.medications) {
      for (const t of m.times || []) {
        const [hh, mm] = t.split(':').map(x => parseInt(x, 10));
        const dt = new Date(now);
        dt.setHours(hh || 0, mm || 0, 0, 0);
        if (dt < now) continue;
        if (!best || dt < best.date) best = { med: m, time: t, date: dt };
      }
    }
    this.nextMedication = best?.med || null;
    this.nextTime = best?.time || null;
  }

  openMedicationDetails(med: MedicationModel) {
    const info = `${med.name}\nDose: ${med.dosage}\nFrequency: ${med.frequency}\nTimes: ${(med.times||[]).join(', ')}`;
    alert(info);
  }

  openAction(med: MedicationModel) {
    if (!this.isActionable(med)) { return; }
    this.selectedMedication = med;
    this.selectedScheduledAt = this.getNextScheduledDate(med);
    this.actionError = null;
  }

  closeAction() {
    this.selectedMedication = null;
    this.selectedScheduledAt = null;
    this.actionError = null;
  }

  confirmSelected() {
    if (!this.selectedMedication || !this.selectedScheduledAt) return;
    // BACKEND PULL DISABLED: adherence confirm
    // const payload: any = { ... };
    // this.adherence.confirm(payload).subscribe({ ... });
    this.medStatuses.set(this.selectedMedication!._id!, 'confirmed');
    const id = this.selectedPersonaId || this.personaState.current();
    if (id) this.refreshData(id);
    this.closeAction();
  }

  postponeSelected(minutes: number = 5) {
    if (!this.selectedMedication || !this.selectedScheduledAt) return;
    // BACKEND PULL DISABLED: adherence postpone
    // const payload = { ... };
    // this.adherence.postpone(payload).subscribe({ ... });
    this.medStatuses.set(this.selectedMedication!._id!, 'postponed');
    const id = this.selectedPersonaId || this.personaState.current();
    if (id) this.refreshData(id);
    this.closeAction();
  }

  getNextScheduledDate(med: MedicationModel): Date | null {
    const now = new Date();
    let best: Date | null = null;
    for (const t of med.times || []) {
      const [hh, mm] = t.split(':').map(x => parseInt(x, 10));
      const dt = new Date(now);
      dt.setHours(hh || 0, mm || 0, 0, 0);
      if (!best || Math.abs(dt.getTime() - now.getTime()) < Math.abs(best.getTime() - now.getTime())) {
        best = dt;
      }
    }
    return best;
  }

  isActionable(med: MedicationModel): boolean {
    const dt = this.getNextScheduledDate(med);
    if (!dt) return false;
    const diffMin = Math.abs((dt.getTime() - Date.now()) / 60000);
    return diffMin <= this.actionableWindowMinutes;
  }

  onCardClick(med: MedicationModel) {
    if (this.isActionable(med)) {
      this.openAction(med);
    }
  }

  cardClass(med: MedicationModel): string {
  const classes: string[] = [];
  const status = med._id ? this.medStatuses.get(med._id) : undefined;
  const actionable = this.isActionable(med);
  const hasAlert = this.hasAlertActive(med);

  if (hasAlert) {
    classes.push('alert-card-pulse', 'border-red-500', 'bg-red-600/30', 'text-red-100');
    return classes.join(' '); 
  }

  if (status === 'confirmed') {
    classes.push('border-emerald-500', 'bg-emerald-500/10', 'border-2');
  } 
  else if (status === 'postponed') {
    classes.push('border-yellow-500', 'bg-yellow-500/20', 'border-2');
  } 
  else if (actionable) {
    classes.push('border-emerald-500/50', 'bg-white/10', 'border-2', 'shadow-[0_0_15px_rgba(16,185,129,0.1)]');
  } 
  else {
    classes.push('border-white/10', 'bg-white/5', 'opacity-50');
  }

  return classes.join(' ');
}
get statusMessage() {
  const now = new Date();
  
  const alertMed = this.todaysMeds.find(m => this.hasAlertActive(m));
  if (alertMed) {
    return { 
      text: `Alert: Action required for ${alertMed.name}!`, 
      class: 'bg-red-600/20 border-red-500 text-red-200' 
    };
  }

  const overdueMed = this.todaysMeds.find(m => {
    const scheduled = this.getNextScheduledDate(m);
    if (!scheduled) return false;
    const diff = (now.getTime() - scheduled.getTime()) / 60000;
    return diff > 10 && !this.medStatuses.has(m._id!);
  });
  if (overdueMed) {
    return { 
      text: `Missed Action: You are 10+ minutes late for ${overdueMed.name}.`, 
      class: 'bg-orange-600/20 border-orange-500 text-orange-200' 
    };
  }

  const actionableMed = this.todaysMeds.find(m => this.isActionable(m) && !this.medStatuses.has(m._id!));
  if (actionableMed) {
    return { 
      text: `It's time for your ${actionableMed.name}. Please confirm or postpone.`, 
      class: 'bg-blue-600/20 border-blue-500 text-blue-200' 
    };
  }

  if (Array.from(this.medStatuses.values()).includes('postponed')) {
    return { 
      text: "You have postponed medications. Don't forget to take them later.", 
      class: 'bg-yellow-600/20 border-yellow-500 text-yellow-200' 
    };
  }

  return { 
    text: "Everything is on track for today. Great job!", 
    class: 'bg-green-600/20 border-green-500 text-green-200' 
  };
}


isMedicationOverdue(med: MedicationModel): boolean {
  const now = new Date();
  const scheduled = this.getNextScheduledDate(med);
  if (!scheduled) return false;
  
  const diffMinutes = (now.getTime() - scheduled.getTime()) / 60000;
  return diffMinutes > 10 && !this.medStatuses.has(med._id!);
}

hasAlertActive(med: MedicationModel): boolean {
  const anyMed: any = med as any;
  const hasDataAlert = !!(anyMed && anyMed.alert && anyMed.alert.active);
  const hasTimeAlert = this.isMedicationOverdue(med);
  
  return hasDataAlert || hasTimeAlert;
}

  hasAlertReason(med: MedicationModel): boolean {
    const anyMed: any = med as any;
    return !!(anyMed && anyMed.alert && anyMed.alert.reason);
  }

  alertReason(med: MedicationModel): string {
    const anyMed: any = med as any;
    return (anyMed && anyMed.alert && anyMed.alert.reason) || '';
  }
}
