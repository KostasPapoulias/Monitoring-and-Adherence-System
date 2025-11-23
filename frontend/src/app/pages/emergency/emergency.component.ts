import { Component } from '@angular/core';
import { AlertsService } from 'src/app/global/services/alerts/alerts.service';

@Component({
  selector: 'app-emergency',
  templateUrl: './emergency.component.html',
  styleUrls: ['./emergency.component.scss']
})
export class EmergencyComponent {
  status: string = '';
  constructor(private alerts: AlertsService) {}
  trigger() { this.alerts.trigger({ channel: 'app', reason: 'manual' }).subscribe(() => this.status = 'Emergency alert sent'); }
}
