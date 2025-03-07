import { Component, Input, OnInit, OnDestroy, TemplateRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { HttpResponse } from "@angular/common/http";

import {
  EndOfPeriod,
  GetInterestPeriodRes,
  GetTotalInterestIncomeForPeriodReqParams,
  GetTotalInvestmentInterestExpenseForPeriodReqParams,
  InvestmentInterestExpense,
  LastPostedInterestIncomeDate,
  LastPostedInterestInvestmentInterestExpenseDate,
  LastPostedPlacementInterestIncomeDate,
  LoanInterestIncome,
  PlacementInterestIncome,
  TotalInterestIncomeForPeriod,
  TotalInvestmentInterestExpenseForPeriod,
} from "../../types/ledger-transactions";
import { LedgerTransactionService } from "src/app/service/ledger-transaction.service";
import * as moment from "moment";
import { ConfigurationService } from "src/app/service/configuration.service";
import { AppOwnerInformation, TableData, TableHeader } from "src/app/modules/shared/shared.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { accumulator } from "src/app/util/finance/financeHelper";

@Component({
  selector: "lnd-set-end-of-period",
  templateUrl: "./set-end-of-period.component.html",
  styleUrls: ["./set-end-of-period.component.scss"],
})
export class SetEndOfPeriodComponent implements OnInit, OnDestroy {
  @Input() type: EndOfPeriod;

  subs$ = new Subject<void>();
  appOwnerInfo: AppOwnerInformation;
  lastPostedInterestIncomeDate: LastPostedInterestIncomeDate;
  lastPostedPlacementInterestIncomeDate: LastPostedPlacementInterestIncomeDate;
  lastPostedInterestInvestmentInterestExpenseDate: LastPostedInterestInvestmentInterestExpenseDate;
  formattedEndDate: string;
  fromDateForDisplay: string;
  endDateForDisplay: string;
  fromDate: string;
  availableEndDates: string[] = [];
  dateNotReachedYet: string;
  minDate: string;
  isFetchingDate = false;
  isFetchingTotalInterestIncomeForPeriod = false;
  isDownloadingTotalInterestIncomeForPeriod = false;
  isFetchingTotalInvestmentInterestExpenseForPeriod = false;
  loansInterestIncome: TotalInterestIncomeForPeriod[] = [];
  placementInterestIncome: TotalInterestIncomeForPeriod[] = [];
  totalAmountOfLoans: number;
  totalInvestmentInterestExpenseForPeriod: TotalInvestmentInterestExpenseForPeriod[] = [];
  isPosting = false;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  currentTheme:ColorThemeInterface;
  breakdownConfirmed = false;
  isLoading = false;
  interestBreakdown: GetInterestPeriodRes;
  interestBreakdownTotalEntries: number;

  tableHeaders: TableHeader[] = [];
  tableData: TableData[] = [];
  pageCount:number = 10;
  pageNumber:number = 1;

  constructor(
    private modalService: NgbModal,
    private configService: ConfigurationService,
    private ledgerTxService: LedgerTransactionService,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getAppOwnerInfo();

    if (this.type === "LoanInterestIncome") {
      this.fetchLastPostedInterestIncomeDate();
    } else if (this.type === "InterestExpense") {
      this.fetchLastPostedInterestInvestmentExpenseDate();
    } else {
      this.fetchLastPostedPlacementInterestIncomeDate();
    }
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }


  private getAppOwnerInfo() {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.appOwnerInfo = res.body;
        },
      });
  }

  fetchLastPostedInterestIncomeDate() {
    this.isFetchingDate = true;
    this.ledgerTxService
      .getLastPostedInterestIncomeDate()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.lastPostedInterestIncomeDate = res.body;
          const fromDate = this.getStartDate();
          this.setFromDate(fromDate);
          this.setMinDate(fromDate);
          this.isFetchingDate = false;
        },
        error: () => {
          this.isFetchingDate = false;
        },
      });
  }
  fetchLastPostedPlacementInterestIncomeDate() {
    this.isFetchingDate = true;
    this.ledgerTxService
      .getLastPlacementPostedInterestIncomeDate()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.lastPostedPlacementInterestIncomeDate = res.body;
          const fromDate = this.getStartDate();
          this.setFromDate(fromDate);
          this.setMinDate(fromDate);
          this.isFetchingDate = false;
        },
        error: () => {
          this.isFetchingDate = false;
        },
      });
  }

  fetchLastPostedInterestInvestmentExpenseDate() {
    this.isFetchingDate = true;
    this.ledgerTxService
      .getLastPostedInterestInvestmentInterestExpenseDate()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.lastPostedInterestInvestmentInterestExpenseDate = res.body;
          const fromDate = this.getStartDate();
          this.setFromDate(fromDate);
          this.setMinDate(fromDate);
          this.isFetchingDate = false;
        },
        error: () => {
          this.isFetchingDate = false;
        },
      });
  }

  setFromDate(date: string) {
    this.fromDate = moment(date).format("DD-MM-yyyy");
    this.setAvailableEndDates();
  }

  setAvailableEndDates() {
    const rangeStart = moment(this.fromDate, "DD-MM-yyyy");
    const rangeEnd = moment();

    while (rangeStart.isSameOrBefore(rangeEnd)) {
      const lastDateOfTheMonth = rangeStart.endOf("month");
      if (moment().isBefore(lastDateOfTheMonth)) {
        this.dateNotReachedYet = lastDateOfTheMonth.format("DD-MMM-yyyy")
      }
      this.availableEndDates.push(lastDateOfTheMonth.format("DD-MMM-yyyy"));
      rangeStart.add(1, "month").startOf("month");
    }
  }

  setMinDate(date: string) {
    this.minDate = moment(date).format("DD-MM-yyyy");
  }

  getStartDate() {
    if (this.type === "LoanInterestIncome") {
      return (
        this.lastPostedInterestIncomeDate?.lastLoansInterestIncomeEndDate ||
        this.lastPostedInterestIncomeDate?.fiscalYearStartDate
      );
    } else if (this.type === "InterestExpense") {
      return (
        this.lastPostedInterestInvestmentInterestExpenseDate
          ?.lastInvestmentInterestExpenseEndDate ||
        this.lastPostedInterestInvestmentInterestExpenseDate
          ?.fiscalYearStartDate
      );
    } else {
      return (
        this.lastPostedPlacementInterestIncomeDate?.lastPlacementInterestIncomeEndDate ||
        this.lastPostedPlacementInterestIncomeDate?.fiscalYearStartDate
      );
    }
  }

  onToDatePicked(value: string) {
    const startDate = this.getStartDate();

    this.formattedEndDate = moment(value).format("YYYY-MM-DDTHH:mm:ss");
    this.fromDateForDisplay = moment(moment(this.fromDate, "DD-MM-yyyy")).format("DD-MMM-YYYY");
    this.endDateForDisplay = moment(this.formattedEndDate).format("DD-MMM-YYYY");
    if (this.type === "LoanInterestIncome") {
      this.fetchTotalInterestIncomeForPeriod({
        startDate,
        endDate: this.formattedEndDate,
        type: "Grouped",
      });
    } else if (this.type === "InterestExpense") {
      this.fetchTotalInvestmentInterestExpenseForPeriod({
        startDate,
        endDate: this.formattedEndDate,
      });
    } else {
      this.fetchPlacementInterestIncomeForPeriod({
        startDate,
        endDate: this.formattedEndDate,
        type: "Grouped",
      });
    }
  }

  fetchTotalInterestIncomeForPeriod(
    data: GetTotalInterestIncomeForPeriodReqParams
  ) {
    this.isFetchingTotalInterestIncomeForPeriod = true;
    this.ledgerTxService
      .getTotalInterestIncomeForPeriod(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.loansInterestIncome = [...res.body];
          this.isFetchingTotalInterestIncomeForPeriod = false;
        },
        error: () => {
          this.isFetchingTotalInterestIncomeForPeriod = false;
        },
      });
  }
  fetchPlacementInterestIncomeForPeriod(
    data: GetTotalInterestIncomeForPeriodReqParams
  ) {
    this.isFetchingTotalInterestIncomeForPeriod = true;
    this.ledgerTxService
      .getPlacementInterestIncomeForPeriod(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.placementInterestIncome = [...res.body]
          this.isFetchingTotalInterestIncomeForPeriod = false;
        },
        error: () => {
          this.isFetchingTotalInterestIncomeForPeriod = false;
        },
      });
  }

  fetchTotalInvestmentInterestExpenseForPeriod(
    data: GetTotalInvestmentInterestExpenseForPeriodReqParams
  ) {
    this.isFetchingTotalInvestmentInterestExpenseForPeriod = true;
    this.ledgerTxService
      .getTotalInvestmentInterestExpenseForPeriod(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.totalInvestmentInterestExpenseForPeriod = [...res.body];
          this.isFetchingTotalInvestmentInterestExpenseForPeriod = false;
        },
        error: () => {
          this.isFetchingTotalInvestmentInterestExpenseForPeriod = false;
        },
      });
  }

  openModal(content: TemplateRef<any>) {
    this.onClose();
    this.isLoading = true;
    this.modalService.open(content,{size:"xl", centered: true, scrollable: true});
    if (this.type === 'LoanInterestIncome') {
      this.getLoanInterestIncomeBreakdown({pageNumber:this.pageNumber,pageSize:this.pageCount})
    } else if (this.type === 'InterestExpense') {
      this.getInvestmentInterestExpenseBreakdown({pageNumber:this.pageNumber,pageSize:this.pageCount})
    } else {
      this.getPlacementInterestIncomeBreakdown({pageNumber:this.pageNumber,pageSize:this.pageCount})
    }
  }
  openPreviousModal(content: any): void {
    this.onClose();
    this.modalService.open(content,{centered: true, scrollable: true});
  }

  setTableData(data: any[]) {
    if (this.type === 'LoanInterestIncome') {
      this.tableHeaders = [
        { name: "Loan Code", type: "code" },
        { name: "Customer" },
        { name: "Branch" },
        { name: "Product Type" },
        { name: "Rate(%)" },
        { name: "Tenor" },
        { name: "Loan Amount", type: "amount" },
        { name: "Interest income for period", type: "amount" },
        { name: "Loan Start Date" },
        { name: "Date Disbursed" }
      ];

      this.tableData = data.map(loan => ({
        code: { tdValue: loan.loanCode, type: "code"},
        cust: { tdValue: loan.customerName},
        branch: { tdValue: loan.branch},
        product: { tdValue: loan.productType},
        rate: { tdValue: loan.rate},
        tenor: { tdValue: loan.loanTenor},
        amount: { tdValue: loan.loanAmount, type: "amount"},
        installments: { tdValue: loan.interestIncomeForPeriod, type: "amount"},
        start: { tdValue: loan.loanStartDate, type: "date"},
        dateDisbursed: { tdValue: loan.dateDisbursed, type: "date"}
      }))
    } else if (this.type === 'InterestExpense') {
      this.tableHeaders = [
        { name: "Code", type: "code" },
        { name: "Investor" },
        { name: "Amount", type: "amount" },
        { name: "Tenor(Days)" },
        { name: "Date Invested" },
        { name: "Investment Type" },
        { name: "Rate(%)" },
        { name: "Gross Interest", type: "amount" },
        { name: "Net Interest", type: "amount" },
        { name: "WHT", type: "amount" },
      ];

      this.tableData = data.map((item: InvestmentInterestExpense) => ({
        code: { tdValue: item.investmentCode, type: "code"},
        cust: { tdValue: item.investorName},
        amount: { tdValue: item.investmentAmount, type: "amount"},
        tenor: { tdValue: item.investmentTenor},
        date: { tdValue: item.investmentStartDate, type: "date"},
        type: { tdValue: item.investmentType},
        rate: { tdValue: item.investmentRate},
        grossInterest: { tdValue: item.grossInterestRate, type: "amount"},
        netInterest: { tdValue: item.netInterestRate, type: "amount"},
        wht: { tdValue: item.withHoldingTax, type: "amount"}
      }))
    } else {
      this.tableHeaders = [
        {name: "Code", type: "code"},
        {name: "Amount", type: "amount"},
        {name: "Type"},
        {name: "Start Date"},
        {name: "Maturity Date"},
        { name: "Gross Interest", type: "amount" },
        { name: "Interest Accrued", type: "amount" },
        { name: "WHT Rate(%)"},
        { name: "Tenor"},
        { name: "Days to maturity (days)"},
        {name: "Created At"},
      ]

      this.tableData = data.map((item: PlacementInterestIncome) => ({
        code: { tdValue: item.shortTermPlacementCode, type: "code"},
        amount: { tdValue: item.principal, type: "amount"},
        type: { tdValue: item.placementType},
        date: { tdValue: item.startDate, type: "date"},
        mDate: { tdValue: item.maturityDate, type: "date"},
        gInterest: { tdValue: item.grossInterest, type: "amount"},
        interest: { tdValue: item.interest, type: "amount"},
        rate: { tdValue: item.whtRate},
        tenor: { tdValue: item.tenor},
        maturity: { tdValue: item.daysTillMaturity},
        created: { tdValue: item.createdAt, type: "date"}
      }))
    }
  }


  getLoanInterestIncomeBreakdown(extras:{pageNumber:number, pageSize:number}){
    this.isLoading = true;
    const payload = {startDate:moment(this.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD"),endDate:this.formattedEndDate,type:'breakdown',...extras}
    this.ledgerTxService.getLoanInterestIncomeBreakdown(payload).pipe(takeUntil(this.subs$)).subscribe(res => {
      this.interestBreakdown = res.body.data;
      this.interestBreakdownTotalEntries = res.body?.data?.totalEntries;
      this.setTableData(this.interestBreakdown.data);
      this.isLoading = false;
    })
  }
  getPlacementInterestIncomeBreakdown(extras:{pageNumber:number, pageSize:number}){
    this.isLoading = true;
    const payload = {startDate:moment(this.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD"),endDate:this.formattedEndDate,type:'breakdown',...extras, tenantId: this.appOwnerInfo.appOwnerKey}
    this.ledgerTxService.getPlacementInterestIncomeBreakdown(payload).pipe(takeUntil(this.subs$)).subscribe(res => {
      this.interestBreakdown = res.body as any;
      this.setTableData(this.interestBreakdown.items);
      this.isLoading = false;
    })
  }
  getInvestmentInterestExpenseBreakdown(extras:{pageNumber:number, pageSize:number}){
    this.isLoading = true;
    const payload = {startDate:moment(this.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD"),endDate:this.formattedEndDate,type:'breakdown',...extras}
    this.ledgerTxService.getInvestmentInterestExpenseBreakdown(payload).pipe(takeUntil(this.subs$)).subscribe(res => {
      this.interestBreakdown = res.body.data;
      this.setTableData(this.interestBreakdown.data);
      this.isLoading = false;
    })
  }

  onClose() {
    this.modalService.dismissAll();
  }

  onSubmit() {
    Swal.fire({
      type: "info",
      title: "Post Transaction",
      text: `You're about to post transactions for the period of ${this.fromDate} to ${this.endDateForDisplay}`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.isPosting = true;

        const startDate = this.getStartDate();
        let response: Observable<HttpResponse<any>>;
        if (this.type === "LoanInterestIncome") {
          const payload = {
            startDate:moment(this.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD"),
            endDate:this.formattedEndDate,
            pageNumber: 1,
            pageSize: this.interestBreakdownTotalEntries,
          }

        this.ledgerTxService.getLoanInterestIncomeBreakdown(payload)
        .pipe(takeUntil(this.subs$))
        .subscribe(res => {
           this.ledgerTxService.postLoansInterestIncome({
            fromDate: startDate,
            toDate: this.formattedEndDate,
            interestIncomeLogs: res.body?.data?.data as LoanInterestIncome[],
          }).pipe(takeUntil(this.subs$)).subscribe({
            next: () => {
              this.isPosting = false;
              this.toast.fire({
                type: "success",
                title: "Posted successfully!",
              });
              this.modalService.dismissAll();
            },
            error: () => {
              this.isPosting = false;
            },
          });
        })
        } else if (this.type === "InterestExpense") {
          response = this.ledgerTxService.postInvestmentInterestExpense({
            fromDate: startDate,
            toDate: this.formattedEndDate,
            data: this.totalInvestmentInterestExpenseForPeriod,
          });
        } else {
          response = this.ledgerTxService.postPlacementInterestIncome({
            fromDate: startDate,
            toDate: this.formattedEndDate,
            data: this.placementInterestIncome,
          });
        }

        if (this.type === "LoanInterestIncome") {
          return;
        }
        response.pipe(takeUntil(this.subs$)).subscribe({
          next: () => {
            this.isPosting = false;
            this.toast.fire({
              type: "success",
              title: "Posted successfully!",
            });
            this.modalService.dismissAll();
          },
          error: () => {
            this.isPosting = false;
          },
        });
      }
    });
  }

  onDownloadClick() {
    const startDate = this.getStartDate();
    if (this.type === "LoanInterestIncome") {
      this.downloadInterestIncomeForPeriod({
        startDate,
        endDate: this.formattedEndDate,
        type: "Grouped",
      });
    } else if (this.type === "InterestExpense") {
      this.downloadInterestExpenseForPeriod({
        startDate,
        endDate: this.formattedEndDate,
        type: "Grouped",
      });
    } else {
      this.downloadPlacementInterestIncomeForPeriod({
        startDate,
        endDate: this.formattedEndDate,
        type: "Grouped",
      });
    }
  }

  downloadInterestIncomeForPeriod(data: GetTotalInterestIncomeForPeriodReqParams): void {
    this.isDownloadingTotalInterestIncomeForPeriod = true;
    this.ledgerTxService
      .downloadLoanInterestIncomeBreakdown(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.isDownloadingTotalInterestIncomeForPeriod = false;
          const message = res.body.data;
          this.toast.fire({
            type: "success",
            title: message,
          });
        },
        error: () => {
          this.isDownloadingTotalInterestIncomeForPeriod = false;
        }
    })
  }
  downloadPlacementInterestIncomeForPeriod(data: GetTotalInterestIncomeForPeriodReqParams): void {
    this.isDownloadingTotalInterestIncomeForPeriod = true;
    this.ledgerTxService
      .downloadLPlacementInterestIncomeBreakdown(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.isDownloadingTotalInterestIncomeForPeriod = false;
          const message = res.body.data;
          this.toast.fire({
            type: "success",
            title: message,
          });
        },
        error: () => {
          this.isDownloadingTotalInterestIncomeForPeriod = false;
        }
    })
  }
  downloadInterestExpenseForPeriod(data: GetTotalInterestIncomeForPeriodReqParams): void {
    this.isDownloadingTotalInterestIncomeForPeriod = true;
    this.ledgerTxService
      .downloadInvestmentInterestExpenseBreakdown(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.isDownloadingTotalInterestIncomeForPeriod = false;
          const message = res.body.data;
          this.toast.fire({
            type: "success",
            title: message,
          });
        },
        error: () => {
          this.isDownloadingTotalInterestIncomeForPeriod = false;
        }
    })
  }

  onPagingChange(event: any): void {
    this.pageNumber = event.pageNumber;
    this.pageCount = event.pageSize;
    if (this.type === 'LoanInterestIncome') {
      this.getLoanInterestIncomeBreakdown({pageNumber:this.pageNumber,pageSize:this.pageCount})
    } else if (this.type === 'InterestExpense') {
      this.getInvestmentInterestExpenseBreakdown({pageNumber:this.pageNumber,pageSize:this.pageCount})
    } else {
      this.getPlacementInterestIncomeBreakdown({pageNumber:this.pageNumber,pageSize:this.pageCount});
    }
  }

  getTotalValue(): number {
    let value = 0;
    if (this.type === 'LoanInterestIncome') {
      this.loansInterestIncome.forEach((item) => {
        value += item.totalInterestIncomeForPeriod;
      })
    } else if (this.type === 'InterestExpense') {
      this.totalInvestmentInterestExpenseForPeriod.forEach((item) => {
        value += item.totalGrossInvestmentInterestExpense;
      })
    } else {
      this.placementInterestIncome.forEach((item) => {
        value += item.totalNetInterestAccrued;
      })
    }
    return value;
  }
  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
