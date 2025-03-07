import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Observable, Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import {
  FinanceReportTableCols,
  FinanceReportTypes,
  FinanceReportNames,
  financeReportRowHeaders,
  FinanceReportTableSubCols,
  FinanceReportDateType,
} from "src/app/modules/finance/models/finance-type.enum";
import { FinanceReportService } from "src/app/modules/finance/service/finance-report.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ExcelService } from "src/app/service/excel.service";
import {
  accumulator,
  calculateReportFieldsTotal,
  spaceWords,
} from "src/app/util/finance/financeHelper";
import { AccountTransactionsViewData } from "src/app/modules/finance/types/reports";
import * as moment from "moment";
import { Filter } from "src/app/model/filter";
import { Column, Workbook } from "exceljs";
import * as fs from "file-saver";
import {
  GetFinanceReportUrlSegment,
  GetReportReqBody,
} from "src/app/modules/finance/finance-report-page/types";
import { HttpResponse } from "@angular/common/http";
import Swal from "sweetalert2";
import { ReportService } from "src/app/service/report.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  ExcelConfig,
  ExcelData,
  ExcelHeader,
  ExcelValueType,
} from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-lib-finance-report",
  templateUrl: "./lib-finance-report.component.html",
  styleUrls: ["./lib-finance-report.component.scss"],
})
export class LibFinanceReportComponent implements OnInit, OnDestroy, OnChanges {
  @Input() allBranches: any[] = [];

  @Input() reportType: FinanceReportTypes;

  @Input() fiscalYear: any;

  @Input() userInfo: any;

  @Input() ownerInformation: any;

  @Input() agingDetailPeriod: string;

  @Input() agingDetailPeriodType: string;

  @Input()
  allAccounts: any[] = [];

  @Output() closeModal: EventEmitter<void> = new EventEmitter<void>();

  searchForm: UntypedFormGroup;
  loader: boolean;
  endDate: any;
  startDate: any;
  paginated: boolean = false;
  startDateRequired = false;
  branchIdRequired = false;
  pagination = {
    pageNum: 1,
    pageSize: 10000,
    maxPage: 0,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };
  needsSpacing = false;
  canDeepLink = false;
  today: number = Date.now();

  reportTypes = FinanceReportTypes;
  reportNames = FinanceReportNames;
  reportName: FinanceReportNames;
  fieldsForSummation: string[];
  allReportTableColumn = FinanceReportTableCols;
  allReportTableSubColumn = FinanceReportTableSubCols;
  showBranch = true;
  showStatus = false;
  statusList: CustomDropDown[] = [];
  selectedBranches: CustomDropDown[] = [];
  assetRegisterReportFilters: CustomDropDown[] = [
    { id: "InActive", text: "Inactive" },
    { id: "Draft", text: "Draft" },
    { id: "Running", text: "Running" },
    { id: "Depreciated", text: "Depreciated" },
    { id: "Disposed", text: "Disposed" },
  ];
  selectedAssetRegisterReportFilters: CustomDropDown[] = [];
  selectedViewType: string = "Grouped";
  currentTheme: ColorThemeInterface = null;
  searchrequestLoader: boolean;
  downloading: boolean;
  requestLoader: boolean;
  public resultOutputTypeArray: Array<string> = ["Grouped", "Breakdown"];
  selectedOutputType: any;

  reportList: any[] = [];
  tableCols: any[] = [];
  tableSubCols: any[] = [];
  rowHeaders: any[] = [];
  rowsWithTotal = [];

  unsubscriber$ = new Subject<void>();
  desiredRows: CustomDropDown[] = [
    { id: 10000, text: "10000" },
    { id: 20000, text: "20000" },
    { id: 30000, text: "30000" },
    { id: 100000, text: "All" },
  ];
  accountTransactionsViewData: AccountTransactionsViewData;
  showCustomDatePicker = false;
  reportDateType: FinanceReportDateType;
  selectedDateRange: string;
  dateRanges = [
    "Today",
    "ThisWeek",
    "ThisMonth",
    "ThisQuarter",
    "ThisYear",
    "YearToDate",
    "Yesterday",
    "PreviousWeek",
    "PreviousMonth",
    "PreviousQuarter",
    "PreviousYear",
    "Custom",
  ];
  previousDate = { startDate: "", endDate: "" };
  filterModel: Filter;
  modules = ["Finance", "Loan", "Investment"];
  queuedReportList: any[] = [];
  reportQueuedMsg: string;
  billAgingDetailsReport;

  constructor(
    private colorThemeService: ColorThemeService,
    private financeReportService: FinanceReportService,
    private reportService: ReportService,
    private excel: ExcelService,
    private modalService: NgbModal,
    private configurationService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.searchFormInit();
    if (!this.ownerInformation) {
      this.getAppOwner();
    } else {
      this.initByReport();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.allAccounts && changes.allAccounts.currentValue) {
      this.allAccounts = changes.allAccounts.currentValue;
    }
  }

