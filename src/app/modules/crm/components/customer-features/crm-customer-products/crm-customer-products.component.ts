import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import {
  CRMCustomerDetail,
  CustomerInvestmentProduct,
  CustomerLoanProduct,
} from "../../../crm.types";
import { SharedService } from "src/app/service/shared.service";
import { AllModulesEnum } from "src/app/util/models/all-modules.enum";
import {
  Tab,
  TableConfig,
  TableData,
  TableHeader,
} from "src/app/modules/shared/shared.types";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CrmService } from "../../../crm.service";

@Component({
  selector: "lnd-crm-customer-products",
  templateUrl: "./crm-customer-products.component.html",
  styleUrls: ["./crm-customer-products.component.scss"],
})
export class CrmCustomerProductsComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject<void>();

  @Input() customer: CRMCustomerDetail;
  @Input() permissions: string[] = [];

  MODULES = AllModulesEnum;
  tabs: Tab[] = [
    { id: AllModulesEnum.Loan, text: "Loans" },
    { id: AllModulesEnum.Investment, text: "Investments" },
  ];
  currentTabId = AllModulesEnum.Loan;
  isLoading = false;
  config: TableConfig = {
    theadLight: true,
    rowClickable: false,
  };
  data: TableData[] = [];
  headers: TableHeader[] = [];

  constructor(
    private router: Router,
    private sharedService: SharedService,
    private crmService: CrmService
  ) {}

  ngOnInit(): void {
    this.getLoanProducts();
  }

  gotoProduct(product: AllModulesEnum, investorType?: string) {
    if (product === AllModulesEnum.Loan) {
      this.sharedService.setModuleInSession(AllModulesEnum.Loan);
      this.router.navigate(["/loan/new-application"]);
    } else if (product === AllModulesEnum.Investment) {
      this.sharedService.setModuleInSession(AllModulesEnum.Investment);
      this.router.navigate(["/treasury/investments/create"], {
        queryParams: { type: investorType },
      });
    }
  }

  switchTab(tab: AllModulesEnum) {
    this.currentTabId = tab;
    if (this.currentTabId === AllModulesEnum.Loan) {
      this.getLoanProducts();
    }

    if (this.currentTabId === AllModulesEnum.Investment) {
      this.getInvestmentProducts();
    }
  }

  private getLoanProducts() {
    this.isLoading = true;
    this.crmService
      .getCrmCustomerLoans({
        pageNumber: 1,
        pageSize: 40,
        customerId: this.customer.id,
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.setDataTable(res.body.items);
        },
        error: () => (this.isLoading = false),
      });
  }

  private getInvestmentProducts() {
    this.isLoading = true;
    this.crmService
      .getCrmCustomerInvestments({
        pageNumber: 1,
        pageSize: 40,
        customerId: this.customer.id,
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.headers = [
            { name: "Code", type: "code" },
            { name: "Amount", type: "amount" },
            { name: "Maturity Amount", type: "amount" },
            { name: "Status" },
            { name: "Created At" },
          ];
          this.setDataTable(res.body.items);
        },
        error: () => (this.isLoading = false),
      });
  }

  private setDataTable(payload) {
    if (this.currentTabId === AllModulesEnum.Loan) {
      this.headers = [
        { name: "Code", type: "code" },
        { name: "Loan Amount", type: "amount" },
        { name: "Amount to be Repaid", type: "amount" },
        { name: "Created At" },
      ];
      this.data = payload.map((loan) => ({
        code: {
          tdValue: loan?.loanCode || loan?.applicationCode,
          type: "code",
        },
        loanAmount: { tdValue: loan?.loanAmount, type: "amount" },
        repaid: {
          tdValue: loan?.amountToBeRepayed > 0 ? loan?.amountToBeRepayed : "--",
          type: loan?.amountToBeRepayed > 0 ? "amount" : "",
          alignment: "right",
        },
        createdAt: { tdValue: loan?.createdAt, type: "date" },
      }));
    } else if (this.currentTabId === AllModulesEnum.Investment) {
      this.headers = [
        { name: "Code", type: "code" },
        { name: "Investment Amount", type: "amount" },
        { name: "Maturity Amount", type: "amount" },
        { name: "Created At" },
      ];
      this.data = payload.map((inv) => ({
        code: { tdValue: inv?.investmentCode, type: "code" },
        amt: { tdValue: inv?.investmentAmount, type: "amount" },
        amtRepaid: { tdValue: inv?.maturityAmount > 0 ? inv?.maturityAmount : "--",
          type: inv?.maturityAmount > 0 ? "amount" : "",
          alignment: "right", },
        createdAt: { tdValue: inv?.createdAt, type: "date" },
      }));
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
