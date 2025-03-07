import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

const PAGE_OPTIONS = [10, 20, 50, 100];
@Component({
  selector: 'lnd-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss']
})
export class PaginatorComponent implements OnInit {
  @Input() disabled: boolean;
  @Input() hidePageSize: boolean;
  @Input() totalEntries: number;
  @Input() pageSize: number;
  @Input() pageNumber: number;
  @Input() pageSizeOptions: number[] = PAGE_OPTIONS;
  @Input() showFirstLastButtons: boolean = true;
  @Input() showPageSizeOptions: boolean = true;
  @Input() labelText: string = 'Enteries per page';

  @Output() pageChange = new EventEmitter()

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  ngOnInit() {
    this.paginator._intl.itemsPerPageLabel= this.labelText;
  }
  handlePageEvent(event: PageEvent): void {
    const pageNumber = event?.pageIndex + 1;
    const pageSize = event?.pageSize;
    this.pageChange.emit({pageNumber, pageSize});
  }
}
