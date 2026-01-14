import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';

@Component({
  selector: 'app-med-card',
  templateUrl: './med-card.component.html',
  styleUrls: ['./med-card.component.scss']
})
export class MedCardComponent {
  @Input() med!: MedicationModel;
  @Input() status: string | null = null;
  @Input() actionable = false;
  @Input() alert = false;
  @Output() select = new EventEmitter<MedicationModel>();

  onClick() {
    this.select.emit(this.med);
  }
}
