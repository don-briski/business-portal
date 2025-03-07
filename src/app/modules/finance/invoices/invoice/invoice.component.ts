import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { Router } from "@angular/router";

import { ConfigurationService } from "src/app/service/configuration.service";
import { FinanceService } from "../../service/finance.service";
import { accumulator } from "src/app/util/finance/financeHelper";
import { SharedService } from "src/app/service/shared.service";
import { printFile } from "src/app/util/helpers/print.helper";
import { InvoiceDetails, InvoiceStatus } from "../../finance.types";

@Component({
  selector: "app-invoice",
  templateUrl: "./invoice.component.html",
  styleUrls: ["./invoice.component.scss"],
})
export class InvoiceComponent implements OnInit, OnDestroy {
  @Input() user: any;
  @Input() invoices: any[] = [];
  @Input() selectedInvoiceId: number;
  @Input() currentTheme: any;
  @Output() closeInvView = new EventEmitter();
  @Output() fetchInvoices = new EventEmitter();

  @ViewChild("InvoicePaper") InvoicePaper: ElementRef;

  invoiceStatusEnum = InvoiceStatus;
  invoiceDetails: InvoiceDetails;
  businessLogo: string;
  appOwner: any;
  defaultLogo = "assets/images/logo-blue.png";
  isLoading: boolean = false;
  approvalStatus: "Redraft" | "Posted" | "Rejected" | null;
  activityLogs: any[] = [];
  selectedTab: string;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  base64Image: string = "data:image/png;base64,";
  printStatus: string;
  hoverStyle;

  private _unsubscriber$ = new Subject();

  constructor(
    private _configService: ConfigurationService,
    private _financeService: FinanceService,
    private _modalService: NgbModal,
    private _sharedService: SharedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.selectedInvoiceId) {
      this.getInvoice(this.selectedInvoiceId);
    }
    this._getAppOwnerDetails();

    this._sharedService.printStatus$
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((status) => (this.printStatus = status));

    this.hoverStyle = {
      borderLeft: `5px solid ${this.currentTheme?.secondaryColor}`,
    };
  }

  private _imageToBase64Url(imageUrl: string): void {
    this._sharedService
      .getBase64Url(imageUrl)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.base64Image += res.body;
      });
  }

  public printInvoice(filename): void {
    this.printStatus = "Processing";
    printFile(this.InvoicePaper, filename, "invoice").then((res) =>
      this._sharedService.printStatus$.next("Print")
    );
  }

  openModal(modal: any): void {
    this._modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
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

  getInvoice(invoiceId: number): void {
    this.isLoading = true;
    this._financeService
      .getInvoice(invoiceId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.invoiceDetails = res.body.data;

        if (this.invoiceDetails?.payments?.length > 0) {
          this.invoiceDetails["totalPayments"] = accumulator(
            this.invoiceDetails?.payments
          );
        }
        this.isLoading = false;
        this._getActivityLogs(invoiceId);
      });
  }

  private _getAppOwnerDetails() {
    this._configService.getAppOwnerInfo().subscribe(
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

  viewInvoice(invoice: any): void {
    this.getInvoice(invoice.invoiceId);
  }

  private _getActivityLogs(invoiceId: number): void {
    this._financeService
      .getInvoiceActivityLogs(invoiceId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => (this.activityLogs = res.body));
  }

  closeView() {
    this.invoiceDetails = null;
    this.closeInvView.emit();
  }

  closeModal(): void {
    this._modalService.dismissAll();
  }

  submit(event): void {
    const { transactionPin, ...rest } = event;

    const payload = { ...rest, invoiceId: this.invoiceDetails.invoiceId };
    this.approvalStatus = payload.status;

    let state: string;
    let message: string;
    switch (this.approvalStatus) {
      case "Posted":
        state = "Post";
        message = `Invoice (${this.invoiceDetails.invoiceCode}) Posted Successfully`;
        break;
      case "Redraft":
        state = "Redraft";
        message = `Invoice (${this.invoiceDetails.invoiceCode}) Redrafted Successfully`;
        break;
      case "Rejected":
        state = "Reject";
        message = `Invoice (${this.invoiceDetails.invoiceCode}) Rejected Successfully`;
        break;
      default:
        break;
    }
    Swal.fire({
      type: "info",
      text: `This Action Will ${state} this Invoice`,
      title: `${state} Invoice`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.isLoading = true;
        this._financeService
          .invoiceApproval(payload, transactionPin)
          .pipe(takeUntil(this._unsubscriber$))
          .subscribe((res) => {
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              text: message,
            });
            this.fetchInvoices.emit();
            this.closeView();
            this.closeModal();
          });
      }
    });
  }

  cloneInvoice() {
    Swal.fire({
      type: "info",
      title: "Clone Invoice?",
      text: `Are you sure you want to clone this Invoice (${this.invoiceDetails.invoiceCode})?`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Clone it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.router.navigateByUrl(
          `/finance/invoices/${this.invoiceDetails.invoiceId}/clone`
        );
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
