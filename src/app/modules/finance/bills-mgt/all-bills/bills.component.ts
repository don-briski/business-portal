import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { map, pluck, take, takeUntil, tap } from "rxjs/operators";
import { BillsMgtService } from "src/app/service/bills-mgt.service";
import Swal from "sweetalert2";
import { ConfigurationService } from "src/app/service/configuration.service";
import * as moment from "moment";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { accumulator, toFormData } from "src/app/util/finance/financeHelper";
import { FinanceService } from "../../service/finance.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ActivatedRoute, Router } from "@angular/router";
import { StatusFilter } from "../../models/status-filter.interface";
import { SharedService } from "src/app/service/shared.service";
import { printFile } from "src/app/util/helpers/print.helper";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { BankAccount } from "../../types/Account";
import { Bill } from "../../types/bill.interface";
import { Filter } from "src/app/model/filter";

@Component({
  selector: "app-bills",
  templateUrl: "./bills.component.html",
  styleUrls: ["./bills.component.scss"],
})
export class AllBillsComponent implements OnInit, OnDestroy {
  @ViewChild("billPaper") billPaper: ElementRef;
  user;
  unsubscriber$ = new Subject<void>();
  currentTheme: ColorThemeInterface;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
  };
  itemsRequestLoader: boolean = false;
  tabLoader: boolean;
  loading: boolean = false;
  whtamountIsZero: boolean = false;
  allBills: Bill[] = [];
  paymentModes: any[] = [];
  accounts: any[] = [];
  bankAccounts: CustomDropDown[] = [];
  selectedBillCode: string;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  isSingleView: boolean;
  selectedBill: Bill;
  appOwner: any;
  businessLogo: string;
  defaultLogo = "assets/images/logo-blue.png";
  loadingBillLines: boolean;
  paymentForm: UntypedFormGroup;
  approvalStatus: "Redraft" | "Posted" | "Rejected" | null;
  selectedTab: string;
  statusFilter: StatusFilter;
  filterStatuses: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "ReDraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
    { id: "PartiallyPaid", text: "Partially Paid" },
    { id: "NotPaid", text: "Not Paid" },
  ];
  currentView: "open" | "closed" | "all" = "open";
  base64Image: string = "data:image/png;base64,";
  printStatus: string;
  paymentStatuses: string[] = ["NotPaid", "PartiallyPaid", "Paid"];
  lineHasAtLeastOneDesc = false;
  hoverStyle;
  filterModel: Filter;
  copy_hover = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private billService: BillsMgtService,
    private configService: ConfigurationService,
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private financeService: FinanceService,
    private coaService: ChartOfAccountService,
    private router: Router,
    private route: ActivatedRoute,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.fetchUser();
    this.loadTheme();
    this.statusFilter = {
      pageNumber: +this.pagination.pageNumber,
      pageSize: +this.pagination.pageSize,
      statusFilter: {
        status: ["Draft", "ReDraft", "SentForApproval"],
        operator: "Or",
        paymentStatuses: ["NotPaid", "PartiallyPaid"],
      },
    };
    this.fetchBills();
    this._getAppOwnerDetails();
    this.sharedService.printStatus$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((status) => (this.printStatus = status));

    this.initPaymentForm();
    this._getPaymentModes();
    this._getAccounts();
    this.getBankAccounts();

    this.hoverStyle = {
      borderLeft: `5px solid ${this.currentTheme?.secondaryColor}`,
    };
  }

  private _imageToBase64Url(imageUrl: string): void {
    this.sharedService
      .getBase64Url(imageUrl)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.base64Image += res.body;
      });
  }

  public printBill(filename): void {
    this.printStatus = "Processing";
    printFile(this.billPaper, filename, "bill").then((res) =>
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

  private _getPaymentModes() {
    const model = {
      pageSize: 1000,
      pageNumber: 1,
    };
    this.financeService
      .getPaymentModes(model)
      .pipe(
        pluck("body", "data", "items"),
        tap((paymentModes: any[]) => {
          const paymentMode = paymentModes.filter(
            (paymentMode) => paymentMode.isDefault
          );

          if (paymentMode.length > 0) {
            this.paymentForm
              .get("paymentModeId")
              .setValue(paymentMode[0]?.financePaymentModeId);

            this.paymentForm.get("paymentMode").setValue([
              {
                id: paymentMode[0]?.financePaymentModeId,
                text: paymentMode[0]?.name,
              },
            ]);
          }
        }),
        map((paymentModes) => {
          return paymentModes.map((res: any) => {
            return {
              id: res?.financePaymentModeId,
              text: res?.name,
            };
          });
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((res) => {
        this.paymentModes = res;
      });
  }

  private _getAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((accounts) => {
        this.accounts = accounts;
      });
  }

  getBankAccounts(): void {
    this.financeService
      .getAccountsByClass({ filter: "bank" })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.bankAccounts = res.body.items.map((acc: BankAccount) => ({
          id: acc.accountId,
          text: acc.name,
        }));
      });
  }

  private initPaymentForm(): void {
    this.paymentForm = this.fb.group({
      personId: new UntypedFormControl(this.selectedBill?.vendorId, [
        Validators.required,
      ]),
      paymentModeId: new UntypedFormControl(null, [Validators.required]),
      paymentMode: new UntypedFormControl(null, [Validators.required]),
      paymentAmount: new UntypedFormControl(0, [Validators.required]),
      whtAmount: new UntypedFormControl(0),
      paymentMadeDate: new UntypedFormControl(null, [Validators.required]),
      paidThroughAccountId: new UntypedFormControl(null, [Validators.required]),
      taxAccountId: new UntypedFormControl(null),
      paymentReference: new UntypedFormControl(null),
      linesAffectedTItems: new UntypedFormControl([], Validators.required),
      status: new UntypedFormControl("SentForApproval", Validators.required),
      relatedObject: new UntypedFormControl("Bill"),
    });

    this._watchFormChanges();
  }

  private _watchFormChanges(): void {
    this.paymentForm
      .get("paymentMode")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) =>
        this.paymentForm
          .get("paymentModeId")
          .setValue(res[0]?.id, { emitEvent: false })
      );
    this.paymentForm
      .get("whtAmount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        let paymentAmount = this.paymentForm.get("paymentAmount").value;
        let value = res + paymentAmount;
        if (value > this.selectedBill.balanceDue) {
          this.paymentForm.get("paymentAmount").reset(0);
          this.paymentForm.get("whtAmount").reset(0);
          this.toast.fire({
            type: "error",
            timer: 5000,
            title: `Payment Amount (${value}) cannot be greater than balance due ${this.selectedBill.balanceDue}`,
          });
        }

        this.paymentForm.get("taxAccountId").setValidators(Validators.required);
        this.paymentForm.get("taxAccountId").updateValueAndValidity();
      });

    this.paymentForm
      .get("paymentAmount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        let taxAmount = this.paymentForm.get("whtAmount").value;
        let value = res + taxAmount;
        if (value > this.selectedBill.balanceDue) {
          this.paymentForm.get("paymentAmount").reset(0);
          this.paymentForm.get("whtAmount").reset(0);
          this.toast.fire({
            type: "error",
            timer: 5000,
            title: `Payment Amount (${value}) cannot be greater than balance due ${this.selectedBill.balanceDue}`,
          });
        }
      });

    this.paymentForm
      .get("taxAccountId")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res && this.paymentForm.get("whtAmount").value > 0) {
          this.whtamountIsZero = false;
        } else {
          this.whtamountIsZero = true;
        }
      });
  }

  createLine(): void {
    if (this.paymentForm.get("paymentAmount").value) {
      const line = this.fb.group({
        billId: new UntypedFormControl(this.selectedBill?.billId),
        paymentAmount: new UntypedFormControl(
          this.paymentForm.get("paymentAmount").value
        ),
        whtAmount: new UntypedFormControl(this.paymentForm.get("whtAmount").value),
        billDate: new UntypedFormControl(this.selectedBill?.billDate),
        billCode: new UntypedFormControl(this.selectedBill?.billCode),
        totalAmount: new UntypedFormControl(this.selectedBill?.totalAmount),
        billAmount: new UntypedFormControl(this.selectedBill?.totalAmount),
      });

      this.paymentForm.get("linesAffectedTItems")?.setValue([line.value]);
    }

    if (this.paymentForm.get("whtAmount").value) {
      const line = this.fb.group({
        billId: new UntypedFormControl(this.selectedBill?.billId),
        paymentAmount: new UntypedFormControl(
          this.paymentForm.get("paymentAmount").value
        ),
        whtAmount: new UntypedFormControl(this.paymentForm.get("whtAmount").value),
        billDate: new UntypedFormControl(this.selectedBill?.billDate),
        billCode: new UntypedFormControl(this.selectedBill?.billCode),
        totalAmount: new UntypedFormControl(this.selectedBill?.totalAmount),
        billAmount: new UntypedFormControl(this.selectedBill?.totalAmount),
      });

      this.paymentForm.get("linesAffectedTItems")?.setValue([line.value]);
    }
  }

  openModal(modal: any, bill?: any, feature?: string): void {
    bill ? (this.selectedBill = bill) : null;

    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });

    if (feature === "payment") {
      this.getBill(bill.billId, feature);
    }
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  selectAccount(event: any, isTaxAcc?: boolean): void {
    isTaxAcc
      ? this.paymentForm.get("taxAccountId").patchValue(event.accountId)
      : this.paymentForm.get("paidThroughAccountId").patchValue(event.id);
  }

  selectPaymentMode(event: any): void {
    this.paymentForm.get("paymentModeId").patchValue(event.id);
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  switchviews(tab: "all" | "open" | "closed"): void {
    if (this.statusFilter?.search) {
      delete this.statusFilter?.search;
    }
    this.filterModel.clearData();

    switch (tab) {
      case "all":
        $("#nav-all").addClass("active-tab");
        $("#nav-open,#nav-closed").removeClass("active-tab");
        this.currentView = tab;
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
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
          { id: "Paid", text: "Paid" },
          { id: "PartiallyPaid", text: "Partially Paid" },
          { id: "NotPaid", text: "Not Paid" },
        ];
        break;

      case "closed":
        $("#nav-closed").addClass("active-tab");
        $("#nav-all,#nav-open").removeClass("active-tab");
        this.currentView = tab;
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

      case "open":
        this.currentView = tab;
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

    this.fetchBills();
  }

  switchTabs(tab: string): void {
    this.selectedTab = tab;
    switch (this.selectedTab) {
      case "overview":
        $("#nav-overview").addClass("active-tab");
        $(
          "#nav-activity,#nav-comments,#nav-files,#nav-payments,#nav-credits"
        ).removeClass("active-tab");

        $("#tab-overview").addClass("active show");
        $(
          "#tab-activity,#tab-comments,#tab-files,#tab-payments,#tab-credits"
        ).removeClass("active show");
        break;

      case "comments":
        $("#nav-comments").addClass("active-tab");
        $(
          "#nav-overview,#nav-activity,#nav-files,#nav-payments,#nav-credits"
        ).removeClass("active-tab");

        $("#tab-comments").addClass("active show");
        $(
          "#tab-overview,#tab-activity,#tab-files,#tab-payments,#tab-credits"
        ).removeClass("active show");
        break;

      case "activity":
        $("#nav-activity").addClass("active-tab");
        $(
          "#nav-overview,#nav-comments,#nav-files,#nav-payments,#nav-credits"
        ).removeClass("active-tab");

        $("#tab-activity").addClass("active show");
        $(
          "#tab-overview,#tab-comments,#tab-files,#tab-payments,#tab-credits"
        ).removeClass("active show");
        break;

      case "files":
        $("#nav-files").addClass("active-tab");
        $(
          "#nav-overview,#nav-comments,#nav-activity,#nav-payments,#nav-credits"
        ).removeClass("active-tab");

        $("#tab-files").addClass("active show");
        $(
          "#tab-overview,#tab-comments,#tab-activity,#tab-payments,#tab-credits"
        ).removeClass("active show");
        break;

      case "payments":
        $("#nav-payments").addClass("active-tab");
        $(
          "#nav-overview,#nav-comments,#nav-activity,#nav-files,#nav-credits"
        ).removeClass("active-tab");

        $("#tab-payments").addClass("active show");
        $(
          "#tab-overview,#tab-comments,#tab-activity,#tab-files,#tab-credits"
        ).removeClass("active show");
        break;

      case "credits":
        $("#nav-credits").addClass("active-tab");
        $(
          "#nav-overview,#nav-comments,#nav-activity,#nav-files,#nav-payments"
        ).removeClass("active-tab");

        $("#tab-payments").addClass("active show");
        $(
          "#tab-overview,#tab-comments,#tab-activity,#tab-files,#tab-payments"
        ).removeClass("active show");
        break;
      default:
        break;
    }
  }

  updateBillView() {
    if (!this.isSingleView) {
      this.fetchBills();
    } else {
      this.fetchBills();
      this.getBill(this.selectedBill.billId);
    }
  }

  fetchBills(event?): void {
    if (event?.id) {
      this.filterModel.setData({
        filters: [[event]],
        filterTypes: ["status"],
        filterHeaders: ["Status"],
      });

      this.paymentStatuses.includes(event?.id)
        ? (this.statusFilter.statusFilter = {
            paymentStatuses: [event?.id],
          })
        : (this.statusFilter.statusFilter = { status: [event?.id] });
    } else {
      this.statusFilter = { ...this.statusFilter, ...event };
    }

    this.tabLoader = true;
    this.billService
      .spoolAllBills(this.statusFilter)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.tabLoader = false;
          this.allBills = res.data?.items;
          this.allBills.forEach((bill) => {
            if (
              !this.isGreaterThanToday(bill?.billDueDate) &&
              bill?.billStatus === "Posted"
            ) {
              bill.isOverdue = true;
            }
          });

          // For deep linking via reports.
          this.getBillIdFromQuery();

          this.setPagination(res);
          $(".itemPaginatedJumpModal").toggle(false);
        },
        (err) => {
          this.tabLoader = false;
        }
      );
  }

  setBills(event): void {
    this.allBills = event.data.items;
    this.setPagination(event);
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  filterModalOpen() {
    $(".filter-menu").toggle();
  }

  setPagination(res: any): void {
    this.pagination.pageSize = res.data.pageSize;
    this.pagination.pageNumber = res.data.pageNumber;
    this.pagination.totalCount = res.data.totalCount;
    this.pagination.hasNextPage = res.data.hasNextPage;
    this.pagination.hasPreviousPage = res.data.hasPreviousPage;
    this.pagination.totalPages = res.data.totalPages;
    this.pagination.count = res.data.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  getBillIdFromQuery() {
    const billId = this.route.snapshot.queryParams["billId"];
    this.router.navigate([], {
      queryParams: {
        billId: null,
      },
      queryParamsHandling: "merge",
    });
    if (billId) {
      this.viewBill(billId);
    }
  }

  attemptDelete(id: any): void {
    Swal.fire({
      type: "info",
      text: "Are you sure you want to delete this bill ?",
      title: "Delete Bill?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.removeBill(id);
      }
    });
  }

  removeBill(id: any): void {
    this.billService
      .deleteBill(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.toast.fire({
          type: "success",
          title: "Bill deleted successfully.",
        });
        this.fetchBills();
      });
  }
  getBill(billId: number, feature?: string): void {
    this.billService
      .getBill(billId)
      .pipe(take(1))
      .subscribe(
        (res) => {
          this.selectedTab = "overview";
          this.switchTabs(this.selectedTab);
          this.selectedBill = res?.data;
          if (feature === "payment") {
            this.paymentForm.patchValue({
              personId: this.selectedBill.vendorId,
            });
          }
          if (this.selectedBill.payments) {
            this.selectedBill.totalPayments = accumulator(
              this.selectedBill.payments
            );
          }

          this.selectedBill.billLines.forEach((line) => {
            this.lineHasAtLeastOneDesc = false;
            if (line.description) {
              this.lineHasAtLeastOneDesc = true;
            }
          });
          this.loadingBillLines = false;
        },
        (err) => {
          this.loadingBillLines = false;
        }
      );
  }
  viewBill(billId: number,element?:HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.loadingBillLines = true;
        this.getBill(billId);
        this.isSingleView = true;
        this.configService.isSidebarClosed$.next(true);
      }
    });
  }

  closeView() {
    this.isSingleView = false;
    this.selectedBill = null;
    this.configService.isSidebarClosed$.next(false);
    this.switchviews("open");
  }

  private _getAppOwnerDetails() {
    this.configService.getAppOwnerInfo().subscribe(
      (res) => {
        this.appOwner = res.body;
        if (this.appOwner?.logoUrl !== null) {
          this.businessLogo = this.appOwner.logoUrl;
        } else {
          this.businessLogo = this.defaultLogo;
        }

        if (this.businessLogo) {
          this._imageToBase64Url(this.businessLogo);
        }
      },
      (err) => {
        this.businessLogo = this.defaultLogo;
      }
    );
  }

  makePayment(status: string): void {
    this.loading = true;
    this.paymentForm.get("status").setValue(status);
    const { whtAmount, ...rest } = this.paymentForm.value;
    const payload = toFormData(rest);

    this.financeService.createPaymentMade(payload).subscribe(
      (res) => {
        this.loading = false;
        this.closeModal();

        status === "SentForApproval"
          ? this.router.navigate(["finance/payments-made"])
          : this.fetchBills();
      },
      (err) => (this.loading = false)
    );
  }

  openPaymentModal(event:Event,payment:HTMLElement,bill:Bill, feature:string){
    if (event) {
      event.stopPropagation();
      this.openModal(payment,bill,feature)
    }
  }

  submit(event?): void {
    const { transactionPin, ...rest } = event;
    const payload = {
      ...rest,
      billId: this.selectedBill?.billId,
    };

    this.approvalStatus = payload.status;
    let state: string;
    let message: string;
    switch (this.approvalStatus) {
      case "Posted":
        state = "Post";
        message = `Bill (${this.selectedBill.billCode}) Posted Successfully`;
        break;
      case "Redraft":
        state = "Redraft";
        message = `Bill (${this.selectedBill.billCode}) Redrafted Successfully`;
        break;
      case "Rejected":
        state = "Reject";
        message = `Bill (${this.selectedBill.billCode}) Rejected Successfully`;
        break;
      default:
        break;
    }
    Swal.fire({
      type: "info",
      text: `This Action Will ${state} this Bill`,
      title: `${state} Bill`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        const formData = toFormData(payload);

        this.billService
          .approveBill(formData, transactionPin)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.loading = false;
              this.toast.fire({
                type: "success",
                text: message,
              });
              this.fetchBills();
              this.closeView();
              this.closeModal();
            },
            (err) => {
              this.loading = false;
            }
          );
      }
    });
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.switchviews(this.currentView);
    });
  }

  public isGreaterThanToday(value: any): boolean {
    const dateVal = moment(value);
    const today = moment();
    const difference = dateVal.diff(today);
    if (difference > 0) {
      return true;
    } else {
      return false;
    }
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Bill code copied to clipboard",type:'success',timer:3000})
    }
  }

  cloneBill() {
    Swal.fire({
      type: "info",
      title: "Clone Bill?",
      text: `Are you sure you want to clone this Bill (${this.selectedBill.billCode})?`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Clone it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.router.navigateByUrl(
          `/finance/bills/${this.selectedBill.billId}/clone`
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.closeView();
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
