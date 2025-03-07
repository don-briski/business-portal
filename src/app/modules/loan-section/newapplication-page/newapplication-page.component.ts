import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { Observable, of, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ConfigurationService } from "../../../service/configuration.service";
import {
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  AbstractControl,
  ValidationErrors,
  FormGroup,
  FormControl,
} from "@angular/forms";
import Swal from "sweetalert2";
import { NavigationEnd, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";
import _ from "underscore";
import * as $ from "jquery";
import { FormField } from "src/app/model/FormField";
import { toFormData } from "src/app/util/finance/financeHelper";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomerBVNDetails, LoanProfile, LoanType } from "../loan.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { LoanRepaymentMethodEnum } from "../enums/loan-repayment-method.enum";
import { ImageType } from "../enums/image-type.enum";
import {
  RemitaIntegrationNameEnum,
  RemitaSetup,
} from "src/app/model/configuration";
import {
  PaystackInfo,
  VerifyBankAccount,
} from "../../configuration/models/configuration";
import { SharedService } from "src/app/service/shared.service";
import { CrmRedirect } from "../../shared/shared.types";
import { Store } from "@ngrx/store";
import { AppState } from "src/app/store/app.state";
import { AppWideState } from "src/app/store/models";
import { selectCrmCustomerFeature } from "src/app/store/selectors";
import { CRMCustomerDetail } from "../../crm/crm.types";
@Component({
  selector: "app-newapplication-page",
  templateUrl: "./newapplication-page.component.html",
  styleUrls: ["./newapplication-page.component.scss"],
})
export class NewapplicationPageComponent implements OnInit, OnDestroy {
  @ViewChild("createLoanWithRemita")
  createLoanWithRemita: TemplateRef<any>;

