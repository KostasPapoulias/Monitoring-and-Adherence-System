import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryRoutingModule } from './history-routing.module';
import { HistoryComponent } from './history.component';
import { KpiStripComponent } from './components/kpi-strip/kpi-strip.component';
import { MedicationBreakdownComponent } from './components/medication-breakdown/medication-breakdown.component';
import { ActionsListComponent } from './components/actions-list/actions-list.component';

@NgModule({
  declarations: [
    HistoryComponent,
    KpiStripComponent,
    MedicationBreakdownComponent,
    ActionsListComponent,
  ],
  imports: [CommonModule, FormsModule, HistoryRoutingModule]
})
export class HistoryModule {}
