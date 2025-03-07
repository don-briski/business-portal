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
import { Subject } from "rxjs";
import { map, pluck, takeUntil, tap } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { FinanceService } from "../../service/finance.service";
import { Account, BankAccount } from "../../types/Account";
import Swal from "sweetalert2";
import { AppOwnerInformation } from "src/app/modules/shared/shared.types";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { toFormData } from "src/app/util/finance/financeHelper";
import { Router } from "@angular/router";
import { nonZero } from "src/app/util/validators/validators";
import { Bill } from "../../types/bill.interface";
import { InvoiceDetails } from "../../finance.types";

@Component({
  selector: "fin-payment",
  templateUrl: "./payment.component.html",
  styleUrls: ["./payment.component.scss"],
})
export class PaymentComponent implements OnInit, OnDestroy {
  private subs$ = new Subject();
  private toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  paymentModes: CustomDropDown[] = [];
  bankAccounts: CustomDropDown[] = [];
  accounts: Account[] = [];
  isLoading = false;
  paymentForm: UntypedFormGroup;

  @Input() invoiceDetails: InvoiceDetails;
  @Input() selectedBill: Bill;
  @Input() appOwner: AppOwnerInformation;
  @Input() user: any;
  @Input() paymentType: "Invoice" | "Bill";

  @Output() closeModal = new EventEmitter();
  @Output() fetchData = new EventEmitter();

  constructor(
    private fb: UntypedFormBuilder,
    private _financeService: FinanceService,
    private coaService: ChartOfAccountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initPaymentForm();
    this.getPaymentModes();
    this.getBankAccounts();
    this.getAccounts();
  }

  private initPaymentForm(): void {
    this.paymentForm = this.fb.group({
      paymentModeId: new UntypedFormControl(null, [Validators.required]),
      paymentMode: new UntypedFormControl(null, [Validators.required]),
      paymentAmount: new UntypedFormControl(0, [Validators.required]),
      whtAmount: new UntypedFormControl(0),
      paymentMadeDate: new UntypedFormControl(null, [Validators.required]),
      paidThroughAccount: new UntypedFormControl(null, [Validators.required]),
      paidThroughAccountId: new UntypedFormControl(null, [Validators.required]),
      taxAccountId: new UntypedFormControl(null),
      paymentReference: new UntypedFormControl(null),
      linesAffectedTItems: new UntypedFormControl([]),
      status: new UntypedFormControl("SentForApproval", Validators.required),
      relatedObject: new UntypedFormControl(this.paymentType),
      transactionPin: new UntypedFormControl(null),
    });

    this._watchFormChanges();
  }

  private getAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.subs$))
      .subscribe((accounts) => {
        this.accounts = accounts;
      });
  }

  private getPaymentModes() {
    const model = {
      pageSize: 1000,
      pageNumber: 1,
    };
    this._financeService
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
        takeUntil(this.subs$)
      )
      .subscribe((paymentModes) => {
        this.paymentModes = paymentModes;
      });
  }

  private getBankAccounts(): void {
    this._financeService
      .getAccountsByClass({ filter: "bank" })
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.bankAccounts = res.body.items.map((acc: BankAccount) => ({
          id: acc.accountId,
          text: acc.name,
        }));
      });
  }

  selectAccount(event: any): void {
    this.paymentForm
      .get("taxAccountId")
      .setValue(event.accountId, { emitEvent: false });

    this.paymentForm
      .get("whtAmount")
      .setValidators([Validators.required, nonZero.bind(this)]);
    this.paymentForm.get("whtAmount").updateValueAndValidity();
  }

  createLine(status: string): void {
    if (
      this.paymentForm.get("paymentAmount").value &&
      this.paymentType === "Invoice"
    ) {
      const line = this.fb.group({
        invoiceId: new UntypedFormControl(this.invoiceDetails?.invoiceId),
        paymentAmount: new UntypedFormControl(
          this.paymentForm.get("paymentAmount").value
        ),
        whtAmount: new UntypedFormControl(this.paymentForm.get("whtAmount").value),
        invoiceDate: new UntypedFormControl(this.invoiceDetails?.invoiceDate),
        invoiceCode: new UntypedFormControl(this.invoiceDetails?.invoiceCode),
        totalAmount: new UntypedFormControl(this.invoiceDetails?.totalAmount),
        invoiceAmount: new UntypedFormControl(this.invoiceDetails?.totalAmount),
      });

      this.paymentForm.get("linesAffectedTItems")?.setValue([line.value]);
    } else {
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

    this.makePayment(status);
  }

  private _watchFormChanges(): void {
    this.paymentForm
      .get("paymentMode")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) =>
        this.paymentForm
          .get("paymentModeId")
          .setValue(res[0]?.id, { emitEvent: false })
      );
    this.paymentForm
      .get("whtAmount")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        let paymentAmount = this.paymentForm.get("paymentAmount").value;
        let value = res + paymentAmount;
        let balanceDue =
          this.invoiceDetails?.balanceDue || this.selectedBill?.balanceDue;
        if (value > balanceDue) {
          this.paymentForm.get("paymentAmount").reset(0);
          this.paymentForm.get("whtAmount").reset(0);
          this.toast.fire({
            type: "error",
            timer: 5000,
            title: `Payment Amount (${value}) cannot be greater than balance due ${balanceDue}`,
          });
        }

        if (res > 0 && !this.paymentForm.get("taxAccountId").value) {
          this.paymentForm
            .get("taxAccountId")
            .setValidators(Validators.required);
        } else {
          this.paymentForm.get("taxAccountId").clearValidators();
        }

        this.paymentForm.get("taxAccountId").updateValueAndValidity();
      });

    this.paymentForm
      .get("paymentAmount")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        let taxAmount = this.paymentForm.get("whtAmount").value;
        let value = res + taxAmount;
        let balanceDue =
          this.invoiceDetails?.balanceDue || this.selectedBill?.balanceDue;

        if (value > balanceDue) {
          this.paymentForm.get("paymentAmount").reset(0);
          this.paymentForm.get("whtAmount").reset(0);
          this.toast.fire({
            type: "error",
            timer: 5000,
            title: `Payment Amount (${value}) cannot be greater than balance due ${balanceDue}`,
          });
        }
      });

    this.paymentForm
      .get("paidThroughAccount")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((val) => {
        this.paymentForm.get("paidThroughAccountId").setValue(val[0]?.id);
      });
  }

  makePayment(status: string): void {
    this.paymentForm.get("status").setValue(status);

    if (status === "Posted" && !this.paymentForm.get("transactionPin").value) {
      this.paymentForm.get("transactionPin").setValidators(Validators.required);
      this.paymentForm.get("transactionPin").updateValueAndValidity();
      return;
    }
    this.isLoading = true;
    this.paymentForm.addControl(
      "PersonId",
      new UntypedFormControl(
        this.invoiceDetails?.customerId || this.selectedBill?.vendorId
      )
    );
    const { whtAmount, ...rest } = this.paymentForm.value;
    const payload = toFormData(rest);

    this._financeService
      .createPaymentMade(payload, rest.transactionPin)
      .subscribe(
        () => {
          this.isLoading = false;
          let url;
          this.paymentType === "Invoice"
            ? (url = "finance/payments-received")
            : (url = "finance/payments-made");
          status === "SentForApproval"
            ? this.router.navigate([url])
            : this.fetchData.emit();

          this.closeModal.emit();
        },
        () => (this.isLoading = false)
      );
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