  getAppOwner() {
    this.loader = true;
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
        this.searchForm
          .get("tenantId")
          .setValue(this.ownerInformation?.appOwnerKey);
        this.initByReport();
      },
      (error) => {
        this.loader = false;
      }
    );
  }

  onToggleFilterModal() {
    if (this.reportName === FinanceReportNames.TrialBalanceReport) {
      this.reportDateType = FinanceReportDateType.StartAndEnd;
    }

    this.showCustomDatePicker = false;
    $(".generate-menu").toggle();
  }

  searchFormInit(): void {
    this.searchForm = new UntypedFormGroup({
      StartDate: new UntypedFormControl(
        this._formatDate(this.fiscalYear?.startFiscalYear)
      ),
      EndDate: new UntypedFormControl(
        this._formatDate(this.fiscalYear?.endFiscalYear),
        [Validators.required]
      ),
      Status: new UntypedFormControl(null),
      PageNumber: new UntypedFormControl(1),
      PageSize: new UntypedFormControl(100),
      relatedObject: new UntypedFormControl(""),
      BranchIds: new UntypedFormControl(null),
      filter: new UntypedFormControl(""),
      tenantId: new UntypedFormControl(this.ownerInformation?.appOwnerKey),
      assetRegisterReportFilter: new UntypedFormControl(""),
    });
    this.startDate = this._formatDate(this.fiscalYear?.startFiscalYear);
    this.endDate = this._formatDate(this.fiscalYear?.endFiscalYear);

    this.searchForm
      .get("StartDate")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (value) => {
          this.startDate = value;
        },
      });
    this.searchForm
      .get("EndDate")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (value) => {
          this.endDate = value;
        },
      });
  }

  get isFormValid(): boolean {
    if (this.branchIdRequired)
      return this.searchForm.valid && this.selectedBranches.length > 0;
    else return this.searchForm.valid;
  }

  getItemsPaginatedSearch(filter: any, pageSize: any, pageNumber: number) {
    if (this.endDate !== "" && this.endDate !== null) {
      this.loader = true;
      this.pagination.pageSize = parseInt(pageSize);
      this.filterReport(pageNumber);
    }
  }

  get showSecondColumnInFilterModal() {
    return (
      this.showCustomDatePicker ||
      this.reportName === this.reportNames.CreditRefundReport ||
      this.reportName === this.reportNames.TrialBalanceReport ||
      this.reportName === this.reportNames.GeneralLedgerReport ||
      this.showBranch
    );
  }

  onDateRangeSelected(data: {
    range: string;
    setDatesForDisplay: boolean;
    clickedOnDateRange: boolean;
  }) {
    if (data.clickedOnDateRange) {
      this.selectedDateRange = data.range;
    }

    let startDate: Date;
    let endDate: Date;
    let formattedStartDate: string;
    let formattedEndDate: string;
    const currentDate = new Date();

    switch (data.range) {
      case "Today":
        formattedStartDate = this.getFormattedDate(currentDate);
        formattedEndDate = this.getFormattedDate(currentDate);
        break;
      case "ThisWeek":
        const firstDay = new Date(
          currentDate.setDate(currentDate.getDate() - currentDate.getDay())
        );

        const lastDay = new Date(
          currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 6)
        );

        formattedStartDate = this.getFormattedDate(firstDay);
        formattedEndDate = this.getFormattedDate(lastDay);
        break;
      case "ThisMonth":
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
        formattedStartDate = this.getFormattedDate(startDate);
        formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "ThisQuarter":
        const currentQuarter = (currentDate.getMonth() - 1) / 3 + 1;
        startDate = new Date(
          currentDate.getFullYear(),
          3 * currentQuarter - 2,
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          3 * currentQuarter + 1,
          1
        );
        formattedStartDate = this.getFormattedDate(startDate);
        formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "ThisYear":
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear(), 11, 31);
        formattedStartDate = this.getFormattedDate(startDate);
        formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "YearToDate":
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        formattedStartDate = this.getFormattedDate(startDate);
        formattedEndDate = this.getFormattedDate(currentDate);
        break;
      case "Yesterday":
        currentDate.setDate(currentDate.getDate() - 1);
        formattedStartDate = this.getFormattedDate(currentDate);
        formattedEndDate = this.getFormattedDate(currentDate);
        break;
      case "PreviousWeek":
        const beforeOneWeek = new Date(
          new Date().getTime() - 60 * 60 * 24 * 7 * 1000
        );
        const beforeOneWeek2 = new Date(beforeOneWeek);
        const day = beforeOneWeek.getDay();
        const diffToMonday =
          beforeOneWeek.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(beforeOneWeek.setDate(diffToMonday));
        endDate = new Date(beforeOneWeek2.setDate(diffToMonday + 6));
        formattedStartDate = this.getFormattedDate(startDate);
        formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "PreviousMonth":
        startDate = new Date(
          currentDate.getFullYear() - (currentDate.getMonth() > 0 ? 0 : 1),
          (currentDate.getMonth() - 1 + 12) % 12,
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        );

        formattedStartDate = this.getFormattedDate(startDate);
        formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "PreviousQuarter":
        const quarter = Math.floor(currentDate.getMonth() / 3);
        startDate = new Date(currentDate.getFullYear(), quarter * 3 - 3, 1);
        endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 3,
          0
        );
        formattedStartDate = this.getFormattedDate(startDate);
        formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "PreviousYear":
        const lastYear = new Date().getFullYear() - 1;
        startDate = new Date(lastYear, 0, 1);
        endDate = new Date(lastYear, 11, 31);
        formattedStartDate = this.getFormattedDate(startDate);
        formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "Custom":
        if (data.clickedOnDateRange) {
          this.showCustomDatePicker = true;
        }
        break;
    }

    if (data.setDatesForDisplay) {
      this.startDate = formattedStartDate;
      this.endDate = formattedEndDate;
      return;
    }

    if (data.range === "Custom") {
      this.setDates("", "");
    } else {
      this.setDates(formattedStartDate, formattedEndDate);
    }
  }

  getFormattedDate(date: Date) {
    return moment(date).format("YYYY-MM-DD");
  }

  setDates(startDate: string, endDate: string) {
    this.searchForm.get("StartDate").setValue(startDate);
    this.searchForm.get("EndDate").setValue(endDate);
    this.startDate = startDate;
    this.endDate = endDate;
  }

  onMouseEnterDateRange(range: string) {
    this.onDateRangeSelected({
      range,
      setDatesForDisplay: true,
      clickedOnDateRange: false,
    });
  }

  onMouseLeaveDateRange() {
    this.startDate = this.searchForm.get("StartDate")?.value;
    this.endDate = this.searchForm.get("EndDate")?.value;
  }

  savePreviousDate() {
    this.previousDate.startDate = this.searchForm.get("StartDate")?.value;
    this.previousDate.endDate = this.searchForm.get("EndDate")?.value;
  }

  onCloseModal() {
    this.selectedDateRange = null;
    this.setDates(this.previousDate.startDate, this.previousDate.endDate);
    this.onToggleFilterModal();
  }

  filterReport(
    pageNum = this.pagination.pageNum,
    isExport = false,
    fileName = null,
    url?: GetFinanceReportUrlSegment
  ) {
    this.reportQueuedMsg = null;

    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    if (this.searchForm.valid) {
      const branchIds = this.selectedBranches.map((branch) => branch.id);
      this.searchForm.patchValue({
        BranchIds: this.selectedBranches.length > 0 ? branchIds : null,
      });
      this.searchForm.patchValue({
        PageSize: this.paginated === true ? this.pagination.pageSize : 1,
      });

      if (this.selectedAssetRegisterReportFilters.length) {
        const filters = this.selectedAssetRegisterReportFilters.map(
          (f) => f.id
        );
        this.searchForm.patchValue({
          assetRegisterReportFilter: filters,
        });
      }

      if (this.agingDetailPeriod) {
        this.reportDateType = FinanceReportDateType.AsAt;
        this.searchForm.get("EndDate").setValue(moment().format("yyyy-MM-DD"));
        this.endDate = moment().format("yyyy-MM-DD");
      }

      if (this.showCustomDatePicker) {
        const startDate = this.searchForm.get("StartDate").value;
        const endDate = this.searchForm.get("EndDate").value;

        this.searchForm
          .get("StartDate")
          .setValue(this.getFormattedDate(startDate));
        this.searchForm.get("EndDate").setValue(this.getFormattedDate(endDate));
      }

      const model = this.searchForm.value;

      if (this.paginated) {
        model["paginated"] = true;
      }

      if (!isExport) this.loader = true;

      const searchModel = this.searchForm.value;

      if (this.reportType === this.reportTypes.BalanceSheetReport) {
        model["asOfDate"] = searchModel?.EndDate;
        delete model["StartDate"];
      }

      const { BranchIds, relatedObject, assetRegisterReportFilter } =
        this.searchForm.value;

      if (
        BranchIds?.length > 0 ||
        relatedObject ||
        assetRegisterReportFilter?.length
      ) {
        let branches = [];
        BranchIds?.forEach((id: number) => {
          const foundBranch = this.allBranches.find(
            (branch) => branch.id == id
          );
          branches.push(foundBranch);
        });

        let assetRegisterFilters = [];
        if (assetRegisterReportFilter?.length > 0) {
          assetRegisterReportFilter?.forEach((id: string) => {
            const filter = this.assetRegisterReportFilters.find(
              (filter) => filter.id == id
            );
            assetRegisterFilters.push(filter);
          });
        }

        this.filterModel.setData({
          filters: [
            branches.length ? branches : [],
            relatedObject ? [{ id: relatedObject, text: relatedObject }] : [],
            assetRegisterFilters.length ? assetRegisterFilters : [],
          ],
          filterTypes: ["branch", "relatedObject", "assetStatus"],
          filterHeaders: ["Branches", "Related object", "Asset Statuses"],
        });
      }

      if (isExport) {
        this.downloadReport(model, fileName, url);
      } else {
        this.getReportService$(model)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            async (res) => {
              if (res.body?.value?.queued) {
                const msg = res.body.value.message;
                this.reportList = [];
                this.reportQueuedMsg = msg;
                this.loader = false;
                this.requestLoader = false;
                Swal.fire("Success", msg, "success");
                return;
              }
              this.billAgingDetailsReport = res.body?.data;

              let reports =
                res.body?.data?.items ||
                res.body?.data ||
                res.body?.items ||
                res.body;
              this.reportList = [];
              this.rowHeaders = [];
              if (this.agingDetailPeriod) {
                for (const key in reports) {
                  if (key !== this.agingDetailPeriod && key !== "current") {
                    delete reports[key];
                  }
                }
              }
              if (this.reportType === this.reportTypes.AccountSummary) {
                reports = reports.map((r: any) => ({ ...r, expanded: false }));
              }

              if (this.reportType == this.reportTypes.TrialBalanceReport) {
                reports = reports.map((report) => {
                  return {
                    ...report,
                    accounts: report.accounts
                      .filter((account) => {
                        return account.netCredit || account.netDebit;
                      })
                      .map((account) => {
                        return {
                          ...account,
                          name: this.upperCamelCase(account.name),
                        };
                      }),
                  };
                });
              }

              if (this.needsSpacing) {
                reports = spaceWords(reports);
              }

              if (reports instanceof Array) {
                this.reportList = reports;

                if (this.reportName && this.fieldsForSummation?.length) {
                  this.rowsWithTotal = calculateReportFieldsTotal(
                    this.reportList,
                    this.fieldsForSummation,
                    FinanceReportTableCols[this.reportName]
                  );
                }
              } else {
                // reports is an object containing arrays.
                // Transform reports into array of arrays.

                if (
                  this.reportType === this.reportTypes.ProfitLossReport ||
                  this.reportType === this.reportTypes.BalanceSheetReport
                ) {
                  Object.keys(reports).forEach((key) => {
                    this.reportList.push({
                      name: key,
                      ...reports[key],
                    });
                  });
                } else {
                  for (let key in reports) {
                    if (reports[key].length) {
                      const reportData = reports[key];
                      this.reportList.push(reportData);

                      if (this.reportName && this.fieldsForSummation?.length) {
                        const rWT = calculateReportFieldsTotal(
                          reportData,
                          this.fieldsForSummation,
                          FinanceReportTableCols[this.reportName]
                        );
                        this.rowsWithTotal.push(...rWT);
                      }

                      const row = financeReportRowHeaders.find(
                        (r) => r.property === key
                      );
                      this.rowHeaders.push(row?.name);
                    }
                  }
                }
              }

              if (this.paginated === true) {
                this.pagination.maxPage =
                  res.body?.data?.totalPages || res.body?.totalPages;
                this.pagination.totalRecords =
                  res.body?.data?.totalCount || res.body?.totalCount;
                this.pagination.count = this.reportList.length;
                this.pagination.jumpArray = Array(this.pagination.maxPage);
                for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                  this.pagination.jumpArray[i] = i + 1;
                }
              }
              this.loader = false;
            },
            (err) => {
              this.loader = false;
            }
          );
      }
    }
    $(".generate-menu").hide();
  }

  upperCamelCase(text: string) {
    if (!text?.length) return text;

    return text
      .split(" ")
      .map((word) => {
        if (word.length > 1) {
          const firstLetter = word[0].toUpperCase();
          return `${firstLetter}${word.slice(1).toLowerCase()}`;
        } else {
          return word.toUpperCase();
        }
      })
      .join(" ");
  }

  selected(type: string, data: CustomDropDown): void {
    switch (type) {
      case "Status":
        this.searchForm.patchValue({ Status: data.id });
        break;
      case "OutputType":
        this.selectedOutputType = data.id;
        data.id === "grouped"
          ? (this.paginated = false)
          : (this.paginated = true);
        break;
      case "AccessibleBranch":
        this.selectedBranches.push(data);
        break;
      case "assetRegisterReportFilter":
        this.selectedAssetRegisterReportFilters.push(data);
        break;
      case "creditRefundRelatedObject":
        let relatedObject: string;
        if (data.text === "Credit Note") relatedObject = "CreditNote";
        else relatedObject = "VendorCreditNote";
        this.searchForm.get("relatedObject").setValue(relatedObject);
        break;
      case "rowSize":
        this.pagination.pageSize = +data.id;
        break;
      case "module":
        this.searchForm.get("filter").setValue(data.id);
        break;
    }
  }

  removed(type: string, data: CustomDropDown): void {
    switch (type) {
      case "Status":
        this.searchForm.patchValue({ Status: null });
        break;
      case "AccessibleBranch":
        this.selectedBranches = this.selectedBranches.filter(
          (branch) => branch.id !== data.id
        );
        break;
      case "assetRegisterReportFilter":
        this.assetRegisterReportFilters =
          this.assetRegisterReportFilters.filter((f) => f.id !== data.id);
        break;
      case "creditRefundRelatedObject":
        this.searchForm.get("relatedObject").setValue("");
        break;
      case "module":
        this.searchForm.get("filter").setValue("");
        break;
    }
  }

  getTotalSection(field, arrayinput: any[], expectedResult): any {
    let total = 0;

    if (Array.isArray(arrayinput)) {
      arrayinput.forEach((x) => (total += parseFloat(x[field])));
    }

    if (expectedResult === "formatted") {
      return total.toLocaleString(undefined, { minimumFractionDigits: 2 });
    } else {
      return total;
    }
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  toggleAside(): void {
    this.closeModal.emit();
  }

  initByReport(): void {
    switch (this.reportType) {
      case this.reportTypes.CreditNoteDetails:
        this.initCNReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.CreditRefundReport:
        this.initCreditRefundReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.InvoiceDetailsReport:
        this.initInvoiceDetailsReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.BillAgingDetailsReport:
        this.initBillAgingDetailsReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.BillAgingSummaryReport:
        this.initBillAgingSummaryReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.InvoiceAgingDetailsReport:
        this.initInvoiceAgingDetailsReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.InvoiceAgingSummaryReport:
        this.initInvoiceAgingSummaryReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.AccountTransactionsReport:
        this.initAccTxReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.PaymentsMadeReport:
        this.initPaymentMadeReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.PaymentsReceivedReport:
        this.initPaymentsReceivedReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.SalesByCustomerReport:
        this.initSalesByCustomerReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.SalesBySalespersonReport:
        this.initSalesBySalespersonReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.SalesByItemReport:
        this.initSalesByItemReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.ExpensesReport:
        this.initExpensesReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.ExpensesByCategoryReport:
        this.initExpensesByCatReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.ActivityLogReport:
        this.initActivityLogReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.PettyCashReport:
        this.initPettyCashReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.VendorCreditNoteDetails:
        this.initVCNReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.CashAdvanceReport:
        this.initCashAdvanceReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.ReconciliationSummary:
        this.initReconciliationSummary();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.AccountSummary:
        this.initAccountSummary();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.PurchasesByVendorReport:
        this.initPurchasesByVendorReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.PurchasesByItemReport:
        this.initPurchasesByItemReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.CustomerBalancesReport:
        this.initCustomerBalancesReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.VendorBalancesReport:
        this.initVendorBalancesReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.BillDetailsReport:
        this.initBillDetailsReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.AssetScheduleReport:
        this.initAssetReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.AssetRegisterReport:
        this.initAssetRegisterReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.GeneralLedgerReport:
        this.initGeneralLedgerReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.TrialBalanceReport:
        this.initTrialBalanceReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.ProfitLossReport:
        this.initProfitAndLossReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
      case this.reportTypes.BalanceSheetReport:
        this.initBalanceSheetReport();
        setTimeout(() => {
          this.filterReport();
        });
        break;
    }
  }

  initReconciliationSummary(): void {
    this.tableCols = this.allReportTableColumn.ReconciliationSummary;
    this.paginated = true;
    this.reportName = this.reportNames.ReconciliationSummary;
    this.fieldsForSummation = ["reconciledAmount"];
    this.canDeepLink = true;
  }

  initCashAdvanceReport(): void {
    this.tableCols = this.allReportTableColumn.CashAdvanceReport;
    this.paginated = true;
    this.needsSpacing = true;
    this.reportName = this.reportNames.CashAdvanceReport;
    this.fieldsForSummation = ["amount"];
  }

  initAccountSummary(): void {
    this.tableCols = this.allReportTableColumn.AccountSummary;
    this.tableSubCols = this.allReportTableSubColumn.AccountSummary;
    this.startDateRequired = true;
    this.searchForm.get("StartDate").setValidators(Validators.required);
    this.branchIdRequired = true;
    this.reportName = this.reportNames.AccountSummary;
    this.fieldsForSummation = ["creditSum", "debitSum"];
    this.canDeepLink = true;
  }

  initInvoiceDetailsReport(): void {
    this.tableCols = this.allReportTableColumn.InvoiceDetailsReport;
    this.paginated = true;
    this.reportName = this.reportNames.InvoiceDetailsReport;
    this.fieldsForSummation = ["balance", "total"];
  }

  initBillAgingDetailsReport(): void {
    this.reportDateType = FinanceReportDateType.AsAt;
    this.tableCols = this.allReportTableColumn.BillAgingDetailsReport;
    this.reportName = this.reportNames.BillAgingDetailsReport;
    this.fieldsForSummation = ["balanceDue", "amount"];
  }

  initBillAgingSummaryReport(): void {
    this.tableCols = this.allReportTableColumn.BillAgingSummaryReport;
    this.reportName = this.reportNames.BillAgingSummaryReport;
    this.fieldsForSummation = [
      "current",
      "_1to15_Days",
      "_16to30_Days",
      "_31to45_Days",
      "_Above45_Days",
      "total",
    ];
  }

  initInvoiceAgingDetailsReport(): void {
    this.reportDateType = FinanceReportDateType.AsAt;
    this.tableCols = this.allReportTableColumn.InvoiceAgingDetailsReport;
    this.reportName = this.reportNames.InvoiceAgingDetailsReport;
    this.fieldsForSummation = ["balanceDue", "amount"];
  }

  initInvoiceAgingSummaryReport(): void {
    this.tableCols = this.allReportTableColumn.InvoiceAgingSummaryReport;
    this.reportName = this.reportNames.InvoiceAgingSummaryReport;
    this.fieldsForSummation = [
      "current",
      "_1to15_Days",
      "_16to30_Days",
      "_31to45_Days",
      "_Above45_Days",
      "total",
    ];
  }

  initCNReport(): void {
    this.tableCols = this.allReportTableColumn.CreditNoteDetails;
    this.fieldsForSummation = ["creditNoteAmount", "balanceAmount"];
    this.reportName = this.reportNames.CreditNoteDetails;
    this.paginated = true;
  }

  initCreditRefundReport(): void {
    this.tableCols = this.allReportTableColumn.CreditRefundReport;
    this.reportName = this.reportNames.CreditRefundReport;
    this.fieldsForSummation = ["refundAmount"];
    this.paginated = true;
  }

  initAccTxReport(): void {
    this.tableCols = this.allReportTableColumn.AccountTransactionsReport;
    this.reportName = this.reportNames.AccountTransactionsReport;
    this.fieldsForSummation = ["creditAmount", "debitAmount"];
    this.paginated = true;
    this.canDeepLink = true;
  }

  initPaymentMadeReport(): void {
    this.tableCols = this.allReportTableColumn.PaymentsMadeReport;
    this.reportName = this.reportNames.PaymentsMadeReport;
    this.fieldsForSummation = ["amount"];
    this.paginated = true;
  }

  initPaymentsReceivedReport(): void {
    this.tableCols = this.allReportTableColumn.PaymentsReceivedReport;
    this.reportName = this.reportNames.PaymentsReceivedReport;
    this.fieldsForSummation = ["amount"];
    this.paginated = true;
  }

  initSalesByCustomerReport(): void {
    this.tableCols = this.allReportTableColumn.SalesByCustomer;
    this.reportName = this.reportNames.SalesByCustomerReport;
    this.fieldsForSummation = ["sales", "salesWithTax"];
  }

  initSalesBySalespersonReport(): void {
    this.tableCols = this.allReportTableColumn.SalesBySalesperson;
    this.reportName = this.reportNames.SalesBySalespersonReport;
    this.fieldsForSummation = [
      "creditNoteSales",
      "creditNoteSalesWithTax",
      "sales",
      "salesWithTax",
      "totalSales",
      "totalSalesWithTax",
    ];
  }

  initSalesByItemReport(): void {
    this.tableCols = this.allReportTableColumn.SalesByItem;
    this.reportName = this.reportNames.SalesByItemReport;
    this.fieldsForSummation = ["averagePrice", "amount"];
  }

  initExpensesReport(): void {
    this.tableCols = this.allReportTableColumn.ExpensesReport;
    this.paginated = true;
    this.needsSpacing = true;
    this.reportName = this.reportNames.ExpensesReport;
    this.fieldsForSummation = ["amount", "amountWithTax"];
  }

  initExpensesByCatReport(): void {
    this.tableCols = this.allReportTableColumn.ExpensesByCategory;
    this.reportName = this.reportNames.ExpensesByCategoryReport;
    this.fieldsForSummation = ["amount", "amountWithTax"];
  }

  initActivityLogReport(): void {
    this.tableCols = this.allReportTableColumn.ActivityLogReport;
    this.paginated = true;
  }

  initPettyCashReport(): void {
    this.tableCols = this.allReportTableColumn.PettyCashReport;
    this.reportName = this.reportNames.PettyCashReport;
    this.fieldsForSummation = ["amount"];
    this.paginated = true;
  }

  initVCNReport(): void {
    this.tableCols = this.allReportTableColumn.VendorCreditNoteDetails;
    this.paginated = true;
    this.reportName = this.reportNames.VendorCreditNoteDetails;
    this.fieldsForSummation = ["balanceAmount", "vendorCreditNoteAmount"];
  }

  initPurchasesByVendorReport(): void {
    this.tableCols = this.allReportTableColumn.PurchasesByVendorReport;

    this.reportName = this.reportNames.PurchasesByVendorReport;
    this.fieldsForSummation = ["purchases", "purchasesWithTax"];
  }

  initPurchasesByItemReport(): void {
    this.tableCols = this.allReportTableColumn.PurchasesByItemReport;
    this.reportName = this.reportNames.PurchasesByItemReport;
    this.fieldsForSummation = ["averagePrice", "amount"];
  }

  initCustomerBalancesReport(): void {
    this.tableCols = this.allReportTableColumn.CustomerBalancesReport;
    this.reportName = this.reportNames.CustomerBalancesReport;
    this.fieldsForSummation = ["availableCredits", "balance", "invoiceBalance"];
  }

  initVendorBalancesReport(): void {
    this.tableCols = this.allReportTableColumn.VendorBalancesReport;
    this.reportName = this.reportNames.VendorBalancesReport;
    this.fieldsForSummation = ["availableCredits", "balance", "billBalance"];
  }

  initBillDetailsReport(): void {
    this.tableCols = this.allReportTableColumn.BillDetailsReport;
    this.reportName = this.reportNames.BillDetailsReport;
    this.fieldsForSummation = ["billAmount"];
  }

  initAssetReport(): void {
    this.reportDateType = FinanceReportDateType.AsAt;
    this.tableCols = this.allReportTableColumn.AssetSchedule;

    this.reportName = this.reportNames.AssetScheduleReport;
    this.paginated = true;
    this.endDate = this._formatDate(moment().toDate().toDateString());
    this.searchForm.get("EndDate").patchValue(this.endDate);
  }

  initAssetRegisterReport(): void {
    this.reportDateType = FinanceReportDateType.StartAndEnd;
    this.reportName = this.reportNames.AssetRegisterReport;
    this.paginated = true;
    this.showBranch = true;
    this.tableCols = FinanceReportTableCols["AssetRegister"];
  }

  initGeneralLedgerReport(): void {
    this.tableCols = this.allReportTableColumn.GeneralLedger;
    this.reportName = this.reportNames.GeneralLedgerReport;
    this.canDeepLink = true;
  }

  initTrialBalanceReport(): void {
    this.reportDateType = FinanceReportDateType.AsAt;
    this.reportName = this.reportNames.TrialBalanceReport;
    this.endDate = this._formatDate(moment().toDate().toDateString());
    this.searchForm.get("EndDate").patchValue(this.endDate);
  }

  initBalanceSheetReport(): void {
    this.reportDateType = FinanceReportDateType.AsAt;
    this.reportName = this.reportNames.BalanceSheetReport;
    this.endDate = this._formatDate(moment().toDate().toDateString());
    this.searchForm.get("EndDate").patchValue(this.endDate);
  }

  initProfitAndLossReport(): void {
    this.reportName = this.reportNames.ProfitLossReport;
  }

  getReportService$(model: any): Observable<any> {
    switch (this.reportType) {
      case this.reportTypes.InvoiceDetailsReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetInvoiceDetailsReport"
        );
      case this.reportTypes.BillAgingDetailsReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetBillAgingDetailsReport"
        );
      case this.reportTypes.BillAgingSummaryReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetBillAgingSummaryReport"
        );
      case this.reportTypes.InvoiceAgingDetailsReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetInvoiceAgingDetailsReport"
        );
      case this.reportTypes.InvoiceAgingSummaryReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetInvoiceAgingSummaryReport"
        );
      case this.reportTypes.PaymentsMadeReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetPaymentsMadeReport"
        );
      case this.reportTypes.CreditNoteDetails:
        return this.financeReportService.getFinanceReport(
          model,
          "GetCreditNoteDetailsReport"
        );
      case this.reportTypes.AccountTransactionsReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetAccountTransactionsReport"
        );
      case this.reportTypes.PaymentsReceivedReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetPaymentsReceivedReport"
        );
      case this.reportTypes.SalesByCustomerReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetSalesByCustomerReport"
        );
      case this.reportTypes.SalesBySalespersonReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetSalesBySalesPersonReport"
        );
      case this.reportTypes.SalesByItemReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetSalesByItemReport"
        );
      case this.reportTypes.ExpensesReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetExpenseReport"
        );
      case this.reportTypes.ExpensesByCategoryReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetExpenseByCategoryReport"
        );
      case this.reportTypes.ActivityLogReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetFinanceActivityLogReport"
        );
      case this.reportTypes.PettyCashReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetPettyCashReport"
        );
      case this.reportTypes.VendorCreditNoteDetails:
        return this.financeReportService.getFinanceReport(
          model,
          "GetVendorCreditNoteDetailsReport"
        );
      case this.reportTypes.CashAdvanceReport:
        return this.financeReportService.getFinanceReport(
          model,
          "CashAdvanceSummary"
        );
      case this.reportTypes.ReconciliationSummary:
        return this.financeReportService.getFinanceReport(
          model,
          "ReconciliationSummary"
        );
      case this.reportTypes.AccountSummary:
        return this.financeReportService.getFinanceReport(
          model,
          "AccountDetails"
        );
      case this.reportTypes.PurchasesByVendorReport:
        return this.financeReportService.getFinanceReport(
          model,
          "purchases/vendors"
        );
      case this.reportTypes.PurchasesByItemReport:
        return this.financeReportService.getFinanceReport(
          model,
          "purchases/items"
        );
      case this.reportTypes.CustomerBalancesReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetCustomerBalancesReport"
        );
      case this.reportTypes.VendorBalancesReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetVendorBalancesReport"
        );
      case this.reportTypes.BillDetailsReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetBillDetailsReport"
        );
      case this.reportTypes.CreditRefundReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetCreditRefundReport"
        );
      case this.reportTypes.AssetScheduleReport:
        return this.financeReportService.getFinanceReport(
          model,
          "GetAssetSchedule"
        );
      case this.reportTypes.AssetRegisterReport:
        return this.financeReportService.getFinanceReport(
          model,
          "AssetRegisterReport"
        );
      case this.reportTypes.GeneralLedgerReport:
        return this.financeReportService.getFinanceReport(
          model,
          "General_Ledger"
        );
      case this.reportTypes.TrialBalanceReport:
        return this.financeReportService.getFinanceReport(
          model,
          "Trial_Balance"
        );
      case this.reportTypes.ProfitLossReport:
        return this.financeReportService.getFinanceReport(
          model,
          "profit_or_loss"
        );
      case this.reportTypes.BalanceSheetReport:
        return this.financeReportService.getFinanceReport(
          model,
          "balance_sheet"
        );
    }
  }

  get reportExportTitle(): string {
    const titleName = `${this.reportType}_`;
    return this.startDate === "" || this.startDate == null
      ? titleName + "As At_" + this.endDate
      : titleName + this.startDate + "_to_" + this.endDate;
  }

  exportLog(data: any[]) {
    const titleName = `${this.reportType}_`;
    const titleFullname =
      this.startDate === "" || this.startDate == null
        ? titleName + "As At_" + this.endDate
        : titleName + this.startDate + "_to_" + this.endDate;
    if (this.reportType === this.reportTypes.TrialBalanceReport) {
      this.exportTrialBalancReport(titleFullname);
      return;
    }
    if (this.reportType === this.reportTypes.AssetScheduleReport) {
      this.exportAssetScheduleReport(titleFullname);
      return;
    }
    if (
      this.reportType === this.reportTypes.BalanceSheetReport ||
      this.reportType === this.reportTypes.ProfitLossReport
    ) {
      this.filterReport(
        this.pagination.pageNum,
        true,
        titleFullname,
        this.reportType === this.reportTypes.BalanceSheetReport
          ? "balance_sheet"
          : "profit_or_loss"
      );
      return;
    }

    if (this.reportType === this.reportTypes.BillAgingDetailsReport) {
      this.exportBillAgingDetailsReport();
      return;
    }
    const exportAble = [];
    const numericHeaders = [];
    const options = {
      headers: [],
    };
    this.tableCols.forEach((col: any) => {
      options.headers.push(col?.name);
      if (col?.type === "number") numericHeaders.push(col?.name);
    });

    data.forEach((row) => {
      const dataExpo = {};
      if (row) {
        options.headers.forEach((header) => {
          dataExpo[header] = row[this.getListPropertyName(header)];
        });
        exportAble.push(dataExpo);
      }
    });
    exportAble.forEach((row) => {
      numericHeaders.forEach((column) => {
        row[column] = this.numberify(row[column]);
      });
    });
    const excelData = {
      title: titleFullname,
      headers: options.headers,
      data: exportAble,
    };

    this.excel.exportExcel(excelData, numericHeaders);
  }

  exportBillAgingDetailsReport() {
    let data: ExcelData = {};

    for (const key in this.billAgingDetailsReport) {
      if (
        Object.prototype.hasOwnProperty.call(this.billAgingDetailsReport, key)
      ) {
        let element = this.billAgingDetailsReport[key];
        if (element?.length > 0) {
          const keyString = financeReportRowHeaders.find(
            (rowHeader) => rowHeader.property === key
          );
          element = element.map((item) => {
            return {
              ...item,
              date: moment(item?.date).format("DD-MMM-YYYY"),
              dueDate: moment(item?.dueDate).format("DD-MMM-YYYY"),
            };
          });
          if (keyString) {
            data[keyString.name] = {
              ...data[keyString.name],
              values: element,
              summations: {
                name: "Total",
                values: [
                  { col: 6, value: accumulator(element, "balanceDue") },
                  { col: 8, value: accumulator(element, "amount") },
                ],
              },
            };
          }
        }
      }
    }

    const headers: ExcelHeader[] = [
      { name: "Date", key: "date" },
      { name: "Due Date", key: "dueDate" },
      { name: "Code", key: "code" },
      { name: "Name", key: "name" },
      { name: "Age", key: "age" },
      { name: "Balance Due", type: ExcelValueType.Numeric, key: "balanceDue" },
      { name: "Payment Status", key: "paymentStatus" },
      { name: "Amount", type: ExcelValueType.Numeric, key: "amount" },
      { name: "Branch", key: "branch" },
    ];
    const config: ExcelConfig = {
      title: this.reportExportTitle,
      cellHeaderColor: this.currentTheme.primaryColor.slice(1),
    };

    this.excel.exportV2(config, headers, data);
  }

  numberify(num: any) {
    try {
      var numStr = `${num}`.replace(/,/g, "");
      numStr = numStr.replace(/s/g, "");
      return Number(numStr);
    } catch (e) {
      return 0;
    }
  }

  getListPropertyName(header: string): string {
    let value = this.tableCols.find((x) => x.name === header);
    return value?.property;
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  getTotal(prop: string, list: any[]): number {
    let total = 0;

    list.forEach((item) => {
      total += item[prop];
    });

    return total;
  }

  getChildrenAccountTotal(account: any): number {
    let totalBalance = account.balance || 0;

    if (account.children) {
      for (const child of account.children) {
        const childBalance = this.getChildrenAccountTotal(child);
        if (
          account.transactionType === child.transactionType ||
          child.isSystemAccount
        ) {
          totalBalance += childBalance;
        } else {
          totalBalance -= childBalance;
        }
      }
    }

    return totalBalance;
  }
  getChildrenAccountTotalNew(account: any): number {
    let result = 0;
    if (account?.children && account?.children?.length > 0) {
      account?.children.forEach((child) => {
        if (child?.balance) {
          if (
            account?.transactionType === child?.transactionType ||
            child?.isSystemAccount
          ) {
            result += account?.childBalance
              ? account?.childBalance
              : child?.balance;
          } else {
            result -= account?.childBalance
              ? account?.childBalance
              : child?.balance;
          }
        }
      });
    }
    return +result.toFixed(2);
  }
  getTrialBalanceTotalByAccount(
    account: any,
    allAccount: any[],
    type: string
  ): number {
    let result = 0;
    allAccount
      .find((acc) => acc?.accountType === account)
      ?.accounts.forEach((item) => {
        if (type === "debit") {
          result += item?.netDebit;
        } else if (type === "credit") {
          result += item?.netCredit;
        }
      });
    return result;
  }

  getTrialBalanceTotal(allAccount: any[], type: string): number {
    let result = 0;
    allAccount.forEach((item) => {
      item.accounts.forEach((acc) => {
        if (type === "debit") {
          result += acc?.netDebit;
        } else if (type === "credit") {
          result += acc?.netCredit;
        }
      });
    });
    return result;
  }

  openAccountTransactions(account: any, view: any): void {
    const {
      StartDate: startDate,
      EndDate: endDate,
      PageNumber: pageNumber,
      PageSize: pageSize,
      paginated,
    } = this.searchForm.value;

    this.accountTransactionsViewData = {
      accountId: account.accountId,
      accountName: account.name || account.account,
      accountNumber: account.reference ? account.reference : "",
      transactionType: account.transactionType,
      startDate,
      endDate,
      paginated,
      pageNumber,
      pageSize,
    };

    this.modalService.open(view, { size: "lg" });
  }

  private _formatDate(dateString: string): string {
    let date = new Date(dateString);
    return moment(date).format("yyyy-MM-DD");
  }

  compareTransactionType(data: any): boolean {
    if (!data?.parentId || this.allAccounts.length === 0) return false;
    let parentTransactionType = this.allAccounts.find(
      (x) => x?.accountId === data?.parentId
    )?.transactionType;
    parentTransactionType = parentTransactionType === 1 ? "Debit" : "Credit";
    return Boolean(parentTransactionType !== data?.transactionType);
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange((data) => {
      if (data.branch) {
        this.selectedBranches = [];

        for (let key in data.branch) {
          this.selectedBranches.push(data["branch"][key]);
        }

        this.searchForm.patchValue({
          BranchIds: this.selectedBranches.map((branch) => branch.id),
        });

        this.showBranch = true;
      } else {
        this.selectedBranches = [];
        this.searchForm.patchValue({
          BranchIds: null,
        });
      }

      if (data.relatedObject) {
        this.searchForm.patchValue({
          relatedObject: data?.relatedObject[0].id,
        });
      } else {
        this.searchForm.patchValue({
          relatedObject: "",
        });
      }

      if (data.assetStatus) {
        this.selectedAssetRegisterReportFilters = [];

        for (let key in data.assetStatus) {
          this.selectedAssetRegisterReportFilters.push(
            data["assetStatus"][key]
          );
        }

        this.searchForm.patchValue({
          assetRegisterReportFilter:
            this.selectedAssetRegisterReportFilters.map((f) => f.id),
        });
      } else {
        this.selectedAssetRegisterReportFilters = [];
        this.searchForm.patchValue({
          assetRegisterReportFilter: null,
        });
      }

      this.filterReport();
    });
  }

  exportTrialBalancReport(title: string): void {
    const header = ["Account", "Account Code", "Net Debit", "Net Credit"];
    const numericHeaders = ["Net Debit", "Net Credit"];
    const numFmt = "#,##0.00";

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(
      title.length > 25 ? title.substring(0, 25) : title
    );
    const headerRow = worksheet.addRow(header);
    headerRow.eachCell((cell, number) => {
      cell.font = {
        bold: true,
        color: { argb: "000000" },
        size: 12,
      };
    });

    let headerIndices = [];
    numericHeaders.forEach((element) => {
      let idx = header.indexOf(element);
      if (idx != -1) {
        idx++;
        headerIndices.push(idx);
      }
    });
    // set numeric columns
    headerIndices.forEach((idx) => {
      worksheet.getColumn(idx).numFmt = numFmt;
    });

    let titleRowNumber = 2;
    this.reportList.forEach((account) => {
      const typeRow = worksheet.addRow([account.accountType]);
      typeRow.eachCell((cell, number) => {
        cell.font = {
          bold: true,
          color: { argb: "000000" },
          size: 12,
        };
      });
      account.accounts.forEach((acct) => {
        worksheet.addRow([
          acct.name,
          acct.reference,
          this.formatNumberIntoCurrency(acct.netDebit),
          this.formatNumberIntoCurrency(acct.netCredit),
        ]);
      });
      worksheet.mergeCells(`A${titleRowNumber}:D${titleRowNumber}`);
      titleRowNumber++;
      const dataRows = account.accounts.length;
      titleRowNumber += dataRows;
      const totalRow = worksheet.addRow([
        "",
        `Total ${account.accountType}`,
        this.formatNumberIntoCurrency(
          this.getTrialBalanceTotalByAccount(
            account.accountType,
            this.reportList,
            "debit"
          )
        ),
        this.formatNumberIntoCurrency(
          this.getTrialBalanceTotalByAccount(
            account.accountType,
            this.reportList,
            "credit"
          )
        ),
      ]);
      titleRowNumber++;
      totalRow.eachCell((cell, number) => {
        cell.font = {
          bold: true,
          color: { argb: "000000" },
          size: 12,
        };
      });
    });

    const allTotalRow = worksheet.addRow([
      "Total for all accounts",
      "",
      this.formatNumberIntoCurrency(
        this.getTrialBalanceTotal(this.reportList, "debit")
      ),
      this.formatNumberIntoCurrency(
        this.getTrialBalanceTotal(this.reportList, "credit")
      ),
    ]);
    allTotalRow.eachCell((cell, number) => {
      cell.font = {
        bold: true,
        color: { argb: "000000" },
        size: 12,
      };
    });

    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      fs.saveAs(blob, title + ".xlsx");
    });
  }

  exportAssetScheduleReport(title: string): void {
    const valueRows = [
      { title: null, value: "assetSubClassName" },
      { title: "Cost", value: null },
      { title: "Opening Balance", value: "costPeriodOpeningBalance" },
      { title: "Additions", value: "costAdditionsInPeriod" },
      { title: "Disposals", value: "costDisposalsInPeriod" },
      { title: "Closing Balance", value: "costAdditionsInPeriod" },
      { title: "Depreciation and Impairment", value: null },
      { title: "Opening Balance", value: "accumDepPeriodOpeningBalance" },
      { title: "Depreciation", value: "accumDepreciationInPeriod" },
      { title: "Disposals", value: "accumDepDisposalsInPeriod" },
      { title: "Closing Balance", value: "accumDepPeriodClosingBalance" },
      { title: "Net Book Value (NBV)", value: "periodNetBookValue" },
      { title: "Total", value: null },
    ];
    let numericHeaders = [];
    let headers = [];
    const numFmt = "#,##0.00";
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(
      title.length > 25 ? title.substring(0, 25) : title
    );
    valueRows.forEach((row: { title: string | null; value: string | null }) => {
      if (row.value) {
        const rowData = this.reportList.map((asset) => asset[row.value]);
        if (row.value !== "assetSubClassName") {
          const totalSum = [...rowData].reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0
          );
          rowData.push(totalSum);
        } else {
          rowData.push("Total");
        }
        rowData.unshift(row.title);
        const workbookRow = worksheet.addRow(rowData);
        if (!row.title || row.value === "periodNetBookValue") {
          if (!row.title) {
            headers = [...rowData];
            numericHeaders = [...rowData];
            let headerIndices = [];
            numericHeaders
              .filter((x) => x !== null)
              .forEach((element) => {
                let idx = headers.indexOf(element);
                if (idx != -1) {
                  idx++;
                  headerIndices.push(idx);
                }
              });
            // set numeric columns
            headerIndices.forEach((idx) => {
              worksheet.getColumn(idx).numFmt = numFmt;
            });
          }
          workbookRow.eachCell((cell, number) => {
            cell.font = {
              bold: true,
              color: { argb: "000000" },
              size: 12,
            };
          });
        }
      } else {
        worksheet.addRow([row.title]);
      }
    });

    worksheet.getColumn("A").eachCell((cell) => {
      cell.font = { bold: true };
    });

    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      fs.saveAs(blob, title + ".xlsx");
    });
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  getReportTitle(): string {
    const titleName = `${this.reportType}_`;
    const titleFullname =
      this.startDate === "" || this.startDate == null
        ? titleName + "As At_" + this.endDate
        : titleName + "From_" + this.startDate + "_to_" + this.endDate;

    return titleFullname;
  }
  formatNumberIntoCurrency(value: number): number {
    return +value.toFixed(2);
  }

  downloadReport(
    model: GetReportReqBody,
    filename: string,
    url: GetFinanceReportUrlSegment
  ): void {
    this.downloading = true;
    this.financeReportService
      .exportFinanceReport(model, url)
      .pipe(take(1))
      .subscribe(
        (response: HttpResponse<Blob>) => {
          Swal.fire({
            type: "info",
            text: "Your report will start downloading automatically.",
            title: "Downloading",
          });
          let binaryData = [];
          binaryData.push(response.body);
          let downloadLink = document.createElement("a");
          downloadLink.href = window.URL.createObjectURL(
            new Blob(binaryData, {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;",
            })
          );
          downloadLink.setAttribute("download", filename);
          document.body.appendChild(downloadLink);
          downloadLink.click();
          this.downloading = false;
        },
        (err) => {
          Swal.fire({
            type: "error",
            title: "Something went wrong",
            text: err.error.message,
          });
          this.downloading = false;
        }
      );
  }

  getProfitAndLossTotal(): number {
    const totalRevenue = this.getChildrenAccountTotal(this.reportList[0]);
    const totalExpense = this.getChildrenAccountTotal(this.reportList[1]);

    if (totalExpense < 0) {
      return totalExpense + totalRevenue;
    } else {
      return totalRevenue - totalExpense;
    }
  }

  loadQueuedReports() {
    this.requestLoader = true;
    const reportName = spaceWords(this.reportName);

    this.reportService.spoolQueuedReports(reportName).subscribe(
      (res) => {
        this.queuedReportList = res.body?.value?.data || [];
        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = false;
      }
    );
  }

  downloadQueuedReport(firlUrl: string) {
    window.open(firlUrl, "_blank");
  }
}
