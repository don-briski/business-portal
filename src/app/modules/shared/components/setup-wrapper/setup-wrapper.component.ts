import { Component, Input } from '@angular/core';

@Component({
  selector: 'lnd-setup-wrapper',
  templateUrl: './setup-wrapper.component.html',
  styleUrls: ['./setup-wrapper.component.scss']
})
export class SetupWrapperComponent {
  @Input() customCols:string;
}
