import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MedicationsComponent } from './medications.component';
import { MedicationsViewComponent } from './medications-view/medications-view.component';

const routes: Routes = [
  { path: '', component: MedicationsComponent, children: [
    { path: 'view', component: MedicationsViewComponent },
    { path: '**', redirectTo: 'view', pathMatch: 'full' }
  ]}
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class MedicationsRoutingModule {}
