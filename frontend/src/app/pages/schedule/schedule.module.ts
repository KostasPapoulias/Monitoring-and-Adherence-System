import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleComponent } from './schedule.component';
import { ScheduleRoutingModule } from './schedule-routing.module';

@NgModule({
  declarations: [ScheduleComponent],
  imports: [CommonModule, FormsModule, ScheduleRoutingModule]
})
export class ScheduleModule {}
