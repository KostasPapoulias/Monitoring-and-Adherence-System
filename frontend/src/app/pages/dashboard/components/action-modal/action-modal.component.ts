import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';

@Component({
  selector: 'app-action-modal',
  templateUrl: './action-modal.component.html',
  styleUrls: ['./action-modal.component.scss']
})
export class ActionModalComponent {
  @Input() med: MedicationModel | null = null;
  @Input() scheduledAt: Date | null = null;
  @Input() error: string | null = null;
  @Input() allowAction = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() postpone = new EventEmitter<number>();
  @Output() close = new EventEmitter<void>();

  emitConfirm() { this.confirm.emit(); }
  emitPostpone(minutes: number) { this.postpone.emit(minutes); }
  emitClose() { this.close.emit(); }
}
