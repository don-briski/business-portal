import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject } from "rxjs";
import { CheckoutAdminService } from "../../../checkout-admin.service";
import { takeUntil } from "rxjs/operators";
import {
  Pagination,
  SearchParams,
  TableConfig,
  TableData,
  TableHeader,
  User,
} from "src/app/modules/shared/shared.types";
import { SharedModule } from "src/app/modules/shared/shared.module";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { Router } from "@angular/router";
import { CustomDropDown, PillFilters } from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AffordProfileCustomer } from "../../../checkout-admin.types";
import {
  CustomersTab,
  CustomerStatusEnum,
  FEEDBACK_RESPONSE_DATA,
  FeedbackResponseData,
} from "./profiles_data";

@Component({
  selector: "lnd-profiles",
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: "./profiles.component.html",
  styleUrls: ["./profiles.component.scss"],
})
export class ProfilesComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject<void>();

  currentTheme: ColorThemeInterface;
  currentTab: CustomersTab = "customers";
  isLoading = false;
  feedbackResponseData = FEEDBACK_RESPONSE_DATA;
  affordProfileCustomers: AffordProfileCustomer[];
  customersTableHeaders: TableHeader[] = [
    { name: "Customer" },
    { name: "Category" },
    { name: "BVN" },
    { name: "Date Created" },
    { name: "Last Updated" },
    { name: "Status" },
    { name: "Status Description" },
    { name: "" },
  ];
  feedbackResponseTableHeaders: TableHeader[] = [
    { name: "Status" },
    { name: "Internal Description" },
    { name: "Feedback to Customer", alignment: 'left' },
  ];
  customersTableData: TableData[] = [];
  feedbackResponseTableData: TableData[] = [];
  customersTableConfig: TableConfig = {
    uniqueIdPropLink: "customer",
    rowClickable: false,
  };
  user: User;
  pagination: Pagination = {
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
  feedbackResponsePagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 0,
    pageSize: 0,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
    searchColumns: ["Status", "Description"],
  };
  filterStatuses: CustomDropDown[] = [
    { id: "CAT A", text: "CAT A" },
    { id: "CAT B", text: "CAT B" },
    { id: "CAT C", text: "CAT C" },
    { id: "CAT D", text: "CAT D" },
    { id: "CAT E", text: "CAT E" },
  ];
  selectedFilters: CustomDropDown;

  constructor(
    private checkoutAdminService: CheckoutAdminService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private sharedService: SharedService,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.fetchCustomers();
    this.getUser();
    this.removePill();
    this.setFeedbackResponseTableData(this.feedbackResponseData);
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  onSwitchTab(tab: CustomersTab) {
    this.currentTab = tab;
    if (this.currentTab === 'customers') {
      this.fetchCustomers();
    }
  }

  setFeedbackResponseTableData(data: FeedbackResponseData[]) {
    this.feedbackResponseTableData = data.map((item) => ({
      status: {
        tdValue: item.status,
        type: "code",
      },
      description: {
        tdValue: item.description,
      },
      feedback: {
        tdValue: item.feedback,
        alignment: "left",
      },
    }));
  }

  private fetchCustomers(props?) {
    let payload = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };
    if (props) {
      payload = { ...payload, ...props };
    }
    this.isLoading = true;
    this.checkoutAdminService
      .fetchAffordProfile(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.affordProfileCustomers = res.body.items;
          this.customersTableData = this.affordProfileCustomers.map(
            (customer) => ({
              customer: {
                tdValue: customer?.customerName,
                id: customer?.checkoutCustomerId,
              },
              category: {
                tdValue: customer?.category,
                defaultConfig: {
                  style: { color: this.currentTheme.secondaryColor },
                },
              },
              bvn: { tdValue: customer?.bvn },
              createdAt: {
                tdValue: customer?.createdAt,
                type: "date",
              },
              lastUpdated: {
                tdValue: customer?.lastUpdated,
                type: "date",
              },
              status: {
                tdValue: customer.status,
                type: "status",
                statusConfig: {
                  class: this.getStatusClass(customer.status),
                },
              },
              statusDesc: {
                tdValue: this.getStatusDesc(customer.status),
              },
              action: {
                tdValue: null,
                type: "action",
                actionConfig: this.getActionConfig(
                  customer.checkoutCustomerId,
                  {
                    hasAffordProfile: customer.hasAffordProfile,
                    hasCreditFile: customer.hasCreditFile,
                    hasCreditProfile: customer.hasCreditProfile,
                  }
                ),
              },
            })
          );
          this.setPagination(res.body);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  getStatusClass(status: string): string {
    if (status === "Eligible") {
      return "badge-success";
    } else {
      return "badge-warning";
    }
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  getActionConfig(
    id: number,
    options: {
      hasAffordProfile: boolean;
      hasCreditFile: boolean;
      hasCreditProfile: boolean;
    }
  ) {
    let textSegment = "";
    let view = "";
    const canViewAffordProfile = this.user.permission.includes(
      "View Afford Profile"
    );
    const canViewCreditFile = this.user.permission.includes("View Credit File");
    const canViewCreditProfile = this.user.permission.includes(
      "View Credit Profile"
    );
    if (canViewCreditFile && options.hasCreditFile) {
      textSegment = "Credit File";
      view = "cf";
    }
    if (canViewCreditProfile && options.hasCreditProfile) {
      textSegment = "Credit Profile";
      view = "cp";
    }
    if (
      canViewCreditFile &&
      canViewCreditProfile &&
      options.hasCreditFile &&
      options.hasCreditProfile
    ) {
      textSegment = "Credit File & Profile";
      view = "cfncp";
    }

    return [
      {
        showBtn: canViewAffordProfile,
        iconClass: "icon-forward",
        btnText: "View Afford Profile",
        disable: !options.hasAffordProfile,
        funcRef: () => {
          if (canViewAffordProfile && options.hasAffordProfile) {
            this.router.navigateByUrl("/checkout-admin/customers/" + id);
          }
        },
      },
      {
        showBtn: canViewCreditFile || canViewCreditProfile,
        iconClass: "icon-forward",
        btnText: `View ${textSegment}`,
        disable: !options.hasCreditFile && !options.hasCreditProfile,
        funcRef: () => {
          if (
            (canViewCreditFile && options.hasCreditFile) ||
            (canViewCreditProfile && options.hasCreditProfile)
          ) {
            this.router.navigateByUrl(
              `/checkout-admin/customers/${id}/credit-file-profile?view=${view}`
            );
          }
        },
      },
    ];
  }

  getStatusDesc(status: CustomerStatusEnum) {
    let msg = "";
    switch (status) {
      case CustomerStatusEnum.Eligible:
        msg = "Eligible.";
        break;
      case CustomerStatusEnum.NotEligible:
        msg = "Default Ineligible.";
        break;
      case CustomerStatusEnum.FailedUniquenessCheck:
        msg = "Parent Application Check: Failed Uniqueness Check.";
        break;
      case CustomerStatusEnum.CreditFileOutDated:
        msg = "Credit Check: Credit File Out Dated.";
        break;
      case CustomerStatusEnum.SystemError:
        msg = "Internal error occurred while processing.";
        break;
      case CustomerStatusEnum.NotEligibleRSB1:
        msg = "Category not permitted: Auto Decline set for category.";
        break;
      case CustomerStatusEnum.NotEligibleRSB2:
        msg =
          "Bank Statement Length Failure: Customer does not meet the required bank statement length.";
        break;
      case CustomerStatusEnum.NotEligibleRSB3:
        msg =
          "Gambling Rate: Customer's gambling rate within the review period is above the set threshold.";
        break;
      case CustomerStatusEnum.NotEligibleRSB4:
        msg =
          "Narration Cipher: Customer statement contains a restricted transaction.";
        break;
      case CustomerStatusEnum.NotEligibleRSB5:
        msg =
          "Earner Check: Customer could not be identified as a salaried earner.";
        break;
      case CustomerStatusEnum.NotEligibleRSB6:
        msg = "Income Check: Customer was not identified as a salary earner.";
        break;
      case CustomerStatusEnum.NotEligibleRSB7:
        msg =
          "Income Check: Customer did not have the required number of salaried earnings.";
        break;
      case CustomerStatusEnum.NotEligibleRSB8:
        msg =
          "Income Check: Customer salaries are not consistent enough to validate salary date.";
        break;
      case CustomerStatusEnum.NotEligibleRSB9:
        msg = "Income Check: Customer salary could not be determined.";
        break;
      case CustomerStatusEnum.NotEligibleRSB10:
        msg =
          "Sweeper Check: Customer withdrawal behaviour is not within acceptable limits.";
        break;
      case CustomerStatusEnum.NotEligibleRSB11:
        msg =
          "Loan Limit Check: Customer earning does not meet the minimum income level.";
        break;
      case CustomerStatusEnum.NotEligibleRSB12:
        msg =
          "Loan Limit Check: Customer does not have all data points required to calculate a loan limit.";
        break;
      case CustomerStatusEnum.NotEligibleRSB13:
        msg =
          "Loan Limit Check: Customer loan offer is less than minimum loan amount allowed for this category.";
        break;
      case CustomerStatusEnum.NotEligibleRSB14:
        msg =
          "Account Activity Check: Customer account activity did not meet required threshold.";
        break;
      case CustomerStatusEnum.NotEligibleRSB15:
        msg =
          "Bank Statement Check: No transactions found in back statement for provided bank account within the selected period.";
        break;
      case CustomerStatusEnum.NotEligibleRSB16:
        msg =
          "Bank Statement Check: Retrieval failed due to insufficient funds in the customer's account.";
        break;
      case CustomerStatusEnum.NotEligibleRSB17:
        msg = "Bank Statement Check: Bank retrieval processing from partner.";
        break;
      case CustomerStatusEnum.NotEligibleRSB18:
          msg = "Loan Limit Check: Customer analysis went through EMI secondary route and failed Eligibility checks";
        break;
    }
    
    return msg;
  }

  onPaginationChange(event) {
    delete event["filter"];
    this.fetchCustomers(event);
  }

  onSearchParams(event: SearchParams, tab: CustomersTab) {
    if (tab === "customers") {
      this.fetchCustomers(event);
    } else {
      this.updateFeedbackResponseData(event);
    }
  }

  updateFeedbackResponseData(search: SearchParams) {
    let updatedData: FeedbackResponseData[];
    
    if (search.selectedSearchColumn.toLowerCase() === "status") {
      updatedData = this.feedbackResponseData.filter((item) =>
        item.status.toLowerCase().includes(search.keyword.toLowerCase())
      );
    } else {
      updatedData = this.feedbackResponseData.filter((item) =>
        item.description.toLowerCase().includes(search.keyword.toLowerCase())
      );
    }

    this.setFeedbackResponseTableData(updatedData);
  }

  onFilter(event) {
    this.selectedFilters = event;
    this.setSelectedFilters();
    this.fetchCustomers({ filter: event.id });
  }

  setSelectedFilters() {
    this.sharedService.selectedFilters$.next({
      filters: [[{ ...this.selectedFilters, type: "status" }]],
      action: "add",
      headers: ["Categories"],
    });
  }

  private setPagination(res: any): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters: PillFilters) => {
        if (selectedFilters.filters[0].length === 0) {
          this.fetchCustomers();
        }
      });
  }

  viewCustomer(id: number) {
    this.router.navigate([`/checkout-admin/customers/${id}`]);
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
