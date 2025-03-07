import { Component, OnDestroy, OnInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { UserService } from "src/app/service/user.service";
import { ConfigurationService } from "../../../service/configuration.service";
import swal from "sweetalert2";
import { AuthService } from "src/app/service/auth.service";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import * as moment from "moment";
import { CustomerService } from "src/app/service/customer.service";
import { CustomDropDown, PillFilters } from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";
import { Filter } from "src/app/model/filter";
import {
  BacklistedCustomerFilter,
  Customer,
  GetLoanCustomersResBody,
  TransformedBlacklistedCustomer,
} from "../loan.types";
import {
  AppOwnerInformation,
  Pagination,
  SearchParams,
  Tab,
  TableConfig,
  TableData,
  TableHeader,
  TablePaginationChange,
  User,
} from "../../shared/shared.types";
import { TabBarService } from "../../shared/components/tab-bar/tab-bar.service";
import { ActivatedRoute } from "@angular/router";
@Component({
  selector: "app-customers-page",
  templateUrl: "./customers-page.component.html",
  styleUrls: ["./customers-page.component.scss"],
})
export class CustomersPageComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  prospectiveCustomers: any[];
  blacklistedCustomers: TransformedBlacklistedCustomer[];

  currentUser: User;
  currentUserId: number;
  currentUserBranchId: number;

  currentView: "Customers" | "Prospects" | "Blacklist" = "Customers";
  requestLoader: boolean;
  fetchCustomerMetricsForBlacklist = false;
  ownerInformation: AppOwnerInformation;
  loader = false;
  updateLoader = false;

  viewCustomerMetrics: boolean;
  customerMetricsData: any;
  customerMetricsDataForBlacklisting: any;
  viewBlacklistedCustomer = false;
  selectedBlacklistedCustomer: TransformedBlacklistedCustomer;

  public loggedInUser: any;

  public toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });

  pagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  pagination2 = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  blacklistedCustomersPagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  searchParam = "";
  filter: BacklistedCustomerFilter;
  filterModel: Filter;

  loaninformation: any;
  viewloandetails: boolean;
  selectedloanid: any;
  selectedloancode: any;
  loanactivities: any[];
  loanhistoryperson: any;
  loanhistoryinformation: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();

  isEditingCustomer: boolean;
  customerForm: UntypedFormGroup;
  gender = [
    { id: "male", text: "Male" },
    { id: "female", text: "Female" },
  ];
  filterOptions: CustomDropDown[] = [
    { text: "Active", id: "Active" },
    { text: "Blacklisted", id: "Blacklisted" },
    { text: "Blacklist Requested", id: "BlacklistRequested" },
    { text: "Deactivated", id: "Deactivated" },
  ];
  tabs: Tab[] = [
    { id: "blacklist-info", text: "Info" },
    { id: "loan-history", text: "History" },
  ];
  currentTabId = "blacklist-info";
  isBlacklistingCustomer = false;
  copy_hover = false;
  isLoadingCustomers = false;
  customerTableConfig: TableConfig = {
    searchPlaceholder: "Code or Name",
    uniqueIdPropLink: "code",
    striped: true,
  };
  customerTableHeaders: TableHeader[] = [
    { name: "Code" },
    { name: "Name" },
    { name: "Originating Branch" },
    { name: "Email" },
    { name: "Phone Number" },
    { name: "" },
  ];
  customersTableData: TableData[] = [];
  customersPagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
    searchColumns: [],
    keyword: "",
  };
  selectedSearchColumn: string;
  selectedFilters: CustomDropDown;
  branches: CustomDropDown[] = [{ id: -1, text: "All Branches" }];

  constructor(
    private loanoperationService: LoanoperationsService,
    private userService: UserService,
    public authService: AuthService,
    private modalService: NgbModal,
    private configurationService: ConfigurationService,
    private colorThemeService: ColorThemeService,
    private customerService: CustomerService,
    private fb: UntypedFormBuilder,
    private sharedService: SharedService,
    private tabBarService: TabBarService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.listenForTabSwitch();
    this.removePill();
    this.getCustomerIdFromQuery();
    this.onFiltersChange();

    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.viewCustomerMetrics = false;
    this.configurationService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
    this.getUserPromise()
      .then((next) => {
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        this.spoolBranches();
      })
      .catch((err) => {});
  }

  getCustomerIdFromQuery() {
    const customerId = this.route.snapshot.queryParams["Id"];

    if (customerId !== null && customerId != undefined) {
      this.switchView("Blacklist", customerId);
    } else {
      this.switchView(this.currentView);
    }
  }

  listenForTabSwitch() {
    this.tabBarService.tabSwitched
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (id) => {
          this.currentTabId = id.tabId;

          if (id.tabId === "loan-history") {
            this.getCustomerMetricsByPersonId(
              this.selectedBlacklistedCustomer?.personId,
              false,
              true
            );
          }
        },
      });
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters) => {
        if (selectedFilters.action === "remove") {
          selectedFilters.filters.forEach((selectedFilter) => {
            if (selectedFilter.length === 0) this.getCustomers();
          });
        }
      });
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  closeModal() {
    this.modalService.dismissAll();
  }
  openModal(content) {
    this.modalService.open(content, { ariaLabelledBy: "modal-basic-title" });
  }

  switchView(
    view: "Customers" | "Prospects" | "Blacklist",
    customerId?: number
  ) {
    if (view === "Customers") {
      this.getCustomers();
    } else if (view === "Prospects") {
      this.getProspectiveCustomers();
    } else if (view === "Blacklist") {
      this.getBlacklistedCustomers(customerId);
    }

    if (this.filterModel) {
      this.filterModel.clearData();
    }
    this.currentView = view;
  }

  editCustomer(): void {
    this.isEditingCustomer = !this.isEditingCustomer;
  }

  getCustomers() {
    this.isLoadingCustomers = true;

    let payload = {
      pageNumber: this.customersPagination.pageNumber,
      pageSize: this.customersPagination.pageSize,
    };

    if (this.customersPagination.filter) {
      payload["filter"] = this.customersPagination.filter;
    }

    if (this.customersPagination.keyword) {
      payload["keyword"] = this.customersPagination.keyword;
      payload["selectedSearchColumn"] = this.selectedSearchColumn;
    }

    this.loanoperationService
      .getLoanCustomers(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.customers = res.body.value.data;
          this.setCustomersPagination(res.body);
          this.setCustomersTableData();

          this.isLoadingCustomers = false;
        },
        () => {
          this.isLoadingCustomers = false;
        }
      );
  }

  onCustomersPaginationChange(data: TablePaginationChange) {
    this.customersPagination.pageNumber = data.pageNumber;
    this.customersPagination.pageSize = data.pageSize;
    this.customersPagination.filter =
      data.filter || this.customersPagination.filter;
    this.getCustomers();
  }

  setCustomersPagination(res: GetLoanCustomersResBody): void {
    this.customersPagination = {
      hasNextPage:
        res.value.totalRecords / this.customersPagination.pageNumber > 1 &&
        this.customersPagination.pageNumber < res.value.pages,
      hasPreviousPage:
        res.value.totalRecords / this.customersPagination.pageNumber > 1 &&
        this.customersPagination.pageNumber > 1,
      pageNumber: this.customersPagination.pageNumber,
      pageSize: this.customersPagination.pageSize,
      totalPages: res.value.pages,
      totalCount: res.value.totalRecords,
      count: res.value.data.length,
      searchColumns: ["Name", "Code"],
      filter: this.customersPagination.filter,
    };

    this.customersPagination.jumpArray = [];
    for (let i = 1; i <= res.value.pages; i++) {
      this.customersPagination.jumpArray.push(i);
    }
  }

  setCustomersTableData() {
    this.customersTableData = this.customers.map((customer) => ({
      code: { tdValue: customer.personCode, type: "code" },
      name: { tdValue: `${customer.firstName} ${customer.lastName}` },
      branch: { tdValue: customer.originatingBranch },
      email: { tdValue: customer.emailAddress },
      phone: { tdValue: customer.phoneNumber },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getCustomerActionConfig(customer),
      },
    }));
  }

  getStatusClass(isActive: boolean): string {
    if (isActive) {
      return "badge-success";
    } else {
      return "badge-danger";
    }
  }

  getCustomerActionConfig(customer: Customer) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.getCustomerMetricsByPersonId(customer.personId),
      },
    ];
  }

  onSearchParams(data: SearchParams) {
    this.customersPagination.keyword = data.keyword;
    this.selectedSearchColumn = data.selectedSearchColumn;
    this.getCustomers();
  }

  onFilter(data: CustomDropDown) {
    if (+data.id > 0) {
      this.customersPagination.filter = data.id.toString();
    } else {
      this.customersPagination.filter = '';
    }

    this.selectedFilters = data;
    this.setSelectedFilters();
    this.getCustomers();
  }

  setSelectedFilters() {
    this.sharedService.selectedFilters$.next({
      filters: [[{ ...this.selectedFilters, type: "branch" }]],
      action: "add",
      headers: ["Branches"],
    });
  }

  onFiltersChange() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters: PillFilters) => {
        if (selectedFilters.filters[0].length === 0) {
          this.customersPagination.filter = null;
          this.customersPagination.pageNumber = 1;
          this.getCustomers();
        }
      });
  }

  getProspectiveCustomers(pageNum = this.pagination2.pageNum, filter = null) {
    this.prospectiveCustomers = [];
    this.requestLoader = true;

    // paginated section
    this.pagination2.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination2.pageNum = 1;
    }
    if (pageNum > this.pagination2.maxPage) {
      this.pagination2.pageNum = this.pagination2.maxPage || 1;
    }

    const paginationmodel = {
      UserId: this.currentUserId,
      BranchId: this.currentUserBranchId,
      pageNumber: this.pagination2.pageNum,
      pageSize: this.pagination2.pageSize,
      filter: this.pagination2.searchTerm,
    };

    this.loanoperationService
      .spoolLoanProspectiveCustomers(paginationmodel)
      .subscribe(
        (response) => {
          this.prospectiveCustomers = response.body.value.data;

          this.pagination2.maxPage = response.body.value.pages;
          this.pagination2.totalRecords = response.body.value.totalRecords;
          this.pagination2.count = this.prospectiveCustomers.length;
          this.pagination2.jumpArray = Array(this.pagination2.maxPage);
          for (let i = 0; i < this.pagination2.jumpArray.length; i++) {
            this.pagination2.jumpArray[i] = i + 1;
          }

          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;
        }
      );
  }

  getBlacklistedCustomers(customerId?: number) {
    this.blacklistedCustomers = [];
    this.requestLoader = true;
    let data = {
      pageNumber: this.blacklistedCustomersPagination.pageNumber,
      pageSize: this.blacklistedCustomersPagination.pageSize,
      keyword: this.searchParam,
      filter: "",
    };

    if (this.filter) {
      data.filter = this.filter;
    } else {
      delete data.filter;
    }

    this.loanoperationService
      .spoolLoanBlacklistedCustomers(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          const blacklists = res.body?.items;
          if (blacklists.length > 0) {
            blacklists.forEach((item) => {
              const mainData = {
                customerCode: item.customerCode,
                fullName: item.fullName,
                personId: item.personId,
              };
              if (item?.blacklistDetails?.length) {
                this.blacklistedCustomers.push({
                  ...item?.blacklistDetails[item?.blacklistDetails.length - 1],
                  ...mainData,
                });
              } else {
                this.blacklistedCustomers.push(mainData);
              }
            });

            if (customerId) {
              const customer = this.blacklistedCustomers.find(
                (item) => item.customerId === customerId
              );

              if (customer) {
                this.onViewCustomerForBlacklist(customer);
              }
            }

            this.setPagination(res.body);
          }

          if (data?.filter) {
            this.filterModel.setData({
              filters: [[{ id: data.filter, text: data.filter }]],
              filterTypes: ["status"],
              filterHeaders: ["Status"],
            });
          }
          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;
        }
      );
  }

  setPagination(res: any): void {
    this.blacklistedCustomersPagination.pageSize = res.pageSize;
    this.blacklistedCustomersPagination.pageNumber = res.pageNumber;
    this.blacklistedCustomersPagination.totalCount = res.totalCount;
    this.blacklistedCustomersPagination.hasNextPage = res.hasNextPage;
    this.blacklistedCustomersPagination.hasPreviousPage = res.hasPreviousPage;
    this.blacklistedCustomersPagination.totalPages = res.totalPages;
    this.blacklistedCustomersPagination.count = res.items.length;

    this.blacklistedCustomersPagination.jumpArray = Array(
      this.blacklistedCustomersPagination.totalPages
    );
    for (
      let i = 0;
      i < this.blacklistedCustomersPagination.jumpArray.length;
      i++
    ) {
      this.blacklistedCustomersPagination.jumpArray[i] = i + 1;
    }
  }

  confirmCustomerBlacklisting(customerId: number): void {
    swal
      .fire({
        type: "warning",
        text: "Are you sure you want to blacklist this customer?",
        title: "Blacklist Customer",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "No",
        confirmButtonText: "Yes I want to",
        confirmButtonColor: "#558E90",
      })
      .then((result) => {
        if (result.value) {
          this.blacklistCustomer(true, customerId);
        }
      });
  }

  blacklistCustomer(status: boolean, customerId: number) {
    this.isBlacklistingCustomer = true;
    const model = {
      customerId,
      isApproved: status,
      userId: this.currentUserId,
    };
    let message: string;

    if (status) {
      message = "approved";
    } else {
      message = "rejected";
    }
    this.loanoperationService.confirmBlacklistCustomer(model).subscribe(
      (response) => {
        this.isBlacklistingCustomer = false;
        this.toggleAside();
        this.getBlacklistedCustomers();
        this.toast.fire({
          type: "success",
          text: "Customer blacklist request has been " + message,
        });
      },
      (error) => {
        this.isBlacklistingCustomer = false;
      }
    );
  }

  confirmCustomerWhitelist(customerId: number): void {
    swal
      .fire({
        type: "warning",
        text: "Are you sure you want to whitelist customer?",
        title: "Whitelist Customer",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "No",
        confirmButtonText: "Yes I want to",
        confirmButtonColor: "#558E90",
      })
      .then((result) => {
        if (result.value) {
          this.whitelistCustomer(customerId);
        }
      });
  }

  whitelistCustomer(customerId: number) {
    this.requestLoader = true;
    const model = {
      customerId,
      userId: this.currentUserId,
    };
    this.loanoperationService.confirmWhitelistCustomer(model).subscribe(
      (response) => {
        this.requestLoader = false;
        this.getBlacklistedCustomers();
        this.toggleAside();
        this.toast.fire({
          type: "success",
          text: "Customer has been whitelisted.",
        });
      },
      (error) => {
        this.requestLoader = false;
      }
    );
  }

  getCustomerMetricsByPersonId(
    personId: any,
    openAside = true,
    forCustomerBlacklist = false
  ): void {
    if (!this.copy_hover) {
      this.customerMetricsData = null;
      if (!forCustomerBlacklist) this.requestLoader = true;
      if (forCustomerBlacklist) this.fetchCustomerMetricsForBlacklist = true;

      this.loanoperationService
        .spoolCustomerMetricsByPersonId(personId)
        .subscribe(
          (response) => {
            if (forCustomerBlacklist)
              this.fetchCustomerMetricsForBlacklist = false;

            if (forCustomerBlacklist) {
              this.customerMetricsDataForBlacklisting = response.body.data;
              return;
            }
            this.customerMetricsData = response.body.data;
            this.customerMetricsData = {
              ...this.customerMetricsData,
              personId,
            };
            this.requestLoader = false;
            this.isEditingCustomer = false;
            this.initCustomerEditForm(this.customerMetricsData, personId);
            if (openAside) this.openCustomerMetricsAside();
          },
          (error) => {
            if (forCustomerBlacklist)
              this.fetchCustomerMetricsForBlacklist = false;
            this.requestLoader = false;
          }
        );
    }
  }

  initCustomerEditForm(data: any, personId: any): void {
    this.customerForm = this.fb.group({
      firstName: new UntypedFormControl(data?.firstName, [Validators.required]),
      lastName: new UntypedFormControl(data?.lastName, [Validators.required]),
      employmentCode: new UntypedFormControl(data?.employmentCode),
      bvn: new UntypedFormControl(data?.bvn),
      dateOfBirth: new UntypedFormControl(
        this.formatDate(data?.dateOfBirth) ?? null
      ),
      personId: new UntypedFormControl(personId, [Validators.required]),
      email: new UntypedFormControl(data?.emailAddress, [Validators.required]),
      phoneNumber: new UntypedFormControl(data?.phoneNumber),
      branchId: new UntypedFormControl(data?.branchId),
      employerId: new UntypedFormControl(data?.employerId),
      sex: new UntypedFormControl(data?.sex),
      branch: new UntypedFormControl({
        id: data?.branchId,
        text: data?.branchName,
      }),
      residentialAddress: new UntypedFormControl(),
    });
  }

  updateCustomer(): void {
    this.updateLoader = true;
    const data = this.customerForm.value;
    this.customerService
      .updateCustomerMetricsByPersonId(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.isEditingCustomer = false;
          this.updateLoader = false;
          this.toast.fire({
            text: "Customer information updated successfully.",
            type: "success",
          });
          this.getCustomerMetricsByPersonId(data?.personId, false);
          if (this.currentView === "Customers") {
            this.getCustomers();
          } else if (this.currentView === "Prospects") {
            this.getProspectiveCustomers();
          }
        },
        (err) => {
          this.updateLoader = false;
        }
      );
  }

  spoolBranches(): void {
    const datamodel = { filter: "", UserId: this.loggedInUser.nameid };
    this.configurationService
      .spoolAccessibleBranches(datamodel)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        let branches = response.body.map((item) => {
          return { id: item.branchId, text: item.branchName };
        });

        this.branches = [...this.branches, ...branches];
      });
  }

  filterModalOpen(display?: boolean) {
    $(".filter-menu").toggle(display);
  }

  selected(type: string, event: any): void {
    this.customerForm.get(type).patchValue(event?.id);
  }

  removed(type: string): void {
    this.customerForm.get(type).patchValue(null);
  }

  csDateToYmd(csdate) {
    let jDate = new Date(csdate);
    let Y = jDate.getFullYear();
    let mn = jDate.getMonth() + 1;
    let m = ("0" + mn).substring(-2);
    let d = jDate.getUTCDate();
    return `${Y}-${m}-${d}`;
  }

  openCustomerMetricsAside() {
    this.viewCustomerMetrics = true;
    this.isEditingCustomer = false;

    this.viewBlacklistedCustomer = false;
    this.selectedBlacklistedCustomer = null;

    this.toggleAside();
  }

  closeCustomerMetricsAside() {
    this.customerMetricsData = null;
    this.viewCustomerMetrics = false;
  }

  onViewCustomerForBlacklist(customer: TransformedBlacklistedCustomer) {
    if (
      (customer.requestedBy || customer.reviewedAt) &&
      (this.filter === "BlacklistRequested" || this.filter === "Blacklisted")
    ) {
      this.customerMetricsData = null;
    } else {
      this.getCustomerMetricsByPersonId(customer.personId);
      return;
    }

    this.customerMetricsDataForBlacklisting = null;
    this.currentTabId = "blacklist-info";
    this.selectedBlacklistedCustomer = customer;
    this.viewBlacklistedCustomer = true;

    this.viewCustomerMetrics = false;
    this.toggleAside();
  }

  onCloseCustomerForBlacklistView() {
    this.viewBlacklistedCustomer = false;
  }

  toggleAside() {
    (window as any).viewLoan();
  }
  closeAside() {
    (window as any).viewLoan();
  }

  getLoanDetailsById(id, loanViewerModal) {
    this.requestLoader = true;
    this.loanoperationService.getLoanapplicationbyid(id).subscribe(
      (res) => {
        this.requestLoader = false;
        this.LoanDetails(res.body);
        this.loanPreview(
          this.loaninformation.person,
          this.loaninformation,
          loanViewerModal
        );
      },
      (err) => {
        this.requestLoader = false;
        // swal.fire('Error', err.error, 'error');
      }
    );
  }

  LoanDetails(loaninformation) {
    this.loaninformation = loaninformation;
    this.viewloandetails = true;
    this.selectedloanid = loaninformation.loanId;
    this.selectedloancode = loaninformation.applicationCode;
    this.loanactivities = [];
  }

  loanPreview(personinfo, loanrow, content) {
    this.loanhistoryperson = personinfo;
    this.loanhistoryinformation = loanrow;
    this.modalService.open(content, {
      size: "lg",
      ariaLabelledBy: "modal-basic-title",
      windowClass: "custom-modal-style opq2",
    });
  }

  getFromJson(stringArray, expectedResult) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }

  getFullDateDiff(date1, date2) {
    const dateOut1 = new Date(date1);
    const dateOut2 = new Date(date2);
    let message = "";

    if (date1 != null && date2 != null) {
      const diff = Math.floor(dateOut1.getTime() - dateOut2.getTime());
      const day = 1000 * 60 * 60 * 24;

      const days = Math.floor(diff / day);
      const months = Math.floor(days / 31);
      const years = Math.floor(months / 12);

      if (Number.isNaN(days) || Number.isNaN(months) || Number.isNaN(years)) {
        message = "Could not calculate";
      } else {
        // message += days + " days : \n"
        message += months + "month(s) : \n";
        message += years + "year(s) ago\n";
      }
    }

    return message;
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentUser = user.body;
          this.currentUserId = this.currentUser.userId;
          this.currentUserBranchId = this.currentUser.branchId;
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  getItemsPaginatedSearch2(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    this.pagination2.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getProspectiveCustomers(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination2.searchTerm = filter === "" ? null : filter;
    this.getProspectiveCustomers(pageNumber, filter);
  }

  toggleBlacklistStatus() {
    this.requestLoader = true;
    this.getBlacklistedCustomers();
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }
  printThisDocument(content, reportType: string) {
    const host = window.location.host;

    let printContents = null,
      popupWin = null,
      title = null,
      data = null;
    switch (reportType) {
      case "to_be_printed":
        printContents = document.getElementById(content).innerHTML;
        title =
          this.loanhistoryinformation.applicationCode + "_Loan_Information";
        data = this.loanhistoryinformation;
        break;
      default:
        swal.fire({
          type: "error",
          title: "Error",
          text: "Print Content seems to be empty",
        });
        break;
    }
    if (data != null && data.length !== 0 && printContents != null) {
      popupWin = window.open(
        "",
        "_blank",
        "top=0,left=0,height=100%,width=auto"
      );
      popupWin.document.open();
      popupWin.document.write(`
            <html>
              <head>
                <title>${title}</title>
                <link rel="stylesheet" href="http://${host}/assets/css/bootstrap.min.css" type="text/css"/>
                <style>
                //........Customized style.......
                @page { margin: 0 }
                body { margin: 0 }
                .sheet {
                  margin: 0;
                  overflow: hidden;
                  position: relative;
                  box-sizing: border-box;
                  page-break-after: always;
                }

                /** Paper sizes **/
                body.A3               .sheet { width: 297mm; height: 419mm }
                body.A3.landscape     .sheet { width: 420mm; height: 296mm }
                body.A4               .sheet { width: 210mm; height: 296mm }
                body.A4.landscape     .sheet { width: 297mm; height: 209mm }
                body.A5               .sheet { width: 148mm; height: 209mm }
                body.A5.landscape     .sheet { width: 210mm; height: 147mm }
                body.letter           .sheet { width: 216mm; height: 279mm }
                body.letter.landscape .sheet { width: 280mm; height: 215mm }
                body.legal            .sheet { width: 216mm; height: 356mm }
                body.legal.landscape  .sheet { width: 357mm; height: 215mm }

                /** Padding area **/
                .sheet.padding-10mm { padding: 10mm }
                .sheet.padding-15mm { padding: 15mm }
                .sheet.padding-20mm { padding: 20mm }
                .sheet.padding-25mm { padding: 25mm }

                /** For screen preview **/
                @media screen {
                  body { background: #e0e0e0 }
                  .sheet {
                    background: white;
                    box-shadow: 0 .5mm 2mm rgba(0,0,0,.3);
                    margin: 5mm auto;
                  }
                }

                /** Fix for Chrome issue #273306 **/
                @media print {
                          body.A3.landscape { width: 420mm }
                  body.A3, body.A4.landscape { width: 297mm }
                  body.A4, body.A5.landscape { width: 210mm }
                  body.A5                    { width: 148mm }
                  body.letter, body.legal    { width: 216mm }
                  body.letter.landscape      { width: 280mm }
                  body.legal.landscape       { width: 357mm }
                }
                nav, aside, footer, button {
                  display: none !important;
                  }

                  .row {
                    display: -ms-flexbox;
                    display: flex;
                    -ms-flex-wrap: wrap;
                    flex-wrap: wrap;
                    // margin-right: -1.6rem;
                    // margin-left: -1.6rem
                }

                .black {
                  color: #000;
               }

              .orange {
                  color: #ff015b;
                }


            .f-12 {
              font-size: 12px
              }

              .mb-1,
              .my-1 {
                  margin-bottom: .4rem !important
              }



                  .col-md-6 {
                    -ms-flex: 0 0 50%;
                    flex: 0 0 50%;
                    max-width: 50%
                }

                  .clay {
                    width: 50%;
                  }

                  .dt-card__title {
                    margin: 0;
                    margin-top: 4px;
                    font-size: 8px;
                    color: #262626
                }



                  .modal-header {
                    padding: 10px;
                  }

                  .table {
                    width: 100%;
                    margin-bottom: 0.4rem;
                    font-size:8px

                }


                .table th {
                      padding: 0.2rem;
                    vertical-align: top;
                    border-bottom:1pt solid black;
                    border-top:1pt solid black;

                    border-collapse: collapse;
                    border-spacing: 0;

                }

                .table td {
                  padding: 0.5rem;
                  vertical-align: top;
                  border-bottom-width: 1px solid #e8e8e8
              }



                  .text-center {
                    text-align: center;
                  }

                  .text-left {
                    text-align: left;
                  }

                  .text-right {
                    text-align: right;
                  }
                </style>
              </head>
          <body onload="window.print();window.close();">${printContents}</body>
            </html>`);
      //  popupWin.document.print();
      popupWin.document.close();
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  onOpenFilterModal() {
    $(".filter-menu").toggle();
  }

  onOptionSelected(option: { id: string; text: string }) {
    this.filter = option.id as BacklistedCustomerFilter;
    this.getBlacklistedCustomers();
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    filter.onChange((data) => {
      if (!data || !data?.status) {
        this.filterModel.clearData();
        this.filter = "";
      }
      this.getBlacklistedCustomers();
    });
  }

  getTotalSection(type, arrayinput, expectedResult) {
    let total = 0;

    if (type === "repayments") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          if (arrayinput[i].paymentTypeString == "Repayment") {
            total += arrayinput[i].paymentAmount;
          } else if (
            arrayinput[i].paymentTypeString == "Reversal" ||
            arrayinput[i].paymentTypeString == "Refund"
          ) {
            total -= arrayinput[i].paymentAmount;
          }
        }
      }
    }

    if (expectedResult === "formatted") {
      return total.toLocaleString(undefined, { minimumFractionDigits: 2 });
    } else {
      return total;
    }
  }

  isEmpty(value) {
    var isEmpty = false;
    if (value == "" || value == null || value == "null") {
      isEmpty = true;
    }
    return isEmpty;
  }

  protected formatDate(date: string): string {
    if (!date) return;
    let newDate = new Date(date);
    return moment(newDate).format("yyyy-MM-DD");
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Customer code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  attemptCustomerDeactivate(): void {
    swal
      .fire({
        type: "warning",
        text: "Are you sure you want to deactivate customer?",
        title: "Deactivate Customer",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "No",
        confirmButtonText: "Yes",
        confirmButtonColor: "#558E90",
      })
      .then((result) => {
        if (result.value) {
          this.deactivateCustomer(this.customerMetricsData?.personId);
          swal.fire({
            type: "info",
            text: "Deactivating customer",
            title: "Processing Request",
            allowEscapeKey: false,
            allowOutsideClick: false,
          });
          swal.showLoading();
        }
      });
  }

  deactivateCustomer(personId: any): void {
    const data = {
      personId,
    };

    this.customerService
      .deleteDuplicatePerson(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          swal.close();
          this.toast.fire({
            type: "success",
            text: "Customer deleted",
          });
        },
        (err) => {
          swal.close();
        }
      );
  }
}
