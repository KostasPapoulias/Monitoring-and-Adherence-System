import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmergencyRoutingModule } from './emergency-routing.module';
import { EmergencyComponent } from './emergency.component';
import { EmergencyButtonComponent } from './components/emergency-button/emergency-button.component';

@NgModule({
  declarations: [
    EmergencyComponent,
    EmergencyButtonComponent,
  ],
  imports: [CommonModule, EmergencyRoutingModule]
})
export class EmergencyModule {}
