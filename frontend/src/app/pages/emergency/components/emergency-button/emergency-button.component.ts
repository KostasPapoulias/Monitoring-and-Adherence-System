import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-emergency-button',
  templateUrl: './emergency-button.component.html',
  styleUrls: ['./emergency-button.component.scss']
})
export class EmergencyButtonComponent {
  @Input() status = '';
  @Input() showGif = false;
  @Output() trigger = new EventEmitter<void>();
}
