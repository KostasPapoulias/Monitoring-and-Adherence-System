import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ScheduleState } from '../../schedule.state';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';

@Component({
  selector: 'app-day-view',
  templateUrl: './day-view.component.html',
  styleUrls: ['./day-view.component.scss']
})
export class DayViewComponent {
  @Input() state!: ScheduleState;
  @Input() getNextDoseTime!: (med: MedicationModel) => string;
  @Input() doseCount!: (med: MedicationModel) => number;
  @Output() prevMed = new EventEmitter<void>();
  @Output() nextMed = new EventEmitter<void>();
}
