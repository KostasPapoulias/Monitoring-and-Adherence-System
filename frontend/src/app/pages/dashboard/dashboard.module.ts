import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { MedCardComponent } from './components/med-card/med-card.component';
import { StatusBannerComponent } from './components/status-banner/status-banner.component';
import { ActionModalComponent } from './components/action-modal/action-modal.component';
import { WallViewComponent } from './views/wall/wall-view.component';
import { MobileViewComponent } from './views/mobile/mobile-view.component';
import { WatchViewComponent } from './views/watch/watch-view.component';
import { SpeakerViewComponent } from './views/speaker/speaker-view.component';

@NgModule({
  declarations: [
    DashboardComponent,
    MedCardComponent,
    StatusBannerComponent,
    ActionModalComponent,
    WallViewComponent,
    MobileViewComponent,
    WatchViewComponent,
    SpeakerViewComponent,
  ],
  imports: [CommonModule, FormsModule, DashboardRoutingModule]
})
export class DashboardModule {}
