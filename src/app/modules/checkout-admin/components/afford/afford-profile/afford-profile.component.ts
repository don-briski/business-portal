import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CheckoutAdminService } from "../../../checkout-admin.service";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { ActivatedRoute, RouterModule } from "@angular/router";
import {
  AffordProfile,
  GetRawBankTransactionsResBody,
  RawBankTransaction,
} from "../../../types/generic";
import { SharedModule } from "src/app/modules/shared/shared.module";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import {
  GetDataQueryParams,
  Pagination,
  SearchParams,
  TableConfig,
  TableData,
  TableHeader,
} from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-afford-profile",
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule],
  templateUrl: "./afford-profile.component.html",
  styleUrls: ["./afford-profile.component.scss"],
})
export class AffordProfileComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();
  isLoading = false;
  profileInfo: AffordProfile;
  currentTheme: ColorThemeInterface;
  currentTabIndex = 1;
  tableConfig: TableConfig = {
    small: true,
    theadLight: true,
    rowClickable: false,
    searchPlaceholder: "Enter narration",
  };
  tableHeaders: TableHeader[] = [
    { name: "Transaction Date", centered: true },
    { name: "Amount", type: "amount" },
  ];

  incTableHeaders: TableHeader[] = [
    { name: "Month", centered: true },
    { name: "Amount", type: "amount" },
  ];

  sweeperTableHeaders: TableHeader[] = [
    { name: "Salary Date", centered: true },
    { name: "Salary Date Used For Calculation", centered: true },
    { name: "Check Date", centered: true },
    { name: "Check Date Used For Calculation", centered: true },
    { name: "Initial Balance", type: "amount" },
    { name: "Balance On Check Date", type: "amount" },
    { name: "Balance Percent Left on Check Date (%)", centered: true },
    { name: "Tag", centered: true },
  ];

  accActTableHeaders: TableHeader[] = [
    { name: "Date", centered: true },
    { name: "Count Credit", centered: true },
    { name: "Inflow Sum", type: "amount" },
    { name: "Outflow Sum", type: "amount" },
    { name: "Variance", type: "amount" },
  ];

  rawBankTransactionsTableHeaders: TableHeader[] = [
    { name: "Transaction Date", centered: true },
    { name: "Narration" },
    { name: "Type", centered: true },
    { name: "Amount", type: "amount" },
    { name: "Balance", type: "amount" },
  ];

  eligibilityTransactionsTableHeaders: TableHeader[] = [
    { name: "Month", centered: true },
    { name: "Total Monthly Credit", type: "amount" },
    { name: "Total Monthly Debit", type: "amount" },
    { name: "EMI Credit Multiple", centered: true },
    { name: "EMI Monthly Eligibility", centered: true },
  ];

  tableData: TableData[] = [];
  incTableData: TableData[] = [];
  sweeperTableData: TableData[] = [];
  accActivityTableData: TableData[] = [];
  eligibilityTransactionsTableData: TableData[] = [];

  allTransactions: RawBankTransaction[] = [];
  rawBankTransactionsData: TableData[] = [];
  rawBankTransactionsPagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
    searchColumns: [],
  };
  keyword: string;

  constructor(
    private checkoutAdmin: CheckoutAdminService,
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.getProfile(this.route.snapshot.params.id);
    this.loadTheme();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private getProfile(id: number) {
    this.isLoading = true;

    this.checkoutAdmin
      .getProfile(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.profileInfo = res.body.data;
          this.tableData =
            this.profileInfo?.affordProfile?.analysedBankStatement?.salaryTransactions?.map(
              (transaction) => ({
                transactionDate: {
                  tdValue: transaction.transactionDate,
                  type: "date",
                  centered: true,
                },
                amount: { tdValue: transaction.amount, type: "amount" },
              })
            ) || [];
          this.incTableData =
            this.profileInfo?.affordProfile?.incomeCipherOutcomeDetails?.salaryTransactions?.map(
              (transaction) => ({
                month: { tdValue: transaction.month, centered: true },
                amount: { tdValue: transaction.amount, type: "amount" },
              })
            ) || [];
          this.sweeperTableData =
            this.profileInfo?.affordProfile?.sweeperCipherOutcomeDetails?.sweeperCipherCalculatedValues?.salaryTransactionsWithSweepTags?.map(
              (transaction) => ({
                salaryDate: {
                  tdValue: transaction.salaryDate,
                  type: "date",
                  centered: true,
                },
                SalaryDateUsedForCalculation: {
                  tdValue: transaction.salaryDateUsedForCalculation,
                  type: "date",
                  centered: true,
                },
                CheckDate: {
                  tdValue: transaction.checkDate,
                  type: "date",
                  centered: true,
                },
                CheckDateUsedForCalculation: {
                  tdValue: transaction.checkDateUsedForCalculation,
                  type: "date",
                  centered: true,
                },
                InitialBalance: {
                  tdValue: transaction.initialBalance,
                  type: "amount",
                  centered: true,
                },
                BalanceOnConfigCheckDate: {
                  tdValue: transaction.balanceOnConfigCheckDate,
                  type: "amount",
                },
                BalancePercentLeftonCheckDate: {
                  tdValue:
                  transaction?.balanceOnConfigCheckDate != null &&
                  transaction?.initialBalance != null &&
                  transaction?.initialBalance > 0
                    ? (
                        (transaction.balanceOnConfigCheckDate /
                          transaction.initialBalance) *
                        100
                      ).toFixed(2)
                    : "-", // Fallback value for invalid or zero initialBalance
                centered: true,
                },
                Tag: {
                  tdValue: transaction.tag,
                  centered: true,
                },
              })
            ) || [];

          this.accActivityTableData =
            this.profileInfo?.affordProfile?.accountActivityCipherOutcomeDetails?.monthResult?.map(
              (transaction) => ({
                Month: {
                  tdValue: transaction.month,
                  type: "date",
                  centered: true,
                },
                CountCredit: {
                  tdValue: transaction.countCredit,
                  centered: true,
                },
                InflowSum: { tdValue: transaction.inflowSum, type: "amount" },
                OutflowSum: {
                  tdValue: transaction.outflowSum,
                  type: "amount",
                },
                Variance: { tdValue: transaction.variance, type: "amount" },
              })
            ) || [];

            this.eligibilityTransactionsTableData =
            this.profileInfo?.affordProfile?.analysedBankStatement?.calculatedEligibilityResult?.eligibilityTransactions?.map(
              (transaction) => ({
                Month: {
                  tdValue: transaction.month,
                  centered: true,
                },
                TotalMonthlyCredit: {
                  tdValue: transaction.totalMonthlyCredit,
                  type: "amount"
                },
                TotalMonthlyDebit: { tdValue: transaction.totalMonthlyDebit, type: "amount" },
                EMICreditMultiple: {
                  tdValue: transaction.emiCreditMultiple,
                  centered: true,
                },
                EMIMonthlyEligibility: { tdValue: transaction.emiMonthlyEligibility},
              })
            ) || [];


          this.allTransactions =
            this.profileInfo?.affordProfile?.rawBankSpoolData?.bankTransactions;

          this.setRawBankTransactionsTableData();

          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  setRawBankTransactionsTableData() {
    const transRes = this.getRawBankTransactions({
      pageNumber: this.rawBankTransactionsPagination.pageNumber,
      pageSize: this.rawBankTransactionsPagination.pageSize,
      keyword: this.keyword,
    });

    this.setRawBankTransactionsPagination(transRes);

    this.rawBankTransactionsData = transRes?.items?.map((transaction) => ({
      transactionDate: {
        tdValue: transaction.transactionDate,
        type: "date",
        centered: true,
      },
      narration: { tdValue: transaction.narration },
      type: { tdValue: transaction.type, centered: true },
      amount: {
        tdValue: transaction.amount,
        type: "amount",
        defaultConfig: {
          class: transaction.type === "Debit" ? "text-danger" : "text-success",
        },
      },
      balance: { tdValue: transaction.balance, type: "amount" },
    })) || [] ;
  }

  getRawBankTransactions(
    data: GetDataQueryParams
  ): GetRawBankTransactionsResBody {
    let transactions = this.allTransactions || [];

    if (data.keyword) {
      transactions = transactions.filter((t) => {
        const narration = t.narration.replace(/\s+/g, "");
        const keyword = data.keyword.replace(/\s+/g, "");
        return narration.includes(keyword);
      });
    }

    const itemsLength = transactions.length;
    const totalPages = Math.ceil(itemsLength / data.pageSize);

    const chapters = {};
    const pageSize = data.pageSize;
    let pageNumber = 1;
    let count = 1;

    while (count <= itemsLength) {
      chapters[pageNumber] = { start: count, end: count + pageSize - 1 };
      count += pageSize;
      pageNumber++;
    }

    let items = [];

    if (Object.entries(chapters).length) {
      chapters[Object.entries(chapters).length]["end"] = itemsLength;
      items = transactions.slice(
        chapters[data.pageNumber]["start"] - 1,
        chapters[data.pageNumber]["end"]
      );
    }

    const pagination: Pagination = {
      hasNextPage: data.pageNumber < totalPages,
      hasPreviousPage: data.pageNumber > 1,
      pageNumber: data.pageNumber,
      pageSize: data.pageSize,
      totalCount: itemsLength,
      count: data.pageSize,
      totalPages: totalPages,
      searchColumns: ["Narration"],
    };

    return { ...pagination, items };
  }

  setRawBankTransactionsPagination(res: GetRawBankTransactionsResBody): void {
    this.rawBankTransactionsPagination = res;
    this.rawBankTransactionsPagination.count = res.items.length;

    this.rawBankTransactionsPagination.jumpArray = [];
    for (let i = 1; i <= this.rawBankTransactionsPagination.totalPages; i++) {
      this.rawBankTransactionsPagination.jumpArray.push(i);
    }
  }

  onPaginationChange(data: { pageSize: number; pageNumber: number }) {
    this.rawBankTransactionsPagination.pageNumber = +data.pageNumber;
    this.rawBankTransactionsPagination.pageSize = +data.pageSize;
    this.setRawBankTransactionsTableData();
  }

  onSearchParams(data: SearchParams) {
    this.keyword = data.keyword;
    this.setRawBankTransactionsTableData();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
