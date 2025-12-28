import { Component, OnInit } from '@angular/core';
import { MedicationsService } from 'src/app/global/services/medications/medications.service';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';
import { PersonasService } from 'src/app/global/services/personas/personas.service';
import { PersonaStateService } from 'src/app/global/services/personas/persona-state.service';
import { PersonaModel } from 'src/app/global/models/personas/persona.model';
import { MOCK_PERSONAS, MOCK_MEDICATIONS } from 'src/app/global/mock/mock-data';
import { ScheduleState, DeviceMode, ViewMode, TextSize } from './schedule.state';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
  isMobile = false;
  isWallDisplay = true;
  deviceMode: DeviceMode = DeviceMode.WALL;
  isCompactMode = false;
  uiTextSize: TextSize = 'medium';
  view: ViewMode = 'day';
  medications: MedicationModel[] = [];
  medIndex = 0;
  personas: PersonaModel[] = [];
  selectedPersonaId: string | null = null;
  selectedPersona: PersonaModel | null = null;

  state: ScheduleState = {
    medications: [],
    view: 'day',
    deviceMode: DeviceMode.WALL,
    isCompactMode: false,
    uiTextSize: 'medium',
    currentMed: null,
  };

  constructor(
    private meds: MedicationsService,
    private personasSvc: PersonasService,
    private personaState: PersonaStateService
  ) {}

  ngOnInit(): void {
    // BACKEND PULL DISABLED: personas list
    // this.personasSvc.list().subscribe(list => {
    //   this.personas = list;
    //   const stored = this.personaState.current() || (list[0]?._id ?? null);
    //   if (stored) { this.onPersonaChange(stored); }
    // });
      this.isMobile = window.innerWidth <= 768;

    this.personas = [...(MOCK_PERSONAS as any[])];
    {
      const stored = this.personaState.current() || (this.personas[0]?._id ?? null);
      if (stored) { this.onPersonaChange(stored); this.refreshData(stored); }
    }
    // BACKEND PULL DISABLED: persona state stream
    // this.personaState.get().subscribe(id => { if (id) this.refreshData(id); });
  }

  onPersonaChange(id: string) {
    if (this.selectedPersonaId === id) return; // Prevent infinite loop
    this.selectedPersonaId = id;
    this.personaState.set(id);
    this.selectedPersona = this.personas.find(p => p._id === id) || null;
    this.deviceMode = (this.selectedPersona?.devicePrefs?.primaryDevice as DeviceMode) || DeviceMode.WALL;
    this.isCompactMode = this.deviceMode !== DeviceMode.WALL;
    this.isMobile = this.isCompactMode;
    this.isWallDisplay = !this.isCompactMode;
    this.uiTextSize = (this.selectedPersona?.devicePrefs?.ui?.textSize as TextSize) || 'medium';
    this.refreshData(id);
    this.medIndex = 0;
    this.state = this.buildState();
  }

  setView(v: ViewMode) { 
    this.view = v; 
    this.state = this.buildState();
  }

  private refreshData(userId: string) {
    // BACKEND PULL DISABLED: medications list
    // this.meds.getAll().subscribe(ms => this.medications = ms.filter(m => m.userId === userId));
    this.medications = (MOCK_MEDICATIONS as any[]).filter(m => m.userId === userId) as any;
    if (this.medIndex >= this.medications.length) this.medIndex = 0;
    this.state = this.buildState();
  }

  get currentMed(): MedicationModel | null {
    return this.medications[this.medIndex] || null;
  }

  prevMed() {
    const len = this.medications.length;
    if (len === 0) return;
    this.medIndex = (this.medIndex - 1 + len) % len;
    this.state = this.buildState();
  }

  nextMed() {
    const len = this.medications.length;
    if (len === 0) return;
    this.medIndex = (this.medIndex + 1) % len;
    this.state = this.buildState();
  }

  getNextDoseTime(med: MedicationModel): string {
    const now = new Date();
    const times = (med.times || []).filter(Boolean);
    if (times.length === 0) return '--:--';

    const candidates = times
      .map(t => {
        const [hh, mm] = String(t).split(':').map(x => parseInt(x, 10));
        const dt = new Date(now);
        dt.setHours(hh || 0, mm || 0, 0, 0);
        return { t: String(t), dt };
      })
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());

    const upcoming = candidates.find(c => c.dt.getTime() >= now.getTime());
    return (upcoming || candidates[0]).t;
  }

  doseCount(med: MedicationModel): number {
    return (med.times || []).length;
  }

  private buildState(): ScheduleState {
    return {
      medications: this.medications,
      view: this.view,
      deviceMode: this.deviceMode,
      isCompactMode: this.isCompactMode,
      uiTextSize: this.uiTextSize,
      currentMed: this.currentMed,
    };
  }
}
