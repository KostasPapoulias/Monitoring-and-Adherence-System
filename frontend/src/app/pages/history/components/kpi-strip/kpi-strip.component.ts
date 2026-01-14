import { Component, Input } from '@angular/core';
import { HistoryState } from '../../history.state';

@Component({
  selector: 'app-kpi-strip',
  templateUrl: './kpi-strip.component.html',
  styleUrls: ['./kpi-strip.component.scss']
})
export class KpiStripComponent {
  @Input() state!: HistoryState;
}
