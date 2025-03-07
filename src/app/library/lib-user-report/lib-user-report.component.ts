import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  UserReportInputDateType,
  UserReportTableCols,
  UserReportTypes,
} from "src/app/modules/finance/models/user-type.enum";
import { FinanceReportService } from "src/app/modules/finance/service/finance-report.service";
import { ReportService } from "src/app/service/report.service";

@Component({
  selector: "lnd-lib-user-report",
  templateUrl: "./lib-user-report.component.html",
  styleUrls: ["./lib-user-report.component.scss"],
})
export class LibUserReportComponent implements OnInit {
  @Input() allBranches: any[] = [];
  @Input() reportType: UserReportTypes;
  @Input() ownerInformation: any;

  @Input() userInfo: any;
  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();

  today: number = Date.now();
  reportInputDateType = UserReportInputDateType.StartAndEndDate;
  loader: boolean = false;
  requestLoader: boolean;
  downloading: boolean;
  reportList: any[] = [];
  tableCols: any[] = [];
  reportTypes = UserReportTypes;
  allReportTableColumn = UserReportTableCols;

  ReportInputDateType_StartAndEndDate = UserReportInputDateType.StartAndEndDate;
  ReportInputDateType_AsAtEndDate = UserReportInputDateType.AsAtEndDate;
  unsubscriber$ = new Subject();
  searchForm: UntypedFormGroup;
  pagination = {
    pageNum: 1,
    pageSize: 20000,
    maxPage: 0,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  selectedBranchIds: number[] = [];
  paginated: boolean = false;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.searchFormInit();
    this.initByReport();
  }

  initByReport(): void {
    switch (this.reportType) {
      case this.reportTypes.ActivityLogReport:
        this.initActivityLogReport();
        break;
    }
  }

  initActivityLogReport(): void {
    this.tableCols = this.allReportTableColumn.ActivityDetailsReport;
    this.paginated = true;
  }

  filtermodal(reportInputDT = UserReportInputDateType.StartAndEndDate): void {
    this.reportInputDateType = reportInputDT;
    $(".generate-menu").toggle();
  }

  searchFormInit(): void {
    this.searchForm = new UntypedFormGroup({
      StartDate: new UntypedFormControl(null),
      EndDate: new UntypedFormControl(null, [Validators.required]),
      Status: new UntypedFormControl(null),
      PageNumber: new UntypedFormControl(1),
      PageSize: new UntypedFormControl(100),
      BranchIds: new UntypedFormControl(null),
    });
  }

  toggleAside(): void {
    this.closeModal.emit();
  }

  getReportService$(model: any): Observable<any> {
    switch (this.reportType) {
      case this.reportTypes.ActivityLogReport:
        return this.reportService.getUserReport(model, "getactivitylogreport");
    }
  }

  filterReport(pageNum = this.pagination.pageNum, filter = null) {
    const { StartDate } = this.searchForm.value;

    if (StartDate === "" || StartDate === null || StartDate === undefined) {
      this.reportInputDateType = UserReportInputDateType.AsAtEndDate;
    } else {
      this.reportInputDateType = UserReportInputDateType.StartAndEndDate;
    }

    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    if (this.searchForm.valid) {
      this.searchForm.patchValue({
        BranchIds:
          this.selectedBranchIds.length > 0 ? this.selectedBranchIds : null,
      });
      this.searchForm.patchValue({
        PageSize: this.paginated === true ? this.pagination.pageSize : 1,
      });

      this.loader = true;

      this.reportService.getUserReport(
        this.searchForm.value,
        "getactivitylogreport"
      );
      this.getReportService$(this.searchForm.value)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            let reports = res.body.data.items;
            this.reportList = [];

            this.reportList = reports;

            this.pagination.maxPage = res.body.data.totalPages;
            this.pagination.totalRecords = res.body.data.totalCount;
            this.pagination.count = this.reportList.length;
            this.pagination.jumpArray = Array(this.pagination.maxPage);
            for (let i = 0; i < this.pagination.jumpArray.length; i++) {
              this.pagination.jumpArray[i] = i + 1;
            }
            this.loader = false;
          },
          (err) => {
            this.loader = false;
          }
        );
    }

    this.filtermodal(this.reportInputDateType);
  }
}
