import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import Swal from "sweetalert2";

import { Tab } from "src/app/modules/shared/shared.types";
import { TabBarService } from "src/app/modules/shared/components/tab-bar/tab-bar.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { LoanAppDetails, LoanType } from "../../loan.types";
import { customDateFormat } from "src/app/util/finance/financeHelper";

@Component({
  selector: "lnd-edit-loan-application-info",
  templateUrl: "./edit-loan-application-info.component.html",
  styleUrls: ["./edit-loan-application-info.component.scss"],
})
export class EditLoanApplicationInfoComponent implements OnInit, OnDestroy {
  @Input() loanId: number;
  @Input() loanType: LoanType;

  @Output() edited = new EventEmitter<void>();

  unsubscriber$ = new Subject<void>();

  tabs: Tab[] = [{ id: "loan-app", text: "Loan Application" }];
  currentTabId = "loan-app";
  currencySymbol: string;
  submitting = false;
  form = new FormGroup({
    loanId: new FormControl(0),
    loanAmount: new FormControl(0),
    interest: new FormControl(0),
    loanTenor: new FormControl(0),
    loanStartDate: new FormControl(""),
    bankInformation: new FormGroup({
      bankName: new FormControl("", Validators.required),
      bankAccountName: new FormControl(""),
      bankSortCode: new FormControl("", Validators.required),
      bankAccountNumber: new FormControl("", [
        Validators.required,
        Validators.min(10),
        Validators.max(10),
      ]),
    }),
  });
  validatingAccount = false;
  errInValidatingAcc = false;
  accountName = "";
  banks: CustomDropDown[] = [];
  gettingBanks = false;
  gettingLoan = false;
  loan: LoanAppDetails;
  requiredPermissions: string[] = [];
  loanTenors: number[] = [];
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private readonly tabBarService: TabBarService,
    private readonly modalService: NgbModal,
    private readonly configService: ConfigurationService,
    private loanService: LoanoperationsService
  ) {}

  ngOnInit(): void {
    this.listenForTabSwitch();
    this.getCurrencySymbol();
    this.fetchBanks();
    this.getLoan();
  }

  get initializing() {
    return this.gettingBanks || this.gettingLoan;
  }

  patchForm(loan: LoanAppDetails) {
    this.form.patchValue({
      loanId: loan?.loanId,
      loanAmount: loan?.loanAmount,
      interest: loan?.interest,
      loanTenor: loan?.loanTenor,
      loanStartDate: loan.loanStartDate
        ? customDateFormat(loan.loanStartDate)
        : loan.loanStartDate,
      bankInformation: { ...loan?.bankInformation },
    });

    this.form
      .get("loanAmount")
      .setValidators([
        Validators.min(this.loanType.minAmount),
        Validators.max(this.loanType.maxAmount),
      ]);

    this.form
      .get("interest")
      .setValidators([
        Validators.min(0.1),
        Validators.max(this.loanType.interestRate),
      ]);

    this.form.updateValueAndValidity();
  }

  listenForTabSwitch() {
    this.tabBarService.tabSwitched
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (id) => {
          this.currentTabId = id.tabId;
        },
      });
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configService.currencySymbol;
    if (!this.currencySymbol) {
      this.configService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  onSelect(data: { type: string; value: CustomDropDown }) {
    if (data.type === "bankSortCode") {
      this.form.get("bankInformation.bankName").setValue(data.value.text);
      this.form
        .get("bankInformation.bankSortCode")
        .setValue(data.value.id.toString());
    }
  }

  onRemove(data: { type: string }) {
    if (data.type === "bankSortCode") {
      this.form.get("bankInformation.bankName").setValue("");
      this.form.get("bankInformation.bankSortCode").setValue("");
    }
  }

  getLoan() {
    this.gettingLoan = true;

    this.loanService
      .getLoanDetails(this.loanId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.loan = res.body?.data;
          this.patchForm(this.loan);

          this.generateLoanTenors();

          this.requiredPermissions = this.loan?.requiredPermissions?.map(
            (perm) => perm.permissionName
          );

          if (
            this.requiredPermissions.includes("Edit Loan Disbursement Account")
          ) {
            this.tabs.push({ id: "disb-info", text: "Disbursement Info" });
          }

          this.gettingLoan = false;
        },
        error: () => {
          this.gettingLoan = false;
        },
      });
  }

  generateLoanTenors() {
    for (let i = 1; i <= this.loanType.loanTypeTenor; i++) {
      this.loanTenors.push(i);
    }
  }

  onSubmit() {
    this.submitting = true;

    this.loanService
      .updateLoanDetails({
        ...(this.form.value as any),
        interest: +this.form.value.interest,
        loanTenor: +this.form.value.loanTenor,
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.toast.fire({
            type: "success",
            title: "Loan edited successfully!",
          });
          this.edited.emit();
          this.onClose();
        },
        error: () => {
          this.submitting = false;
        },
      });
  }

  onValidateAccount() {
    this.validatingAccount = true;
    this.accountName = "";
    this.errInValidatingAcc = false;

    const payload = {
      sortCode: this.form.get("bankInformation.bankSortCode").value,
      accountNumber: this.form.get("bankInformation.bankAccountNumber").value,
    };

    this.configService
      .validateBankAccount(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.accountName = res.body.data.accountName;
          this.validatingAccount = false;
        },
        (err) => {
          this.validatingAccount = false;
          this.errInValidatingAcc = true;
        }
      );
  }

  fetchBanks() {
    this.gettingBanks = true;
    this.configService
      .spoolBanks({ provider: "Paystack" })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.banks = res.body
            .sort((a, b) => a.bankName.localeCompare(b.bankName))
            .map((bank) => ({ id: bank.sortCode, text: bank.bankName }));
          this.gettingBanks = false;
        },
        () => {
          this.gettingBanks = false;
        }
      );
  }

  onClose() {
    this.modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
