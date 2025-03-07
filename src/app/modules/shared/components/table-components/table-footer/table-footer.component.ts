import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Pagination } from "src/app/model/Pagination";

@Component({
  selector: "lnd-table-footer",
  templateUrl: "./table-footer.component.html",
  styleUrls: ["./table-footer.component.scss"],
})
export class TableFooterComponent implements OnInit {
  @Input() pagination: Pagination;
  @Output() paginationChange = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  onPaginationChange(pagination?): void {
    this.paginationChange.emit({
      pageNumber: pagination.pageNumber,
      pageSize: +pagination.pageSize,
    });
    $(".itemPaginatedJumpModal").toggle(false);
  }
}
