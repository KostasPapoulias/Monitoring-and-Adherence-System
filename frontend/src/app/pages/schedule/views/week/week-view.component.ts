import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ScheduleState } from '../../schedule.state';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';

@Component({
  selector: 'app-week-view',
  templateUrl: './week-view.component.html',
  styleUrls: ['./week-view.component.scss']
})
export class WeekViewComponent {
  @Input() state!: ScheduleState;
  @Output() prevMed = new EventEmitter<void>();
  @Output() nextMed = new EventEmitter<void>();
}
