import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssistiveControlsComponent } from './assistive-controls.component';

const routes: Routes = [
  { path: '', component: AssistiveControlsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssistiveControlsRoutingModule {}
