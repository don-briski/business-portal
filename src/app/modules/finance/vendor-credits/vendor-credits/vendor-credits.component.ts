import { ActivatedRoute, Router } from "@angular/router";
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  TemplateRef,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { take, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import * as moment from "moment";
import Swal from "sweetalert2";

import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { VendorCreditNoteService } from "../vendor-credits.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  VCNote,
  CreditBillLine,
  TabName,
  VCNStatus,
  VCNActivity,
  GetVCNotesReqParams,
  GetVCNsResBody,
  VCNDetails,
} from "src/app/modules/finance/types/vendor-credit-note";
import { BillsMgtService } from "src/app/service/bills-mgt.service";
import {
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
} from "@angular/forms";
import { SharedService } from "src/app/service/shared.service";
import { printFile } from "src/app/util/helpers/print.helper";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Filter } from "src/app/model/filter";
import { Pagination, SearchParams } from "src/app/modules/shared/shared.types";

@Component({
  selector: "app-vendor-credits",
  templateUrl: "./vendor-credits.component.html",
  styleUrls: ["./vendor-credits.component.scss"],
})
export class VendorCreditsComponent implements OnInit, OnDestroy {
  @ViewChild("vcnPaper") vcnPaper: ElementRef;
  subs$ = new Subject<void>();
  user: any;
  colorTheme: ColorThemeInterface;

  viewingSingleVCN = false;
  selectedVCN: VCNote;
  vcnDetails: VCNDetails;
  fetchingVCN = false;
  fetchingVCNs = false;
  errOccured = false;
  fetchingSelectedVCNActivities = false;
  selectedVCNActivities: VCNActivity[] = [];
  vcnotes: VCNote[] = [];
  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  searchColumns: string[] = [];
  selectedSearchColumn = "";
  searchTerm = "";
  appOwner: any;
  businessLogo: string;
  currencySymbol: string;
  defaultLogo = "assets/images/logo-blue.png";
  loadingBillLines: boolean;
  tabState: "all" | "open" | "closed" = "all";

