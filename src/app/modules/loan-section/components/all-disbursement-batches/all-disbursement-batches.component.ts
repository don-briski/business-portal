import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import {
  DisbursementBatch,
  GetAllDisbursementBatchesQueryParams,
  GetAllDisbursementBatchesResDto,
  ModifiedDisbursementBatch,
} from "src/app/model/disbursement-batch";
import {
  AppOwnerInformation,
  Pagination,
} from "src/app/modules/shared/shared.types";
import { LoanoperationsService } from "src/app/service/loanoperations.service";

@Component({
  selector: "lnd-all-disbursement-batches",
  templateUrl: "./all-disbursement-batches.component.html",
  styleUrls: ["./all-disbursement-batches.component.scss"],
})
export class AllDisbursementBatchesComponent implements OnInit, OnDestroy {
  @Input() colorTheme: ColorThemeInterface;
  @Input() ownerInfo: AppOwnerInformation;

  @Output() viewDisbBatch = new EventEmitter<DisbursementBatch>();
  @Output() isFetchingDisbBatches = new EventEmitter<boolean>();
  @Output() copyToClipboard = new EventEmitter<string>();

  subs$ = new Subject<void>();

  isLoading: boolean;
  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  disbBatches: ModifiedDisbursementBatch[] = [];
  searchParam = "";
  selectedDisbBatches: DisbursementBatch[] = [];
  masterInputValue = false;
  selectedDisb: DisbursementBatch;
  isFetchingPaymentOfficers = false;
  paymentOfficers: CustomDropDown[] = [];
  selectedPaymentOfficer: CustomDropDown = { id: "", text: "" };
  copy_hover = false;

  constructor(private readonly loanOperationsService: LoanoperationsService) {}

  ngOnInit(): void {
    this.fetchDisbBatches();
    this.listenForReassignment();
    this.fetchPaymentOfficers();
  }

  listenForReassignment() {
    this.loanOperationsService.reassignedDisbursementBatch
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: () => {
          this.fetchDisbBatches();
        },
      });
  }

  fetchPaymentOfficers() {
    this.isFetchingPaymentOfficers = true;
    this.loanOperationsService
      .getPaymentOfficers()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.paymentOfficers = res.body.map((item) => ({
            id: item.userId,
            text: item.name,
          }));
          this.isFetchingPaymentOfficers = false;
        },
        error: () => {
          this.isFetchingPaymentOfficers = false;
        },
      });
  }

  fetchDisbBatches() {
    const data: GetAllDisbursementBatchesQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };

    if (this.searchParam) data["keyword"] = this.searchParam;
    if (this.selectedPaymentOfficer.id)
      data["assignedTo"] = this.selectedPaymentOfficer.id as string;

    this.isLoading = true;
    this.isFetchingDisbBatches.emit(true);

    this.loanOperationsService
      .getAllDisbursementBatches(data)
      .pipe(
        map((res) => {
          res.body.items = res.body.items.map((disb) => ({
            ...disb,
            selected: false,
            selectable: disb.status === "open",
          }));
          return res.body;
        }),
        takeUntil(this.subs$)
      )
      .subscribe({
        next: (res) => {
          this.disbBatches = res.items as ModifiedDisbursementBatch[];
          this.selectedDisbBatches = [];
          this.masterInputValue = false;
          this.setPagination(res);
          this.isLoading = false;
          this.isFetchingDisbBatches.emit(false);
        },
        error: () => {
          this.isLoading = false;
          this.isFetchingDisbBatches.emit(false);
        },
      });
  }

  setPagination(res: GetAllDisbursementBatchesResDto): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  onViewDisb(disb: DisbursementBatch) {
    if (!this.copy_hover) {
      this.viewDisbBatch.emit(disb);
    }
  }

  onToggleFilterModal(): void {
    $(".filter-menu").toggle();
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
