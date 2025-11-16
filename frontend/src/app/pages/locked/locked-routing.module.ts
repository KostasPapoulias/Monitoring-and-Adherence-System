import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LockedComponent } from './locked.component';

const routes: Routes = [
  { path: '', component: LockedComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LockedRoutingModule {}
