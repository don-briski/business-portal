import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { BillsMgtService } from "src/app/service/bills-mgt.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { Vendor } from "../../models/vendor.interface";
import { FinanceService } from "../../service/finance.service";
import { VendorCreditNoteService } from "../../vendor-credits/vendor-credits.service";

@Component({
  selector: "app-vendor",
  templateUrl: "./vendor.component.html",
  styleUrls: ["./vendor.component.scss"],
})
export class VendorComponent implements OnInit, OnDestroy {
  private _unsubscriber$ = new Subject();

  @Input() vendors;
  @Input() vendor;
  @Input() pagination;
  @Input() isLoading;
  @Input() user;
  @Input() currentTheme;
  @Output() getVendorsPaginatedSearch = new EventEmitter<any>();
  @Output() close = new EventEmitter<any>();

  selectedVendor: Vendor;
  fetchingVendor: boolean = false;
  vendorComments: any[] = [];
  commentForm: UntypedFormGroup;
  commentIdToDelete: number;
  periods: CustomDropDown[] = [{ id: 1, text: "custom" }];
  ownerInformation: any;
  outstandingPayables: number = 0;
  unusedCredits: number = 0;
  hoverStyle;
  constructor(
    private financeService: FinanceService,
    private modalService: NgbModal,
    private _fb: UntypedFormBuilder,
    private configService: ConfigurationService,
    private _billService: BillsMgtService,
    private vcnService: VendorCreditNoteService
  ) {}

  ngOnInit(): void {
    this.getApplicationownerinformation();
    this._getOutstandingPayables(this.vendor.vendorId);
    this._getUnusedCredits(this.vendor.vendorId);
    this._initForm();
    this.hoverStyle = {
      borderLeft: `5px solid ${this.currentTheme?.secondaryColor}`,
    };

    this.showVendorInfo(this.vendor)
  }

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(pluck("body"), takeUntil(this._unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response;
      });
  }

  private _initForm(): void {
    this.commentForm = this._fb.group({
      vendorId: new UntypedFormControl(
        this.vendor.id,
        Validators.required
      ),
      comment: new UntypedFormControl(null, Validators.required),
    });
  }

  showVendorInfo(vendor): void {
    this.fetchingVendor = true;
    this._getVendor(vendor?.vendorId);
    this._getOutstandingPayables(vendor?.vendorId);
    this._getUnusedCredits(vendor?.vendorId);
  }

  private _getOutstandingPayables(vendorId): void {
    const model = {
      vendorId: vendorId,
    };
    this._billService
      .spoolAllBills(model)
      .pipe(pluck("data", "items"), takeUntil(this._unsubscriber$))
      .subscribe((bills: any[]) => {
        let initialValue = 0;
        this.outstandingPayables = bills
          .filter((bill) => bill.billStatus === "Posted")
          .reduce((accumulator, bill) => {
            return accumulator + bill.balanceDue;
          }, initialValue);
      });
  }

  private _getUnusedCredits(vendorId): void {
    const model = {
      pageNumber: 0,
      pageSize: 0,
      vendorId: vendorId,
    };
    this.vcnService
      .getVCNotes(model)
      .pipe(pluck("body", "items"), takeUntil(this._unsubscriber$))
      .subscribe((vcns) => {
        let initialValue = 0;
        this.unusedCredits = vcns
          .filter((vcn) => vcn.status === "Posted")
          .reduce((accumulator, vcn) => {
            return accumulator + vcn.creditsRemaining;
          }, initialValue);
      });
  }

  private _getVendor(vendorId: number): void {
    this.financeService
      .getVendor(vendorId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.selectedVendor = res.body;
        this.fetchingVendor = false;
        this._initForm();
      });
  }

  private _getVendorComments(): void {
    this.isLoading = true;
    this.financeService
      .getVendorComments(this.selectedVendor.vendorId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.vendorComments = res.body;
        this.isLoading = false;
      });
  }

  openModal(modal: any): void {
    this._initForm();
    this.modalService.open(modal, { centered: true });
  }

  dismiss(): void {
    this.modalService.dismissAll();
  }

  closeModal(): void {
    this.commentForm.reset();
    this.dismiss();
  }

  emitGetVendorsPaginatedSearch(pageSize, pageNumber): void {
    this.isLoading = true;
    this.getVendorsPaginatedSearch.emit({ pageSize, pageNumber });
  }

  closeWindow(): void {
    this.close.emit();
  }

  switchTabs(tab: string): void {
    switch (tab) {
      case "overview":
        $("#nav-overview").addClass("active-tab");
        $("#nav-transaction,#nav-comments,#nav-statement").removeClass(
          "active-tab"
        );

        $("#tab-overview").addClass("active show");
        $(
          "#tab-transaction,#tab-comments,#tab-statement,#tab-statement"
        ).removeClass("active show");
        break;

      case "transaction":
        $("#nav-transaction").addClass("active-tab");
        $("#nav-overview,#nav-comments,#nav-statement").removeClass(
          "active-tab"
        );

        $("#tab-transaction").addClass("active show");
        $("#tab-overview,#tab-comments,#tab-statement").removeClass(
          "active show"
        );
        break;

      case "comments":
        $("#nav-comments").addClass("active-tab");
        $("#nav-overview,#nav-transaction,#nav-statement").removeClass(
          "active-tab"
        );

        $("#tab-comments").addClass("active show");
        $("#tab-overview,#tab-transaction,#tab-statement").removeClass(
          "active show"
        );
        this._getVendorComments();
        break;

      case "statement":
        $("#nav-statement").addClass("active-tab");
        $("#nav-overview,#nav-transaction,#nav-comments").removeClass(
          "active-tab"
        );

        $("#tab-statement").addClass("active show");
        $("#tab-overview,#tab-transaction,#tab-comments").removeClass(
          "active show"
        );
        break;
      default:
        break;
    }
  }

  isEmptyObject(obj) {
    return obj && Object.keys(obj).length === 0;
  }

  deleteComment(commentId: number): void {
    this.isLoading = true;
    this.commentIdToDelete = commentId;

    this.financeService
      .deleteVendorComment(this.selectedVendor.vendorId, commentId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        if (res.status === 200) {
          this._getVendorComments();
          this.commentIdToDelete = null;
          this.isLoading = false;
        }
      });
  }

  submitComment(): void {
    this.isLoading = true;
    this.financeService
      .addVendorComments(this.commentForm.value)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.isLoading = false;
        this.closeModal();
        this._getVendorComments();
      });
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
