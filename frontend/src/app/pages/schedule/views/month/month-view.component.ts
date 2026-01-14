import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ScheduleState } from '../../schedule.state';

@Component({
  selector: 'app-month-view',
  templateUrl: './month-view.component.html',
  styleUrls: ['./month-view.component.scss']
})
export class MonthViewComponent {
  @Input() state!: ScheduleState;
  @Output() prevMed = new EventEmitter<void>();
  @Output() nextMed = new EventEmitter<void>();
}
