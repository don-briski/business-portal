import { Component, OnInit, Output, EventEmitter, Input } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { InvestmentService } from "../../../service/investment.service";
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { formatDate } from "@angular/common";
import * as moment from "moment";
import { Router } from "@angular/router";
import Swal from "sweetalert2";
import { map, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

import { UserService } from "../../../service/user.service";
import { AuthService } from "../../../service/auth.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { InvestmentCertificateComponent } from "src/app/library/investment-certificate/investment-certificate.component";
import { isValidEmail } from "src/app/util/validators/validators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { AppOwnerInformation, User } from "../../shared/shared.types";
import { InvestmentCertificateInfoSetup } from "src/app/model/configuration";
import { objectToCamelCase } from "../../shared/helpers/generic.helpers";

@Component({
  selector: "app-investment-page",
  templateUrl: "./investment-page.component.html",
  styleUrls: ["./investment-page.component.scss"],
})
export class InvestmentPageComponent implements OnInit {
  public user: User;
  public InvestmentForm: UntypedFormGroup;
  public verifyingBVN = false;
  public verifyingAccount = false;
  public bvnChecked = false;
  public bankAccountChecked = false;
  public amountValid = false;
  public loader = false;
  public bvnErrorMessage = "";
  public accountErrorMessage = "";
  public accountVerificationMessage = "";
  public bankList = [];
  public bankInfo: any;
  public investmentTypeList = [];
  public invTypeSelected: any;
  invTypeSelectedId: number;
  public amountError = "";
  public amountTextInfo = "";
  public formSubmitted = false;

  @Input() investmentDetails: any;
  @Input() bvn: number;
  @Input() amount: number;
  @Output() investmentCreated = new EventEmitter<any>();
  appOwner: AppOwnerInformation;
  StartDateNotification = "";
  loggedInUser: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  loadingCert: boolean;
  postInvToFinance: boolean = false;
  accounts: CustomDropDown[];
  currencySymbol: string;
  investmentCertSetup?: InvestmentCertificateInfoSetup;

  constructor(
    private modalService: NgbModal,
    private userService: UserService,
    private authService: AuthService,
    private invService: InvestmentService,
    private configService: ConfigurationService,
    private router: Router,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit() {
    this.getCurrencySymbol();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }

    this.getOwnerInformation();
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

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getOwnerInformation() {
    this.configService.getAppOwnerInfo().subscribe((response) => {
      this.appOwner = response?.body;
      this.accounts = this.appOwner.financeInvestmentInitialAccounts.map(
        (account) => ({
          id: account.accountId,
          text: account.name,
        })
      );

      this.fetchUserInfo();
      this.fetchBanks();
      this.fetchInvestmentType();
      this.getInvestmentSetupInfo();
    });
  }

  fetchInvestmentType() {
    this.invService.fetchActiveInvestmentType().subscribe(
      (res) => {
        this.investmentTypeList = res.body;
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
      },
      (err) => {}
    );
  }

  fetchUserInfo() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe(
        (response) => {
          this.user = response.body;
          this.investmentInit();

          if (this.investmentDetails != null) {
            this.verifyingBVN = false;
            this.bvnChecked = true;
            this.bankInfo = {
              account_name:
                this.investmentDetails.additionalInfo.bankAccountName,
              account_number:
                this.investmentDetails.additionalInfo.bankAccountNumber,
            };
            this.invTypeSelected = this.investmentDetails.investmentTypeInfo;

            const accId =
              this.investmentDetails.financeInteractionCashOrBankAccountId;
            if (accId !== null && accId !== undefined) {
              const account = this.accounts.filter((acc) => accId === acc.id);

              this.InvestmentForm.get(
                "financeInteractionCashOrBankAccountIdObj"
              ).setValue(account);
              this.InvestmentForm.get(
                "financeInteractionCashOrBankAccountId"
              ).setValue(account[0].id);
            }
            this.InvestmentForm.get("FirstName").disable();
            this.InvestmentForm.get("FirstName").setValue(
              this.investmentDetails.firstName,
              { onlySelf: true, emitEvent: true }
            );
            this.InvestmentForm.get("FirstName").disable();

            this.InvestmentForm.get("LastName").setValue(
              this.investmentDetails.lastName,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("PhoneNumber").setValue(
              this.investmentDetails.additionalInfo.phoneNumber,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("EmailAddress").setValue(
              this.investmentDetails.additionalInfo.investorEmail,
              { onlySelf: true, emitEvent: true }
            );
            this.InvestmentForm.get("InvestorId").setValue(
              this.investmentDetails.investorId,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("InvestmentId").setValue(
              this.investmentDetails.investmentId,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("InvestmentTypeId").setValue(
              this.investmentDetails.investmentTypId,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("InvestmentAmount").setValue(
              this.investmentDetails.investmentAmount,
              { onlySelf: true, emitEvent: true }
            );
            this.InvestmentForm.get("collectionPeriod").setValue(
              this.investmentDetails.collectionPeriod,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("RolloverDetails").setValue(
              JSON.stringify(this.investmentDetails),
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("BankAccountNumber").setValue(
              this.investmentDetails.additionalInfo.bankAccountNumber,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("BankAccountName").setValue(
              this.investmentDetails.additionalInfo.bankAccountName,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("BankSortCode").setValue(
              this.investmentDetails.additionalInfo.bankSortCode,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("BankName").setValue(
              this.investmentDetails.additionalInfo.bankName,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("AccountVerification").setValue(
              this.investmentDetails.additionalInfo.bankName !== ""
                ? true
                : false,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("AltPhoneNumber").setValue(
              this.investmentDetails.additionalInfo.investorAltPhoneNumber,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("CustomerAddress").setValue(
              this.investmentDetails.additionalInfo.investorCustomAddress,
              { onlySelf: true, emitEvent: true }
            );

            const dt = this.investmentDetails.startDate
              ? formatDate(this.investmentDetails.startDate, "yyyy-MM-dd", "en")
              : "";
            this.InvestmentForm.get("StartDate").setValue(dt, {
              onlySelf: true,
              emitEvent: true,
            });

            this.InvestmentForm.get("InvestmentRate").setValue(
              this.investmentDetails.investmentRate,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("InvestmentTenor").setValue(
              this.investmentDetails.investmentTenor,
              { onlySelf: true, emitEvent: true }
            );

            this.InvestmentForm.get("InvestmentCode").setValue(
              this.investmentDetails.investmentCode,
              { onlySelf: true, emitEvent: true }
            );
          }
        },
        (err) => {
          this.verifyingBVN = false;
          this.bvnErrorMessage = err.error;
        }
      );
  }

  checkAmount(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      this.amountTextInfo =
        `(${this.currencySymbol}` +
        this.invTypeSelected.minAmount.toLocaleString() +
        ` - ${this.currencySymbol}` +
        this.invTypeSelected.maxAmount.toLocaleString() +
        ")";
      const loanAmount = control.value || 0;
      if (loanAmount > 0) {
        if (
          loanAmount >= this.invTypeSelected.minAmount &&
          loanAmount <= this.invTypeSelected.maxAmount
        ) {
          return null;
        } else {
          return {
            OutOfRange: "Investment amount is out of range.",
            GreaterThanZero: "",
          };
        }
      } else {
        return {
          GreaterThanZero: "Investment amount must be greater than zero.",
          OutOfRange: "",
        };
      }
    } else {
      this.amountTextInfo = "";
      if (this.InvestmentForm) {
        this.InvestmentForm.controls["InvestmentTypeId"].markAsTouched();
      }
      if (control.value > 0) {
        return { GreaterThanZero: "", OutOfRange: "" };
      } else {
        return {
          GreaterThanZero: "Investment amount must be greater than zero.",
          OutOfRange: "",
        };
      }
    }
  }

  investmentInit() {
    this.InvestmentForm = new UntypedFormGroup({
      InvestmentId: new UntypedFormControl("", []),
      InvestmentCode: new UntypedFormControl("", []),
      InvestmentAmount: new UntypedFormControl({ value: 0, disabled: true }, [
        Validators.required,
        this.checkAmount.bind(this),
      ]),
      InvestmentTypeId: new UntypedFormControl({ value: "", disabled: true }, [
        Validators.required,
        this.checkLoanAmount.bind(this),
      ]),
      InvestorId: new UntypedFormControl("", []),
      InvestmentTenor: new UntypedFormControl({ value: 0 }, [
        Validators.required,
        this.checkInvestmentTenor.bind(this),
        Validators.pattern(/^[1-9]+[0-9]*$/),
      ]),
      InvestmentRate: new UntypedFormControl({ value: 0 }, [
        Validators.required,
        this.checkInvestmentRate.bind(this),
      ]),
      FirstName: new UntypedFormControl({ value: "", disabled: true }, [
        Validators.required,
      ]),
      LastName: new UntypedFormControl({ value: "", disabled: true }, [
        Validators.required,
      ]),
      PhoneNumber: new UntypedFormControl({ value: "", disabled: true }, [
        Validators.required,
      ]),
      BankAccountNumber: new UntypedFormControl(
        { value: "", disabled: true },
        []
      ),
      BankAccountName: new UntypedFormControl(
        { value: "", disabled: true },
        []
      ),
      BankSortCode: new UntypedFormControl({ value: "", disabled: true }, []),
      BankName: new UntypedFormControl({ value: "", disabled: true }, []),
      BankList: new UntypedFormControl("", []),
      AccountVerification: new UntypedFormControl(false, []),
      AltPhoneNumber: new UntypedFormControl({ value: "", disabled: true }, []),
      CustomerAddress: new UntypedFormControl({ value: "", disabled: true }, [
        Validators.required,
      ]),
      RolloverDetails: new UntypedFormControl("", []),
      StartDate: new UntypedFormControl({ value: "", disabled: true }, [
        Validators.required,
        this.notifyAgent.bind(this),
      ]),
      EmailAddress: new UntypedFormControl("", [
        Validators.required,
        Validators.email,
      ]),
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      collectionPeriod: new UntypedFormControl({ value: "", disabled: true }, [
        Validators.required,
        this.checkCollectionPeriod.bind(this),
        Validators.pattern(/^[1-9]+[0-9]*$/),
      ]),
      BranchId: new UntypedFormControl(this.user?.branchId),
      appOwnerKey: new UntypedFormControl(this.appOwner?.appOwnerKey),
      hasFinanceInteraction: new UntypedFormControl(false),
      financeInteractionCashOrBankAccountIdObj: new UntypedFormControl(null),
      financeInteractionCashOrBankAccountId: new UntypedFormControl(null),
    });

    const form = this.InvestmentForm;
    form
      .get("financeInteractionCashOrBankAccountIdObj")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res[0]) {
          form
            .get("financeInteractionCashOrBankAccountId")
            .setValue(res[0]?.id);
          form.get("hasFinanceInteraction").setValue(true);
        } else {
          form.get("financeInteractionCashOrBankAccountId").setValue(null);
          form.get("hasFinanceInteraction").setValue(false);
        }
      });
  }

  notifyAgent(control: AbstractControl): ValidationErrors | null {
    if (
      control.value !== "" &&
      moment(control.value).isBefore(moment(), "days")
    ) {
      this.StartDateNotification = "This investment start date is in the PAST.";
      return null;
    } else if (
      control.value !== "" &&
      moment(control.value).isAfter(moment(), "days")
    ) {
      this.StartDateNotification =
        "This investment start date is in the FUTURE.";
      return null;
    } else {
      this.StartDateNotification = "";
      return null;
    }
  }

  verifyEmailAddress() {
    const email: string = this.InvestmentForm.get("EmailAddress").value;
    if (email === "" || !isValidEmail(email)) return;

    if (this.InvestmentForm) {
      this.verifyingBVN = true;
      this.invService.verifyInvestorEmailAddress(email).subscribe(
        (res) => {
          this.verifyingBVN = false;
          if (res.body) {
            this.InvestmentForm.controls["InvestorId"].patchValue(
              res.body.personId
            );
            this.InvestmentForm.controls["InvestorId"].enable();
            this.InvestmentForm.controls["PhoneNumber"].patchValue(
              res.body.phoneNumber
            );
            this.InvestmentForm.controls["PhoneNumber"].enable();
            this.InvestmentForm.controls["FirstName"].patchValue(
              res.body.firstName
            );
            this.InvestmentForm.controls["FirstName"].enable();
            this.InvestmentForm.controls["LastName"].patchValue(
              res.body.lastName
            );
            this.InvestmentForm.controls["LastName"].enable();
            this.InvestmentForm.controls["CustomerAddress"].patchValue(
              res.body.address
            );
            this.InvestmentForm.controls["CustomerAddress"].enable();

            this.InvestmentForm.controls["AltPhoneNumber"].enable();
            this.InvestmentForm.controls["BankSortCode"].enable();
            this.InvestmentForm.controls["BankName"].enable();
            this.InvestmentForm.controls["StartDate"].enable();
            this.InvestmentForm.controls["BankAccountName"].enable();
            this.InvestmentForm.controls["BankAccountNumber"].enable();
            this.InvestmentForm.controls["InvestmentTenor"].enable();
            this.InvestmentForm.controls["InvestmentRate"].enable();
            this.InvestmentForm.controls["InvestmentAmount"].enable();
            this.InvestmentForm.controls["InvestmentTypeId"].enable();
            this.InvestmentForm.controls["collectionPeriod"].enable();
          } else {
            this.InvestmentForm.controls["InvestorId"].enable();
            this.InvestmentForm.controls["PhoneNumber"].enable();
            this.InvestmentForm.controls["FirstName"].enable();
            this.InvestmentForm.controls["LastName"].enable();
            this.InvestmentForm.controls["CustomerAddress"].enable();
            this.InvestmentForm.controls["AltPhoneNumber"].enable();
            this.InvestmentForm.controls["BankSortCode"].enable();
            this.InvestmentForm.controls["BankName"].enable();
            this.InvestmentForm.controls["StartDate"].enable();
            this.InvestmentForm.controls["BankAccountName"].enable();
            this.InvestmentForm.controls["BankAccountNumber"].enable();
            this.InvestmentForm.controls["InvestmentTenor"].enable();
            this.InvestmentForm.controls["InvestmentRate"].enable();
            this.InvestmentForm.controls["InvestmentAmount"].enable();
            this.InvestmentForm.controls["InvestmentTypeId"].enable();
            this.InvestmentForm.controls["collectionPeriod"].enable();
          }
        },
        (err) => {
          this.verifyingBVN = false;
        }
      );
    }
  }

  checkInvestmentTenor(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      if (
        this.invTypeSelected.minInvestmentTenor <= parseInt(control.value, 0) &&
        parseInt(control.value, 0) <= this.invTypeSelected.maxInvestmentTenor
      ) {
        const collectionPeriod = this.InvestmentForm.get("collectionPeriod");
        if (collectionPeriod.value > control.value) {
          return {
            OutOfRange:
              "Investment tenor cannot be less than collection period",
          };
        }

        return null;
      } else {
        return {
          OutOfRange: `Min: ${this.invTypeSelected.minInvestmentTenor} - Max: ${this.invTypeSelected.maxInvestmentTenor}`,
        };
      }
    } else {
      return null;
    }
  }

  checkCollectionPeriod(control: AbstractControl): ValidationErrors | null {
    const investmentTenor = this.InvestmentForm.get("InvestmentTenor");

    if (investmentTenor) {
      if (control.value > investmentTenor.value) {
        return {
          OutOfRange:
            "Collection Period must be less than or equal to Investment Tenor",
        };
      } else {
        return null;
      }
    }
  }

  checkInvestmentRate(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      if (
        +control.value >= this.invTypeSelected.minInterestRate &&
        +control.value <= this.invTypeSelected.maxInterestRate
      ) {
        return null;
      } else {
        return {
          OutOfRange: `Min: ${this.invTypeSelected.minInterestRate} - Max: ${this.invTypeSelected.maxInterestRate}`,
        };
      }
    } else {
      return null;
    }
  }

  checkLoanAmount(control: AbstractControl): ValidationErrors | null {
    this.invTypeSelected = this.investmentTypeList.find(
      (x) => x.investmentTypeId === parseInt(control.value, 0)
    );
    if (this.invTypeSelected) {
      this.amountTextInfo =
        `(${this.currencySymbol}` +
        this.invTypeSelected.minAmount.toLocaleString() +
        ` - ${this.currencySymbol}` +
        this.invTypeSelected.maxAmount.toLocaleString() +
        ")";
      if (this.InvestmentForm) {
        this.InvestmentForm.controls["InvestmentAmount"].markAsTouched();
        this.InvestmentForm.controls["InvestmentAmount"].markAsDirty();
        this.InvestmentForm.controls[
          "InvestmentAmount"
        ].updateValueAndValidity();
      }
    } else {
      this.amountTextInfo = "";
    }
    return null;
  }

  selectInvestmentType(event) {
    this.invTypeSelected = this.investmentTypeList.find(
      (x) => x.investmentTypeId === parseInt(event.target.value, 0)
    );
    this.invTypeSelectedId = event.target.value;
    if (this.invTypeSelected) {
      this.amountTextInfo =
        `(${this.currencySymbol}` +
        this.invTypeSelected.minAmount.toLocaleString() +
        ` - ${this.currencySymbol}` +
        this.invTypeSelected.maxAmount.toLocaleString() +
        ")";
    } else {
      this.amountTextInfo = "";
    }
  }

  checkLoanAmountValidity(val, check) {
    if (check) {
      const loanAmount = val;
      if (loanAmount >= check.minAmount && loanAmount <= check.maxAmount) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  private _cleanUp(): void {
    const controls = this.InvestmentForm.controls;
    controls["InvestorId"].enable();
    controls["PhoneNumber"].enable();
    controls["FirstName"].enable();
    controls["LastName"].enable();
    controls["CustomerAddress"].enable();
    controls["AltPhoneNumber"].enable();
    controls["BankSortCode"].enable();
    controls["BankName"].enable();
    controls["StartDate"].enable();
    controls["BankAccountName"].enable();
    controls["BankAccountNumber"].enable();
    controls["InvestmentTenor"].enable();
    controls["InvestmentRate"].enable();
    controls["InvestmentAmount"].enable();
    controls["InvestmentTypeId"].enable();
    controls["collectionPeriod"].enable();

    const {
      financeInteractionCashOrBankAccountIdObj,
      financeInteractionInvestmentIncomeAccountIdObj,
      ...rest
    } = this.InvestmentForm.value;
    rest["InvestmentTypeId"] = this.investmentDetails
      ? this.investmentDetails.investmentTypId
      : controls["InvestmentTypeId"].value;

    return rest;
  }

  checkApprovalStatus() {
    if (
      this.invTypeSelected?.approvalRequired ||
      this.InvestmentForm.get("InvestmentId").value
    ) {
      this.saveInvestmentForm();
    } else {
      Swal.fire({
        type: "info",
        title: "Activate Investment",
        text: "This investment will not go through approval process, it will be set to active automatically. Do you want to continue?",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "No",
        confirmButtonText: "Yes, activate it",
        confirmButtonColor: "#558E90",
      }).then((result) => {
        if (result.value) {
          this.saveInvestmentForm();
        }
      });
    }
  }

  saveInvestmentForm() {
    const payload = this._cleanUp();
    this.formSubmitted = true;
    if (this.InvestmentForm.valid) {
      this.loader = true;
      this.invService.saveInvestment(payload).subscribe(
        (res) => {
          this.investmentCreated.emit(res);
          this.InvestmentForm.reset();
          this.investmentInit();
          this.formSubmitted = false;
        },
        (err) => {
          this.formSubmitted = false;
          this.loader = false;
        }
      );
    }
  }

  previewInvestmentCert() {
    if (this.InvestmentForm.valid) {
      const investmentTypeId =
        +this.InvestmentForm.get("InvestmentTypeId").value;
      const selectedInvestmentType = this.investmentTypeList.find(
        (inv) => inv.investmentTypeId === investmentTypeId
      );
      let investmentTermsAndConditions =
        selectedInvestmentType?.termsAndConditionsSetupInfo
          ? JSON.parse(selectedInvestmentType?.termsAndConditionsSetupInfo)
          : null;

      if (investmentTermsAndConditions) {
        investmentTermsAndConditions = objectToCamelCase(
          investmentTermsAndConditions
        );
      }
      this.loadingCert = true;
      this.invService
        .getInvestmentCertificatePreview(this.InvestmentForm.getRawValue())
        .subscribe(
          (res) => {
            let certData = res.body?.data;
            certData["total"] = +(
              certData?.investmentAmount + certData?.totalAmountExpected
            );
            if (investmentTermsAndConditions) {
              const investmentTypeInfo = {
                termsAndConditionsInfoSetup: investmentTermsAndConditions,
              };
              certData["investmentTypeInfo"] = investmentTypeInfo;
            }

            certData = {
              ...certData,
              investmentCertSetup: this.investmentCertSetup,
            };

            this.loadingCert = false;
            const modalRef = this.modalService.open(
              InvestmentCertificateComponent,
              { centered: true, windowClass: "myModal" }
            );

            modalRef.componentInstance.data = certData;
            modalRef.componentInstance.theme = this.currentTheme;
            modalRef.componentInstance.isModal = true;
          },
          (err) => {
            this.loadingCert = false;
          }
        );
    }
  }

  openModal(content) {
    this.modalService.open(content, {
      backdrop: "static",
      size: "lg",
      centered: true,
    });
  }

  closeModal() {
    this.modalService.dismissAll();
    this.bvnChecked = false;
    this.bankAccountChecked = false;
    this.bvnErrorMessage = "";
    this.accountErrorMessage = "";
    this.amountError = "";
    this.amountValid = false;
    this.investmentInit();
  }

  fetchBanks() {
    this.configService.fetchBanks().pipe(map(response => (response.body.data.sort((a,b) => a.name.localeCompare(b.name)))),takeUntil(this.unsubscriber$)).subscribe((banks) => {
      this.bankList = banks;
    });
  }

  getBankSelected(event) {
    const selectedOptions = event.target.options;
    const selectedIndex = selectedOptions.selectedIndex;
    const selectElementText = selectedOptions[selectedIndex].text;
    this.InvestmentForm.controls["BankSortCode"].setValue(event.target.value, {
      onlySelf: true,
      emitEvent: true,
    });
    this.InvestmentForm.controls["BankSortCode"].updateValueAndValidity();
    this.InvestmentForm.controls["BankName"].setValue(selectElementText, {
      onlySelf: true,
      emitEvent: true,
    });
    this.InvestmentForm.controls["BankName"].updateValueAndValidity();
    this.InvestmentForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
    this.InvestmentForm.controls["AccountVerification"].setValue(false, {
      onlySelf: true,
      emitEvent: true,
    });
    this.InvestmentForm.controls[
      "AccountVerification"
    ].updateValueAndValidity();
    this.accountErrorMessage = "";
  }

  validateAccount(ev) {
    if (this.appOwner.loanBankAccountValidationSetting) {
      if (this.InvestmentForm.get("BankSortCode").value) {
        if (ev.target.value.length === 10) {
          this.InvestmentForm.controls["AccountVerification"].setValue(false, {
            onlySelf: true,
            emitEvent: true,
          });
          this.InvestmentForm.controls[
            "AccountVerification"
          ].updateValueAndValidity();
          this.InvestmentForm.controls["BankAccountName"].setValue("", {
            onlySelf: true,
            emitEvent: true,
          });
          this.InvestmentForm.controls[
            "BankAccountName"
          ].updateValueAndValidity();
          this.accountVerificationMessage = "";
          this.bankInfo = null;
          ev.target.disabled = true;
          this.verifyingAccount = true;
          this.invService
            .verifyBankAccount({
              sortCode: this.InvestmentForm.get("BankSortCode").value,
              accountNumber: this.InvestmentForm.get("BankAccountNumber").value,
            })
            .subscribe(
              (res: any) => {
                this.verifyingAccount = false;
                ev.target.disabled = false;
                this.InvestmentForm.controls["AccountVerification"].setValue(
                  true,
                  { onlySelf: true, emitEvent: true }
                );
                this.InvestmentForm.controls[
                  "AccountVerification"
                ].updateValueAndValidity();
                this.bankInfo = res.body.data;
                this.InvestmentForm.controls["BankAccountName"].setValue(
                  res.body.data?.accountName,
                  { onlySelf: true, emitEvent: true }
                );
                this.InvestmentForm.controls[
                  "BankAccountName"
                ].updateValueAndValidity();
              },
              (err) => {
                this.verifyingAccount = false;
                ev.target.disabled = false;
                this.accountVerificationMessage = err.error;
              }
            );
        }
      } else {
        this.accountErrorMessage = "Select a bank from the list.";
      }
    }
  }

  validateBVN(ev) {
    if (ev.target.value.length === 11) {
      ev.target.disabled = true;
      this.verifyingBVN = true;
      this.bvnChecked = false;
      this.bvnErrorMessage = "";
      this.InvestmentForm.controls["FirstName"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.InvestmentForm.controls["AccountVerification"].setValue(false, {
        onlySelf: true,
        emitEvent: true,
      });
      this.InvestmentForm.controls["LastName"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.InvestmentForm.controls["PhoneNumber"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.InvestmentForm.controls["BankList"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.InvestmentForm.controls["BankSortCode"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.InvestmentForm.controls["BankAccountNumber"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.InvestmentForm.controls["EmailAddress"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.InvestmentForm.controls["InvestorId"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.bankInfo = null;
      this.InvestmentForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });

      this.invService
        .verifyBVN({ BVN: ev.target.value, UserId: this.user.userId })
        .subscribe(
          (res) => {
            ev.target.disabled = false;
            this.verifyingBVN = false;
            this.bvnChecked = true;
            this.InvestmentForm.controls["FirstName"].setValue(
              res.body.firstName,
              { onlySelf: true, emitEvent: true }
            );
            this.InvestmentForm.controls["FirstName"].disable();
            this.InvestmentForm.controls["LastName"].setValue(
              res.body.lastName,
              { onlySelf: true, emitEvent: true }
            );
            this.InvestmentForm.controls["LastName"].disable();
            this.InvestmentForm.controls["PhoneNumber"].setValue(
              res.body.phoneNumber,
              { onlySelf: true, emitEvent: true }
            );
            this.InvestmentForm.controls["PhoneNumber"].disable();
            this.InvestmentForm.controls["EmailAddress"].setValue(
              res.body.emailAddress,
              { onlySelf: true, emitEvent: true }
            );
            this.InvestmentForm.controls["InvestorId"].setValue(
              res.body.personId,
              { onlySelf: true, emitEvent: true }
            );
            this.InvestmentForm.updateValueAndValidity({
              onlySelf: true,
              emitEvent: true,
            });
          },
          (err) => {
            this.verifyingBVN = false;
            ev.target.disabled = false;
            this.bvnErrorMessage = err.error;
          }
        );
    }
  }

  getInvestmentSetupInfo() {
    this.configService
      .fetchInvestmentSetupInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.investmentCertSetup =
            res.body?.data?.investmentCertificateInfoSetup;
        },
      });
  }
}
