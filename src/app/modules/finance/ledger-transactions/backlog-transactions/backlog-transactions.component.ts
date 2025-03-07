import { Component, OnInit } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { LedgerTransactionService } from "src/app/service/ledger-transaction.service";
import {
  InvestmentInterestExpense,
  LastPostedInterestIncomeDate,
  LastPostedInterestInvestmentInterestExpenseDate,
  LastPostedPlacementInterestIncomeDate,
  LoanInterestIncome,
  PlacementInterestIncome,
} from "../../types/ledger-transactions";
import { TableData, TableHeader } from "src/app/modules/shared/shared.types";
import { SelectionModel } from "@angular/cdk/collections";
import Swal from "sweetalert2";
import { HttpResponse } from "@angular/common/http";
import * as moment from "moment";
import { ConfigurationService } from "src/app/service/configuration.service";

@Component({
  selector: "lnd-backlog-transactions",
  templateUrl: "./backlog-transactions.component.html",
  styleUrls: ["./backlog-transactions.component.scss"],
})
export class BacklogTransactionsComponent implements OnInit {
  currentTheme: ColorThemeInterface;
  unsubscriber$: Subject<void> = new Subject();
  tabState: "loan" | "placement" | "investment" = "loan";
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  isFetchingDate: boolean;
  lastPostedInterestIncomeDate: LastPostedInterestIncomeDate;
  lastPostedPlacementInterestIncomeDate: LastPostedPlacementInterestIncomeDate;
  lastPostedInterestInvestmentInterestExpenseDate: LastPostedInterestInvestmentInterestExpenseDate;
  lastPostedDate: string;

  tableHeaders: TableHeader[] = [];
  tableData: TableData[] = [];
  pageCount: number = 10;
  pageNumber: number = 1;
  totalCount: number = 0;
  isLoading = false;
  isPosting = false;
  loanBacklogs: any[] = [];
  placementBacklogs: PlacementInterestIncome[] = [];
  investmentBacklogs: InvestmentInterestExpense[] = [];
  selectedItems = new SelectionModel<string>(true, []);
  selectedItemObjects: any[] = [];
  selectedObjectTotalAmount: number = 0;
  totalLoanAmount: number = 0;
  totalPlacementAmount: number = 0;
  totalInvestmenAmount: number = 0;
  fromDate: any;
  currencySymbol: string;

  selectedInvestmentTotalValue = {
    totalGrossInvestmentInterestExpense: 0,
    totalNetInvestmentInterestExpense: 0,
    totalWHTInvestmentInterestExpense: 0,
  };
  constructor(
    private colorThemeService: ColorThemeService,
    private ledgerTxService: LedgerTransactionService,
    private readonly configService: ConfigurationService,
  ) {}

