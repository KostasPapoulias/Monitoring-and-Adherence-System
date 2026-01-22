import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AssistiveControlsRoutingModule } from './assistive-controls-routing.module';
import { AssistiveControlsComponent } from './assistive-controls.component';

@NgModule({
  declarations: [AssistiveControlsComponent],
  imports: [CommonModule, FormsModule, AssistiveControlsRoutingModule]
})
export class AssistiveControlsModule {}
