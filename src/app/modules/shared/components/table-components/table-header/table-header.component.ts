import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Pagination } from "src/app/model/Pagination";
@Component({
  selector: "lnd-table-header",
  templateUrl: "./table-header.component.html",
  styleUrls: ["./table-header.component.scss"],
})
export class TableHeaderComponent implements OnInit {
  @Input() pagination: Pagination;
  @Input() currentTheme: ColorThemeInterface;
  @Input() isLoading: boolean;
  @Input() placeholder: string;
  @Input() hideSection: string[] = [];
  @Output() paginationChange = new EventEmitter();
  tabChange = false;
  constructor() {}

  ngOnInit(): void {}

  onPaginationChange(pagination?: Pagination): void {
    const { pageNumber, pageSize, keyword } = pagination;
    this.paginationChange.emit({ pageNumber, pageSize: +pageSize, keyword });
  }
}
