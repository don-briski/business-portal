import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import Swal from "sweetalert2";

import { User } from "src/app/modules/shared/shared.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { DisbursementBatch } from "src/app/model/disbursement-batch";
import { takeUntil } from "rxjs/operators";
import { EncryptService } from "src/app/service/encrypt.service";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";

@Component({
  selector: "lnd-reassign-disbursement",
  templateUrl: "./reassign-disbursement.component.html",
  styleUrls: ["./reassign-disbursement.component.scss"],
})
export class ReassignDisbursementComponent implements OnInit, OnDestroy {
  @Input() colorTheme: ColorThemeInterface;
  @Input() disbursementBatch: DisbursementBatch;

  user: User;
  subs$ = new Subject<void>();
  form: UntypedFormGroup;
  paymentOfficers: CustomDropDown[] = [];
  isFetchingPaymentOfficers = false;
  isSubmitting = false;
  selectPaymentOfficerName: string;

  constructor(
    private modalService: NgbModal,
    private readonly loanOperationsService: LoanoperationsService,
    private encryptService: EncryptService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getUser();
    this.fetchPaymentOfficers();
  }

  initForm() {
    this.form = new UntypedFormGroup({
      paymentOfficer: new UntypedFormControl("", Validators.required),
      transactionPin: new UntypedFormControl("", Validators.required),
    });
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  fetchPaymentOfficers() {
    this.isFetchingPaymentOfficers = true;
    this.loanOperationsService
      .getPaymentOfficers()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.paymentOfficers = res.body.map((item) => ({
            id: item.userId,
            text: item.name,
          }));
          this.isFetchingPaymentOfficers = false;
        },
        error: () => {
          this.isFetchingPaymentOfficers = false;
        },
      });
  }

  onSelectPaymentOfficer(value: CustomDropDown) {
    this.form.get("paymentOfficer").setValue(value.id);
    this.selectPaymentOfficerName = value.text;
  }

  onSubmit() {
    this.isSubmitting = true;

    let { transactionPin, paymentOfficer } = this.form.value;
    transactionPin = this.encryptService.encrypt(transactionPin);

    const data = {
      disbursementBatches: [this.disbursementBatch.disbursementBatchId],
      newPaymentOfficerId: paymentOfficer,
    };
    this.loanOperationsService
      .reassignDisbursementBatch(data, transactionPin)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.loanOperationsService.reassignedDisbursementBatch.next();
          this.closeModal();
          this.showSuccessModal();
        },
        error: () => {
          this.isSubmitting = false;
        },
      });
  }

  showSuccessModal() {
    Swal.fire({
      type: "success",
      title: "Successful",
      text: `You have successfully reassigned this disbursement batch to ${this.selectPaymentOfficerName}`,
      confirmButtonText: "Okay",
      confirmButtonColor: "#558E90",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
