import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lnd-submit-btn',
  templateUrl: './submit-btn.component.html',
  styleUrls: ['./submit-btn.component.scss']
})
export class SubmitBtnComponent {
  @Input() text = "Submit";
  @Input() customClasses:string;
  @Input() isProcessing = false;
  @Input() isValid = true;

  @Output() triggerAction = new EventEmitter();
}
