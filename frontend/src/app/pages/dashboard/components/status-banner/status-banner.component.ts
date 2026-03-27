import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-banner',
  templateUrl: './status-banner.component.html',
  styleUrls: ['./status-banner.component.scss']
})
export class StatusBannerComponent {
  @Input() text = '';
  @Input() badge: 'info' | 'alert' | 'ok' = 'info';
  @Input() hint = '';
}
