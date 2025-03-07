import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { Step } from '../../shared.types';

@Component({
  selector: 'lnd-step-footer',
  templateUrl: './step-footer.component.html',
  styleUrls: ['./step-footer.component.scss']
})
export class StepFooterComponent {
  @Input() formValid:boolean;
  @Input() isLoading:boolean;
  @Input() currentStepIsValid:boolean;
  @Input() currentTheme:ColorThemeInterface;
  @Input() currentStepIndex:number;
  @Input() steps:Step[];

  @Output() previous = new EventEmitter();
  @Output() next = new EventEmitter();


}
