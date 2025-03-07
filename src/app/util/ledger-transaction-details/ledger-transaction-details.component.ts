import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { pluck, take, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { FinanceReportService } from "src/app/modules/finance/service/finance-report.service";
import {
  AccountTransaction,
  AccountTransactionsViewData,
} from "src/app/modules/finance/types/reports";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ExcelService } from "src/app/service/excel.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { HttpHeaders } from "@angular/common/http";
import { AuthService } from "src/app/service/auth.service";
import { FinanceService } from "src/app/modules/finance/service/finance.service";

@Component({
  selector: "lnd-ledger-transaction-details",
  templateUrl: "./ledger-transaction-details.component.html",
  styleUrls: ["./ledger-transaction-details.component.scss"],
})
export class LedgerTransactionDetailsComponent implements OnInit, OnDestroy {
  @Input("accountTransactionsViewData")
  accountTxData: AccountTransactionsViewData;

  appOwner = null;
  appOwnerKey: string;
  businessErrMsg: string;
  businessLoader: boolean;
  isFullPageView = false;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  searchModel: any;

  requestLoader = false;
  allTransactions: AccountTransaction[] = [];
  totalDebitAmount = 0;
  totalCreditAmount = 0;
  closingBalance = 0;

  constructor(
    private colorThemeService: ColorThemeService,
    private financeReportService: FinanceReportService,
    private financeService: FinanceService,
    private excel: ExcelService,
    private configService: ConfigurationService,
    private authService: AuthService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const token = localStorage.getItem("tempToken");
    if (token) {
      const header = new HttpHeaders().set("Set-Auth", token);
      this.financeReportService.setToken(header);
      localStorage.removeItem("tempToken");
    }
  }

  ngOnInit(): void {
    this.loadTheme();
    this.setAccountTxDataFromParams();

    if (this.isFullPageView) {
      this.appOwnerKey = this.getSubdomain();
      this.getAppOwnerDetailsForFullPage();
    } else {
      this.getAppOwnerDetails();
    }

    this.setSearchModel();
  }

  setAccountTxDataFromParams() {
    this.isFullPageView = this.route.snapshot.queryParams["fullPageView"];
    if (!this.isFullPageView) return;

    const params = this.route.snapshot.params;

    this.accountTxData = {
      accountId: params["account-id"],
      accountName: params["account-name"],
      accountNumber: params["account-number"],
      transactionType: params['transaction-type'],
      startDate: params["start-date"] === "null" ? "" : params["start-date"],
      endDate: params["end-date"],
      pageSize: params["page-size"],
      pageNumber: params["page-number"],
      paginated: params["paginated"],
    };
  }

