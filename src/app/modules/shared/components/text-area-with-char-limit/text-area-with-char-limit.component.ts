import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lnd-text-area-with-char-limit',
  templateUrl: './text-area-with-char-limit.component.html',
  styleUrls: ['./text-area-with-char-limit.component.scss']
})
export class TextAreaWithCharLimitComponent {
  @Input() label:string;
  @Input() placeholder:string;
  @Input() isRequired:boolean;
  @Input() charLimit:number;
  @Input() inputValue:string;

  @Output() value = new EventEmitter();

}
