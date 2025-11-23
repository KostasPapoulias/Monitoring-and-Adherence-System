import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MedicationsRoutingModule } from './medications-routing.module';
import { MedicationsComponent } from './medications.component';
import { MedicationsViewComponent } from './medications-view/medications-view.component';

@NgModule({
  declarations: [MedicationsComponent, MedicationsViewComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MedicationsRoutingModule]
})
export class MedicationsModule {}