  setSearchModel() {
    this.searchModel = {
      accountId: this.accountTxData.accountId,
      StartDate:
        this.accountTxData.startDate === null
          ? ""
          : this.accountTxData.startDate,
      EndDate: this.accountTxData.endDate,
      Paginated: this.accountTxData.paginated,
      PageNumber: this.accountTxData.pageNumber,
      PageSize: this.accountTxData.pageSize,
    };
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getAccountTransactions(): void {
    this.requestLoader = true;
    this.totalCreditAmount = 0;
    this.totalDebitAmount = 0;
    this.financeReportService
      .getPostingAccountTransactions(this.searchModel)
      .pipe(take(1), pluck("body"))
      .subscribe(
        (res) => {
          this.allTransactions = res?.data;

          this.requestLoader = false;
        },
        () => {
          this.requestLoader = false;
        },
        () => {
          this.allTransactions.forEach((trans) => {
            if (trans?.creditAmount > 0) {
              this.totalCreditAmount += trans?.creditAmount;
            }
            if (trans?.debitAmount > 0) {
              this.totalDebitAmount += trans?.debitAmount;
            }
          });
          this.calculateDifference();
        }
      );
  }

  calculateDifference() {
    const creditSum = this.allTransactions
      .map((tx) => tx.creditAmount)
      .reduce((a, b) => a + b, 0);

    const debitSum = this.allTransactions
      .map((tx) => tx.debitAmount)
      .reduce((a, b) => a + b, 0);

    const creditMinusDebit = creditSum - debitSum;
    const debitMinusCredit = debitSum - creditSum;

    if (this.accountTxData?.transactionType === 'Debit') {
      this.closingBalance = debitMinusCredit
    } else {
      this.closingBalance = creditMinusDebit;
    }
  }

  private getAppOwnerDetails() {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.appOwner = res.body;
        this.getAccountTransactions();
      });
  }

  onViewRelatedEntity(transaction: AccountTransaction) {
    Swal.fire({
      type: "info",
      title: "Exit Page?",
      text: "Leave this page to view the source document?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Continue",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        const url = this.financeService.getDeepLinkingUrl({
          name: transaction.relatedEntity,
          id: transaction.relatedEntityId,
        });

        if (url) {
          this.router.navigateByUrl(url);
          this.modalService.dismissAll();
        }
      }
    });
  }

  onCloseModal() {
    this.modalService.dismissAll();
  }

  exportTransactions(): void {
    const exportAble = [];
    const numericHeaders = ["Debit", "Credit"];
    const options = {
      headers: [
        "Posting Date",
        "Transaction Date",
        "Reference",
        "Transaction Details",
        "Debit",
        "Credit",
      ],
    };

    this.allTransactions.forEach((transaction) => {
      exportAble.push({
        "postingDate Date": transaction?.postingDate,
        "Transaction Date": transaction?.transactionDate,
        Reference: transaction?.reference,
        "Transaction Details": transaction?.label,
        Debit: this.numberify(transaction?.debitAmount),
        Credit: this.numberify(transaction?.creditAmount),
      });
    });

    exportAble.forEach((row) => {
      numericHeaders.forEach((column) => {
        row[column] = this.numberify(row[column]);
      });
    });

    const filename =
      `${this.accountTxData.accountNumber} - ${this.accountTxData.accountName} Transactions_` +
      `${
        this.accountTxData?.startDate === ""
          ? "As_at_" + this.accountTxData?.endDate
          : "From_" +
            this.accountTxData?.startDate +
            "_To_" +
            this.accountTxData?.endDate
      }`;

    const excelData = {
      title: filename,
      headers: options.headers,
      data: exportAble,
    };

    this.excel.exportExcel(excelData, numericHeaders);
  }

  numberify(num) {
    try {
      var numStr = `${num}`.replace(/,/g, "");
      numStr = numStr.replace(/s/g, "");
      return Number(numStr);
    } catch (e) {
      return 0;
    }
  }

  onFullPageView(): void {
    // Set token for new page
    const token = this.financeReportService._getToken();
    localStorage.setItem("tempToken", token);

    const host = window.location.origin;

    const url = `${host}/business/#/account-transactions/${
      this.accountTxData?.accountId
    }/${this.accountTxData?.accountName}/${this.accountTxData.accountId}/${
      this.accountTxData.accountNumber
    }/${this.accountTxData.transactionType}/${this.accountTxData.startDate ? this.accountTxData.startDate : null}/${
      this.accountTxData.endDate ? this.accountTxData.endDate : null
    }/${this.accountTxData?.pageSize}/${this.accountTxData?.pageNumber}/${
      this.accountTxData?.paginated ? true : false
    }?fullPageView=1`;
    window.open(url, "_blank");
  }

  protected getSubdomain(): string {
    let host = window.location.host;
    let splitt = host.split(".");
    let subdomain = splitt[0];
    if (
      subdomain.includes("localhost") ||
      subdomain == "dev" ||
      subdomain == "test" ||
      subdomain == "www"
    ) {
      // return null;
      return "";
    } else {
      return subdomain;
    }
  }

  protected getAppOwnerDetailsForFullPage(): void {
    this.appOwner = null;
    this.businessErrMsg = "";
    if (
      this.appOwnerKey !== "" &&
      this.appOwnerKey !== null &&
      this.appOwnerKey !== "null"
    ) {
      this.businessLoader = true;
      this.authService
        .getAppOwnerByAliasOrPublicKey(this.appOwnerKey)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.businessLoader = false;
            this.appOwner = res.body;
            sessionStorage.setItem("appOwnerKey", this.appOwner.appOwnerKey);
            this.getAccountTransactions();
          },
          (err) => {
            this.businessErrMsg =
              err.error.Message ||
              err.error.message ||
              err.statusText ||
              err ||
              err.message ||
              err.error ||
              err.Message;
            this.businessLoader = false;
          }
        );
    } else {
      this.businessErrMsg = "Business alias not supplied.";
      this.businessLoader = false;
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
