import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';
import { MedicationsService } from 'src/app/global/services/medications/medications.service';
import { PersonaStateService } from 'src/app/global/services/personas/persona-state.service';

@Component({
  selector: 'app-medications-view',
  templateUrl: './medications-view.component.html',
  styleUrls: ['./medications-view.component.scss']
})
export class MedicationsViewComponent implements OnInit {
  list: MedicationModel[] = [];
  form!: FormGroup;

  constructor(private meds: MedicationsService, private fb: FormBuilder, private personaState: PersonaStateService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [''], dosage: [''], frequency: [''], times: [''], sideEffects: ['']
    });
    this.reload();
  }

  reload() {
    const userId = this.personaState.current();
    this.meds.getAll().subscribe(d => this.list = userId ? d.filter(m => m.userId === userId) : d);
  }

  save() {
    const v = this.form.value;
    const payload: Partial<MedicationModel> = {
      name: v.name,
      dosage: v.dosage,
      frequency: v.frequency,
      times: (v.times || '').split(',').map((t: string) => t.trim()).filter((t: string) => !!t),
      sideEffects: (v.sideEffects || '').split(',').map((t: string) => t.trim()).filter((t: string) => !!t),
      userId: this.personaState.current() || undefined
    };
    this.meds.create(payload).subscribe(() => { this.form.reset(); this.reload(); });
  }

  remove(m: MedicationModel) { if (!m._id) { return; } this.meds.delete(m._id).subscribe(() => this.reload()); }
}
