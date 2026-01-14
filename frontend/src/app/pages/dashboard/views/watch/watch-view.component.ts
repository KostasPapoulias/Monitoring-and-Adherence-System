import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DashboardState } from '../../dashboard.state';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';

@Component({
  selector: 'app-watch-view',
  templateUrl: './watch-view.component.html',
  styleUrls: ['./watch-view.component.scss']
})
export class WatchViewComponent {
  @Input() state!: DashboardState;
  @Input() watchMed: MedicationModel | null = null;
  @Input() medStatusFor!: (med: MedicationModel) => { text: string; class: string };
  @Input() hasAlertActive!: (med: MedicationModel) => boolean;
  @Input() getNextScheduledDate!: (med: MedicationModel) => Date | null;
  @Output() open = new EventEmitter<MedicationModel>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
}
