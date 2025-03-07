import { Component, Input } from "@angular/core";

@Component({
  selector: "lnd-list-item",
  template: `
    <li class="dt-list__item">
      <!-- Media -->
      <div class="media">
        <i
          class="icon icon-3x mr-5 align-self-center text-warning"
          [ngClass]="iconClass"
        ></i>

        <!-- Media Body -->
        <div class="media-body">
          <span class="d-block text-light-gray f-12 mb-1">{{label}}</span>
          <h5 class="mb-0">
            <span *ngIf="type === 'date'">{{value | date:'mediumDate'}}</span>
            <span *ngIf="type !== 'date'">{{value}}</span>
          </h5>
        </div>
        <!-- /media body -->
      </div>
      <!-- /media -->
    </li>
    <!-- /list item -->
  `,
  styles: ["div {margin-right:40px;}"],
})
export class ListItemComponent {
  @Input() label:string;
  @Input() value:string;
  @Input() iconClass:string;
  @Input() type:string;

}
