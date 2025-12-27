import { Component, Input } from '@angular/core';
import { DashboardState } from '../../dashboard.state';

@Component({
  selector: 'app-speaker-view',
  templateUrl: './speaker-view.component.html',
  styleUrls: ['./speaker-view.component.scss']
})
export class SpeakerViewComponent {
  @Input() state!: DashboardState;
}
