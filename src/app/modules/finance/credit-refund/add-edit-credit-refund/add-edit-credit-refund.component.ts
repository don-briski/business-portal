import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil, pluck, tap } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import Swal from "sweetalert2";

import { ConfigurationService } from "src/app/service/configuration.service";
import { FinanceService } from "../../service/finance.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { CreditRefundService } from "../../credit-refund/credit-refund.service";
import { EncryptService } from "src/app/service/encrypt.service";
import { AppOwnerInformation } from "src/app/modules/shared/shared.types";
import { PaymentMode } from "../credit-refund.types";

@Component({
  selector: "lnd-add-edit-credit-refund",
  templateUrl: "./add-edit-credit-refund.component.html",
  styleUrls: ["./add-edit-credit-refund.component.scss"],
})
export class AddEditCreditRefundComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<{ creditsRefunded: boolean }>();
  @Input() relatedObject: string;
  @Input() relatedObjectId: number;
  @Input() maxAmount: number;

  subs$ = new Subject<void>();

  refundForm: UntypedFormGroup;

  refunding = false;
  ownerInfo: AppOwnerInformation;
  currencySymbol: string;
  gettingPModes = false;
  paymentModes: CustomDropDown[] = [];
  gettingAccs = false;
  accounts: any[] = [];
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private formB: UntypedFormBuilder,
    private configService: ConfigurationService,
    private financeService: FinanceService,
    private coaService: ChartOfAccountService,
    private refundService: CreditRefundService,
    private encryptService: EncryptService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getOwnerInfo();
    this.getPaymentModes();
    this.getAccounts();
  }

  initForm() {
    this.refundForm = this.formB.group({
      creditRefundId: [""],
      amount: ["", [Validators.required]],
      reference: [this.relatedObjectId],
      status: ["Posted", [Validators.required]],
      paymentMode: ["", [Validators.required]],
      paymentModeId: ["", [Validators.required]],
      refundDate: ["", [Validators.required]],
      relatedObject: [this.relatedObject, [Validators.required]],
      relatedObjectId: [this.relatedObjectId, [Validators.required]],
      paidThroughAccountId: ["", [Validators.required]],
      transactionPin: ["", [Validators.required]],
      transactionDescription: [""],
    });

    this.refundForm
      .get("paymentMode")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) =>
        this.refundForm
          .get("paymentModeId")
          .setValue(res[0]?.id, { emitEvent: false })
      );

    const amtControl = this.refundForm.get("amount");
    amtControl.valueChanges.pipe(takeUntil(this.subs$)).subscribe({
      next: (value: string) => {
        if (+value > this.maxAmount) {
          this.toast.fire({
            type: "error",
            title: `Maximum refundable credits is ${this.currencySymbol}${this.maxAmount}`,
          });
          amtControl.setValue("");
        }
      },
    });
  }

  getOwnerInfo() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.ownerInfo = res.body;
        this.currencySymbol = this.ownerInfo?.currency?.currencySymbol;
      });
  }

  getPaymentModes() {
    this.gettingPModes = true;

    this.financeService
      .getPaymentModes({
        pageSize: 1000,
        pageNumber: 1,
      })
      .pipe(
        pluck("body", "data", "items"),
        tap((paymentModes: PaymentMode[]) => {
          const paymentMode = paymentModes.find(
            (paymentMode) => paymentMode.isDefault
          );

          if (paymentMode) {
            this.refundForm
              .get("paymentModeId")
              .setValue(paymentMode.financePaymentModeId);
            this.refundForm.get("paymentMode").setValue([
              {
                id: paymentMode.financePaymentModeId,
                text: paymentMode.name,
              },
            ]);
          }
        }),
        takeUntil(this.subs$)
      )
      .subscribe({
        next: (res) => {
          const fetchedModes = res;
          if (fetchedModes.length) {
            this.paymentModes = fetchedModes.map(
              (item: any) =>
                <CustomDropDown>{
                  id: item?.financePaymentModeId,
                  text: item?.name,
                }
            );
          }

          this.gettingPModes = false;
        },
        error: () => {
          this.gettingPModes = false;
        },
      });
  }

  getAccounts(): void {
    this.gettingAccs = true;
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (accs) => {
          this.accounts = accs;
          this.gettingAccs = false;
        },
        error: (err) => {
          this.gettingAccs = false;
        },
      });
  }

  onSelect(value: string, event: any) {
    switch (value) {
      case "paymentMode":
        this.refundForm.get("paymentModeId").patchValue(event.id);
        break;
      case "paidThrough":
        this.refundForm.get("paidThroughAccountId").patchValue(event.accountId);
        break;
    }
  }

  onDeselectPMode() {
    this.refundForm.get("paymentModeId").patchValue("");
  }

  onSubmit() {
    const data = this.refundForm.value;
    data.transactionPin = this.encryptService.encrypt(data.transactionPin);

    this.refunding = true;
    this.refundService
      .createCreditRefund(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (_) => {
          this.refunding = false;
          this.toast.fire({
            type: "success",
            title: `Credits refunded successfully.`,
          });
          this.close.emit({ creditsRefunded: true });
        },
        error: (_) => {
          this.refunding = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
