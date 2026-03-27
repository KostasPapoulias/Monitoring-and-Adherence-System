import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HistoryState } from '../../history.state';
import { AdherenceEventModel } from 'src/app/global/models/adherence/adherence-event.model';

@Component({
  selector: 'app-actions-list',
  templateUrl: './actions-list.component.html',
  styleUrls: ['./actions-list.component.scss']
})
export class ActionsListComponent {
  @Input() state!: HistoryState;
  @Output() prevEvent = new EventEmitter<void>();
  @Output() nextEvent = new EventEmitter<void>();
  @Output() setType = new EventEmitter<{event: AdherenceEventModel, type: 'taken' | 'postponed' | 'missed'}>();
  @Output() cancel = new EventEmitter<AdherenceEventModel>();

  getMedicationName(medicationId: string | undefined): string {
    if (!medicationId) return 'Unknown';
    const med = this.state.medications?.find(m => m._id === medicationId);
    return med?.name || medicationId;
  }
}
