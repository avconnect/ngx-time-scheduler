import { NgModule } from '@angular/core';
import { NgxTimeSchedulerComponent } from './ngx-time-scheduler.component';
import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [NgxTimeSchedulerComponent],
  imports: [
    CommonModule,
    DragDropModule,
    NgbDropdownModule
  ],
  exports: [NgxTimeSchedulerComponent]
})
export class NgxTimeSchedulerModule { }
