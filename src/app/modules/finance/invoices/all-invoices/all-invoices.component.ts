import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { FinanceService } from "../../service/finance.service";
import Swal from "sweetalert2";
import * as moment from "moment";
import { StatusFilter } from "../../models/status-filter.interface";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { CustomDropDown, PillFilters } from "src/app/model/CustomDropdown";
import { Filter } from "src/app/model/filter";
import { SharedService } from "src/app/service/shared.service";
import { FinanceTabs, GetInvoicesResBody, Invoice } from "../../finance.types";
import {
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
} from "src/app/modules/shared/shared.types";

@Component({
  selector: "app-all-invoices",
  templateUrl: "./all-invoices.component.html",
  styleUrls: ["./all-invoices.component.scss"],
})
export class AllInvoicesComponent implements OnInit, OnDestroy {
  @ViewChild("financePayment", { static: true }) financePayment: HTMLElement;
  isSingleView: boolean = false;
  isLoading: boolean = false;
  user: any;
  currentTheme: ColorThemeInterface;
  selectedInvoiceId: number;
  selectedInvoice: any;
  invoices: Invoice[] = [];
  filterStatuses: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "ReDraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
    { id: "NotPaid", text: "Not Paid" },
    { id: "PartiallyPaid", text: "Partially Paid" },
  ];
  paymentStatuses: string[] = ["NotPaid", "PartiallyPaid", "Paid"];
  statusFilter: StatusFilter;

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

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  private _unsubscriber$ = new Subject();
  ownerInformation: any;
  accounts: any[] = [];
  filterModel: Filter;
  copy_hover = false;
  invoiceTableConfig: TableConfig = {
    uniqueIdPropLink: "code",
    searchPlaceholder: "Code or Name",
    striped: true,
  };
  invoiceTableHeaders: TableHeader[] = [
    { name: "Code", type: "code" },
    { name: "Customer" },
    { name: "Reference" },
    { name: "Invoice Date" },
    { name: "Due Date" },
    { name: "Amount", type: "amount" },
    { name: "Balance Due", type: "amount" },
    { name: "Status" },
    { name: "" }
  ];
  invoiceTableData: TableData[] = [];
  selectedFilters: CustomDropDown;
  currentTab:FinanceTabs = FinanceTabs.open;

  constructor(
    private _userService: UserService,
    private _authService: AuthService,
    private _colorThemeService: ColorThemeService,
    private _financeService: FinanceService,
    private _configService: ConfigurationService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this._fetchUser();
    this._loadTheme();
    this.statusFilter = {
      pageNumber: +this.pagination.pageNumber,
      pageSize: +this.pagination.pageSize,
      statusFilter: {
        status: ["Draft", "ReDraft", "SentForApproval"],
        operator: "Or",
        paymentStatuses: ["NotPaid", "PartiallyPaid"],
      },
    };
    this.getInvoices(this.statusFilter);
    this.getApplicationownerinformation();
    this.removePill();
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  viewInvoice(invoiceId: number, element?: HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        if (invoiceId) {
          this.isSingleView = true;
          this._configService.isSidebarClosed$.next(true);
          this.selectedInvoiceId = invoiceId;
        }
      }
    });
  }

  makePayment(invoiceId: number) {
    this._financeService
      .getInvoice(invoiceId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.selectedInvoice = res.body.data;
        this.openModal(this.financePayment);
      });
  }

  closeInvoice(): void {
    this.selectedInvoiceId = null;
    this.isSingleView = false;
    this._configService.isSidebarClosed$.next(false);
  }

  getApplicationownerinformation() {
    this._configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  private _fetchUser(): void {
    this._userService
      .getUserInfo(this._authService.decodeToken().nameid)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  private _loadTheme(): void {
    this._colorThemeService
      .getTheme()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  setSelectedFilters() {
    this.sharedService.selectedFilters$.next({
      filters: [[{ ...this.selectedFilters, type: "status" }]],
      action: "add",
      headers: ["Statuses"],
    });
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((selectedFilters: PillFilters) => {
        if (selectedFilters.filters[0].length === 0) {
          this.switchViews(this.currentTab)
        }
      });
  }

  getInvoices(filterOptions?: any): void {
    if (filterOptions?.id) {
      this.paymentStatuses.includes(filterOptions?.id)
        ? (this.statusFilter.statusFilter = {
            operator: "And",
            paymentStatuses: [filterOptions?.id],
          })
        : (this.statusFilter.statusFilter = {
            operator: "And",
            status: [filterOptions?.id],
          });
      this.selectedFilters = filterOptions;
      this.setSelectedFilters();
    } else {
      this.statusFilter = { ...this.statusFilter, ...filterOptions };
    }
    this.isLoading = true;
    this._financeService
      .getInvoices(this.statusFilter)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.invoices = res.body?.items;
        this.pagination.searchColumns = res.body.searchColumns;
        this.invoices.forEach((invoice) => {
          if (this.isOverdue(invoice.invoiceDueDate)) {
            invoice["isOverdue"] = "Overdue";
          }
          if (invoice.status === "SentForApproval") {
            invoice.status = "Awaiting Approval";
          }

          if (invoice.status === "Posted") {
            invoice.status = invoice.paymentStatus;
          }
        });
        this.generateTable();
        this._setPagination(res.body);
        this.isLoading = false;

        // For deep linking via reports.
        this.getInvoiceIdFromQuery();

        $(".itemPaginatedJumpModal").toggle(false);
      });
  }

  generateTable() {
    this.invoiceTableData = this.invoices.map((invoice) => ({
      code: { tdValue: invoice.code, type: "code", id: invoice.id },
      customer: { tdValue: invoice.customer },
      ref: { tdValue: invoice.reference || "-" },
      invoiceDate: { tdValue: invoice.invoiceDate, type: "date" },
      invoiceDueDate: { tdValue: invoice.invoiceDueDate, type: "date" },
      amount: { tdValue: invoice.amount, type: "amount" },
      balDue: { tdValue: invoice.balanceDue, type: "amount" },
      loanStage: {
        tdValue: invoice?.status,
        type: "status",
        statusConfig: {
          class: this.getStatusClass(invoice),
        },
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(invoice),
      },
    }));
  }

  getStatusClass(invoice: Invoice): string {
    if (invoice.status === "Draft") {
      return "badge-warning";
    } else if (invoice.status === "Awaiting Approval") {
      return "badge-approval";
    } else if (invoice.paymentStatus === "Paid") {
      return "badge-success";
    } else if (invoice.paymentStatus === "NotPaid") {
      return "badge-notPaid";
    } else if (invoice.paymentStatus === "PartiallyPaid") {
      return "badge-partiallyPaid";
    } else if (invoice.status === "ReDraft") {
      return "badge-redraft";
    } else {
      return "badge-danger";
    }
  }

  getActionConfig(invoice: Invoice) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.viewInvoice(invoice?.id),
      },
      {
        showBtn:
          (this.user?.permission?.includes("Edit Invoice") &&
            invoice?.status === "Draft") ||
          invoice?.status === "ReDraft",
        iconClass: "icon-edit",
        btnText: "Edit",
        funcRef: () =>
          this.redirect({
            url: `/finance/invoices/edit/${invoice?.id}`,
          }),
      },
      {
        showBtn:
          this.user?.permission?.includes("Create Finance Payment") &&
          (invoice?.paymentStatus == "NotPaid" ||
            invoice?.paymentStatus == "PartiallyPaid"),
        iconClass: "icon-card",
        btnText: "Make Payment",
        funcRef: () => this.makePayment(invoice.id),
      },
      {
        showBtn: invoice?.status === "Draft" || invoice?.status === "ReDraft",
        iconClass: "icon-card",
        btnText: "Delete Invoice",
        funcRef: () => this.deleteInvoice(invoice.id),
      },
    ];
  }

  redirect(navigate: { url: string; config?: NavigationExtras }) {
    this.router.navigate([navigate.url], navigate.config);
  }

  getInvoiceIdFromQuery() {
    const invoiceId = this.route.snapshot.queryParams["invoiceId"];
    if (invoiceId) {
      this.viewInvoice(invoiceId);
    }
  }

  isOverdue(invoiceDueDate): boolean {
    invoiceDueDate = invoiceDueDate.split("T")[0];
    let today = new Date().toISOString().split("T")[0];
    let dueDate = moment(invoiceDueDate);
    let today_moment = moment(today);

    return dueDate.isBefore(today_moment);
  }

  private _setPagination(res: GetInvoicesResBody): void {
    this.pagination = res;
    this.pagination.count = res.items.length;
    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  setInvoices(event): void {
    this.invoices = event.body.data.items;
    this._setPagination(event.body.data);
  }

  filterModalOpen(display?: boolean) {
    $(".filter-menu").toggle(display);
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  openModal(modal: HTMLElement): void {
    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  resetExistingFilters(){
    this.selectedFilters = null;
    this.statusFilter = {...this.statusFilter,pageNumber:1,pageSize:10};
    delete this.statusFilter["selectedSearchColumn"];
    delete this.statusFilter["keyword"];
  }

  switchViews(tab: FinanceTabs): void {
    this.currentTab = tab;
    this.resetExistingFilters()
    this.filterModalOpen(false);
    switch (tab) {
      case FinanceTabs.all:
        $("#nav-all").addClass("active-tab");
        $("#nav-open,#nav-closed").removeClass("active-tab");
        this.statusFilter = {
          ...this.statusFilter,
          statusFilter: {
            status: ["Draft", "ReDraft", "SentForApproval", "Rejected"],
            operator: "Or",
            paymentStatuses: ["NotPaid", "PartiallyPaid", "Paid"],
          },
        };
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
          { id: "Rejected", text: "Rejected" },
          { id: "Paid", text: "Paid" },
          { id: "PartiallyPaid", text: "Partially Paid" },
          { id: "NotPaid", text: "Not Paid" },
        ];
        break;

      case FinanceTabs.closed:
        $("#nav-closed").addClass("active-tab");
        $("#nav-all,#nav-open").removeClass("active-tab");
        this.statusFilter = {
          ...this.statusFilter,
          statusFilter: {
            status: ["Rejected"],
            operator: "Or",
            paymentStatuses: ["Paid"],
          },
        };

        this.filterStatuses = [
          { id: "Rejected", text: "Rejected" },
          { id: "Paid", text: "Paid" },
        ];
        break;

      case FinanceTabs.open:
        $("#nav-open").addClass("active-tab");
        $("#nav-all,#nav-closed").removeClass("active-tab");
        this.statusFilter = {
          ...this.statusFilter,
          statusFilter: {
            status: ["Draft", "ReDraft", "SentForApproval"],
            operator: "Or",
            paymentStatuses: ["NotPaid", "PartiallyPaid"],
          },
        };
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
          { id: "PartiallyPaid", text: "Partially Paid" },
          { id: "NotPaid", text: "Not Paid" },
        ];
        break;
      default:
        break;
    }

    this.getInvoices(this.statusFilter);
  }

  deleteInvoice(invoiceId: number): void {
    this.isLoading = true;
    Swal.fire({
      type: "info",
      text: "Are you sure you want to delete this Invoice ?",
      title: "Delete Invoice?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this._financeService
          .deleteInvoice(invoiceId)
          .pipe(takeUntil(this._unsubscriber$))
          .subscribe((res) => {
            this.toast.fire({
              type: "success",
              title: "Invoice deleted successfully.",
            });

            this.getInvoices();
          });
      }
    });
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Invoice code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
