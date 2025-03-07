import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ConfigurationService } from "src/app/service/configuration.service";
import { SharedService } from "src/app/service/shared.service";
import { toFormData } from "src/app/util/finance/financeHelper";
import { printFile } from "src/app/util/helpers/print.helper";
import Swal from "sweetalert2";
import { FinanceService } from "../../service/finance.service";
import { FinancePayment } from "../../finance.types";

@Component({
  selector: "app-payment-received",
  templateUrl: "./payment-received.component.html",
  styleUrls: ["./payment-received.component.scss"],
})
export class PaymentReceivedComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  approvalStatus: "Redraft" | "Posted" | "Rejected" | null;
  activityLogs: any[] = [];
  businessLogo: string;
  appOwner: any;
  defaultLogo = "assets/images/logo-blue.png";
  base64Image: string = "data:image/png;base64,";

  @Input() user: any;
  @Input() allPayments: FinancePayment[] = [];
  @Input() selectedPaymentId: any;
  @Input() currentTheme: any;
  @Output() closeView = new EventEmitter();
  @Output() fetchPayments = new EventEmitter();
  @ViewChild("paymentPaper") paymentPaper: ElementRef;

  private _unsubscriber$ = new Subject();

  selectedPayment: FinancePayment;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  printStatus: string;
  hoverStyle;

  constructor(
    private _modalService: NgbModal,
    private _financeService: FinanceService,
    private _configService: ConfigurationService,
    private _sharedService: SharedService
  ) {}

  ngOnInit(): void {
    if (this.selectedPaymentId) {
      this.viewPayment(this.selectedPaymentId);
    }
    this._getAppOwnerDetails();
    this._sharedService.printStatus$
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((status) => (this.printStatus = status));

    this.hoverStyle = {
      borderLeft: `5px solid ${this.currentTheme?.secondaryColor}`,
    };
  }

  openModal(modal: any): void {
    this._modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal(): void {
    this._modalService.dismissAll();
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

  private _getPayment(paymentId: number): void {
    this.isLoading = true;
    this._financeService
      .getPayment(paymentId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.selectedPayment = res.body.data;
        this.activityLogs = res.body.data.appActivities;
        this.isLoading = false;
      });
  }

  private _imageToBase64Url(imageUrl: string): void {
    this._sharedService
      .getBase64Url(imageUrl)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.base64Image += res.body;
      });
  }

  public printPayment(filename): void {
    this.printStatus = "Processing";

    printFile(this.paymentPaper, filename, "payment-received").then((res) =>
      this._sharedService.printStatus$.next("Print")
    );
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

  viewPayment(paymentId: any): void {
    this._getPayment(paymentId);
  }

  closePaymentModal(): void {
    this.closeView.emit();
  }

  submit(event): void {
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
        message = `Payment (${this.selectedPayment.financePaymentId}) Posted Successfully`;
        break;
      case "Redraft":
        state = "Redraft";
        message = `Payment (${this.selectedPayment.financePaymentId}) Redrafted Successfully`;
        break;
      case "Rejected":
        state = "Reject";
        message = `Payment (${this.selectedPayment.financePaymentId}) Rejected Successfully`;
        break;
      default:
        break;
    }

    const formData = toFormData(payload);
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
        this.isLoading = true;
        this._financeService
          .approvePaymentMade(formData, transactionPin)
          .pipe(takeUntil(this._unsubscriber$))
          .subscribe(
            (res) => {
              this.isLoading = false;
              this.toast.fire({
                type: "success",
                text: message,
              });
              this.fetchPayments.emit();
              this.closePaymentModal();
              this.closeModal();
            },
            (error) => (this.isLoading = false)
          );
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
