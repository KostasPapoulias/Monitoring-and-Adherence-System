import { Component, Input } from '@angular/core';
import { HistoryState } from '../../history.state';

@Component({
  selector: 'app-medication-breakdown',
  templateUrl: './medication-breakdown.component.html',
  styleUrls: ['./medication-breakdown.component.scss']
})
export class MedicationBreakdownComponent {
  @Input() state!: HistoryState;
}
