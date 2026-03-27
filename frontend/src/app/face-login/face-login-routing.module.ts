import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FaceLoginComponent } from './face-login.component';

const routes: Routes = [{ path: '', component: FaceLoginComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FaceLoginRoutingModule {}
