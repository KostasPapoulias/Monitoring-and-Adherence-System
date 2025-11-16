import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LockedRoutingModule } from './locked-routing.module';
import { LockedComponent } from './locked.component';

@NgModule({
  declarations: [LockedComponent],
  imports: [CommonModule, FormsModule, LockedRoutingModule],
})
export class LockedModule {}
