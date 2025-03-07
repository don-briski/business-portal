import { ActivatedRoute, Router } from "@angular/router";
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { pluck, take, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import * as moment from "moment";
import Swal from "sweetalert2";

import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CreditNotesService } from "../credit-notes.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  CreditNote,
  CreditNoteDetails,
  GetCNotesResBody,
  CreditInvoiceLine,
  CreditNoteStatus,
  CNActivity,
  GetCNotesReqBody,
} from "../types";
import { Pagination } from "src/app/modules/shared/shared.types";
import { FinanceService } from "../../service/finance.service";
import {
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
} from "@angular/forms";
import { SharedService } from "src/app/service/shared.service";
import { printFile } from "src/app/util/helpers/print.helper";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Filter } from "src/app/model/filter";
import { saveAs } from "file-saver";
import { toFormData } from "src/app/util/finance/financeHelper";
import { TabName } from "../../types/vendor-credit-note";
import { SearchParams } from "src/app/modules/shared/shared.types";

@Component({
  selector: "app-credit-notes",
  templateUrl: "./credit-notes.component.html",
  styleUrls: ["./credit-notes.component.scss"],
})
export class CreditNotesComponent implements OnInit, OnDestroy {
  @ViewChild("creditNotePaper") creditNotePaper: ElementRef;
  subs$ = new Subject<void>();
  colorTheme: ColorThemeInterface;
  user: any;

  viewingSingleCN = false;
  cnDetails: CreditNoteDetails;
  fetchingCN = false;
  fetchingCNs = false;
  selectedCNActivities: CNActivity[] = [];
  fetchingSelectedCNActivities = false;
  errOccured = false;
  searchColumns: string[] = [];
  selectedSearchColumn = "";
  searchTerm = "";
  cnotes: CreditNote[] = [];
  cnPagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  invPagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  appOwner: any;
  businessLogo: string;
  currencySymbol: string;
  defaultLogo = "assets/images/logo-blue.png";
  tabState: "all" | "open" | "closed" = "all";

