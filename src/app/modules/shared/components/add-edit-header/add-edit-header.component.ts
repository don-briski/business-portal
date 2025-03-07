import { Component, Input } from '@angular/core';

@Component({
  selector: 'lnd-add-edit-header',
  templateUrl: './add-edit-header.component.html',
  styleUrls: ['./add-edit-header.component.scss'],
})
export class AddEditHeaderComponent {
  @Input() isEditing: boolean;
  @Input() resource: string;
  @Input() routerLink: string;
}
