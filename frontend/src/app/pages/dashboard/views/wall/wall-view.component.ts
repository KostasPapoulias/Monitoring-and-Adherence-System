import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DashboardState } from '../../dashboard.state';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';

@Component({
  selector: 'app-wall-view',
  templateUrl: './wall-view.component.html',
  styleUrls: ['./wall-view.component.scss']
})
export class WallViewComponent {
  @Input() state!: DashboardState;
  @Input() medStatusFor!: (med: MedicationModel) => { text: string; class: string };
  @Input() cardClass!: (med: MedicationModel) => string;
  @Input() hasAlertActive!: (med: MedicationModel) => boolean;
  @Input() getNextScheduledDate!: (med: MedicationModel) => Date | null;
  @Output() open = new EventEmitter<MedicationModel>();
}
