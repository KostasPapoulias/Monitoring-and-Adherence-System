import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { DashboardState } from '../../dashboard.state';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';

@Component({
  selector: 'app-mobile-view',
  templateUrl: './mobile-view.component.html',
  styleUrls: ['./mobile-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileViewComponent {

  @Input() state!: DashboardState;

  @Input()
  medStatusFor!: (med: MedicationModel) => { text: string; class: string };

  @Input()
  hasAlertActive!: (med: MedicationModel) => boolean;

  @Input()
  isActionable!: (med: MedicationModel) => boolean;

  @Output()
  open = new EventEmitter<MedicationModel>();

  getStatus(med: MedicationModel): string {
    return this.medStatusFor(med).text.toLowerCase();
  }
}
