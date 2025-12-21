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
  view: 'day' | 'week' | 'month' = 'day';
  medications: MedicationModel[] = [];
  personas: PersonaModel[] = [];
  selectedPersonaId: string | null = null;

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
    this.refreshData(id);
  }

  setView(v: 'day' | 'week' | 'month') { this.view = v; }

  private refreshData(userId: string) {
    // BACKEND PULL DISABLED: medications list
    // this.meds.getAll().subscribe(ms => this.medications = ms.filter(m => m.userId === userId));
    this.medications = (MOCK_MEDICATIONS as any[]).filter(m => m.userId === userId) as any;
  }
}
