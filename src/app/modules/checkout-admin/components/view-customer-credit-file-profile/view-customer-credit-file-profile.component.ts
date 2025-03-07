import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { CheckoutAdminService } from "../../checkout-admin.service";
import {
  CustomerCreditFile,
  CustomerCreditProfile,
} from "../../checkout-admin.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import {
  TableConfig,
  TableData,
  TableHeader,
  User,
} from "src/app/modules/shared/shared.types";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { ConfigurationService } from "src/app/service/configuration.service";

@Component({
  selector: "lnd-view-customer-credit-file-profile",
  templateUrl: "./view-customer-credit-file-profile.component.html",
  styleUrls: ["./view-customer-credit-file-profile.component.scss"],
})
export class ViewCustomerCreditFileProfileComponent
  implements OnInit, OnDestroy
{
  private unsubscriber$ = new Subject();

  user: User;
  currencySymbol: string;
  currentTheme: ColorThemeInterface;
  customerBvn?: string;
  customerName?: string;
  gettingCreditFile = false;
  gettingCreditProfile = false;
  customerCreditFile?: CustomerCreditFile;
  customerCreditProfile?: CustomerCreditProfile;
  currentTabIndex = 1;
  tableConfig: TableConfig = {
    small: true,
    theadLight: true,
    rowClickable: false,
    shadow: true,
    style: { width: "100vw" },
  };
  tableHeaders: TableHeader[] = [
    { name: "Account Number" },
    { name: "Loan Duration", centered: true },
    { name: "Repayment Frequency", centered: true },
    { name: "Installment Amount", type: "amount" },
    { name: "Opening Balance", type: "amount" },
    { name: "Open Date" },
    { name: "Current Balance", type: "amount" },
    { name: "Account Status" },
    { name: "Performance Status" },
    { name: "Last Updated" },
    { name: "Closed Date" },
    { name: "Exempted" },
    { name: "Max Delinquency (Days)", centered: true },
    { name: "Recency (Years)", centered: true },
  ];
  tableData: TableData[] = [];
  availableViews: string[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly checkoutAdminService: CheckoutAdminService,
    private configServ: ConfigurationService,
    private colorThemeService: ColorThemeService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getAppOwnerDetails();
    this.getTheme();
    this.getUser();
    this.getData();
  }

  getAppOwnerDetails() {
    this.configServ
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.currencySymbol = res.body?.currency?.currencySymbol;
      });
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  getData() {
    const view = this.route.snapshot.queryParams["view"];
    if (view === "cf" || view === "cfncp") {
      if (view === "cf") {
        this.availableViews.push("Credit File");
      } else {
        this.availableViews = ["Credit File", "Credit Profile"];
      }
      this.getCustomerCreditFile();
    }

    if (view === "cp" || view === "cfncp") {
      if (view === "cp") {
        this.availableViews.push("Credit Profile");
        this.currentTabIndex = 2;
      } else {
        this.availableViews = ["Credit File", "Credit Profile"];
      }
      this.getCustomerCreditProfile();
    }
  }

  private getTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getCustomerCreditFile() {
    const id = this.route.snapshot.params["id"];
    this.gettingCreditFile = true;

    this.checkoutAdminService
      .getCustomerCreditFile(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.customerCreditFile = res.body.data;
          this.gettingCreditFile = false;

          if (!this.customerBvn && this.customerCreditFile.bvn) {
            this.customerBvn = this.customerCreditFile.bvn;
          }
          if (!this.customerName && this.customerCreditFile.name) {
            this.customerName = this.customerCreditFile.name;
          }

          this.setTableData();
        },
        error: () => {
          this.gettingCreditFile = false;
        },
      });
  }

  getCustomerCreditProfile() {
    const id = this.route.snapshot.params["id"];
    this.gettingCreditProfile = true;

    this.checkoutAdminService
      .getCustomerCreditProfile(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.customerCreditProfile = res.body?.data?.creditProfile;
          if (!this.customerBvn && res.body?.data?.bvn) {
            this.customerBvn = res.body?.data?.bvn;
          }
          if (!this.customerName && res.body?.data?.name) {
            this.customerName = res.body?.data?.name;
          }
          this.gettingCreditProfile = false;
        },
        error: () => {
          this.gettingCreditProfile = false;
        },
      });
  }

  setTableData() {
    this.tableData = this.customerCreditFile?.creditFile?.loans?.map((loan) => {
      return {
        accountNumber: {
          tdValue: loan.accountNumber,
          defaultConfig: {
            style: { color: this.currentTheme.secondaryColor },
          },
        },
        loanDuration: { tdValue: loan.loanDuration, centered: true },
        repaymentFrequency: {
          tdValue: loan.repaymentFrequency,
          centered: true,
        },
        installmentAmount: { tdValue: loan.installmentAmount, type: "amount" },
        openingBalanceAmount: {
          tdValue: loan.openingBalanceAmount,
          type: "amount",
        },
        loanOpenDate: { tdValue: loan.loanOpenDate, type: "date" },
        currentBalance: { tdValue: loan.currentBalance, type: "amount" },
        accountStatus: { tdValue: loan.accountStatus },
        performanceStatus: { tdValue: loan.performanceStatus },
        lastUpdated: { tdValue: loan.lastUpdated, type: "date" },
        loanClosedDate: { tdValue: loan.loanClosedDate, type: "date" },
        isExempted: { tdValue: loan.isExempted ? "Exempted" : "Not Exempted" },
        maxDelinquencyInDays: {
          tdValue: loan.maxDelinquencyInDays,
          centered: true,
        },
        recencyInYears: { tdValue: loan.recencyInYears, alignment: "center" },
      };
    });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