  ngOnInit() {
    this.getCurrencySymbol();
    this.loadTheme();
    this.fetchLastPostedInterestIncomeDate();
    this.fetchLastPostedPlacementInterestIncomeDate();
    this.fetchLastPostedInterestInvestmentExpenseDate();
    this.fetchLoanTotalAmount();
    this.fetchInvestmentTotalAmount();
    this.fetchPlacementTotalAmount();
    this.fetchLoanBacklog(this.pageNumber, this.pageCount);
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configService.currencySymbol;
    if (!this.currencySymbol) {
      this.configService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  switchViews(tab: "loan" | "placement" | "investment"): void {
    if (this.tabState === tab) return;
    this.tabState = tab;
    this.pageCount = 10;
    this.pageNumber = 1;
    this.selectedItems.clear();
    this.selectedItemObjects = [];
    this.calculateSelectedAmount();
    switch (tab) {
      case "loan":
        $("#nav-loan").addClass("active-tab");
        $("#nav-placement,#nav-investment").removeClass("active-tab");
        this.fetchLoanBacklog(this.pageNumber, this.pageCount);
        this.lastPostedDate =
          this.lastPostedInterestIncomeDate?.lastLoansInterestIncomeEndDate;
        break;

      case "placement":
        $("#nav-placement").addClass("active-tab");
        $("#nav-loan,#nav-investment").removeClass("active-tab");
        this.fetchPlacementBacklog(this.pageNumber, this.pageCount);
        this.lastPostedDate =
          this.lastPostedPlacementInterestIncomeDate?.lastPlacementInterestIncomeEndDate;
        break;

      case "investment":
        $("#nav-investment").addClass("active-tab");
        $("#nav-placement,#nav-loan").removeClass("active-tab");
        this.fetchInvestmentBacklog(this.pageNumber, this.pageCount);
        this.lastPostedDate =
          this.lastPostedInterestInvestmentInterestExpenseDate?.lastInvestmentInterestExpenseEndDate;
        break;
      default:
        break;
    }
  }

  fetchLastPostedInterestIncomeDate() {
    this.isFetchingDate = true;
    this.ledgerTxService
      .getLastPostedInterestIncomeDate()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.lastPostedInterestIncomeDate = res.body;
          this.lastPostedDate =
            this.lastPostedInterestIncomeDate?.lastLoansInterestIncomeEndDate;
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
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.lastPostedPlacementInterestIncomeDate = res.body;
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
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.lastPostedInterestInvestmentInterestExpenseDate = res.body;
          this.isFetchingDate = false;
        },
        error: () => {
          this.isFetchingDate = false;
        },
      });
  }

  fetchLoanBacklog(pageNumber: number, pageSize: number) {
    this.isLoading = true;
    this.ledgerTxService
      .getLoanInterestIncomeBacklogs({ pageNumber, pageSize })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.totalCount = res.body.data.totalRecords;
          this.loanBacklogs = [
            ...(res?.body?.data?.interestIncomeReportDtos ?? []),
          ];
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }
  fetchPlacementBacklog(pageNumber: number, pageSize: number) {
    this.isLoading = true;
    this.ledgerTxService
      .getPlacementInterestIncomeBacklogs({ pageNumber, pageSize })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.totalCount = res.body.totalCount;
          this.placementBacklogs = [...res.body.items];
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }
  fetchInvestmentBacklog(pageNumber: number, pageSize: number) {
    this.isLoading = true;
    this.ledgerTxService
      .getInterestExpenseBacklogs({ pageNumber, pageSize })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.totalCount = res.body.data.totalRecords;
          this.investmentBacklogs = [
            ...(res?.body?.data?.interestReportDtos ?? []),
          ];
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  onPagingChange(event: any): void {
    this.pageNumber = event.pageNumber;
    this.pageCount = event.pageSize;
    if (this.tabState === "loan") {
      this.fetchLoanBacklog(this.pageNumber, this.pageCount);
    } else if (this.tabState === "investment") {
      this.fetchInvestmentBacklog(this.pageNumber, this.pageCount);
    } else {
      this.fetchPlacementBacklog(this.pageNumber, this.pageCount);
    }
  }

  toggleSelection(item: any): void {
    let code =
      this.tabState === "loan"
        ? item.loanCode
        : this.tabState === "investment"
        ? item.investmentCode
        : item.shortTermPlacementCode;
    item["code"] = code;
    this.selectedItems.toggle(code);

    if (this.selectedItems.isSelected(code)) {
      this.selectedItemObjects.push(item);
    } else {
      this.selectedItemObjects = [
        ...this.selectedItemObjects.filter((x) => x.code !== code),
      ];
    }
    this.calculateSelectedAmount();
  }

  selectAll(items: any[]): void {
    this.selectedItems.select(...items);
  }

  fetchLoanTotalAmount() {
    this.ledgerTxService
      .getLoanBacklogsTotalAmount()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.totalLoanAmount = res.body.amount;
        },
        error: () => {
          this.isFetchingDate = false;
        },
      });
  }
  fetchPlacementTotalAmount() {
    this.ledgerTxService
      .getPlacementBacklogsTotalAmount()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.totalPlacementAmount = res.body.amount;
        },
        error: () => {
          this.isFetchingDate = false;
        },
      });
  }
  fetchInvestmentTotalAmount() {
    this.ledgerTxService
      .getInvestmentBacklogsTotalAmount()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.totalInvestmenAmount =
            res.body.totalGrossInvestmentInterestExpense;
        },
        error: () => {
          this.isFetchingDate = false;
        },
      });
  }

  postEntry() {
    Swal.fire({
      type: "info",
      title: "Post Transaction",
      text: `You're about to post transactions backlogs for ${
        this.tabState === "loan"
          ? "Loan interest income"
          : this.tabState === "investment"
          ? "Investment interest expense"
          : "Short term placement interest income"
      } as at ${moment(this.lastPostedDate).format("DD-MMM-yyyy")}`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.isPosting = true;
        let response: Observable<HttpResponse<any>>;
        if (this.tabState === "loan") {
          response = this.ledgerTxService.postLoansInterestIncome({
            loanInterestBackLogs: [...this.selectedItemObjects],
            toDate: moment(this.lastPostedDate).format("YYYY-MM-DDTHH:mm:ss"),
            fromDate: this.fromDate
          } as any);
        } else if (this.tabState === "investment") {
          response = this.ledgerTxService.postInvestmentInterestExpense({
            data: [],
            investmentInterestExpenseModel: [...this.selectedItemObjects],
            toDate: moment(this.lastPostedDate).format("YYYY-MM-DDTHH:mm:ss"),
            fromDate: this.fromDate
          });
        } else {
          response = this.ledgerTxService.postPlacementInterestIncome({
            data: this.selectedObjectTotalAmount,
            stpShortTermInterestAccruedResponses: [...this.selectedItemObjects],
            toDate: moment(this.lastPostedDate).format("YYYY-MM-DDTHH:mm:ss"),
            fromDate: this.fromDate
          });
        }

        response.pipe(takeUntil(this.unsubscriber$)).subscribe({
          next: () => {
            this.isPosting = false;
            this.pageCount = 10;
            this.pageNumber = 1;
            this.toast.fire({
              type: "success",
              title: "Posted successfully!",
            });
            this.selectedItemObjects = [];
            this.selectedItems.clear();
            this.calculateSelectedAmount();
            if (this.tabState === "loan") this.fetchLoanBacklog(this.pageNumber, this.pageCount)
            if (this.tabState === "investment") this.fetchInvestmentBacklog(this.pageNumber, this.pageCount)
            if (this.tabState === "placement") this.fetchPlacementBacklog(this.pageNumber, this.pageCount)
          },
          error: (error: any) => {
            this.isPosting = false;
            const errorMessages: string[] = [];
            const savedErrorMessageype: string[] = [];
            const errors = error.error;

            errors.forEach((err) => {
              if (!savedErrorMessageype.includes(err.productName)) {
                errorMessages.push(err.error);
                savedErrorMessageype.push(err.productName);
              }
            });

            Swal.fire({
              type: 'error',
              title: 'An error occured',
              text: `${errorMessages.join(' ')}`
            })
          },
        });
      }
    });
  }

  calculateSelectedAmount(): void {
    this.selectedObjectTotalAmount = 0;
    if (this.selectedItemObjects.length === 0) return;
    if (this.tabState === "investment") {
      const moments = this.selectedItemObjects.map((d:InvestmentInterestExpense) => moment(d.investmentStartDate))
      this.fromDate = moment.max(moments).format("YYYY-MM-DDTHH:mm:ss");
      this.selectedInvestmentTotalValue.totalGrossInvestmentInterestExpense = 0;
      this.selectedInvestmentTotalValue.totalNetInvestmentInterestExpense = 0;
      this.selectedInvestmentTotalValue.totalWHTInvestmentInterestExpense = 0;
      this.selectedItemObjects.forEach((item: InvestmentInterestExpense) => {
        this.selectedObjectTotalAmount += item?.grossInterestRate;
        this.selectedInvestmentTotalValue.totalGrossInvestmentInterestExpense +=
          item?.grossInterestRate;
        this.selectedInvestmentTotalValue.totalNetInvestmentInterestExpense +=
          item?.netInterestRate;
        this.selectedInvestmentTotalValue.totalWHTInvestmentInterestExpense +=
          item?.withHoldingTax;
      });
    } else if (this.tabState === "placement") {
      const moments = this.selectedItemObjects.map((d:PlacementInterestIncome) => moment(d.startDate))
      this.fromDate = moment.max(moments).format("YYYY-MM-DDTHH:mm:ss")
      this.selectedItemObjects.forEach((item: PlacementInterestIncome) => {
        this.selectedObjectTotalAmount += item?.interest;
      });
    } else {
      const moments = this.selectedItemObjects.map((d:LoanInterestIncome) => moment(d.loanStartDate))
      this.fromDate = moment.max(moments).format("YYYY-MM-DDTHH:mm:ss")
      
      this.selectedItemObjects.forEach((item: LoanInterestIncome) => {
        this.selectedObjectTotalAmount += +item?.interestIncomeForPeriod;
      });
    }
  }
}
