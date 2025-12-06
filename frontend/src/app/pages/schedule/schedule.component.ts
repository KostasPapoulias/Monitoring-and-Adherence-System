import { Component, OnInit } from '@angular/core';
import { MedicationsService } from 'src/app/global/services/medications/medications.service';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';
import { PersonasService } from 'src/app/global/services/personas/personas.service';
import { PersonaStateService } from 'src/app/global/services/personas/persona-state.service';
import { PersonaModel } from 'src/app/global/models/personas/persona.model';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
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
    this.personasSvc.list().subscribe(list => {
      this.personas = list;
      const stored = this.personaState.current() || (list[0]?._id ?? null);
      if (stored) { this.onPersonaChange(stored); }
    });
    this.personaState.get().subscribe(id => { if (id) this.refreshData(id); });
  }

  onPersonaChange(id: string) {
    this.selectedPersonaId = id;
    this.personaState.set(id);
  }

  setView(v: 'day' | 'week' | 'month') { this.view = v; }

  private refreshData(userId: string) {
    this.meds.getAll().subscribe(ms => this.medications = ms.filter(m => m.userId === userId));
  }
}
