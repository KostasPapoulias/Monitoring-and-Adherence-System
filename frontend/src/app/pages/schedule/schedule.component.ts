import { Component, OnInit } from '@angular/core';
import { MedicationsService } from 'src/app/global/services/medications/medications.service';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';
import { PersonasService } from 'src/app/global/services/personas/personas.service';
import { PersonaStateService } from 'src/app/global/services/personas/persona-state.service';
import { PersonaModel } from 'src/app/global/models/personas/persona.model';
import { MOCK_PERSONAS, MOCK_MEDICATIONS } from 'src/app/global/mock/mock-data';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
  isMobile = false;
  isWallDisplay = true;
  deviceMode: 'wall-display' | 'smartphone' | 'smartwatch' | 'smart-speaker' = 'wall-display';
  isCompactMode = false;
  uiTextSize: 'small' | 'medium' | 'large' = 'medium';
  view: 'day' | 'week' | 'month' = 'day';
  medications: MedicationModel[] = [];
  personas: PersonaModel[] = [];
  selectedPersonaId: string | null = null;
  selectedPersona: PersonaModel | null = null;

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
    this.selectedPersonaId = id;
    this.personaState.set(id);
    this.selectedPersona = this.personas.find(p => p._id === id) || null;
    this.deviceMode = (this.selectedPersona?.devicePrefs?.primaryDevice as any) || 'wall-display';
    this.isCompactMode = this.deviceMode !== 'wall-display';
    // Drive layout by persona device (not by window width)
    this.isMobile = this.isCompactMode;
    this.isWallDisplay = !this.isCompactMode;
    this.uiTextSize = (this.selectedPersona?.devicePrefs?.ui?.textSize as any) || 'medium';
    this.refreshData(id);
  }

  setView(v: 'day' | 'week' | 'month') { this.view = v; }

  private refreshData(userId: string) {
    // BACKEND PULL DISABLED: medications list
    // this.meds.getAll().subscribe(ms => this.medications = ms.filter(m => m.userId === userId));
    this.medications = (MOCK_MEDICATIONS as any[]).filter(m => m.userId === userId) as any;
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
}
