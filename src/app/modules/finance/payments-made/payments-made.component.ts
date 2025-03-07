import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Pagination } from "src/app/model/Pagination";
import { FinanceService } from "../service/finance.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { toFormData } from "src/app/util/finance/financeHelper";
import { printFile } from "src/app/util/helpers/print.helper";
import { SharedService } from "src/app/service/shared.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Filter } from "src/app/model/filter";
import { FinancePayment, GetPaymentsReqBody, Payment } from "../finance.types";
import { TableConfig, TableData, TableHeader } from "../../shared/shared.types";

@Component({
  selector: "app-payments-made",
  templateUrl: "./payments-made.component.html",
  styleUrls: ["./payments-made.component.scss"],
})
export class PaymentsMadeComponent implements OnInit, OnDestroy {
  @ViewChild("paymentsMadePaper") paymentsMadePaper: ElementRef;

  user;
  unsubscriber$ = new Subject<void>();
  currentTheme: ColorThemeInterface;
  itemPagination: Pagination = {
    pageNumber: 1,
    pageSize: 10,
    totalPages: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };
  singleView: boolean = false;
  approvalStatus: "Redraft" | "Posted" | "Rejected" | null;
  tabState: "all" | "open" | "closed" = "open";
  statusState: string[] = ["Draft", "ReDraft", "SentForApproval"];
  filterStatuses: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "ReDraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
  ];
  currentView: "all" | "open" | "closed" = "open";
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  loader: boolean = false;
  selectedPayment: FinancePayment;
  allPayments: Payment[] = [];
  allVendors: any[] = [];
  allPaymentModes: any[] = [];
  ownerInformation: any;
  printStatus: string;
  hoverStyle;
  filterModel: Filter;
  copy_hover = false;
  paymentConfig: TableConfig;
  paymentHeaders: TableHeader[] = [];
  paymentData: TableData[] = [];
  searchColumns:string[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private financeService: FinanceService,
    private configService: ConfigurationService,
    private modalService: NgbModal,
    private sharedService: SharedService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.fetchUser();
    this.loadTheme();
    this.fetchPayments();
    this._getVendors();
    this._getPaymentModes();
    this.getApplicationownerinformation();
    this.sharedService.printStatus$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((status) => (this.printStatus = status));
    this.hoverStyle = {
      borderLeft: `5px solid ${this.currentTheme?.secondaryColor}`,
    };
  }

  public printPayment(filename): void {
    this.printStatus = "Processing";
    printFile(this.paymentsMadePaper, filename, "payments-made").then((res) =>
      this.sharedService.printStatus$.next("Print")
    );
  }

  fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  getPaymentMadeIdFromQuery() {
    const id = this.route.snapshot.queryParams["paymentMadeId"];
    if (id) {
      this.setSingleView(id);
    }
  }

  setSingleView(paymentMadeId: number, element?: HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.viewPayment(paymentMadeId);
        this.singleView = true;
        this.configService.isSidebarClosed$.next(true);
      }
    });
  }

  viewPayment(paymentMadeId: number): void {
    this.getPaymentMade(paymentMadeId);
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
      this.paymentConfig = {
        currency: this.ownerInformation?.currency?.currencySymbol,
        theadBg:true
      };
      this.paymentHeaders.push(
        { name: "#", type: "code" },
        { name: `Amount Paid`, type:"amount" },
        { name: `Withholding Tax`, type:"amount" },
        { name: `Payment Amount`, type:"amount" },
      );
    });
  }

  getPaymentMade(paymentMadeId: number): void {
    this.loader = true;
    this.financeService
      .getPayment(paymentMadeId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.selectedPayment = res.body.data;
        this.paymentData = this.selectedPayment.paymentLines.map(payment => ({
          code:{tdValue:payment?.billCode,type:"code"},
          amountPaid:{tdValue:payment?.amountAllocated, type:"amount"},
          wht:{tdValue:payment?.whtAmount, type:"amount"},
          paymentAmount:{tdValue:payment?.amountExpected, type:"amount"},
        }))
        this.loader = false;
      });
  }
  openModal(modal: any): void {
    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  switchviews(tab: "all" | "open" | "closed", status?: string[]): void {
    this.tabState = tab;
    this.statusState = status;
    this.currentView = tab;

    switch (tab) {
      case "all":
        $("#nav-all").addClass("active-tab");
        $("#nav-open,#nav-closed").removeClass("active-tab");
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        break;

      case "closed":
        $("#nav-closed").addClass("active-tab");
        $("#nav-all,#nav-open").removeClass("active-tab");
        this.filterStatuses = [
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        break;

      case "open":
        $("#nav-open").addClass("active-tab");
        $("#nav-all,#nav-closed").removeClass("active-tab");
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
        ];
        break;
      default:
        break;
    }

    this.filterModel.clearData();
    this.fetchPayments();
  }

  closeView(): void {
    this.singleView = false;
    this.selectedPayment = null;
    this.configService.isSidebarClosed$.next(false);
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  fetchPayments(event?, options?): void {
    if (event?.id) {
      this.filterModel.setData({
        filters: [[event]],
        filterTypes: ["status"],
        filterHeaders: ["Status"],
      });

      this.statusState = [event?.id];
    }
    let model: GetPaymentsReqBody;
    model = {
      pageSize: this.itemPagination.pageSize,
      pageNumber: this.itemPagination.pageNumber,
      status: this.statusState,
      filter: "Bill",
    };

    if (options) {
      model = { ...model, ...options };
    }
    this.loader = true;

    this.financeService
      .getPayments(model)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe(
        (payments) => {
          this.allPayments = payments?.items;
          this.searchColumns = payments.searchColumns;
          this.loader = false;
          this.setPagination(payments);
          $(".itemPaginatedJumpModal").toggle(false);

          // For deep linking via reports
          this.getPaymentMadeIdFromQuery();
        },
        () => {
          this.loader = false;
        }
      );
  }

  setPagination(res: any): void {
    this.itemPagination.pageSize = res.pageSize;
    this.itemPagination.pageNumber = res.pageNumber;
    this.itemPagination.totalRecords = res.totalCount;
    this.itemPagination.hasNextPage = res.hasNextPage;
    this.itemPagination.hasPreviousPage = res.hasPreviousPage;
    this.itemPagination.totalPages = res.totalPages;
    this.itemPagination.count = res.items.length;

    this.itemPagination.jumpArray = Array(this.itemPagination.totalPages);
    for (let i = 0; i < this.itemPagination.jumpArray.length; i++) {
      this.itemPagination.jumpArray[i] = i + 1;
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  filterModalOpen() {
    $(".filter-menu").toggle();
  }

  attemptDelete(id: any): void {
    Swal.fire({
      type: "info",
      text: "Are you sure you want to delete this payment ?",
      title: "Delete Payment?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.removePayment(id);
      }
    });
  }

  getVendorName(vendorId: any): string {
    return this.allVendors?.find((x) => x.vendorId === vendorId)?.name;
  }

  getPaymentModeName(paymentModeId: any): string {
    return this.allPaymentModes?.find(
      (x) => x.financePaymentModeId === paymentModeId
    )?.name;
  }

  private removePayment(id: any): void {
    this.financeService
      .deletePaymentMade(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.toast.fire({
          type: "success",
          title: "Payment deleted successfully.",
        });
        this.fetchPayments();
      });
  }

  protected _getPaymentModes() {
    const model = {
      pageSize: 1000,
      pageNumber: 1,
    };
    this.financeService
      .getPaymentModes(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.allPaymentModes = res?.body?.data?.items;
      });
  }
  protected _getVendors() {
    const model = {
      pageSize: 1000,
      pageNumber: 1,
    };
    this.financeService
      .getVendors(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.allVendors = res?.body?.data;
      });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  switchTabs(tab: string): void {
    switch (tab) {
      case "overview":
        $("#nav-overview").addClass("active-tab");
        $("#nav-activity,#nav-comments,#nav-files").removeClass("active-tab");

        $("#tab-overview").addClass("active show");
        $("#tab-activity,#tab-comments,#tab-files").removeClass("active show");
        break;

      case "comments":
        $("#nav-comments").addClass("active-tab");
        $("#nav-overview,#nav-activity,#nav-files").removeClass("active-tab");

        $("#tab-comments").addClass("active show");
        $("#tab-overview,#tab-activity,#tab-files").removeClass("active show");
        break;

      case "activity":
        $("#nav-activity").addClass("active-tab");
        $("#nav-overview,#nav-comments,#nav-files").removeClass("active-tab");

        $("#tab-activity").addClass("active show");
        $("#tab-overview,#tab-comments,#tab-files").removeClass("active show");
        break;

      case "files":
        $("#nav-files").addClass("active-tab");
        $("#nav-overview,#nav-comments,#nav-activity").removeClass(
          "active-tab"
        );

        $("#tab-files").addClass("active show");
        $("#tab-overview,#tab-comments,#tab-activity").removeClass(
          "active show"
        );
        break;
      default:
        break;
    }
  }

  submit(event?): void {
    const { transactionPin, ...rest } = event;
    const payload = {
      ...rest,
      paymentId: this.selectedPayment.financePaymentId,
    };
    this.approvalStatus = payload.status;
    let state: string;
    let message: string;
    switch (this.approvalStatus) {
      case "Posted":
        state = "Post";
        message = `Payment (${this.selectedPayment.paymentCode}) Posted Successfully`;
        break;
      case "Redraft":
        state = "Redraft";
        message = `Payment (${this.selectedPayment.paymentCode}) Redrafted Successfully`;
        break;
      case "Rejected":
        state = "Reject";
        message = `Payment (${this.selectedPayment.paymentCode}) Rejected Successfully`;
        break;
      default:
        break;
    }
    Swal.fire({
      type: "info",
      text: `This Action Will ${state} this Payment`,
      title: `${state} Payment`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.loader = true;
        const formData = toFormData(payload);

        this.financeService
          .approvePaymentMade(formData, transactionPin)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe((res) => {
            this.loader = false;
            this.toast.fire({
              type: "success",
              text: message,
            });
            this.fetchPayments();
            this.closeView();
            this.closeModal();
          });
      }
    });
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.switchviews(this.currentView);
    });
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Payment code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  ngOnDestroy(): void {
    this.closeView();
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
