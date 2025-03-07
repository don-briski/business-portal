import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  EventEmitter,
  Output,
} from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { Router } from "@angular/router";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import {
  CustomerBVNDetails,
  CustomerDetailsFromRemita,
} from "../../loan.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { User } from "src/app/modules/shared/shared.types";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { toFormData } from "src/app/util/finance/financeHelper";
import { VerifyBankAccount } from "src/app/modules/configuration/models/configuration";

@Component({
  selector: "lnd-create-loan-with-remita",
  templateUrl: "./create-loan-with-remita.component.html",
  styleUrls: ["./create-loan-with-remita.component.scss"],
})
export class CreateLoanWithRemitaComponent implements OnInit, OnDestroy {
  @Input() colorTheme: ColorThemeInterface;
  @Input() customerBVNDetails: CustomerBVNDetails;
  @Input() partLoanApplicationDetails: any;
  @Input() loanTypeId: number;
  @Input() loanInterest: number;
  @Input() customerEmailAddress: "";

  subs$ = new Subject<void>();
  user: User;
  getCustomerDetailsForm: UntypedFormGroup;
  loanApplicationForm: UntypedFormGroup;
  remitaBanks: CustomDropDown[] = [];
  paystackBanks: CustomDropDown[] = [];
  isFetchingRemitaBanks = false;
  isFetchingCustomerDetails = false;
  isSubmittingLoanApplication = false;
  customerDetailsFromRemita?: CustomerDetailsFromRemita;
  branches: CustomDropDown[] = [];
  selectedRemitaBankName: string;
  isPaystackDisburseable = false;
  usePaystackDisburseableBankAcc = false;
  validatingBankAcc = false;
  validatedBankAccInfo?: any;
  selectedRemitaInfo: "Salary" | "Loan";
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });

  constructor(
    private readonly router: Router,
    private readonly modalService: NgbModal,
    private readonly loanOperationsService: LoanoperationsService,
    private readonly configService: ConfigurationService,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.getUser();
    this.fetchBranches();
    this.getRemitaBanks();
    this.getPaystackBanks();
  }

  initForms() {
    this.getCustomerDetailsForm = new UntypedFormGroup({
      accountNumber: new UntypedFormControl("", [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern("^[0-9]*$"),
      ]),
      bankCode: new UntypedFormControl("", Validators.required),
    });

    this.getCustomerDetailsForm.valueChanges
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: () => {
          this.customerDetailsFromRemita = null;
        },
      });

    this.loanApplicationForm = new UntypedFormGroup({
      DateOfEmployment: new UntypedFormControl("", Validators.required),
      CustomerName: new UntypedFormControl(
        this.customerDetailsFromRemita?.customerName
      ),
      CustomerPhoneNumber: new UntypedFormControl("", [
        Validators.required,
        Validators.minLength(11),
        Validators.maxLength(11),
        Validators.pattern("^[0-9]*$"),
      ]),
      ResidentialAddress: new UntypedFormControl("", Validators.required),
      BankAccountNumber: new UntypedFormControl("", [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern("^[0-9]*$"),
      ]),
      BankSortCode: new UntypedFormControl("", Validators.required),
      BankName: new UntypedFormControl(""),
      BranchId: new UntypedFormControl(""),
      LoanTypeId: new UntypedFormControl(this.loanTypeId),
      EmployerName: new UntypedFormControl(""),
      EmploymentStatus: new UntypedFormControl("EMPLOYED"),
      RepaymentMethod: new UntypedFormControl("Inflight Collections - Remita"),
      BVN: new UntypedFormControl(this.customerBVNDetails.bvn),
      BvnDateOfBirth: new UntypedFormControl(this.customerBVNDetails.dob),
      LoanInterest: new UntypedFormControl(this.loanInterest),
      EmailAddress: new UntypedFormControl(this.customerEmailAddress),
      AdditionalComment: new UntypedFormControl(""),
    });

    this.loanApplicationForm
      .get("BankAccountNumber")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe({
        next: (value: string) => {
          if (
            value.length === 10 &&
            this.loanApplicationForm.get("BankSortCode").value
          ) {
            this.validateBankAccount();
          }
        },
      });
  }

  getUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.user = res.body;
        this.loanApplicationForm.get("BranchId").setValue(this.user.branchId);
      });
  }

  fetchBranches() {
    this.configService
      .spoolAccessibleBranches({
        UserId: this.authService.decodeToken().nameid,
      })
      .subscribe((res) => {
        this.branches = res.body;
      });
  }

  getRemitaBanks() {
    this.isFetchingRemitaBanks = true;

    this.loanOperationsService
      .getBanksAsJson()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.remitaBanks = res.body.map((bank) => ({
            id: bank.BankCode,
            text: bank.BankName,
          }));

          this.isFetchingRemitaBanks = false;
        },
        error: () => {
          this.isFetchingRemitaBanks = false;
        },
      });
  }

  onSelectBank(value: CustomDropDown, kind: "Remita" | "Paystack") {
    if (kind === "Remita") {
      this.getCustomerDetailsForm.get("bankCode").setValue(value.id);

      const foundRemitaBank = this.remitaBanks.find(
        (bank) => bank.id === value.id
      );
      this.selectedRemitaBankName = foundRemitaBank.text;

      const foundPaystackBank = this.paystackBanks.find(
        (bank) => bank.id === value.id
      );
      if (foundPaystackBank) {
        this.isPaystackDisburseable = true;

        const remitaCustomerBankAccount =
          this.getCustomerDetailsForm.get("accountNumber").value;
        const remitaCustomerBankSortCode = value.id;

        this.loanApplicationForm
          .get("BankAccountNumber")
          .setValue(remitaCustomerBankAccount);

        this.loanApplicationForm.get("BankName").setValue(foundRemitaBank.text);

        this.loanApplicationForm
          .get("BankSortCode")
          .setValue(remitaCustomerBankSortCode);
      } else {
        this.isPaystackDisburseable = false;
      }
    } else if (kind === "Paystack") {
      this.loanApplicationForm.get("BankSortCode").setValue(value.id);

      if (
        this.loanApplicationForm.get("BankAccountNumber").value?.length === 10
      ) {
        this.validateBankAccount();
      }
    }
  }

  onDeselectBank(kind: "Remita" | "Paystack") {
    if (kind === "Remita") {
      this.getCustomerDetailsForm.get("bankCode").setValue("");
    } else if (kind === "Paystack") {
      this.loanApplicationForm.get("BankSortCode").setValue("");
    }
  }

  getPaystackBanks() {
    this.configService
      .fetchBanks()
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.paystackBanks = res.body.data.map((item) => ({
          id: item.code,
          text: item.name,
        }));
      });
  }

  onGetCustomerDetails() {
    this.isFetchingCustomerDetails = true;

    const { accountNumber, bankCode } = this.getCustomerDetailsForm.value;
    const { firstName, lastName, bvn } = this.customerBVNDetails;

    const customerDetails = {
      firstName,
      lastName,
      bvn,
      accountNumber,
      bankCode,
    };

    this.loanOperationsService
      .getCustomerDetailsFromRemita(customerDetails)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.customerDetailsFromRemita = res.body.data;
          this.loanApplicationForm
            .get("EmployerName")
            .setValue(this.customerDetailsFromRemita?.companyName);
          this.isFetchingCustomerDetails = false;
        },
        error: () => {
          this.isFetchingCustomerDetails = false;
        },
      });
  }

  validateBankAccount() {
    this.validatedBankAccInfo = null;
    this.validatingBankAcc = true;
    const payload:VerifyBankAccount = {
      accountNumber:this.loanApplicationForm.get("BankAccountNumber").value,
      sortCode:this.loanApplicationForm.get("BankSortCode").value
    }
    this.configService
      .validateBankAccount(payload)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.validatedBankAccInfo = res.body;
          this.loanApplicationForm
            .get("BankAccountName")
            .setValue(res.body["account_name"]);
          this.validatingBankAcc = false;
        },
        error: () => {
          this.validatingBankAcc = false;
        },
      });
  }

  async onSubmitLoanApplicationForm(status: "Pool") {
    if (this.loanApplicationForm.invalid) return;

    const result = await Swal.fire({
      type: "info",
      title: "Create Loan?",
      text: "Are you sure you want to create this loan?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Create Loan",
      confirmButtonColor: "#558E90",
    });

    if (!result.value) return;

    const data = {
      status,
      ...this.partLoanApplicationDetails,
      ...this.loanApplicationForm.value,
    };

    const payload = toFormData(data, ["SupportingDocuments"]);

    this.isSubmittingLoanApplication = true;
    this.configService.SubmitLoanApplication(payload).subscribe({
      next: () => {
        this.isSubmittingLoanApplication = false;
        this.onClose();
        Swal.fire({ type: "success", text: "Loan successfully created." });
        this.router.navigate(["/loan/myapplications"]);
      },
      error: () => {
        this.isSubmittingLoanApplication = false;
      },
    });
  }

  onClose() {
    this.modalService.dismissAll();
  }

  ngOnDestroy() {
    this.subs$.next();
    this.subs$.complete();
  }
}
