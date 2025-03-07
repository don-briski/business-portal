import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Step, StepStatus } from '../../shared.types';

@Component({
  selector: 'lnd-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss']
})
export class StepperComponent{
  @Input() steps:Step[] = [];
  @Input() currentStepStroke: string;
  @Input() fullWidth = false;
  @Input() borderElemStyle;
  @Input() innerElemStyle;

  @Output() stepIndex = new EventEmitter<number>();

  stepStatus = StepStatus;
}
