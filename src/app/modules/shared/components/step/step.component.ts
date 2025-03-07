import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StepStatus } from '../../shared.types';

@Component({
  selector: 'lnd-step',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss']
})
export class StepComponent {
  @Input() index:number;
  @Input() lastIndex:number;
  @Input() stage: string;
  @Input() type: string;
  @Input() currentStepStroke: string;

  @Input() status: StepStatus;

  @Output() activeStepIndex = new EventEmitter<number>()

  stepStatus = StepStatus;

}
