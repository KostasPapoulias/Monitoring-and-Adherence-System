import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmergencyRoutingModule } from './emergency-routing.module';
import { EmergencyComponent } from './emergency.component';

@NgModule({
  declarations: [EmergencyComponent],
  imports: [CommonModule, EmergencyRoutingModule]
})
export class EmergencyModule {}
