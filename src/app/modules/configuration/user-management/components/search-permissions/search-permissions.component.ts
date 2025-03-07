import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';

@Component({
  selector: 'lnd-search-permissions',
  templateUrl: './search-permissions.component.html',
  styleUrls: ['./search-permissions.component.scss'],
  standalone: true,
  imports: [SharedModule, CommonModule]
})
export class SearchPermissionsComponent {
  @Input() searchCount!:number;
  @Input() isViewPerm:boolean;

  @Output() searchPermissions = new EventEmitter();
}
