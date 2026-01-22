import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceLoginRoutingModule } from './face-login-routing.module';
import { FaceLoginComponent } from './face-login.component';

@NgModule({
  declarations: [FaceLoginComponent],
  imports: [CommonModule, FaceLoginRoutingModule],
})
export class FaceLoginModule {}
