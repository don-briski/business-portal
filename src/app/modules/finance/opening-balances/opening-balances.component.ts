import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { UntypedFormBuilder } from "@angular/forms";
import { Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { FinanceService } from "../service/finance.service";
import Swal from "sweetalert2";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  customDateFormat,
  toFormData,
} from "src/app/util/finance/financeHelper";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { excelToJson } from "../../shared/helpers/excel_to_json.helper";
import { saveAs } from "file-saver";
import * as moment from "moment";
import { COAImport, COAPosting, PostingAccount } from "../finance.types";

@Component({
  selector: "lnd-opening-balances",
  templateUrl: "./opening-balances.component.html",
  styleUrls: ["./opening-balances.component.scss"],
})
export class OpeningBalancesComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();
  loader: boolean;
  saving: boolean;
  allAccounts: any[];
  allPostingAccount: any[] = [];
  allowEdit: boolean;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  openingBalanceEntries: any[] = [];
  totalDebit = 0;
  totalCredit = 0;
  openingBalanceDate: any;
  currentTheme: ColorThemeInterface;
  ownerInformation: any;
  disableDateSelection: boolean;
  openBalanceFile;
  isImporting = false;
  debitCreditEqual = false;
  differenceInCreditAndDebit = 0;
  creditIsGreater = false;
  debitIsGreater = false;
  obInputValue: string;

  constructor(
    private financeService: FinanceService,
    private coaService: ChartOfAccountService,
    private fb: UntypedFormBuilder,
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getApplicationownerinformation();
    this.loadOpeningBalance();
  }

  checkImportForNegativeValues(coaImports: COAImport[]) {
    const badCOA: COAImport[] = [];
    if (coaImports?.length) {
      coaImports.forEach((item) => {
        if (item.CreditAmount < 0 || item.DebitAmount < 0) {
          badCOA.push(item);
        }
      });
    }

    if (badCOA.length) {
      const transformedBadCOA = badCOA
        .map((item) => `${item.AccountName} (${item.AccountId})`)
        .join(", ");

      this.showNegativeValuesErrorAlert(transformedBadCOA);
    }

    return badCOA.length > 0;
  }

  showNegativeValuesErrorAlert(data: string) {
    Swal.fire({
      type: "error",
      title: "Negative Values Found!",
      text: `Negative values are not permitted. Negative credit or debit values were found for the following: ${data}`,
      confirmButtonText: "Okay",
      confirmButtonColor: "#558E90",
    });
  }

  async importOB(event: any) {
    this.isImporting = true;
    let coaImports: any = await excelToJson(event);
    this.obInputValue = "";

    const hasNegativeValues = this.checkImportForNegativeValues(coaImports);
    if (hasNegativeValues) {
      this.isImporting = false;
      return;
    }

    this.allPostingAccount = this.allPostingAccount.map(
      (postingAccount, index) => {
        if (
          coaImports[index].CreditAmount > 0 &&
          postingAccount.credit !== coaImports[index].CreditAmount
        ) {
          postingAccount.credit = coaImports[index].CreditAmount;
        }

        if (
          coaImports[index].DebitAmount &&
          postingAccount.debit !== coaImports[index].DebitAmount
        ) {
          postingAccount.debit = coaImports[index].DebitAmount;
        }
        return postingAccount;
      }
    );

    this.calculateTotals();

    this.openBalanceFile = event.target.files[0];

    this.isImporting = false;

    this.toast.fire(
      "File Import",
      `Successfully imported ${coaImports.length} records!, you can proceed to submit!`,
      "success"
    );
  }

  loadAccounts(): void {
    this.loader = true;
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.allAccounts = res;
          this.loader = false;
        },
        (err) => {
          this.loader = false;
        },
        () => {
          this.allPostingAccount = this.allAccounts.filter(
            (x) => x?.isPostingAccount
          );
          this.allPostingAccount.forEach((acc) => {
            acc["debit"] = 0;
            acc["credit"] = 0;
          });
        }
      );
  }

  getAccountName(id: any): string {
    return this.allAccounts.find((x) => x.accountId === id)?.name;
  }

  setBalance(account: PostingAccount, type: string, event: number): void {
    const entryIndex = this.openingBalanceEntries.findIndex(
      (x) => x.accountId === account.accountId
    );
    if (entryIndex === -1) {
      const entry = {
        accountId: account.accountId,
        accountName: account.accountName,
        debitAmount: 0,
        creditAmount: 0,
      };
      entry[`${type}Amount`] = event;
      const transaction = this.allPostingAccount.find(
        (x) => x.accountId === account.accountId
      );
      if (transaction?.openingBalance) {
        entry["transactionId"] = transaction?.openingBalance?.transactionId;
      }
      this.openingBalanceEntries.push(entry);
    } else {
      this.openingBalanceEntries[entryIndex][`${type}Amount`] = event;
    }
    this.allPostingAccount.find((x) => x?.accountId === account.accountId)[
      type
    ] = event;
    setTimeout(() => {
      this.calculateTotals();
    }, 1500);
  }
  calculateTotals(): void {
    this.totalDebit = 0;
    this.totalCredit = 0;
    this.allPostingAccount.forEach((entry) => {
      this.totalDebit += entry?.debit;
      this.totalCredit += entry?.credit;
    });
    this.totalDebit = +this.totalDebit.toFixed(2);
    this.totalCredit = +this.totalCredit.toFixed(2);

    this.debitCreditEqual = this.totalCredit === this.totalDebit;
  }

  calculateDifference() {
    const creditSum = this.allPostingAccount
      .map((acc) => acc.credit)
      .reduce((a, b) => a + b, 0);

    const debitSum = this.allPostingAccount
      .map((acc) => acc.debit)
      .reduce((a, b) => a + b, 0);

    let difference = 0;

    if (creditSum > debitSum) {
      difference = creditSum - debitSum;
      this.differenceInCreditAndDebit = difference;
      this.creditIsGreater = true;
      this.debitIsGreater = false;
    } else if (debitSum > creditSum) {
      difference = debitSum - creditSum;
      this.differenceInCreditAndDebit = difference;
      this.debitIsGreater = true;
      this.creditIsGreater = false;
    } else {
      this.creditIsGreater = false;
      this.debitIsGreater = false;
      this.differenceInCreditAndDebit = difference;
    }
  }

  loadOpeningBalance(): void {
    this.loader = true;
    this.financeService
      .getOpeningBalances()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.allPostingAccount = res?.body;
        this.openingBalanceDate = this.allPostingAccount.find(
          (x) => x?.openingBalance
        )?.openingBalance?.migrationDate;
        if (this.openingBalanceDate) {
          this.openingBalanceDate = customDateFormat(this.openingBalanceDate);
          this.disableDateSelection = true;
        }
        this.allPostingAccount.forEach((account) => {
          account["debit"] = account?.openingBalance
            ? account.openingBalance.debit
            : 0;
          account["credit"] = account.openingBalance
            ? account.openingBalance.credit
            : 0;

          if (account?.openingBalance) {
            const entry = {
              accountId: account?.accountId,
              debitAmount: account.openingBalance.debit,
              creditAmount: account.openingBalance.credit,
              transactionId: account.openingBalance.transactionId,
            };
            this.openingBalanceEntries.push(entry);
          }
        });
        this.calculateTotals();
        this.loader = false;
      });
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  downloadSampleOB() {
    this.financeService
      .getOpeningBalancesTemplate()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const fileName = `sample-opening-balance-${moment().format(
          "YYYY-MM-DD-HH:mm:ss"
        )}`;
        saveAs(res.body, fileName);
      });
  }

  attemptSubmit(): void {
    const hasNegativeValues = this.checkPostingsForNegativeValues(
      this.openingBalanceEntries
    );
    if (hasNegativeValues) {
      return;
    }

    Swal.fire({
      type: "info",
      text: "All invoices, payments received, credit notes, bills and its payments, recorded before the opening balance date will get adjusted with the amount entered.",
      title: "Are you sure you want to proceed?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.submit();
      }
    });
  }

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response?.body;
      });
  }

  checkPostingsForNegativeValues(postings: COAPosting[]) {
    const badPostings: COAPosting[] = [];
    if (postings?.length) {
      postings.forEach((item) => {
        if (item.creditAmount < 0 || item.debitAmount < 0) {
          badPostings.push(item);
        }
      });
    }

    if (badPostings.length) {
      const transformedBadCOA = badPostings
        .map((item) => `${item.accountName}`)
        .join(", ");

      this.showNegativeValuesErrorAlert(transformedBadCOA);
    }

    return badPostings.length > 0;
  }

  submit(): void {
    this.saving = true;
    let data: any = {
      migrationDate: this.openingBalanceDate,
      postings: this.openingBalanceEntries,
      currencyId: this.ownerInformation?.currencyId,
    };

    if (!this.openBalanceFile) {
      this.financeService
        .updateOpeningBalances(data)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => {
            this.saving = false;
            this.openingBalanceDate = null;
            this.openingBalanceEntries = [];
            this.allowEdit = false;
            this.loadOpeningBalance();
          },
          error: () => (this.saving = false),
        });
    } else {
      delete data.postings;
      data = { ...data, File: this.openBalanceFile };

      const formData = toFormData(data);

      this.financeService
        .importOpeningBalances(formData)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => {
            this.saving = false;
            this.openingBalanceDate = null;
            this.openingBalanceEntries = [];
            this.allowEdit = false;
            this.loadOpeningBalance();

            Swal.fire({
              type: "info",
              text: "The Opening Balances would be updated once your transaction has been approved",
              title: "Import was Successful",
              confirmButtonText: "OK",
              confirmButtonColor: "#558E90",
            });
          },
          error: () => (this.saving = false),
        });
    }
  }

  cancel(): void {
    this.allowEdit = false;
    this.creditIsGreater = false;
    this.debitIsGreater = false;
    this.differenceInCreditAndDebit = 0;

    if (this.openingBalanceEntries.length > 0) {
      this.openingBalanceEntries = [];
      this.loadOpeningBalance();
    }
  }

  openModal(modal: any): void {
    this.modalService.open(modal, { size: "lg" });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