  fetchingInvoices = false;
  invoices: any[] = [];
  applyCreditsForm = new UntypedFormGroup({
    id: new UntypedFormControl(""),
    lines: new UntypedFormArray([]),
  });
  amount = {
    amountToCredit: 0,
    totalCreditsRemaining: 0,
  };
  haveLinesWithAmount = false;
  applying = false;
  approving = false;
  deleting = false;
  approvalStatus: "Redraft" | "Posted" | "Rejected" | null;
  filterOptions: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "Redraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
  ];
  currentView: "open" | "all" | "closed" = "open";
  currentTab: TabName = "overview";
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  base64Image: string = "data:image/png;base64,";
  printStatus: string;
  hoverStyle;
  filterModel: Filter;
  isImporting = false;
  downloading = false;
  copy_hover = false;

  constructor(
    private configServ: ConfigurationService,
    private authServ: AuthService,
    private userServ: UserService,
    private colorThemeServ: ColorThemeService,
    private cnServ: CreditNotesService,
    private financeServ: FinanceService,
    private modalServ: NgbModal,
    private _sharedService: SharedService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getUser();
    this.loadTheme();
    this.fetchCNotes();
    this.getAppOwnerDetails();
    this._sharedService.printStatus$
      .pipe(takeUntil(this.subs$))
      .subscribe((status) => (this.printStatus = status));
    this.resolveCurrentTableView();

    this.hoverStyle = {
      borderLeft: `5px solid ${this.colorTheme?.secondaryColor}`,
    };
  }

  resolveCurrentTableView(): void {
    const view = this.route.snapshot.queryParams["view"];
    if (view) {
      this.onSwitchTableView(view);
      this.router.navigate(["."], { relativeTo: this.route, queryParams: {} });
    }
  }

  getUser(): void {
    this.userServ
      .getUserInfo(this.authServ.decodeToken().nameid)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  loadTheme(): void {
    this.colorThemeServ
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  initApplyCreditsForm(invoices: any[]) {
    this.applyCreditsForm.get("id").setValue(this.cnDetails.id);

    const lines = <UntypedFormArray>this.applyCreditsForm.get("lines");
    lines.clear();

    invoices.forEach((inv) => {
      const item = new UntypedFormGroup({
        id: new UntypedFormControl(inv.id),
        amount: new UntypedFormControl(""),
      });

      lines.push(item);
    });
  }

  get lines() {
    return <UntypedFormArray>this.applyCreditsForm.get("lines");
  }

  onAmountChange(invoice: any, line: UntypedFormGroup) {
    this.amount.amountToCredit = 0;

    const amtToCredit = () => {
      let amt = 0;
      this.lines.controls.forEach((line) => {
        const { amount } = line.value;
        amt += +amount;
      });
      this.haveLinesWithAmount = amt > 0;
      return amt;
    };

    const rollBackAmtToCredit = (msg: string) => {
      line.get("amount").setValue("0.00");
      this.amount.amountToCredit = amtToCredit();
      this.amount.totalCreditsRemaining =
        this.cnDetails.creditsRemaining - amtToCredit();

      this.toast.fire({
        type: "error",
        title: msg,
      });
    };

    if (amtToCredit() > this.cnDetails.creditsRemaining) {
      rollBackAmtToCredit(
        `Can't exceed max credits of ${this.currencySymbol}${this.cnDetails.creditsRemaining}`
      );

      return;
    }

    if (+line.value.amount > invoice.balanceDue) {
      rollBackAmtToCredit(
        `Can't apply more than ${this.currencySymbol}${invoice.balanceDue} credits to this invoice`
      );
    } else {
      this.amount.amountToCredit = amtToCredit();
      this.amount.totalCreditsRemaining =
        this.cnDetails.creditsRemaining - this.amount.amountToCredit;
    }
  }

  getCreditedInvoices(lines: CreditInvoiceLine[]) {
    return lines.filter((ln) => +ln.amount > 0);
  }

  onApplyToInvoice() {
    const creditedInvoices = this.getCreditedInvoices(
      this.applyCreditsForm.value.lines
    );
    this.applying = true;

    this.cnServ
      .applyToInvoice({
        id: this.applyCreditsForm.value.id,
        lines: creditedInvoices,
      })
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.applying = false;
          this.updateCredits(true);
          this.toast.fire({
            type: "success",
            title: "Credits have been applied to the invoice(s)",
          });
          this.fetchCNotes();
          this.closeApplyCreditsModal();
        },
        (err) => {
          this.applying = false;
        }
      );
  }

  updateCredits(finished: boolean) {
    if (finished) {
      this.cnDetails.creditsRemaining = this.amount.totalCreditsRemaining;
    } else {
      this.amount.totalCreditsRemaining = this.cnDetails.creditsRemaining;
    }
    this.amount.amountToCredit = 0;
  }

  get haveCNotes() {
    return this.cnotes.length;
  }

  get haveCredits() {
    return this.cnDetails.creditsRemaining > 0;
  }

  private getAppOwnerDetails() {
    this.configServ
      .getAppOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.appOwner = res.body;
          this.currencySymbol = this.appOwner?.currency?.currencySymbol;
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

  fetchCNotes(
    data: GetCNotesReqBody = {
      pageNumber: this.cnPagination.pageNumber,
      pageSize: this.cnPagination.pageSize,
      keyword: this.searchTerm,
      selectedSearchColumn: this.selectedSearchColumn,
    }
  ) {
    data.statuses = this.filterOptions.map((filter) => String(filter.id));

    this.fetchingCNs = true;
    this.cnServ
      .getCreditNotes(data)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.cnotes = res.body.items;
          this.setPaginationForCNs(res.body);
          $(".itemPaginatedJumpModal").toggle(false);
          this.fetchingCNs = false;
          this.errOccured = false;

          this.getCreditNoteIdFromQuery();
        },
        () => {
          this.fetchingCNs = false;
          this.errOccured = true;
        }
      );
  }

  setPaginationForCNs(res: GetCNotesResBody): void {
    this.cnPagination = res;
    this.cnPagination.count = res.items.length;

    this.cnPagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.cnPagination.jumpArray.push(i);
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange((value) => {
      this.onSwitchTableView(this.currentView);
    });
  }

  onOpenFilterModal() {
    $(".filter-menu").toggle();
  }

  onOptionSelected(option: CustomDropDown) {
    this.filterOptions = [option];
    this.filterModel.setData({
      filters: [this.filterOptions],
      filterTypes: ["status"],
      filterHeaders: ["Status"],
    });
    this.fetchCNotes();
  }

  getCreditNoteIdFromQuery() {
    const id = this.route.snapshot.queryParams["creditNoteId"];
    if (id) {
      this.viewSingleCN(null, id);
    }
  }

  setCreditNote(event: any): void {
    this.cnotes = event.data.items;
    this.setPaginationForCNs(event);
  }

  getCNStatus(status: CreditNoteStatus): string {
    let text: string;
    if (status === "Redraft") text = "Redraft";
    else if (status === "SentForApproval") text = "Awaiting Approval";
    else text = status;

    return text;
  }

  viewSingleCN(cnId: number, element?: HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.fetchingCN = true;

        this.cnServ
          .getCNoteById(cnId)
          .pipe(take(1))
          .subscribe(
            (res) => {
              if (res.status) {
                this.cnDetails = res.body.data;

                this.amount.totalCreditsRemaining =
                  this.cnDetails.creditsRemaining;
                this.viewingSingleCN = true;
                this.configServ.isSidebarClosed$.next(true);
              }
              this.fetchingCN = false;
            },
            () => {
              this.fetchingCN = false;
            }
          );
      }
    });
  }

  closeSingleCNView() {
    this.viewingSingleCN = false;
    this.cnDetails = null;
    this.configServ.isSidebarClosed$.next(false);
  }

  fetchInvoices(): void {
    this.invoices = [];
    this.haveLinesWithAmount = false;
    this.fetchingInvoices = true;
    this.financeServ
      .getInvoices({
        pageNumber: +this.invPagination.pageNumber,
        pageSize: +this.invPagination.pageSize,
        statusFilter: {
          operator: "And",
          paymentStatuses: ["NotPaid", "PartiallyPaid"],
          status: ["Posted"],
        },
        customerId: this.cnDetails.customerId,
      })
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.invoices = res.body.items.filter(
            (item: any) => item.balanceDue > 0
          );
          this.initApplyCreditsForm(this.invoices);
          this.fetchingInvoices = false;
          $(".itemPaginatedJumpModal").toggle(false);
        },
        (err) => {
          this.fetchingInvoices = false;
        }
      );
  }

  onOpenRefundModal($event: Event, view: any, cn: CreditNoteDetails) {
    $event.stopPropagation();
    this.cnDetails = cn;
    this.modalServ.open(view, {
      centered: true,
      size: "md",
    });
  }

  onCloseRefundModal(event: { creditsRefunded: boolean }) {
    if (event.creditsRefunded) this.fetchCNotes();
    this.modalServ.dismissAll();
  }

  attemptCNDelete(id: number): void {
    Swal.fire({
      type: "info",
      title: "Delete Credit Note?",
      text: "Are you sure you want to delete this Credit Note?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.deleteCN(id);
      }
    });
  }

  deleteCN(id: number) {
    this.cnServ
      .deleteCN(id)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            text: "Credit note deleted successfully",
          });

          this.fetchCNotes();
        },
        (err) => {}
      );
  }

  isAfterToday(value: any): boolean {
    const dateVal = moment(value);
    const today = moment();
    const difference = dateVal.diff(today);
    if (difference > 0) {
      return true;
    } else {
      return false;
    }
  }

  openModal(view: any, cn: CreditNoteDetails): void {
    this.modalServ.open(view, {
      centered: true,
      size: "lg",
      ariaLabelledBy: "modal-basic-title",
    });

    if (cn) {
      this.cnDetails = cn;
    }

    this.fetchInvoices();
  }

  openApprovalModal(view: any, size?: string) {
    this.modalServ.open(view, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeApprovalModal() {
    this.modalServ.dismissAll();
  }

  closeApplyCreditsModal(): void {
    this.updateCredits(false);
    this.modalServ.dismissAll();
  }

  onApproveCN(event?): void {
    const { transactionPin, ...rest } = event;
    const payload = {
      ...rest,
      creditNoteId: this.cnDetails.id,
    };
    this.approvalStatus = payload.status;

    let state: string;
    let message: string;
    switch (this.approvalStatus) {
      case "Posted":
        state = "Post";
        message = `Credit Note (${this.cnDetails.code}) Posted Successfully`;
        break;
      case "Redraft":
        state = "Redraft";
        message = `Credit Note (${this.cnDetails.code}) Redrafted Successfully`;
        break;
      case "Rejected":
        state = "Reject";
        message = `Credit Note (${this.cnDetails.code}) Rejected Successfully`;
        break;
      default:
        break;
    }
    Swal.fire({
      type: "info",
      text: `This Action Will ${state} this Credit Note`,
      title: `${state} Credit Note`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.approving = true;

        this.cnServ
          .approveCN(payload, transactionPin)
          .pipe(takeUntil(this.subs$))
          .subscribe(
            (res) => {
              this.approving = false;
              this.toast.fire({
                type: "success",
                text: message,
              });
              this.fetchCNotes();
              this.closeSingleCNView();
              this.closeApprovalModal();
            },
            (err) => {
              this.approving = false;
            }
          );
      }
    });
  }

  onSwitchTableView(view: "all" | "open" | "closed"): void {
    switch (view) {
      case "open":
        this.currentView = "open";
        this.filterOptions = [
          { id: "Draft", text: "Draft" },
          { id: "Redraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
        ];
        break;
      case "closed":
        this.currentView = "closed";
        this.filterOptions = [
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        break;
      case "all":
        this.filterOptions = [
          { id: "Draft", text: "Draft" },
          { id: "Redraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        this.currentView = "all";
    }

    this.fetchCNotes();
  }

  onSwitchTab(tabName: TabName) {
    switch (tabName) {
      case "overview":
        this.currentTab = tabName;
        break;
      case "comments":
        this.currentTab = tabName;
        break;
      case "activity":
        this.currentTab = tabName;
        this.fetchCNActivities(this.cnDetails.id);
        break;
      case "files":
        this.currentTab = tabName;
        break;
      default:
        this.currentTab = "overview";
    }
  }

  fetchCNActivities(id: number) {
    this.selectedCNActivities = [];
    this.fetchingSelectedCNActivities = true;
    this.cnServ
      .getCNActivities(id)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.selectedCNActivities = res.body.data;
          this.fetchingSelectedCNActivities = false;
        },
        (err) => {
          this.fetchingSelectedCNActivities = false;
        }
      );
  }

  downloadTemplate() {
    this.downloading = true;
    this.cnServ
      .getCNTemplate()
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        const fileName = `sample-credit-note-${moment().format(
          "YYYY-MM-DD-HH:mm:ss"
        )}`;
        saveAs(res.body, fileName);
        this.downloading = false;
      });
  }

  submitImportedCN(creditNotes) {
    this.closeApprovalModal();
    this.isImporting = true;

    const payload = toFormData({ File: creditNotes });
    this.cnServ
      .importCN(payload)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.isImporting = false;

          Swal.fire({
            type: "success",
            title: "Import Successful!",
            text: `Successfully imported ${res?.body?.data?.message} records`,
            confirmButtonText: "Ok",
            confirmButtonColor: "#558E90",
          }).then((result) => {
            if (result.value) {
              this.onSwitchTableView("closed");
            }
          });
        },
        () => (this.isImporting = false)
      );
  }

  private _imageToBase64Url(imageUrl: string): void {
    this._sharedService
      .getBase64Url(imageUrl)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.base64Image += res.body;
      });
  }

  public printCN(filename): void {
    this.printStatus = "Processing";

    printFile(this.creditNotePaper, filename, "credit-note").then((res) =>
      this._sharedService.printStatus$.next("Print")
    );
  }

  copyCode(text: string) {
    if (this._sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Credit note code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  onSearchParams(event: SearchParams) {
    this.selectedSearchColumn = event.selectedSearchColumn;
    this.searchTerm = event.keyword;
    this.fetchCNotes();
  }

  ngOnDestroy() {
    this.subs$.next();
    this.subs$.complete();
  }
}
