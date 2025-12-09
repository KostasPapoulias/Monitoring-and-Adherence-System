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
  presence: PresenceState | null = null;
  isWallDisplay = false;
  isMobile = false;
  viewMode: 'general' | 'detailed' = 'general';
  detailedPersona: any = null;
  detailedMeds: any[] = [];
  scanning = false;
  proximity: 'near' | 'far' | null = null;
  private stream: MediaStream | null = null;
  private rafId: number | null = null;

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
    // subscribe to presence for wall display UX
    this.presenceSvc.state().subscribe(state => {
      this.presence = state;
      this.isWallDisplay = state?.device === 'wall-display';
      this.viewMode = (state?.viewMode || 'general') as any;
      this.detailedPersona = state?.persona || null;
      this.detailedMeds = state?.meds || [];
      if (state?.persona?._id) {
        // sync selected persona when face recognition identifies user
        this.selectedPersonaId = state.persona._id;
      }
      console.log('[dashboard] presence state', state);
    });

    this.personasSvc.list().subscribe(list => {
      this.personas = list;
      const stored = this.personaState.current() || (list[0]?._id ?? null);
      if (stored) { this.onPersonaChange(stored); }
    });
    this.personaState.get().subscribe(id => { if (id) this.refreshData(id); });

    if (!this.isMobile) {
      this.startBackgroundScan();
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  onPersonaChange(id: string) {
    this.selectedPersonaId = id;
    this.personaState.set(id);
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
        this.presenceSvc.update({ present: false, device: 'wall-display' }).subscribe();
      } else {
        this.proximity = det.proximity || null;
        const distanceMeters = this.proximity === 'near' ? 1 : this.proximity === 'far' ? 3 : null;
        const personaId = this.personaState.current();
        this.presenceSvc.update({ present: true, device: 'wall-display', distanceMeters, personaId }).subscribe();
      }
    } catch (err) {
      console.error('Background compare error', err);
    }
    this.rafId = requestAnimationFrame(this.loopCompare);
  };

  private refreshData(userId: string) {
    this.meds.getAll().subscribe(ms => this.medications = ms.filter(m => m.userId === userId));
    this.adherence.summary({ userId }).subscribe(s => this.summary = s);
    this.adherence.list({ userId, type: 'postponed' }).subscribe(evts => this.postponedEvents = evts || []);
    // compute next medication by soonest upcoming time today
    this.computeNextMedication();
  }

  private computeNextMedication() {
    const now = new Date();
    let best: { med: MedicationModel; time: string; date: Date } | null = null;
    for (const m of this.medications) {
      for (const t of m.times || []) {
        const [hh, mm] = t.split(':').map(x => parseInt(x, 10));
        const dt = new Date(now);
        dt.setHours(hh || 0, mm || 0, 0, 0);
        if (dt < now) continue; // only upcoming today
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
}
