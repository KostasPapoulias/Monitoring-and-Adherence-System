import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleComponent } from './schedule.component';
import { ScheduleRoutingModule } from './schedule-routing.module';
import { DayViewComponent } from './views/day/day-view.component';
import { WeekViewComponent } from './views/week/week-view.component';
import { MonthViewComponent } from './views/month/month-view.component';

@NgModule({
  declarations: [
    ScheduleComponent,
    DayViewComponent,
    WeekViewComponent,
    MonthViewComponent,
  ],
  imports: [CommonModule, FormsModule, ScheduleRoutingModule]
})
export class ScheduleModule {}