  fetchingBills = false;
  bills: any[] = [];
  applyCreditsForm = new UntypedFormGroup({
    id: new UntypedFormControl(""),
    lines: new UntypedFormArray([]),
  });
  amount = {
    amountToCredit: 0,
    creditsRemaining: 0,
  };
  haveLinesWithAmount = false;
  applying = false;
  approving = false;
  approvalStatus: "Redraft" | "Posted" | "Rejected" | null;
  currentTab: TabName = "overview";
  filterOptions: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "Redraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
  ];
  filterStatuses: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "Redraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
  ];
  currentView: "open" | "closed" | "all" = "open";
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
  copy_hover = false;

  constructor(
    private authServ: AuthService,
    private userServ: UserService,
    private colorThemeServ: ColorThemeService,
    private vcnServ: VendorCreditNoteService,
    private modalServ: NgbModal,
    private configServ: ConfigurationService,
    private billServ: BillsMgtService,
    private sharedService: SharedService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getUser();
    this.fetchVCNotes();
    this.getAppOwnerDetails();
    this.sharedService.printStatus$
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

  private _imageToBase64Url(imageUrl: string): void {
    this.sharedService
      .getBase64Url(imageUrl)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.base64Image += res.body;
      });
  }

  public printVCN(filename): void {
    this.printStatus = "Processing";
    printFile(this.vcnPaper, filename, "vcn").then((res) =>
      this.sharedService.printStatus$.next("Print")
    );
  }

  initApplyCreditsForm(bills: any[]) {
    this.applyCreditsForm.get("id").setValue(this.selectedVCN.vendorCreditNoteId);

    const lines = <UntypedFormArray>this.applyCreditsForm.get("lines");
    lines.clear();

    bills.forEach((b) => {
      const item = new UntypedFormGroup({
        id: new UntypedFormControl(b.billId),
        amount: new UntypedFormControl(""),
      });

      lines.push(item);
    });
  }

  get lines() {
    return <UntypedFormArray>this.applyCreditsForm.get("lines");
  }

  onAmountChange(bill: any, line: UntypedFormGroup) {
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
      this.amount.creditsRemaining =
        this.selectedVCN.totalCreditsRemaining - amtToCredit();

      this.toast.fire({
        type: "error",
        title: msg,
      });
    };

    if (amtToCredit() > this.selectedVCN.totalCreditsRemaining) {
      rollBackAmtToCredit(
        `Can't exceed max credits of ${this.currencySymbol}${this.selectedVCN.totalCreditsRemaining}`
      );

      return;
    }

    if (+line.value.amount > bill.balanceDue) {
      rollBackAmtToCredit(
        `Can't apply more than ${this.currencySymbol}${bill.balanceDue} credits to this bill`
      );
    } else {
      this.amount.amountToCredit = amtToCredit();
      this.amount.creditsRemaining =
        this.selectedVCN.totalCreditsRemaining - this.amount.amountToCredit;
    }
  }

  getCreditedBills(cbLines: CreditBillLine[]) {
    return cbLines.filter((cbl) => +cbl.amount > 0);
  }

  onApplyToBills() {
    const creditedBills = this.getCreditedBills(
      this.applyCreditsForm.value.lines
    );
    this.applying = true;

    this.vcnServ
      .applyToBills({
        id: this.selectedVCN.vendorCreditNoteId,
        lines: creditedBills,
      })
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.applying = false;
          this.updateCredits(true);
          this.toast.fire({
            type: "success",
            title: "Credits have been applied to the bill(s)",
          });
          this.fetchVCNotes();
          this.closeApplyCreditsModal();
        },
        (err) => {
          this.applying = false;
        }
      );
  }

  updateCredits(finished: boolean) {
    if (finished) {
      this.selectedVCN.totalCreditsRemaining = this.amount.creditsRemaining;
    } else {
      this.amount.creditsRemaining = this.selectedVCN.totalCreditsRemaining;
    }
    this.amount.amountToCredit = 0;
  }

  get haveVCNotes() {
    return this.vcnotes.length;
  }

  getUser(): void {
    this.userServ
      .getUserInfo(this.authServ.decodeToken().nameid)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.user = res.body;
      });
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

  loadTheme(): void {
    this.colorThemeServ
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  fetchVCNotes(
    data: GetVCNotesReqParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      keyword: this.searchTerm,
      selectedSearchColumn: this.selectedSearchColumn,
    }
  ) {
    data.filter = this.filterStatuses.map((filter) => String(filter.id));

    this.fetchingVCNs = true;
    this.vcnServ
      .getVCNotes(data)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.vcnotes = res.body.items;
          this.setPagination(res.body);
          $(".itemPaginatedJumpModal").toggle(false);
          this.fetchingVCNs = false;
          this.errOccured = false;

          // For deep linking via reports
          this.getVCNIdFromQuery();
        },
        (err) => {
          this.fetchingVCNs = false;
          this.errOccured = true;
        }
      );
  }

  setPagination(res: GetVCNsResBody): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  onOpenFilterModal() {
    $(".filter-menu").toggle();
  }

  onOptionSelected(option: CustomDropDown) {
    this.filterStatuses = [option];
    this.filterModel.setData({
      filters: [this.filterStatuses],
      filterTypes: ["status"],
      filterHeaders: ["Status"],
    });

    this.fetchVCNotes();
  }

  getVCNIdFromQuery() {
    const id = this.route.snapshot.queryParams["vcnId"];
    if (id) {
      this.viewSingleVCN(null, id);
    }
  }

  viewSingleVCN(vcn?: VCNote, vcnId?: number, element?: HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.fetchingVCN = true;
        this.selectedVCN = vcn;
        this.fetchVCNActivities(this.selectedVCN?.id || vcnId);

        this.vcnServ
          .getVCNoteById(vcn?.id || vcnId)
          .pipe(take(1))
          .subscribe(
            (res) => {
              if (res.status) {
                this.vcnDetails = res.body.data;
                this.amount.creditsRemaining =
                  this.selectedVCN.creditsRemaining;
                this.viewingSingleVCN = true;
                this.configServ.isSidebarClosed$.next(true);
              }
              this.fetchingVCN = false;
            },
            () => {
              this.fetchingVCN = false;
            }
          );
      }
    });
  }

  closeSingleVCNView() {
    this.viewingSingleVCN = false;
    this.selectedVCN = null;
    this.configServ.isSidebarClosed$.next(false);
  }

  fetchBills(status?: string[]): void {
    this.bills = [];
    this.haveLinesWithAmount = false;
    this.fetchingBills = true;
    const model = {
      pageSize: 10,
      pageNumber: 1,
      billStatus: status,
      vendorId: this.selectedVCN.vendorId,
    };
    this.fetchingBills = true;
    this.billServ
      .spoolAllBills(model)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.bills = res.data.items.filter(
            (item: any) => item.balanceDue > 0
          );

          this.bills.forEach((bill) => {
            if (
              !this.isAfterToday(bill?.billDueDate) &&
              bill?.billStatus === "Posted"
            ) {
              bill.billStatus = "Overdue";
            }
          });

          this.initApplyCreditsForm(this.bills);

          this.fetchingBills = false;
          this.setPagination(res);
        },
        (err) => {
          this.fetchingBills = false;
        }
      );
  }

  onOpenRefundModal(view: TemplateRef<any>, vcn: VCNote, event: Event) {
    event.stopPropagation();

    this.selectedVCN = vcn;
    this.modalServ.open(view, {
      centered: true,
      size: "md",
    });
  }

  onCloseRefundModal(event: { creditsRefunded: boolean }) {
    if (event.creditsRefunded) this.fetchVCNotes();
    this.modalServ.dismissAll();
  }

  attemptVCNDelete(id: number): void {
    Swal.fire({
      type: "info",
      title: "Delete Vendor Credit Note?",
      text: "Are you sure you want to delete this Vendor Credit Note?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.deleteVCN(id);
      }
    });
  }

  deleteVCN(id: number) {
    this.vcnServ
      .deleteVCN(id)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            text: "Vendor credit note deleted successfully",
          });

          this.fetchVCNotes();
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

  openModal(view: any, vcn: VCNote): void {
    this.modalServ.open(view, {
      centered: true,
      size: "lg",
      ariaLabelledBy: "modal-basic-title",
    });

    if (vcn) {
      this.selectedVCN = vcn;
    }

    this.fetchBills();
  }

  openApprovalModal(view: any) {
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

  onApproveVCN(event?): void {
    const { transactionPin, ...rest } = event;
    const payload = {
      ...rest,
      vendorCreditNoteId: this.selectedVCN.vendorCreditNoteId,
    };
    this.approvalStatus = payload.status;
    let state: string;
    let message: string;
    switch (this.approvalStatus) {
      case "Posted":
        state = "Post";
        message = `Vendor Credit Note (${this.selectedVCN.code}) Posted Successfully`;
        break;
      case "Redraft":
        state = "Redraft";
        message = `Vendor Credit Note (${this.selectedVCN.code}) Redrafted Successfully`;
        break;
      case "Rejected":
        state = "Reject";
        message = `Vendor Credit Note (${this.selectedVCN.code}) Rejected Successfully`;
        break;
      default:
        break;
    }
    Swal.fire({
      type: "info",
      text: `This Action Will ${state} this Vendor Credit Note`,
      title: `${state} Vendor Credit Note`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.approving = true;

        this.vcnServ
          .approveVCN(payload, transactionPin)
          .pipe(takeUntil(this.subs$))
          .subscribe(
            (res) => {
              this.approving = false;
              this.toast.fire({
                type: "success",
                text: message,
              });
              this.fetchVCNotes();
              this.closeApprovalModal();
              this.closeSingleVCNView();
            },
            (err) => {
              this.approving = false;
            }
          );
      }
    });
  }

  onSwitchTableView(
    view: "all" | "open" | "closed",
    filters: CustomDropDown[] = []
  ): void {
    this.filterStatuses = filters;
    this.filterOptions = filters;

    switch (view) {
      case "open":
        this.currentView = "open";
        this.filterOptions = [
          { id: "Draft", text: "Draft" },
          { id: "Redraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
        ];
        this.filterStatuses = this.filterOptions;
        break;
      case "closed":
        this.currentView = "closed";
        this.filterOptions = [
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        this.filterStatuses = this.filterOptions;
        break;
      case "all":
        this.currentView = "all";
        this.filterOptions = [
          { id: "Draft", text: "Draft" },
          { id: "Redraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        this.filterStatuses = this.filterOptions;
        break;
    }

    this.filterModel.clearData();
    this.fetchVCNotes();
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
        break;
      case "files":
        this.currentTab = tabName;
        break;
      default:
        this.currentTab = "overview";
    }
  }

  fetchVCNActivities(id: number) {
    this.selectedVCNActivities = [];
    this.fetchingSelectedVCNActivities = true;
    this.vcnServ
      .getVCNActivities(id)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.selectedVCNActivities = res.body.data;
          this.fetchingSelectedVCNActivities = false;
        },
        (err) => {
          this.fetchingSelectedVCNActivities = false;
        }
      );
  }

  getVCNStatus(status: VCNStatus): string {
    let text: string;
    if (status === "SentForApproval") text = "Awaiting Approval";
    else text = status;

    return text;
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.onSwitchTableView(this.currentView);
    });
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "VCN code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  onSearchParams(event: SearchParams) {
    this.selectedSearchColumn = event.selectedSearchColumn;
    this.searchTerm = event.keyword;
    this.fetchVCNotes();
  }

  cloneVCN() {
    Swal.fire({
      type: "info",
      title: "Clone Vendor Credit Note?",
      text: `Are you sure you want to clone this Vendor Credit Note (${this.selectedVCN.code})?`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Clone it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.router.navigateByUrl(
          `/finance/vendor-credit-notes/${this.selectedVCN.vendorCreditNoteId}/clone`
        );
      }
    });
  }

  ngOnDestroy() {
    this.subs$.next();
    this.subs$.complete();
  }
}
