import { Component, EventEmitter, Output } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "lnd-filter-btn",
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="filterModalOpen.emit()"
      class="btn btn-xs text-white mr-1"
    >
    <img src="assets/images/filter-lines.svg" alt="filter svg">
    <span class="ml-2">Filter</span>
    </button>
  `,
  styles: [
    "button {border-radius: 8px; padding: 10px 16px !important; color: #000 !important; border:1px solid #D0D5DD}",
  ],
})
export class FilterBtnComponent {
  @Output() filterModalOpen = new EventEmitter();
}