  colorTheme: ColorThemeInterface;
  private unsubscriber$ = new Subject();
  dateOfBirth: any = null;
  loanStartDate: any = null;
  loanDateError: boolean = true;
  dateError: boolean = true;
  isDOBFromBVN = false;
  user: any;
  CustomerInfoError = "";
  typeaheadLoading: boolean;
  typeaheadNoResults: boolean;
  dataSource: Observable<any>;
  statesComplex: any[] = [];
  modifiedLoanTypes: CustomDropDown[] = [];
  loanTypes: LoanType[] = [];
  selectedLoanType: LoanType;
  selectedLoanTypeId: number;
  loanApplicationForm: UntypedFormGroup;
  AddEmployerForm: UntypedFormGroup;
  AlternativeCustomerForm: UntypedFormGroup;
  searchLoader = false;
  uniqueIdForm: UntypedFormGroup;
  accountShow = false;
  employmentShow = false;
  residenceShow = false;
  repaymentShow = false;
  loader = false;
  verifyloader = false;
  setUp: any;
  tenorList: any[] = [];
  payDateList: any[] = [];
  // personal info
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    // timer: 3000
  });
  bankList: any[] = [];
  bankInfo: any;
  repaymentMethods: string[] = [];
  reference: number;
  skipSecurity = false;
  public repaymentScheduleArray: any[] = [];
  repaymentLoader = false;
  userList: any[];
  userListForSelect: any[];
  selectedSoldByArray: any[] = [];
  employerList: any[];
  selectedstatus: any;
  employerSearchBool = false;
  loanReasonSearch = false;
  employerSearchTerm = "";
  loanReasonList: any[];
  loanReasonSearchTerm: any;
  FormFieldValidation = [];
  formField: FormField;
  repaymentDate: any;
  showRepaymentInputBox = false;
  durationLoader = false;
  showBuyOver = false;
  appOwnerDetails: any = {};
  validCustomerIdOnLoanOrigination = [
    "EMAIL_ADDRESS",
    "UNIQUE_ID_OR_EMAIL_ADDRESS",
    "UNIQUE_ID",
  ];
  requestLoader: boolean;
  branches = [];
  uniqueCustomerList: any;
  altRequiredBox = [];
  placeholder = "Type in unique id";
  currentPersonBvnValidated = false;
  today;
  supportingDocuments: any[] = [];
  supportingDocumentsView: any[] = [];
  customerBVNDetails: CustomerBVNDetails;
  haveInflightCollectionsRemita = false;
  haveOtherRepaymentMethods = false;
  showCreateLoanWithoutRemitaBtn = false;
  customerEmailAddress = "";
  feelines: any;
  feeModified = false;
  scheduleInformation: any;
  paystackInfo: PaystackInfo;
  remitaSetup: RemitaSetup;
  currencySymbol: string;
  profile: LoanProfile;
  showPopup = false;
  crmCustomer: CRMCustomerDetail;
  genders: CustomDropDown[] = [
    { id: "Male", text: "Male" },
    { id: "Female", text: "Female" },
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigurationService,
    private router: Router,
    private modalService: NgbModal,
    private colorThemeService: ColorThemeService,
    private store: Store<AppWideState>
  ) {
    this.formField = new FormField();
  }

  ngOnInit() {
    this.loadTheme();
    this.getCurrencySymbol();
    this.beginLoanApplicationProcess();
    this.getPaystackInfo();
    this.getRemitaSetup();
    this.listenForCrmCustomer();
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

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  beginLoanApplicationProcess() {
    this.accountShow = true;
    this.setMaxDob();
    this.getAppOwnerInfo();
    this.fetchBranches();
  }

  setMaxDob() {
    let today = new Date();
    let year = today.getFullYear() - 18;
    let month = today.getMonth() + 1;
    let date = today.getDate();
    this.today =
      year.toString() + "-" + month.toString() + "-" + date.toString();
  }

  private getPaystackInfo() {
    this.configService
      .getPaystackInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.paystackInfo = res.body.data;
      });
  }

  getAppOwnerInfo() {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.appOwnerDetails = res.body;
          this.appOwnerDetails["uniqueIdInformation"].forEach((ele) => {
            this.altRequiredBox.push(ele.itemName);
          });

          if (
            !this.validCustomerIdOnLoanOrigination.includes(
              this.appOwnerDetails["appOwnerLoanOriginationId"]
            )
          ) {
            this.appOwnerDetails["appOwnerLoanOriginationId"] =
              "UNIQUE_ID_OR_EMAIL_ADDRESS";
          }

          this.fetchUser();
          this.fetchBanks();
          this.initAlternativeCustomerForm();
          this.initUniqueIdForm();
        },
        (err) => {
          // this.toast.fire({
          //   type: 'warning',
          //   title: 'Error: ',
          //   text: err.error
          // });
        }
      );
  }

  fetchEmployers() {
    this.typeaheadLoading = true;
    this.employerList = [];
    this.configService
      .fetchAllEmployers({
        id: this.loanApplicationForm.get("EmploymentIndustry").value,
      })
      .subscribe(
        (res) => {
          this.typeaheadLoading = false;
          this.employerList = _.sortBy(res.body, "name");
        },
        (err) => {
          this.typeaheadLoading = false;
        }
      );
  }

  AddEmployerFormInit(content) {
    this.modalService.dismissAll();
    this.AddEmployerForm = new UntypedFormGroup({
      EmployerName: new UntypedFormControl("", [Validators.required]),
      EmployerAddress: new UntypedFormControl("", [Validators.required]),
      EmployerPayDate: new UntypedFormControl("", [Validators.required]),
      Status: new UntypedFormControl("NonActive", [Validators.required]),
      EmploymentIndustryId: new UntypedFormControl("", [Validators.required]),
    });

    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  submitEmployerForm(val: any) {
    if (this.AddEmployerForm.valid) {
      this.loader = true;
      this.configService.createEmployer(this.AddEmployerForm.value).subscribe(
        (res) => {
          val = {
            address: res.body.employerAddress,
            name: res.body.employerName,
            id: res.body.employerId,
            paydate: res.body.employerPayDate,
          };
          this.selectEmployer(val);
          this.loader = false;
          this.fetchEmployers();
          this.closeModal();
          this.toast.fire({
            type: "success",
            title: "Success: ",
            text: "Employer successfully added.",
          });
        },
        (err) => {
          this.loader = false;
          // this.toast.fire({
          //   type: 'warning',
          //   title: 'Error: ',
          //   text: err.error
          // });
        }
      );
    }
  }

  getFormField() {
    this.configService.spoolFormFieldsForValidation().subscribe(
      (res) => {
        this.FormFieldValidation = res.body;
        this.FormFieldValidation.forEach((key) => {
          this.formField[key.formFieldName] = key.required;
        });
      },
      (err) => {
        // Swal.fire('Error', 'Could not spool form field validation.', 'error');
      }
    );
  }

  loanApplicationFormInit() {
    this.loanApplicationForm = new UntypedFormGroup({
      PersonId: new UntypedFormControl("", [Validators.required]),
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      LoanTypeId: new UntypedFormControl("", [Validators.required]),
      LoanAmount: new UntypedFormControl("", [Validators.required]),
      LoanInterest: new UntypedFormControl("", []),
      LoanDuration: new UntypedFormControl({ value: "", disabled: true }, [
        Validators.required,
      ]),
      NetIncome: new UntypedFormControl("", [Validators.required]),
      Gender: new UntypedFormControl("", [this.isFormFieldRequired.bind(this)]),
      CustomerName: new UntypedFormControl("", [Validators.required]),
      FirstName: new UntypedFormControl("", [Validators.required]),
      LastName: new UntypedFormControl("", [Validators.required]),
      EmailAddress: new UntypedFormControl("", [
        Validators.required,
        Validators.email,
      ]),
      BVN: new UntypedFormControl("", [
        Validators.required,
        Validators.minLength(11),
        Validators.maxLength(11),
      ]),
      BvnDateOfBirth: new UntypedFormControl(""),
      EmploymentStatus: new UntypedFormControl("", [Validators.required]),
      EmploymentIndustry: new UntypedFormControl("", []),
      BankStatement: new UntypedFormControl(null, [
        this.isFormFieldRequired.bind(this),
      ]),
      DateOfEmployment: new UntypedFormControl("", []),
      GradeLevel: new UntypedFormControl("", []),
      EmployerPayDate: new UntypedFormControl("", []),
      EmployerAddress: new UntypedFormControl("", []),
      EmployerEmailAddress: new UntypedFormControl("", []),
      EmployerPhone: new UntypedFormControl("", []),
      EmployerName: new UntypedFormControl("", []),
      EmploymentCode: new UntypedFormControl("", []),
      EmployerId: new UntypedFormControl("", []),
      BankStatementIsPassworded: new UntypedFormControl(false),
      BankStatementPassword: new UntypedFormControl(null),
      bankStatementBankSortCode: new UntypedFormControl(null),
      BankSortCode: new UntypedFormControl("", [Validators.required]),
      SoldBy: new UntypedFormControl(this.authService.decodeToken().nameid, [
        this.isFormFieldRequired.bind(this),
      ]),
      BankList: new UntypedFormControl("", []),
      Loan: new UntypedFormControl("", [Validators.required]),
      BankName: new UntypedFormControl("", [Validators.required]),
      BankAccountName: new UntypedFormControl("", []),
      BankAccountNumber: new UntypedFormControl("", [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
      ]),
      ResidentialAddress: new UntypedFormControl("", [Validators.required]),
      UtilityBill: new UntypedFormControl("", [
        this.isFormFieldRequired.bind(this),
      ]),
      SupportingDocuments: new UntypedFormControl("", [
        this.isFormFieldRequired.bind(this),
      ]),
      AccountVerification: new UntypedFormControl("", []),
      RepaymentMethod: new UntypedFormControl("", [Validators.required]),
      Sec: new UntypedFormControl("", []),
      SecurityQuestion: new UntypedFormControl("", []),
      Ans: new UntypedFormControl("", []),
      SecurityAnswer: new UntypedFormControl("", []),
      CardPrime: new UntypedFormControl("", []),
      TransactionRef: new UntypedFormControl("", []),
      Status: new UntypedFormControl("", []),
      // new additions
      CustomerPhoneNumber: new UntypedFormControl("", [
        this.isFormFieldRequired.bind(this),
      ]),
      CustomerAltPhoneNumber: new UntypedFormControl("", [
        this.isFormFieldRequired.bind(this),
      ]),
      AdditionalComment: new UntypedFormControl("", []),
      NextOfKinName: new UntypedFormControl("", [
        this.isFormFieldRequired.bind(this),
        Validators.pattern("[a-zA-Z -#$_.,]*"),
      ]),
      NextOfKinPhoneNumber: new UntypedFormControl("", [
        this.isFormFieldRequired.bind(this),
      ]),
      NextOfKinAddress: new UntypedFormControl("", [
        this.isFormFieldRequired.bind(this),
      ]),
      LoanReason: new UntypedFormControl("", []),
      LoanReasonId: new UntypedFormControl("", [
        this.isFormFieldRequired.bind(this),
      ]),
      RepaymentStartDate: new UntypedFormControl("", []),
      // lending institution
      LendingInstitutionId: new UntypedFormControl("", []),
      BuyOverAmount: new UntypedFormControl(0, []),
      IsBuyOver: new UntypedFormControl(false, []),
      BranchId: new UntypedFormControl(this.user.branchId, [
        Validators.required,
      ]),
      IsBvnValidated: new UntypedFormControl(false, []),
      Fees: new UntypedFormControl(false, []),
      LoanStartDate: new UntypedFormControl(null),
      depositAmount: new FormControl(0),
      isLoanDepositRecieved: new FormControl(false),
    });

    this.loanApplicationForm
      .get("LoanAmount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((loanAmount) => {
        if (this.selectedLoanType?.loanDepositSettings?.depositValue) {
          this.prepopulateDepositAmount(
            this.selectedLoanType?.loanDepositSettings?.depositValue,
            loanAmount
          );
        }
      });

    this.feelines = [
      {
        FeeID: null,
        FeeName: null,
        FeeApplication: null,
        FeeType: null,
        FeeAmount: null,
        FeeIsMandatory: null,
      },
    ];

    this.loanApplicationForm
      .get("EmailAddress")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (value) => {
          this.customerEmailAddress = value;
        },
      });
    this._watchFormChanges();
    if (this.crmCustomer) {
      this.loanApplicationForm.get("BVN").setValue(this.crmCustomer?.bvn);
      this.loanApplicationForm
        .get("EmailAddress")
        .setValue(this.crmCustomer?.email);
      this.loanApplicationForm.get("Gender").setValue(this.crmCustomer?.gender);
      this.loanApplicationForm.get("Gender").disable();
      this.validateBVN();
    }
  }
  markAsRecieved(event) {
    this.loanApplicationForm.get("isLoanDepositRecieved").setValue(event);
  }

  private _watchFormChanges(): void {
    this.loanApplicationForm
      .get("BankStatementPassword")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res !== "") {
          this.loanApplicationForm
            .get("BankStatementIsPassworded")
            .setValue(true, { emitEvent: false });
        } else {
          this.loanApplicationForm
            .get("BankStatementIsPassworded")
            .setValue(false, { emitEvent: false });
        }
      });

    this.loanApplicationForm
      .get("bankStatementBankSortCode")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res) {
          this.loanApplicationForm
            .get("BankStatement")
            .setValidators(Validators.required);
          this.loanApplicationForm
            .get("BankStatement")
            .updateValueAndValidity();
        }
      });

    this.loanApplicationForm
      .get("BankStatement")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res && this.appOwnerDetails.decideInfo.isActive) {
          this.loanApplicationForm
            .get("bankStatementBankSortCode")
            .setValidators(Validators.required);
          this.loanApplicationForm
            .get("bankStatementBankSortCode")
            .updateValueAndValidity();
        }
      });
  }

  loanReasonCheck() {
    if (this.loanApplicationForm.get("LoanReasonId").invalid) {
      this.loanApplicationForm
        .get("LoanReason")
        .setValidators(Validators.required);
      this.loanApplicationForm.get("LoanReason").updateValueAndValidity();
    }
  }

  subCheck() {
    Object.keys(this.loanApplicationForm.controls).forEach((key) => {
      const controlErrors: ValidationErrors =
        this.loanApplicationForm.get(key).errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach((keyError) => {});
      }
    });
  }

  isFormFieldRequired(control: AbstractControl): ValidationErrors | null {
    if (control.parent) {
      const controlName = Object.keys(control.parent.controls).find(
        (key) => control.parent.controls[key] === control
      );
      if (
        this.formField.hasOwnProperty(controlName) &&
        this.formField[controlName] &&
        control.value === ""
      ) {
        return { required: true };
      }
      return null;
    }
    return null;
  }

  isBuyOverAmountGreaterThanLoanAmount(
    control: AbstractControl
  ): ValidationErrors | null {
    if (control.value > control.parent.get("LoanAmount").value) {
      return {
        BuyOverAmountGreaterThanLoanAmount:
          "Buy over amount must be less than or equal to Loan Amount.",
      };
    }
    if (control.value === 0) {
      return {
        BuyOverAmountGreaterThanLoanAmount:
          "Buy over amount must be less than or equal to the loan amount.",
      };
    }
    return null;
  }

  isBuyOver() {
    const val = this.loanApplicationForm.get("IsBuyOver").value;
    this.loanApplicationForm.controls["IsBuyOver"].setValue(val);

    if (val) {
      // tslint:disable-next-line:max-line-length
      this.loanApplicationForm.controls["BuyOverAmount"].setValidators([
        Validators.required,
        this.isBuyOverAmountGreaterThanLoanAmount.bind(this),
      ]);
      this.loanApplicationForm.controls["LendingInstitutionId"].setValidators([
        Validators.required,
      ]);
      this.loanApplicationForm.updateValueAndValidity();
    } else {
      this.loanApplicationForm.controls["BuyOverAmount"].clearValidators();
      this.loanApplicationForm.controls[
        "BuyOverAmount"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls[
        "LendingInstitutionId"
      ].clearValidators();
      this.loanApplicationForm.controls[
        "LendingInstitutionId"
      ].updateValueAndValidity();
      this.loanApplicationForm.updateValueAndValidity();
    }
  }

  searchEmployer(content) {
    this.employerList = [];
    this.employerSearchBool = true;
    this.employerSearchTerm =
      this.loanApplicationForm.get("EmployerName").value;
    this.configService
      .fetchEmployers(
        this.loanApplicationForm.get("EmploymentIndustry").value,
        this.loanApplicationForm.get("EmployerName").value
      )
      .subscribe((res) => {
        this.employerSearchBool = false;
        this.employerList = _.sortBy(res.body, "name");
        this.openModal(content);
      });
  }

  searchLoanReason(content) {
    this.loanReasonList = [];
    this.loanReasonSearch = true;
    this.loanReasonSearchTerm =
      this.loanApplicationForm.get("LoanReason").value;
    this.configService
      .fetchLoanReason({ term: this.loanReasonSearchTerm })
      .subscribe((res: any) => {
        this.loanReasonSearch = false;
        this.loanReasonList = _.sortBy(res.body, "loanReasonName");
        this.openModal(content);
      });
  }

  selectEmployer(val: any) {
    this.loanApplicationForm.controls["EmployerPayDate"].setValue(val.payDate);
    this.loanApplicationForm.controls[
      "EmployerPayDate"
    ].updateValueAndValidity();
    this.loanApplicationForm.controls["EmployerAddress"].setValue(val.address);
    this.loanApplicationForm.controls[
      "EmployerAddress"
    ].updateValueAndValidity();
    this.loanApplicationForm.controls["EmployerName"].setValue(val.name);
    this.loanApplicationForm.controls["EmployerName"].updateValueAndValidity();
    this.loanApplicationForm.controls["EmployerId"].setValue(val.id);
    this.loanApplicationForm.controls["EmployerId"].updateValueAndValidity();
    this.closeModal();
  }

  selectLoanReason(val: any) {
    this.loanApplicationForm.controls["LoanReason"].setValue(
      val.loanReasonName
    );
    this.loanApplicationForm.controls["LoanReason"].updateValueAndValidity();
    this.loanApplicationForm.controls["LoanReasonId"].setValue(
      val.loanReasonId
    );
    this.loanApplicationForm.controls["LoanReasonId"].updateValueAndValidity();
    this.closeModal();
  }

  switchValidity(val: any) {
    if (val === "EMPLOYED") {
      this.loanApplicationForm.controls["GradeLevel"].setValidators([
        this.isFormFieldRequired.bind(this),
      ]);
      this.loanApplicationForm.controls["GradeLevel"].updateValueAndValidity();
      this.loanApplicationForm.controls["EmployerPayDate"].setValidators([
        this.isFormFieldRequired.bind(this),
      ]);
      this.loanApplicationForm.controls[
        "EmployerPayDate"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["EmployerAddress"].setValidators([
        this.isFormFieldRequired.bind(this),
      ]);
      this.loanApplicationForm.controls[
        "EmployerAddress"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["EmployerEmailAddress"].setValidators([
        this.isFormFieldRequired.bind(this),
        Validators.email,
      ]);
      this.loanApplicationForm.controls[
        "EmployerEmailAddress"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["EmploymentCode"].setValidators([
        this.isFormFieldRequired.bind(this),
      ]);
      this.loanApplicationForm.controls[
        "EmploymentCode"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["EmployerPhone"].setValidators([
        this.isFormFieldRequired.bind(this),
      ]);
      this.loanApplicationForm.controls[
        "EmployerPhone"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["DateOfEmployment"].setValidators([
        this.isFormFieldRequired.bind(this),
      ]);
      this.loanApplicationForm.controls[
        "DateOfEmployment"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["EmployerName"].setValidators([
        Validators.required,
      ]);
      this.loanApplicationForm.controls[
        "EmployerName"
      ].updateValueAndValidity();
      this.loanApplicationForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
    } else {
      this.loanApplicationForm.controls["GradeLevel"].clearValidators();
      this.loanApplicationForm.controls["GradeLevel"].updateValueAndValidity();
      this.loanApplicationForm.controls["EmployerPayDate"].clearValidators();
      this.loanApplicationForm.controls[
        "EmployerPayDate"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["EmployerAddress"].clearValidators();
      this.loanApplicationForm.controls[
        "EmployerAddress"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls[
        "EmployerEmailAddress"
      ].clearValidators();
      this.loanApplicationForm.controls[
        "EmployerEmailAddress"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["EmploymentCode"].clearValidators();
      this.loanApplicationForm.controls[
        "EmploymentCode"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["EmployerPhone"].clearValidators();
      this.loanApplicationForm.controls[
        "EmployerPhone"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["DateOfEmployment"].clearValidators();
      this.loanApplicationForm.controls[
        "DateOfEmployment"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["EmployerName"].clearValidators();
      this.loanApplicationForm.controls[
        "EmployerName"
      ].updateValueAndValidity();
      this.loanApplicationForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
    }
  }

  fetchBanks() {
    this.configService
      .fetchBanks()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.bankList = res.body.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
  }

  onSelectRepaymentMethod() {
    this.loanApplicationForm.controls["CardPrime"].clearValidators();
    this.loanApplicationForm.controls["CardPrime"].updateValueAndValidity();
    this.loanApplicationForm.controls["TransactionRef"].clearValidators();
    this.loanApplicationForm.controls[
      "TransactionRef"
    ].updateValueAndValidity();
    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  validateAccount() {
    this.verifyloader = true;
    this.loanApplicationForm.controls["AccountVerification"].setValue(false, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
    const payload: VerifyBankAccount = {
      sortCode: this.loanApplicationForm.get("BankSortCode").value,
      accountNumber: this.loanApplicationForm.get("BankAccountNumber").value,
    };
    this.configService
      .validateBankAccount(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.bankInfo = res.body.data;
          this.verifyloader = false;
          this.loanApplicationForm.controls["AccountVerification"].setValue(
            true,
            { onlySelf: true, emitEvent: true }
          );
          this.loanApplicationForm.controls["BankAccountName"].setValue(
            res.body.data.accountName,
            { onlySelf: true, emitEvent: true }
          );
          this.loanApplicationForm.updateValueAndValidity({
            onlySelf: true,
            emitEvent: true,
          });
        },
        (err) => {
          this.verifyloader = false;
          // this.toast.fire({
          //   type: 'warning',
          //   title: 'Error: ',
          //   text: err.error
          // });
        }
      );
  }

  submitLoanApplicationForm(val: any) {
    const sec = [];
    const ans = [];
    sec.push({
      SecurityQuestion: this.loanApplicationForm.controls["Sec"].value,
    });
    ans.push({
      SecurityAnswer: this.loanApplicationForm.controls["Ans"].value,
    });

    this.onDateChange(this.dateOfBirth);
    this.onLoanDateChange(this.loanStartDate);
    if (!this.dateError) {
      this.loanApplicationForm.controls["BvnDateOfBirth"].setValue(
        this.getDate(this.dateOfBirth)
      );
    } else {
      this.loanApplicationForm.controls["BvnDateOfBirth"].setValue(null);
    }
    if (!this.loanDateError && this.loanStartDate) {
      this.loanApplicationForm.controls["LoanStartDate"].setValue(
        this.getDate(this.loanStartDate)
      );
    } else {
      this.loanApplicationForm.controls["LoanStartDate"].setValue(null);
    }
    this.loanApplicationForm.controls["SecurityQuestion"].setValue(
      JSON.stringify(sec),
      { onlySelf: true, emitEvent: true }
    );
    this.loanApplicationForm.controls["SecurityAnswer"].setValue(
      JSON.stringify(ans),
      { onlySelf: true, emitEvent: true }
    );

    this.loanApplicationForm.controls["Fees"].setValue(this.feelines, {
      onlySelf: true,
      emitEvent: true,
    });

    this.loanApplicationForm.controls["CustomerName"].enable({
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.controls["BVN"].enable({
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.controls["EmailAddress"].enable({
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.controls["Status"].setValue(this.selectedstatus);
    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });

    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });

    let payload = this.loanApplicationForm.value;
    payload["loanDeposit"] = {
      isLoanDepositRecieved: payload?.isLoanDepositRecieved,
      depositAmount: payload?.depositAmount,
    };

    if (payload?.depositAmount) {
      delete payload.depositAmount;
      delete payload.isLoanDepositRecieved;
    }

    if (this.profile?.newProfileImg) {
      payload["profileImage"] = this.profile?.newProfileImg;
    }

    payload = toFormData(payload, ["SupportingDocuments", "profileImage"]);

    if (this.loanApplicationForm.valid || true) {
      this.loader = true;
      this.configService.SubmitLoanApplication(payload).subscribe(
        (res) => {
          this.loader = false;
          this.loanApplicationFormInit();
          this.repaymentShow = false;
          this.accountShow = true;
          Swal.fire({ type: "success", text: "Loan successfully created." });
          this.router.navigate(["/loan/myapplications"]);
        },
        (err) => {
          this.loader = false;
        }
      );
    }
  }

  fileUploader(files: FileList, text: string) {
    if (!this.isFileSizeValid(files[0], 5)) {
      this.toast.fire({
        type: "error",
        title: "File size must not be more than 5MB!",
        timer: 4000,
      });
      this.loanApplicationForm.controls[text].patchValue(null, {
        onlySelf: true,
        emitEvent: true,
      });
      return;
    }
    if (
      text === "UtilityBill" &&
      !this.isImage(files[0]) &&
      files[0].type !== "application/pdf"
    ) {
      this.toast.fire({
        type: "error",
        title: "Must be an Image or PDF File!",
        timer: 4000,
      });
      this.loanApplicationForm.controls[text].patchValue(null, {
        onlySelf: true,
        emitEvent: true,
      });
      return;
    }
    if (text === "BankStatement" && files[0].type !== "application/pdf") {
      this.toast.fire({
        type: "error",
        title: "Must be a PDF File!",
        timer: 4000,
      });
      this.loanApplicationForm.controls[text].patchValue(null, {
        onlySelf: true,
        emitEvent: true,
      });
      return;
    }

    this.loanApplicationForm.controls[text].setValue(files[0], {
      onlySelf: true,
      emitEvent: true,
    });

    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  handleFileInput(filelist: FileList): void {
    for (let i = 0; i < filelist.length; i++) {
      if (!this.isFileSizeValid(filelist[i], 5)) {
        this.toast.fire({
          type: "error",
          title: "File size must not be more than 5MB",
          timer: 4000,
        });
        return;
      }
      if (
        !this.isImage(filelist[i]) &&
        filelist[i].type !== "application/pdf"
      ) {
        this.toast.fire({
          type: "error",
          title: "File must be an Image or PDF file.",
          timer: 4000,
        });
        return;
      }
      if (
        !this.supportingDocuments.find(
          (file) => file.name === filelist.item(i).name
        )
      ) {
        this.supportingDocuments.push(filelist.item(i));
        this.supportingDocumentsView = [
          ...this.supportingDocumentsView,
          filelist.item(i),
        ];
      }
    }

    this.loanApplicationForm
      .get("SupportingDocuments")
      .setValue(this.supportingDocuments);
  }

  removeFile(index: number): void {
    this.supportingDocumentsView.splice(index, 1);
    this.supportingDocuments.splice(index, 1);
  }

  getBankSelected(event, caller?: string) {
    if (caller === "bankStatement") {
      this.loanApplicationForm.controls["bankStatementBankSortCode"].setValue(
        event.target.value,
        {
          onlySelf: true,
          emitEvent: true,
        }
      );
    } else {
      const selectedOptions = event.target.options;
      const selectedIndex = selectedOptions.selectedIndex;
      const selectElementText = selectedOptions[selectedIndex].text;
      this.loanApplicationForm.controls["AccountVerification"].setValue(false, {
        onlySelf: true,
        emitEvent: true,
      });
      this.loanApplicationForm.controls[
        "AccountVerification"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["BankSortCode"].setValue(
        event.target.value,
        { onlySelf: true, emitEvent: true }
      );
      this.loanApplicationForm.controls[
        "BankSortCode"
      ].updateValueAndValidity();
      this.loanApplicationForm.controls["BankName"].setValue(
        selectElementText,
        {
          onlySelf: true,
          emitEvent: true,
        }
      );
      this.loanApplicationForm.controls["BankName"].updateValueAndValidity();
      this.loanApplicationForm.controls["BankAccountNumber"].setValue("", {
        onlySelf: true,
        emitEvent: true,
      });
      this.loanApplicationForm.controls[
        "BankAccountNumber"
      ].updateValueAndValidity();

      this.loanApplicationForm.updateValueAndValidity({
        onlySelf: true,
        emitEvent: true,
      });
    }
  }

  openModal(content, size = "lg") {
    this.modalService.open(content, {
      size,
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  openSmallModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  viewRepaymentSchedule(content) {
    let loanStartDate = this.loanApplicationForm.get("LoanStartDate").value;

    // if (loanStartDate && content !== '') this.repaymentDate = loanStartDate;
    this.repaymentLoader = true;
    this.repaymentScheduleArray = [];
    const Amount = this.loanApplicationForm.get("LoanAmount").value;
    const NetIncome = this.loanApplicationForm.get("NetIncome").value;
    const Duration = this.loanApplicationForm.get("LoanDuration").value;
    const LoanType = this.selectedLoanType.loanTypeId;
    const InterestRate = this.loanApplicationForm.get("LoanInterest").value;
    const RepaymentDate = this.repaymentDate;
    const UserPreferredFeeChanges = this.feelines;
    if (Amount > 0 && NetIncome && Duration && LoanType) {
      this.configService
        .getRepaymentSchedule({
          NetIncome,
          Amount,
          LoanType,
          Duration,
          RepaymentDate,
          InterestRate,
          loanStartDate,
          UserPreferredFeeChanges,
        })
        .subscribe(
          (res) => {
            this.repaymentLoader = false;
            this.loanApplicationForm.controls["RepaymentStartDate"].patchValue(
              this.repaymentDate
            );
            this.scheduleInformation = res.body;
            this.repaymentScheduleArray = res.body.repaymentSchedule;
            if (!this.modalService.hasOpenModals()) {
              this.openSmallModal(content);
            }
          },
          () => {
            this.repaymentLoader = false;
          }
        );
    }
  }

  setProfileDetails(imgUrl: string, name: string, dob: string) {
    this.profile = { imgUrl, name, dob };
  }

  validateBVN() {
    this.payDateList = [];
    this.reference = Math.floor(Math.random() * 10000000000 + 1);
    this.loader = true;
    this.configService
      .validateBVN({
        BVN: this.loanApplicationForm.get("BVN").value,
        EmailAddress: this.loanApplicationForm.get("EmailAddress").value,
        UserId: this.authService.decodeToken().nameid,
      })
      .subscribe(
        (res) => {
          const imgUrl =
            res.body.data.bvnImageUrl ||
            "assets/images/male-default-profile.png";
          const name = `${res.body.data.first_name} ${
            res.body.data?.middleName || ""
          } ${res.body.data.last_name}`;
          const dob = moment(res.body.data.dob).format("DD/MM/yyyy");
          this.setProfileDetails(imgUrl, name, dob);
          this.uniqueIdForm.setValue({
            parameter: this.loanApplicationForm.get("BVN").value,
            searchType: "General",
          });
          this.isDOBFromBVN = true;
          this.submitUniqueIdForm(true);
          this.loanApplicationForm.controls["CustomerPhoneNumber"].setValue(
            res.body?.data?.mobile
          );

          this.onDateChange(res.body?.data?.dob);
          if (!this.dateError) {
            this.dateOfBirth = this.getDate(res.body?.data?.dob);
            this.loanApplicationForm.controls["BvnDateOfBirth"].setValue({
              value: this.getDate(this.dateOfBirth),
            });
          } else {
            this.loanApplicationForm.controls["BvnDateOfBirth"].setValue(null);
          }
          this.loanApplicationForm.controls["PersonId"].setValue(0, {
            onlySelf: true,
            emitEvent: true,
          });

          let firstName = res.body?.data?.first_name;
          let lastName = res.body?.data?.last_name;
          this.showNoBVNWarning(res.body?.data?.bvn);
          this.setCustomerBVNDetails({
            firstName,
            lastName,
            bvn: res.body?.data?.bvn,
            dob: res.body?.data?.dob,
            mobile: res.body?.data?.mobile,
          });
          this.loanApplicationForm.controls["CustomerName"].disable({
            onlySelf: true,
            emitEvent: true,
          });
          this.loanApplicationForm.controls["CustomerName"].setValue(
            `${firstName} ${res.body?.data?.middleName || ""} ${lastName}`,
            { onlySelf: true, emitEvent: true }
          );

          this.loanApplicationForm.controls["FirstName"].patchValue(firstName, {
            onlySelf: true,
            emitEvent: true,
          });
          this.loanApplicationForm.controls["LastName"].patchValue(lastName, {
            onlySelf: true,
            emitEvent: true,
          });

          var isBvnValidated = true;
          this.loanApplicationForm.controls["IsBvnValidated"].setValue(
            isBvnValidated,
            { onlySelf: true, emitEvent: true }
          );

          if (isBvnValidated) {
            this.loanApplicationForm.controls["BVN"].disable({
              onlySelf: true,
              emitEvent: true,
            });
            this.loanApplicationForm.controls["EmailAddress"].disable({
              onlySelf: true,
              emitEvent: true,
            });
          }

          this.loanApplicationForm.updateValueAndValidity({
            onlySelf: true,
            emitEvent: true,
          });
          for (let index = 1; index <= 31; index++) {
            this.payDateList.push(index);
          }
          this.loader = false;
          this.toast.fire({
            type: "success",
            text: "BVN was Successfully Added!",
          });
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  previousStep(step: number) {
    if (step === 1) {
      this.accountShow = true;
      this.employmentShow = false;
    } else if (step === 2) {
      this.employmentShow = true;
      this.residenceShow = false;
    } else if (step === 3) {
      this.repaymentShow = false;
      this.residenceShow = true;
    }
  }

  nextStep(step: number) {
    if (Swal.isVisible()) {
      Swal.close();
    }
    if (step === 2) {
      const Amount = this.loanApplicationForm.get("LoanAmount").value;
      const NetIncome = this.loanApplicationForm.get("NetIncome").value;
      const Duration = this.loanApplicationForm.get("LoanDuration").value;
      const LoanType = this.selectedLoanType.loanTypeId;
      const maxAmount = this.selectedLoanType.maxAmount;
      const minAmount = this.selectedLoanType.minAmount;
      if (Amount > maxAmount || Amount < minAmount) {
        this.toast.fire({
          type: "warning",
          title: "Loan amount is out of the range of this loan.",
        });
      } else {
        this.loader = true;
        this.configService
          .checkAuthAmount({ NetIncome, Amount, LoanType, Duration })
          .subscribe(
            (res) => {
              this.loader = false;
              if (res.body.repaymentCalculate > res.body.repaymentNetIncome) {
                this.toast.fire({
                  type: "warning",
                  title:
                    "Your net income is too low for this loan type, consider changing the loan type or extending the loan tenor.",
                });
              } else {
                this.loanApplicationForm.controls["LoanTypeId"].setValue(
                  LoanType,
                  { onlySelf: true, emitEvent: true }
                );
                this.loanApplicationForm.updateValueAndValidity({
                  onlySelf: true,
                  emitEvent: true,
                });
                this.accountShow = false;
                this.employmentShow = true;
              }
            },
            (err) => {
              this.loader = false;

              // this.toast.fire({
              //   type: 'warning',
              //   title: 'Error: ',
              //   text: err.error
              // });
            }
          );
      }
    } else if (step === 3) {
      this.employmentShow = false;
      this.residenceShow = true;
    } else if (step === 4) {
      this.residenceShow = false;
      this.repaymentShow = true;
    }
  }

  statusCheck(response) {
    if (response === "1sy87") {
      this.selectedstatus = "Pool";
    } else if (response === "13km87") {
      this.selectedstatus = "Submitted";
    } else {
      // 17sehj
      this.selectedstatus = "Draft";
    }
  }

  fetchOriginalLoanSetup() {
    this.loanTypes = [];
    this.requestLoader = true;
    this.configService
      .fetchOriginalLoanSetup(
        this.authService.decodeToken().nameid,
        this.user.appOwnerKey
      )
      .subscribe((res) => {
        this.setUp = res.body;
        this.requestLoader = false;
      });
  }

  fetchLoanTypes() {
    this.loanTypes = [];
    this.configService
      .fetchLoanTypes(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.modifiedLoanTypes = res.body.map((loanType) => ({
          id: loanType.loanTypeId,
          text: loanType.loanName,
        }));
        this.loanTypes = res.body;
      });
  }

  verifyMultiLoanRequirements(selLoanType) {
    const personId = this.loanApplicationForm.get("PersonId").value;
    const payload = {
      InComingLoanTypeId: selLoanType.id,
      personId: this.loanApplicationForm.get("PersonId").value,
    };
    this.configService
      .verifyMultiLoanRequirements(toFormData(payload))
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.onSelectLoanType(selLoanType);
          if (
            this.selectedLoanType?.loanDepositSettings?.depositValue &&
            this.loanApplicationForm.value.LoanAmount
          ) {
            this.prepopulateDepositAmount(
              this.selectedLoanType?.loanDepositSettings?.depositValue,
              this.loanApplicationForm.value.LoanAmount
            );
          }
        },
        () => {
          this.loanApplicationForm.get("LoanTypeId").reset("");
          this.loanApplicationForm.get("Loan").reset(null);
        }
      );
  }

  prepopulateDepositAmount(depositValue: number, loanAmount: number) {
    if (this.selectedLoanType?.isDepositRequired) {
      if (this.selectedLoanType?.loanDepositSettings?.depositType === "Fixed") {
        this.loanApplicationForm.get("depositAmount").setValue(depositValue);
      }

      if (
        this.selectedLoanType?.loanDepositSettings?.depositType === "Percent" &&
        depositValue <= 100
      ) {
        const value = (depositValue / 100) * loanAmount;
        this.loanApplicationForm.get("depositAmount").setValue(value);
      }
    } else {
      this.loanApplicationForm.get("depositAmount").reset(null);
    }
  }

  onSelectLoanType(event: CustomDropDown) {
    const loanType = this.loanTypes.find(
      (loanType) => loanType.loanTypeId === event.id
    );
    this.selectedLoanTypeId = event.id as number;
    const depositSettings =
      loanType?.loanDepositSettings &&
      JSON.parse(loanType?.loanDepositSettings as unknown as string);
    this.selectedLoanType = {
      ...loanType,
      loanDepositSettings: {
        depositType: depositSettings?.DepositType,
        depositValue: depositSettings?.DepositValue,
      },
    };
    this.showBuyOver = this.selectedLoanType.buyOverEligibility;
    this.repaymentMethods = JSON.parse(this.selectedLoanType.repaymentMethods);
    this.feelines = JSON.parse(this.selectedLoanType.applicableFees);
    this.feeModified = false;
    const inflightCollectionsRemita = this.repaymentMethods.find(
      (method) => method === LoanRepaymentMethodEnum.InflightCollectionsRemita
    );

    if (inflightCollectionsRemita) {
      this.haveInflightCollectionsRemita = true;
      this.haveOtherRepaymentMethods = this.repaymentMethods.length > 1;

      if (!this.customerBVNDetails?.bvn) {
        Swal.fire({
          type: "warning",
          title: "Warning",
          text: "BVN is required for creating a loan with Inflight Collections - Remita. The selected customer has no BVN.",
          confirmButtonText: "Okay",
          confirmButtonColor: "#558E90",
        });
      }
    } else {
      this.haveInflightCollectionsRemita = false;
    }

    this.showCreateLoanWithoutRemitaBtn =
      (this.haveInflightCollectionsRemita && this.haveOtherRepaymentMethods) ||
      !this.haveInflightCollectionsRemita;

    if (inflightCollectionsRemita) {
      this.repaymentMethods = this.repaymentMethods.filter(
        (method) => method !== LoanRepaymentMethodEnum.InflightCollectionsRemita
      );
    }

    if (this.loanApplicationForm.get("LoanAmount").value !== "") {
      this.getLoanDurationParameters({
        LoanAmount: this.loanApplicationForm.get("LoanAmount").value,
        LoanTypeId: this.selectedLoanType.loanTypeId,
        LoanInterestRate: this.loanApplicationForm.get("LoanInterest").value,
      });
    } else {
      this.loanApplicationForm.controls["LoanDuration"].setValue("");
      this.loanApplicationForm.updateValueAndValidity();
    }
  }

  onDeselectLoanType() {
    this.selectedLoanType = null;
  }

  checkIfLoanTypeSelected($event) {
    if (
      this.selectedLoanType != null &&
      this.loanApplicationForm.get("LoanAmount").value
    ) {
      this.getLoanDurationParameters({
        LoanAmount: this.loanApplicationForm.get("LoanAmount").value,
        LoanTypeId: this.selectedLoanType.loanTypeId,
        LoanInterestRate: this.loanApplicationForm.get("LoanInterest").value,
      });
    } else {
      this.loanApplicationForm.controls["LoanDuration"].setValue("");
      this.loanApplicationForm.controls["LoanDuration"].disable();
      this.loanApplicationForm.updateValueAndValidity();
    }
  }

  getRemitaSetup() {
    this.configService
      .getRemitaInfo(RemitaIntegrationNameEnum.InflightCollectionsRemita)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.remitaSetup = res.body.data;
        },
      });
  }

  onContinueWithRemita() {
    if (!this.remitaSetup.isActive) {
      Swal.fire({
        type: "warning",
        title: "Warning",
        text: `Remita (${RemitaIntegrationNameEnum.InflightCollectionsRemita}) is not active.`,
        confirmButtonText: "Okay",
        confirmButtonColor: "#558E90",
      });
      return;
    }

    this.modalService.open(this.createLoanWithRemita, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  getLoanDurationParameters(data) {
    this.durationLoader = true;
    this.tenorList = [];
    this.configService
      .getLoanTypeParametersByLoanAmountAndLoanTypeId(data)
      .subscribe(
        (res) => {
          // blur
          this.durationLoader = false;
          for (let index = 1; index <= res.body.tenorAllowable; index++) {
            this.tenorList.push(index);
          }
          this.loanApplicationForm.controls["LoanDuration"].enable();
          this.loanApplicationForm.updateValueAndValidity();
        },
        (err) => {
          // this.loanApplicationForm.controls['LoanDuration'].disable();
          this.loanApplicationForm.updateValueAndValidity();
          this.durationLoader = false;

          // Swal.fire('Error', err.error, 'error');

          // blur
          // document.getElementById('LoanDuration').blur();
        }
      );
  }

  paymentDone(ev) {
    this.loanApplicationForm.controls["CardPrime"].setValue(true, {
      onlySelf: true,
      emitEvent: true,
    });
    // this.loanApplicationForm.controls['CardPrime']'].updateValueAndValidity();
    this.loanApplicationForm.controls["TransactionRef"].setValue(ev.reference, {
      onlySelf: true,
      emitEvent: true,
    });
    // this.loanApplicationForm.controls['TransactionRef']'].updateValueAndValidity();
    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  fetchUserInBranch() {
    this.userListForSelect = [];
    this.userService
      .FetchAllUsersInBranch(this.authService.decodeToken().nameid)
      .subscribe((res) => {
        this.userList = res.body;
        this.userList.forEach((user) => {
          this.userListForSelect.push({
            id: user.userId,
            text: user.displayName,
          });
        });

        const soldById = this.authService.decodeToken().nameid;
        let selectedUser = this.userListForSelect.find((x) => x.id == soldById);
        if (selectedUser != null) {
          this.selectedSoldByArray = [selectedUser];
        }
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
      });
  }

  fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.user = res.body;
          // if (!this.user.permission?.includes('Create Loan Application')) {
          //   this.router.navigate(['/']);
          // }
          this.getFormField();
          this.fetchOriginalLoanSetup();
          this.fetchLoanTypes();
          this.fetchUserInBranch();
          this.loanApplicationFormInit();
        },
        (err) => {}
      );
  }

  fetchBranches() {
    this.configService
      .spoolAccessibleBranches({
        UserId: this.authService.decodeToken().nameid,
      })
      .subscribe(
        (res) => {
          this.branches = res.body;
        },
        (err) => {}
      );
  }

  getStatesAsObservable(token: string): Observable<any> {
    const query = new RegExp(token, "i");
    return of(
      this.statesComplex.filter((state: any) => {
        return query.test(state.name);
      })
    );
  }

  changeTypeaheadLoading(e: boolean): void {
    this.typeaheadLoading = e;
  }

  typeaheadOnSelect(e: any): void {
    this.loanApplicationForm.controls["EmployerName"].setValue(e.text, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.controls["EmployerId"].setValue(e.id.employerId, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.controls["EmployerAddress"].setValue(
      e.id.employerAddress,
      { onlySelf: true, emitEvent: true }
    );
    this.loanApplicationForm.controls["EmployerPayDate"].setValue(
      e.id.employerPayDate,
      { onlySelf: true, emitEvent: true }
    );
    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  initUniqueIdForm() {
    this.uniqueIdForm = new UntypedFormGroup({
      parameter: new UntypedFormControl("", [Validators.required]),
      searchType: new UntypedFormControl("UniqueId", [
        Validators.required,
        this.checkSearchType.bind(this),
      ]),
    });
  }

  checkSearchType(control: AbstractControl): ValidationErrors | null {
    if (this.uniqueIdForm && control) {
      if (control.value == "UniqueId") {
        this.placeholder = "Type in unique id";
        this.uniqueIdForm.controls["parameter"].setValue("");
        this.uniqueIdForm.controls["parameter"].clearValidators();
        this.uniqueIdForm.controls["parameter"].setValidators([
          Validators.required,
          Validators.minLength(11),
          Validators.maxLength(11),
        ]);
      }
      if (control.value == "Email") {
        this.placeholder = "Type in email address";
        this.uniqueIdForm.controls["parameter"].setValue("");
        this.uniqueIdForm.controls["parameter"].clearValidators();
        this.uniqueIdForm.controls["parameter"].setValidators([
          Validators.required,
          Validators.email,
        ]);
      }
      if (control.value == "Phone") {
        this.placeholder = "Type in phone number";
        this.uniqueIdForm.controls["parameter"].setValue("");
        this.uniqueIdForm.controls["parameter"].clearValidators();
        this.uniqueIdForm.controls["parameter"].setValidators([
          Validators.required,
          Validators.pattern("[0-9]*"),
          Validators.minLength(5),
        ]);
      }
    }
    return null;
  }

  submitUniqueIdForm(viaBVN?: boolean) {
    this.searchLoader = true;
    this.uniqueCustomerList = null;
    this.userService
      .customerSearchByUniqueId(this.uniqueIdForm.value)
      .subscribe(
        (res) => {
          this.uniqueCustomerList = res.body;
          this.searchLoader = false;

          if (viaBVN && this.uniqueCustomerList.item2.length > 0) {
            this.loanApplicationForm.controls["PersonId"].setValue(
              this.uniqueCustomerList.item2[0]?.personId,
              {
                onlySelf: true,
                emitEvent: true,
              }
            );
          }
        },
        (err) => {
          this.searchLoader = false;
        }
      );
  }

  initAlternativeCustomerForm() {
    this.AlternativeCustomerForm = new UntypedFormGroup({
      FirstName: new UntypedFormControl("", [Validators.required]),
      LastName: new UntypedFormControl("", [Validators.required]),
      EmailAddress: new UntypedFormControl(
        "",
        this.altRequiredBox.includes("Email")
          ? [Validators.required, Validators.email]
          : [Validators.email]
      ),
      PhoneNumber: new UntypedFormControl(
        "",
        this.altRequiredBox.includes("Phone")
          ? [
              Validators.required,
              Validators.minLength(11),
              Validators.maxLength(11),
            ]
          : []
      ),
      DateOfBirth: new UntypedFormControl("", [Validators.required]),
      Bvn: new UntypedFormControl(
        "",
        this.altRequiredBox.includes("UniqueId")
          ? [
              Validators.required,
              Validators.minLength(11),
              Validators.maxLength(11),
            ]
          : [Validators.minLength(11), Validators.maxLength(11)]
      ),
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
    });

    this.AlternativeCustomerForm.get("EmailAddress")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (value) => {
          this.customerEmailAddress = value;
        },
      });
  }

  openModalCustomer(content) {
    this.closeModal();
    this.setVariables();
    this.openModal(content);
  }

  setVariables() {
    var value = this.uniqueIdForm.controls["parameter"].value;
    var searchType = this.uniqueIdForm.controls["searchType"].value;

    if (searchType == "UniqueId") {
      this.AlternativeCustomerForm.controls["Bvn"].setValue(value, {
        onlySelf: true,
        emitEvent: true,
      });
    } else if (searchType == "Email") {
      this.AlternativeCustomerForm.controls["EmailAddress"].setValue(value, {
        onlySelf: true,
        emitEvent: true,
      });
    } else if (searchType == "Phone") {
      this.AlternativeCustomerForm.controls["PhoneNumber"].setValue(value, {
        onlySelf: true,
        emitEvent: true,
      });
    }
  }

  clearDateOfBirth() {
    this.isDOBFromBVN = false;
    this.dateOfBirth = "";
    this.loanApplicationForm.controls["BvnDateOfBirth"].setValue("", {
      onlySelf: true,
      emitEvent: true,
    });
  }

  selectCustomer(item: any) {
    this.showNoBVNWarning(item);
    this.setCustomerBVNDetails({
      firstName: item?.firstName,
      lastName: item?.lastName,
      dob: this.getDate(item?.dateOfBirth) as string,
      bvn: item?.bvn,
      mobile: item?.phoneNumber,
    });

    this.clearDateOfBirth();
    const type = this.uniqueIdForm.get("searchType").value;
    this.loanApplicationForm.controls["PersonId"].setValue(item.personId, {
      onlySelf: true,
      emitEvent: true,
    });

    this.loanApplicationForm.controls["CustomerName"].disable({
      onlySelf: true,
      emitEvent: true,
    });

    this.loanApplicationForm.controls["CustomerName"].setValue(
      item.firstName + " " + item.lastName,
      { onlySelf: true, emitEvent: true }
    );

    this.loanApplicationForm.controls["FirstName"].setValue(item.firstName, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.controls["LastName"].setValue(item.lastName, {
      onlySelf: true,
      emitEvent: true,
    });

    this.loanApplicationForm.controls["IsBvnValidated"].setValue(
      item.isBvnValidated,
      { onlySelf: true, emitEvent: true }
    );

    this.loanApplicationForm.controls["BVN"].setValue(item.bvn, {
      onlySelf: true,
      emitEvent: true,
    });

    if (item.isBvnValidated) {
      this.loanApplicationForm.controls["FirstName"].disable({
        onlySelf: true,
        emitEvent: true,
      });
      this.loanApplicationForm.controls["LastName"].disable({
        onlySelf: true,
        emitEvent: true,
      });
      this.loanApplicationForm.controls["BVN"].disable({
        onlySelf: true,
        emitEvent: true,
      });
      //  this.loanApplicationForm.controls['EmailAddress'].disable({onlySelf: true, emitEvent: true});
    }

    if (item.bvn !== "") {
      this.loanApplicationForm.controls["BVN"].clearValidators();
      this.loanApplicationForm.controls["BVN"].updateValueAndValidity();
    } else {
      this.loanApplicationForm.controls["BVN"].disable({
        onlySelf: true,
        emitEvent: true,
      });
    }

    this.loanApplicationForm.controls["EmailAddress"].setValue(
      item.emailAddress,
      { onlySelf: true, emitEvent: true }
    );

    this.loanApplicationForm.controls["CustomerPhoneNumber"].setValue(
      item.phoneNumber,
      { onlySelf: true, emitEvent: true }
    );
    // this.loanApplicationForm.controls['PhoneNumber'].disable({onlySelf: true, emitEvent: true});

    this.onDateChange(item.dateOfBirth);
    if (!this.dateError) {
      this.dateOfBirth = item.dateOfBirth;
      this.loanApplicationForm.controls["BvnDateOfBirth"].setValue(
        this.getDate(this.dateOfBirth),
        { onlySelf: true, emitEvent: true }
      );
    }

    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
    for (let index = 1; index <= 31; index++) {
      this.payDateList.push(index);
    }
    this.closeModal();
  }

  showNoBVNWarning(bvn: string) {
    if (!bvn) {
      Swal.fire({
        type: "warning",
        title: "Warning",
        text: "The selected customer has no BVN.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#558E90",
      });
    }
  }

  setCustomerBVNDetails(details: CustomerBVNDetails) {
    this.customerBVNDetails = details;
  }

  setCustomerImage(img: string) {
    this.profile.newProfileImg = img;
  }

  saveAlternativeCustomerForm(data) {
    if (this.AlternativeCustomerForm.valid) {
      this.loader = true;
      this.userService
        .altCustomerCreation(this.AlternativeCustomerForm.value)
        .subscribe(
          (res) => {
            this.loader = false;
            this.clearDateOfBirth();
            this.loanApplicationForm.controls["PersonId"].setValue(
              res.body.personId,
              { onlySelf: true, emitEvent: true }
            );
            this.loanApplicationForm.controls["CustomerName"].disable({
              onlySelf: true,
              emitEvent: true,
            });
            this.loanApplicationForm.controls["CustomerName"].setValue(
              res.body.displayName,
              { onlySelf: true, emitEvent: true }
            );

            this.loanApplicationForm.controls["FirstName"].setValue(
              res.body.firstName,
              { onlySelf: true, emitEvent: true }
            );
            this.loanApplicationForm.controls["LastName"].setValue(
              res.body.lastName,
              { onlySelf: true, emitEvent: true }
            );

            if (res.body.bvn) {
              this.loanApplicationForm.controls["BVN"].setValue(res.body.bvn, {
                onlySelf: true,
                emitEvent: true,
              });
              this.loanApplicationForm.controls["BVN"].disable({
                onlySelf: true,
                emitEvent: true,
              });
            } else {
              this.loanApplicationForm.controls["BVN"].setValue("", {
                onlySelf: true,
                emitEvent: true,
              });
              this.loanApplicationForm.controls["BVN"].disable({
                onlySelf: true,
                emitEvent: true,
              });
              this.loanApplicationForm.controls["BVN"].clearValidators();
              this.loanApplicationForm.controls["BVN"].updateValueAndValidity();
            }

            this.loanApplicationForm.controls["EmailAddress"].setValue(
              res.body.emailAddress,
              { onlySelf: true, emitEvent: true }
            );
            //   this.loanApplicationForm.controls['EmailAddress'].disable({onlySelf: true, emitEvent: true});

            this.loanApplicationForm.controls["CustomerPhoneNumber"].setValue(
              res.body.phoneNumber,
              { onlySelf: true, emitEvent: true }
            );

            this.onDateChange(res.body.dateOfBirth);
            if (!this.dateError) {
              this.dateOfBirth = res.body.dateOfBirth;
              this.loanApplicationForm.controls["BvnDateOfBirth"].setValue(
                this.getDate(this.dateOfBirth),
                { onlySelf: true, emitEvent: true }
              );
            }

            this.loanApplicationForm.updateValueAndValidity({
              onlySelf: true,
              emitEvent: true,
            });
            for (let index = 1; index <= 31; index++) {
              this.payDateList.push(index);
            }

            this.showNoBVNWarning(res.body?.bvn);
            this.setCustomerBVNDetails({
              firstName: res.body?.firstName,
              lastName: res.body?.lastName,
              bvn: res.body?.bvn,
              dob: res.body?.dateOfBirth,
              mobile: res.body?.phoneNumber,
            });

            this.setProfileDetails(
              "assets/images/male-default-profile.png",
              `${res.body?.firstName} ${res.body?.lastName}`,
              res.body?.dateOfBirth
            );
            this.closeModal();
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  customRepaymentDate() {
    this.viewRepaymentSchedule("");
  }

  toggleRepaymentStartDate() {
    this.showRepaymentInputBox = !this.showRepaymentInputBox;
  }

  onLoanDateChange(datestr) {
    let date = this.getDate(datestr);
    this.loanDateError = date == false;
  }

  onDateChange(datestr) {
    if (this.isGreaterThanToday(datestr)) {
      this.dateError = true;
      Swal.fire({
        title: "Change birthday",
        text: "Birthday cannot be in future",
        type: "info",
      });

      return;
    }
    let date = this.getDate(datestr);
    this.dateError = date == false;
  }

  protected isGreaterThanToday(value: any): boolean {
    const dateVal = moment(value);
    const today = moment();
    const difference = dateVal.diff(today);
    if (difference >= 0) {
      return true;
    } else {
      return false;
    }
  }

  selectedSoldBy(ev) {
    this.loanApplicationForm.controls["SoldBy"].setValue(ev.id, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  removedSoldBy(ev) {
    this.loanApplicationForm.controls["SoldBy"].setValue(null, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  getDate(s) {
    if (!s) {
      return false;
    }
    try {
      let d = new Date(s);
      const yyyy = `${d.getFullYear()}`;
      const mm = `0${d.getMonth() + 1}`.slice(-2);
      const dd = `0${d.getDate()}`.slice(-2);
      return `${yyyy}-${mm}-${dd}`;
    } catch (error) {
      return false;
    }
  }

  isImage(file: File): boolean {
    return Object.values(ImageType).includes(file.type as ImageType);
  }

  isFileSizeValid(file: File, maxSizeInMb: number): boolean {
    const maxSizeInBytes = maxSizeInMb * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  removeFeeRow(i) {
    this.feelines.splice(i, 1);
    this.feeModified = true;
  }

  private listenForCrmCustomer() {
    this.store
      .select(selectCrmCustomerFeature)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((crmCustomer) => {
        this.crmCustomer = crmCustomer;
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
