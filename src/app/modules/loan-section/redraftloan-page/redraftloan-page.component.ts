import { Component, OnInit } from "@angular/core";
import {
  ActivatedRoute,
  ParamMap,
  Router,
  NavigationEnd,
} from "@angular/router";
import { AuthService } from "../../../service/auth.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { LoanoperationsService } from "../../../service/loanoperations.service";
import { UserService } from "../../../service/user.service";
import { mergeMap, filter, takeUntil, pluck } from "rxjs/operators";
import { Observable, of } from "rxjs";
import Swal from "sweetalert2";
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormControl,
} from "@angular/forms";
import { TypeaheadMatch } from "ngx-bootstrap";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";
import _ from "underscore";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { FormField } from "src/app/model/FormField";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Subject } from "rxjs";
import { toFormData } from "src/app/util/finance/financeHelper";
import { AppOwnerInformation } from "../../shared/shared.types";
import { VerifyBankAccount } from "../../configuration/models/configuration";
import { LoanProfile } from "../loan.types";
@Component({
  selector: "app-redraftloan-page",
  templateUrl: "./redraftloan-page.component.html",
  styleUrls: ["./redraftloan-page.component.scss"],
})
export class RedraftloanPageComponent implements OnInit {
  loanId = null;
  user: any;
  dateOfBirth: any = null;
  dateError: boolean = true;
  loanStartDate: any = null;
  loanDateError: boolean = true;
  // asyncSelected: string;
  typeaheadLoading: boolean;
  typeaheadNoResults: boolean;
  dataSource: Observable<any>;
  statesComplex: any[] = [];
  loanTypes: any[] = [];
  LoanTypeSelected: any;
  loanApplicationForm: UntypedFormGroup;
  accountShow = false;
  employmentShow = false;
  residenceShow = false;
  repaymentShow = false;
  loader = false;
  verifyloader = false;
  setUp: any;
  ownerInformation: any;
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
  repaymentMethods: any;
  reference: number;
  skipSecurity = false;
  loanSelected: any[] = [];
  loanInfo: any;
  // root = 'https://lenda-bucket.s3.eu-west-2.amazonaws.com/lendadevenv/';
  public repaymentScheduleArray: any[] = [];
  repaymentLoader = false;
  userList: any[];
  userListForSelect: any[] = [];
  selectedSoldByArray: any[] = [];
  AddEmployerForm: UntypedFormGroup;
  employerList: any[];
  activeList: any[];
  selectedstatus: any;
  selectedchangestatus: any;
  employerSearchBool = false;
  currentloanstatus: any;
  employerSearchTerm = "";
  requestLoader: boolean;
  loanactivities: any;
  redrafttype: any;
  changeInitiatorID = null;
  changeReviwerID = null;
  loanhistoryinformation: any;
  newloaninformation: any;
  loanhistoryperson: any;
  currencySymbol: string;

  repaymentDate: any;
  showRepaymentInputBox = false;
  durationLoader = false;
  topUpLoanAmount: any;
  topUpTenor: any;
  topUpNetIncome: any;
  showBuyOver = false;
  FormFieldValidation = [];
  formField: FormField;
  usableLoanTypeId: any;
  topUploanTypeId: any;
  branches = [];
  loanTypeInfo = {
    loanTypeName: "nil",
    tenor: "nil",
  };

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  supportingDocuments: any[] = [];
  supportingDocumentsView: any[] = [];
  ExistingSupportingDocuments: number[] = [];
  feelines: any;
  feeModified = false;
  scheduleInformation: any;
  fromTopupCreation: boolean;
  appOwnerDetails: AppOwnerInformation;
  profile: LoanProfile;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigurationService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private loanoperationService: LoanoperationsService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private colorThemeService: ColorThemeService
  ) {
    this.formField = new FormField();
  }

  ngOnInit() {
    this.getCurrencySymbol();
    this.loanoperationService.fromTopupCreation$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.fromTopupCreation = res;
      });
    this.loadTheme();
    this.getAppowner();

    this.redrafttype = "loanapplication";

    this.route.paramMap
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((params: ParamMap) => {
        this.loanId = params.get("loanid");
        this.topUploanTypeId = params.get("loantypeid");
        this.redrafttype =
          params.get("redrafttype") != null && params.get("redrafttype") != ""
            ? params.get("redrafttype")
            : this.redrafttype;

        this.topUpLoanAmount = params.get("loanamount");
        this.topUpTenor = params.get("tenor");
        this.topUpNetIncome = params.get("netincome");

        this.fetchLoanInfo(this.loanId);
      });
    this.accountShow = true;
    this.fetchBanks();
    this.fetchUser();
    this.fetchBranches();
    this.getLoanFiles();
    for (let index = 1; index <= 31; index++) {
      this.payDateList.push(index);
    }
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

  private getAppowner() {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.appOwnerDetails = res.body;
      });
  }

  private getLoanFiles(): void {
    this.loanoperationService
      .getLoanFiles(this.loanId)
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe((files) => {
        this.supportingDocumentsView = files;
        this.ExistingSupportingDocuments = files.map((file) => file.fileId);
      });
  }

  removeFile(fileId: number): void {
    const fileIndex = this.supportingDocumentsView.findIndex(
      (file) => file.fileId === fileId
    );

    if (fileIndex !== -1) {
      this.supportingDocumentsView.splice(fileIndex, 1);
      this.ExistingSupportingDocuments.splice(fileIndex, 1);
    }

    this.loanApplicationForm
      .get("ExistingSupportingDocuments")
      .setValue(this.ExistingSupportingDocuments);
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  fetchEmployers(id) {
    this.typeaheadLoading = true;
    this.employerList = [];
    this.configService
      .fetchAllEmployers({ id })
      .pipe(takeUntil(this.unsubscriber$))
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

  goBack() {
    if (
      this.redrafttype === "loanapplication" ||
      this.redrafttype === "topup"
    ) {
      this.router.navigateByUrl("loan/applications");
    } else if (this.redrafttype === "loan") {
      this.router.navigateByUrl("/loan/loans");
    }
  }

  AddEmployerFormInit(content) {
    this.AddEmployerForm = new UntypedFormGroup({
      EmployerName: new UntypedFormControl("", [Validators.required]),
      EmployerAddress: new UntypedFormControl("", [Validators.required]),
      EmployerPayDate: new UntypedFormControl("", [Validators.required]),
      Status: new UntypedFormControl("not-active", [Validators.required]),
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
      this.configService
        .createEmployer(this.AddEmployerForm.value)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            val = {
              address: res.employerAddress,
              name: res.employerName,
              id: res.employerId,
              paydate: res.employerPayDate,
              industry: res.employmentIndustryId,
            };
            this.selectEmployer(val);
            this.loader = false;
            // this.fetchEmployers(this.loanApplicationForm.get('EmploymentIndustry').value);
            this.closeModal();
            this.toast.fire({
              type: "success",
              title: "Success: ",
              text: "Employer successfully added.",
            });
          },
          (err) => {
            this.loader = false;
            // Swal.fire('Error', err.error, 'error');
          }
        );
    }
  }

  fetchUserInBranch() {
    this.userListForSelect = [];
    this.userService
      .FetchAllUsersInBranch(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.userList = res.body;
        this.userList.forEach((user) => {
          this.userListForSelect.push({
            id: user.userId,
            text: user.displayName,
          });
        });
      });
  }

  fetchLoanInfo(loanId) {
    this.requestLoader = true;
    this.configService
      .fetchLoanForRedraft(loanId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.loanInfo = res.body;
          if (this.loanInfo?.loanDeposit) {
            this.loanInfo.loanDeposit = JSON.parse(this.loanInfo?.loanDeposit);
          }

          if (!this.fromTopupCreation) {
            this.loanStartDate = this.getDate(
              this.loanInfo?.loan?.loanStartDate
            );
            this.onLoanDateChange(this.loanStartDate);
          }
          if (this.loanInfo?.soldBy && this.loanInfo?.salesPerson?.person) {
            this.selectedSoldByArray = [
              {
                id: this.loanInfo?.soldBy,
                text: this.loanInfo?.salesPerson?.person?.displayName,
              },
            ];
          } else {
            this.selectedSoldByArray = [
              { id: this.user?.userId, text: this.user?.person?.displayName },
            ];
          }
          this.fetchEmployers(res.body?.employmentIndustryId);
          this.getFormField();
          this.fetchOriginalLoanSetup();
          this.profile = {
            imgUrl: this.loanInfo?.loan?.customerImageUrl,
            name: `${this.loanInfo?.bvnFirstName} ${this.loanInfo?.bvnLastName}`,
            dob: this.loanInfo?.bvnDateOfBirth,
          };
        },
        () => {
          this.requestLoader = false;
        }
      );
  }

  getFormField() {
    this.configService
      .spoolFormFieldsForValidation()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.FormFieldValidation = res.body;
        this.FormFieldValidation.forEach((key) => {
          this.formField[key.formFieldName] = key.required;
        });
        this.fetchLoanSetup();
      });
  }

  loanApplicationFormInit(data) {
    let depositAmount = data?.loanDeposit?.DepositAmount;
    if (data?.loanDeposit?.DepositType === "Percent") {
      depositAmount = (
        (data?.loanDeposit?.DepositAmount / 100) *
        data?.loanAmount
      ).toFixed(2);
    }

    this.dateOfBirth = data?.bvnDateOfBirth;
    this.onDateChange(this.dateOfBirth);
    this.feelines = [];

    this.activeList = [
      {
        id: {
          employerId: data.employerId,
          employerName: data.employerName,
          employerPayDate: data.employerPayDate,
          employerAddress: data.employerAddress,
          employmentIndustryId: data.employmentIndustryId,
        },
        text: data.employerName,
      },
    ];

    var buyOverHasValue = data.lendingInstitutionId !== undefined;
    const isBuyOver =
      buyOverHasValue &&
      data.lendingInstitutionId !== null &&
      this.redrafttype !== "topup"
        ? true
        : false;
    this.showBuyOver =
      buyOverHasValue &&
      data.lendingInstitutionId !== null &&
      data.buyOverAmount !== null
        ? true
        : false;

    // tslint:disable-next-line:max-line-length
    const buyOverAmountValidationCheck =
      buyOverHasValue && data.lendingInstitutionId !== null && isBuyOver
        ? [
            Validators.required,
            this.isBuyOverAmountGreaterThanLoanAmount.bind(this),
          ]
        : [];
    const lendingInstitutionIdValidationCheck =
      buyOverHasValue && data.lendingInstitutionId !== null
        ? [Validators.required]
        : [];
    this.loanApplicationForm = new UntypedFormGroup({
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      LoanId: new UntypedFormControl(data.loanId, [Validators.required]),
      LoanTypeId: new UntypedFormControl(data.loanTypeId, [
        Validators.required,
      ]),
      LoanAmount: new UntypedFormControl(
        this.topUpLoanAmount != null && this.topUpLoanAmount != ""
          ? this.topUpLoanAmount
          : data.loanAmount,
        [Validators.required]
      ),
      depositAmount: new FormControl(depositAmount),
      isLoanDepositRecieved: new FormControl(
        data?.loanDeposit?.IsLoanDepositRecieved || false
      ),
      LoanDuration: new UntypedFormControl(
        this.topUpTenor != null && this.topUpTenor != ""
          ? this.topUpTenor
          : data.loanDuration,
        [Validators.required]
      ),
      // LoanDuration: new FormControl({ value: ((this.topUpTenor != null && this.topUpTenor != '') ? this.topUpTenor : data.loanDuration), disabled: false}, [Validators.required]),
      NetIncome: new UntypedFormControl(
        this.topUpNetIncome != null && this.topUpNetIncome != ""
          ? this.topUpNetIncome
          : data.netIncome,
        [Validators.required]
      ),

      BVN: new UntypedFormControl(
        { value: data.bvnNumber, disabled: data.loan.person.isBvnValidated },
        []
      ),

      BvnDateOfBirth: new UntypedFormControl(),
      CustomerName: new UntypedFormControl(
        { value: data.bvnFirstName + " " + data.bvnLastName, disabled: true },
        [Validators.required]
      ),
      FirstName: new UntypedFormControl(data.bvnFirstName, [
        Validators.required,
      ]),
      LastName: new UntypedFormControl(data.bvnLastName, [Validators.required]),

      EmailAddress: new UntypedFormControl(
        { value: data.emailAddress, disabled: false },
        [Validators.required, Validators.email]
      ),
      EmploymentStatus: new UntypedFormControl(data.employmentStatus, [
        Validators.required,
      ]),
      EmploymentIndustry: new UntypedFormControl("", []),
      BankStatement: new UntypedFormControl("", []),
      DateOfEmployment: new UntypedFormControl(data.employmentYears, []),
      Gender: new UntypedFormControl(data.gender, [
        this.isFormFieldRequired.bind(this),
      ]),
      GradeLevel: new UntypedFormControl(data.employmentLevel, []),
      SoldBy: new UntypedFormControl(data?.soldBy || this.user.userId, [
        this.isFormFieldRequired.bind(this),
      ]),
      EmployerPayDate: new UntypedFormControl(data.employerPayDate, []),
      EmployerAddress: new UntypedFormControl(data.employerAddress, []),
      EmployerEmailAddress: new UntypedFormControl(data.officeEmail, []),
      EmployerPhone: new UntypedFormControl(data.officePhone, []),
      EmploymentCode: new UntypedFormControl(data.employmentCode, []),
      EmployerName: new UntypedFormControl(data.employerName, []),
      EmployerId: new UntypedFormControl(data.employerId, []),
      BankSortCode: new UntypedFormControl(data.bankSortCode, [
        Validators.required,
      ]),
      BankList: new UntypedFormControl("", []),
      Loan: new UntypedFormControl("", [Validators.required]),
      BankName: new UntypedFormControl(data.bankName, [Validators.required]),
      BankAccountName: new UntypedFormControl(data.bankAccountName, []),
      BankAccountNumber: new UntypedFormControl(data.bankAccountNumber, [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
      ]),
      ResidentialAddress: new UntypedFormControl(data.residentialAddress, [
        Validators.required,
      ]),
      UtilityBill: new UntypedFormControl("", []),
      SupportingDocuments: new UntypedFormControl("", []),
      ExistingSupportingDocuments: new UntypedFormControl(""),
      AccountVerification: new UntypedFormControl(true, []),
      RepaymentMethod: new UntypedFormControl(data.repaymentMethod, [
        Validators.required,
      ]),
      Sec: new UntypedFormControl("", []),
      SecurityQuestion: new UntypedFormControl("", []),
      Ans: new UntypedFormControl("", []),
      SecurityAnswer: new UntypedFormControl("", []),
      CardPrime: new UntypedFormControl("", []),
      TransactionRef: new UntypedFormControl("", []),
      Status: new UntypedFormControl("", []),
      // new additions
      CustomerPhoneNumber: new UntypedFormControl(data.customerPhoneNumber, [
        this.isFormFieldRequired.bind(this),
      ]),
      CustomerAltPhoneNumber: new UntypedFormControl(
        data.customerAltPhoneNumber,
        [this.isFormFieldRequired.bind(this)]
      ),
      NextOfKinName: new UntypedFormControl(data.nextOfKinName, [
        this.isFormFieldRequired.bind(this),
      ]),
      NextOfKinPhoneNumber: new UntypedFormControl(data.nextOfKinPhoneNumber, [
        this.isFormFieldRequired.bind(this),
      ]),
      NextOfKinAddress: new UntypedFormControl(data.nextOfKinAddress, [
        this.isFormFieldRequired.bind(this),
      ]),
      LoanReason: new UntypedFormControl(data.loanReasonId, []),
      LoanReasonId: new UntypedFormControl(data.loanReasonId, [
        this.isFormFieldRequired.bind(this),
      ]),

      ChangeInitiatorID: new UntypedFormControl(data.changeInitiatorID, []),
      ChangeStatus: new UntypedFormControl("", []),
      ChangeComment: new UntypedFormControl("", []),
      ChangeReviwerID: new UntypedFormControl(data.changeReviwerID, []),
      RedraftType: new UntypedFormControl("", []),
      RepaymentStartDate: new UntypedFormControl(data.repaymentStartDate, []),
      // lending institution
      // LendingInstitutionId: new FormControl(data.lendingInstitutionId, []),
      LendingInstitutionId: new UntypedFormControl(
        data.lendingInstitutionId,
        lendingInstitutionIdValidationCheck
      ),
      BuyOverAmount: new UntypedFormControl(
        data.buyOverAmount,
        buyOverAmountValidationCheck
      ),
      // BuyOverAmount: new FormControl(data.buyOverAmount, []),
      IsBuyOver: new UntypedFormControl(isBuyOver, []),
      ParentLoanId: new UntypedFormControl(data.loan.parentLoanId),
      PersonId: new UntypedFormControl(data.loan.personId),
      BranchId: new UntypedFormControl(data.branchId, [Validators.required]),
      // top up
      BankStatementFile: new UntypedFormControl(data.bankStatement),
      UtilityBillFile: new UntypedFormControl(data.utilityBill),
      IsBvnValidated: new UntypedFormControl(
        data.loan.person.isBvnValidated,
        []
      ),
      LoanInterest: new UntypedFormControl(
        this.getFromJson(data.loan.loanTypeInfo, "loanInterestRate"),
        []
      ),
      Fees: new UntypedFormControl(false, []),
      LoanStartDate: new UntypedFormControl(null),
    });

    this.loanApplicationForm
      .get("LoanAmount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((loanAmount) => {
        if (this.LoanTypeSelected?.loanDepositSettings?.DepositValue) {
          this.prepopulateDepositAmount(
            this.LoanTypeSelected?.loanDepositSettings?.DepositValue,
            loanAmount
          );
        }
      });
    this.currentloanstatus = data.loan.statusString;
    this.switchValidity(data.employmentStatus);

    if (!this.isEmpty(data.loan.loanCode)) {
      this.loanTypeInfo.loanTypeName = this.getFromJson(
        data.loan.loanTypeInfo,
        "loanTypeName"
      );
      this.loanTypeInfo.tenor = this.getFromJson(
        data.loan.loanTypeInfo,
        "loanDuration"
      );
    }

    const incomingFeeLines = JSON.parse(data.loan.loanTypeInfo).FeesUsed;

    if (incomingFeeLines != null) {
      this.feelines = incomingFeeLines;
    }
    if (this.fromTopupCreation) {
      this.updateFeelinesAndLoanInterestRate(data.loan.loanType);
    }
  }

  updateFeelinesAndLoanInterestRate(loanType: any): void {
    this.feelines = JSON.parse(loanType?.applicableFees);
    this.loanApplicationForm
      .get("LoanInterest")
      .setValue(loanType.interestRate);
  }

  markAsRecieved(event) {
    this.loanApplicationForm.get("isLoanDepositRecieved").setValue(event);
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
    if (
      control.parent &&
      control.parent.get("LoanAmount").value &&
      control.value > control.parent.get("LoanAmount").value
    ) {
      return {
        BuyOverAmountGreaterThanLoanAmount:
          "Buy over amount must be less than or equal to Loan Amount.",
      };
    }
    if (control.value === 0) {
      return {
        BuyOverAmountGreaterThanLoanAmount:
          "Buy over amount must be greater than zero but less than or equal to the loan amount.",
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
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.employerSearchBool = false;
        this.employerList = _.sortBy(res.body, "name");
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
    this.loanApplicationForm.controls["EmploymentIndustry"].setValue(
      val.industry
    );
    this.loanApplicationForm.controls[
      "EmploymentIndustry"
    ].updateValueAndValidity();
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
        this.bankList = res.body.data;
      });
  }

  repaymentSwitch(ev) {
    this.loanApplicationForm.get("RepaymentMethod").setValue(ev);
    if (ev === "Card - Paystack") {
      // this.loanApplicationForm.controls['CardPrime'].setValidators([Validators.required]);
      // this.loanApplicationForm.controls['CardPrime'].updateValueAndValidity();
      // this.loanApplicationForm.controls['TransactionRef'].setValidators([Validators.required]);
      // this.loanApplicationForm.controls['TransactionRef'].updateValueAndValidity();
      // this.loanApplicationForm.updateValueAndValidity({onlySelf: true, emitEvent: true});
    } else {
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
          this.bankInfo = res.body;
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
          // this.toast.fire('Error', err.error, 'error');
        }
      );
  }

  openModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  statusCheck(response) {
    if (response === "1sy87") {
      this.selectedstatus = "Claimed";
    } else if (response === "13km87") {
      this.selectedstatus = "Submitted";
    } else if (response === "1syc7") {
      this.selectedstatus = "Pool";
    } else if (response === "17sehj") {
      this.selectedstatus = "Draft";
    } else if (response === "1dbehj") {
      // || response == "1dbehj"
      this.selectedstatus = this.currentloanstatus;
    } else if (response === "23km87") {
      this.selectedstatus = this.currentloanstatus;
      this.selectedchangestatus = "ChangeRequested";
      this.redrafttype = "loan";
      this.changeInitiatorID = this.authService.decodeToken().nameid;
    } else if (response === "27sehj") {
      this.selectedstatus = this.currentloanstatus;
      this.selectedchangestatus = "ChangeRedraft";
      this.redrafttype = "loan";
      this.changeReviwerID = this.authService.decodeToken().nameid;
    } else if (response === "2sy87") {
      this.selectedstatus = this.currentloanstatus;
      this.selectedchangestatus = "ChangeApproved";
      this.redrafttype = "loan";
      this.changeReviwerID = this.authService.decodeToken().nameid;
    } else if (response === "t3km87") {
      this.selectedstatus = "Submitted";
      this.redrafttype = "topup";
    } else if (response === "tsyc7") {
      this.selectedstatus = "Pool";
      this.redrafttype = "topup";
    }
  }

  getConstants() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.ownerInformation = response.body;
        },
        (error) => {
          // Swal.fire({   type: 'error',   title: 'Error',   text: error, });
          // Swal.fire('Error', error.error, 'error');
        }
      );
  }

  viewRepaymentSchedule(content) {
    let loanStartDate = this.loanApplicationForm.get("LoanStartDate").value;

    if (loanStartDate && content !== "") this.repaymentDate = loanStartDate;
    this.repaymentLoader = true;
    this.repaymentScheduleArray = [];
    const Amount = this.loanApplicationForm.get("LoanAmount").value;
    const NetIncome = this.loanApplicationForm.get("NetIncome").value;
    const Duration = this.loanApplicationForm.get("LoanDuration").value;
    const LoanType = this.LoanTypeSelected.loanTypeId;
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
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.repaymentLoader = false;
            this.loanApplicationForm.controls["RepaymentStartDate"].patchValue(
              this.repaymentDate
            );
            this.scheduleInformation = res.body;
            this.repaymentScheduleArray = res.body.repaymentSchedule;
            if (!this.modalService.hasOpenModals()) {
              this.openModal(content);
            }
          },
          (err) => {
            this.repaymentLoader = false;
            this.toast.fire({
              type: "warning",
              title: "Error: ",
              text: err.error,
            });
          }
        );
    }
  }

  setCustomerImage(img: string) {
    this.profile.newProfileImg = img;
    return
  }

  submitLoanApplicationForm(val: any) {
    this.onDateChange(this.dateOfBirth);
    if (!this.dateError) {
      this.loanApplicationForm.controls["BvnDateOfBirth"].setValue(
        this.getDate(this.dateOfBirth)
      );
    } else {
      this.loanApplicationForm.controls["BvnDateOfBirth"].setValue(null);
    }
    this.loanApplicationForm.value.LoanStartDate
      ? (this.loanStartDate = this.loanApplicationForm.value.LoanStartDate)
      : this.loanStartDate;

    this.onLoanDateChange(this.loanStartDate);
    if (!this.loanDateError && this.loanStartDate) {
      this.loanApplicationForm.controls["LoanStartDate"].setValue(
        this.getDate(this.loanStartDate)
      );
    } else {
      this.loanApplicationForm.controls["LoanStartDate"].setValue(null);
    }

    const loanAmount = this.loanApplicationForm.get("LoanAmount").value;
    const max = this.LoanTypeSelected.maxAmount;
    const min = this.LoanTypeSelected.minAmount;

    const loanAmountIsInRange = loanAmount <= max || loanAmount >= min;

    // if ( this.loanApplicationForm.valid && loanAmountIsInRange ) {
    // if ( this.loanApplicationForm.valid ) {
    this.loader = true;
    this.loanApplicationForm.controls["Status"].setValue(this.selectedstatus);
    this.loanApplicationForm.controls["ChangeStatus"].setValue(
      this.selectedchangestatus
    );
    this.loanApplicationForm.controls["ChangeInitiatorID"].setValue(
      this.changeInitiatorID
    );
    this.loanApplicationForm.controls["ChangeReviwerID"].setValue(
      this.changeReviwerID
    );
    this.loanApplicationForm.controls["RedraftType"].setValue(this.redrafttype);
    this.loanApplicationForm.controls["Fees"].setValue(this.feelines, {
      onlySelf: true,
      emitEvent: true,
    });

    let payload = { ...this.loanApplicationForm.getRawValue() };
    if (!this.user?.permission?.includes("Set Loan Application Start Date")) {
      delete payload.LoanStartDate;
    }

    payload["loanDeposit"] = {
      isLoanDepositRecieved: payload?.isLoanDepositRecieved,
      depositAmount: payload?.depositAmount || 0,
    };

    if (payload?.depositAmount) {
      delete payload.depositAmount;
      delete payload.isLoanDepositRecieved;
    }

    if (this.redrafttype == "topup") {
      this.loanApplicationForm.controls["ParentLoanId"].setValue(
        this.loanApplicationForm.get("LoanId").value
      );
      payload.ParentLoanId = this.loanApplicationForm.get("LoanId").value;

      if (!this.profile?.newProfileImg && this.loanInfo?.loan?.customerImageUrl) {
        payload["parentLoanCustomerImageUrl"] = this.loanInfo?.loan?.customerImageUrl;
      }

      if (this.profile?.newProfileImg) {
        payload["profileImage"] = this.profile?.newProfileImg;
      }
      payload = toFormData(payload, ["SupportingDocuments", "profileImage"]);
      this.configService
        .SubmitLoanApplication(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          () => {
            this.loader = false;
            this.repaymentShow = false;
            this.accountShow = true;
            Swal.fire({
              type: "success",
              text: "Loan Top-Up successfully created.",
            });
            this.loanoperationService.fromTopupCreation$.next(false);
            this.router.navigate(["/loan/applications"]);
          },
          (err) => {
            this.loader = false;

            //  this.toast.fire({ type: 'warning',title: 'Error: ', text: err.error });
          }
        );
    } else {
      this.configService
        .SubmitLoanApplicationRedraft(
          toFormData(payload, ["SupportingDocuments"])
        )
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.loader = false;
            this.accountShow = true;

            if (
              this.redrafttype === "loan" &&
              this.selectedchangestatus === "ChangeRequested"
            ) {
              Swal.fire({
                type: "success",
                text: "Loan update request successfully sent.",
              });
              this.router.navigate(["/loan/loans"]);
            } else if (
              this.redrafttype === "loan" &&
              this.selectedchangestatus === "ChangeRedraft"
            ) {
              Swal.fire({
                type: "success",
                text: "Loan redraft successfully sent.",
              });
              this.router.navigate(["/loan/loans"]);
            } else if (
              this.redrafttype === "loan" &&
              this.selectedchangestatus === "ChangeApproved"
            ) {
              Swal.fire({
                type: "success",
                text: "Loan change(s) successfully applied.",
              });
              this.router.navigate(["/loan/loans"]);
            } else {
              Swal.fire({
                type: "success",
                text: "Loan successfully updated.",
              });
              this.router.navigate(["/loan/applications"]);
            }
          },
          (err) => {
            this.loader = false;
            // Swal.fire('Error', err.error, 'error');
          }
        );
    }

    // }

    // else {
    //   this.toast.fire({
    //     type: 'warning',
    //     title: 'Loan amount seem to be out of range.'
    //   });
    // }
  }

  fileUploader(files: FileList, text: string) {
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
    this.supportingDocuments = [];

    for (let i = 0; i < filelist.length; i++) {
      this.supportingDocuments.push(filelist.item(i));
      this.supportingDocumentsView = [
        ...this.supportingDocumentsView,
        filelist.item(i),
      ];
    }

    this.loanApplicationForm
      .get("SupportingDocuments")
      .setValue(this.supportingDocuments);
  }

  getBankSelected(event) {
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
    this.loanApplicationForm.controls["BankSortCode"].updateValueAndValidity();
    this.loanApplicationForm.controls["BankName"].setValue(selectElementText, {
      onlySelf: true,
      emitEvent: true,
    });
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

  validateBVN() {
    this.reference = Math.floor(Math.random() * 10000000000 + 1);
    this.loader = true;
    this.configService
      .validateBVN({
        BVN: this.loanApplicationForm.get("BVN").value,
        EmailAddress: this.loanApplicationForm.get("EmailAddress").value,
        UserId: this.authService.decodeToken().nameid,
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.loanApplicationForm.controls["PersonId"].setValue(
            this.loanInfo?.loan?.personId,
            {
              onlySelf: true,
              emitEvent: true,
            }
          );
          this.loanApplicationForm.controls["CustomerName"].disable({
            onlySelf: true,
            emitEvent: true,
          });
          this.loanApplicationForm.controls["CustomerName"].setValue(
            `${res.body.data?.first_name} ${res.body.data?.last_name}`,
            { onlySelf: true, emitEvent: true }
          );
          this.loanApplicationForm.controls["BVN"].disable({
            onlySelf: true,
            emitEvent: true,
          });
          this.loanApplicationForm.controls["EmailAddress"].disable({
            onlySelf: true,
            emitEvent: true,
          });
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
            title: "BVN was Successfully Added!",
          });
        },
        () => {
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
    if (step === 2) {
      const Amount = this.loanApplicationForm.get("LoanAmount").value;
      const NetIncome = this.loanApplicationForm.get("NetIncome").value;
      const Duration = this.loanApplicationForm.get("LoanDuration").value;
      const LoanType = this.LoanTypeSelected.loanTypeId;
      const maxAmount = this.LoanTypeSelected.maxAmount;
      const minAmount = this.LoanTypeSelected.minAmount;
      if (Amount > maxAmount || Amount < minAmount) {
        this.toast.fire({
          type: "warning",
          title: "Loan amount is out of the range of this loan.",
        });
      } else {
        this.loader = true;
        this.configService
          .checkAuthAmount({ NetIncome, Amount, LoanType, Duration })
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.loader = false;
              if (res.repaymentCalculate > res.repaymentNetIncome) {
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

              //  Swal.fire('Error', err.error, 'error');
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

  fetchOriginalLoanSetup() {
    this.loanTypes = [];
    this.configService
      .fetchOriginalLoanSetup(
        this.authService.decodeToken().nameid,
        sessionStorage.getItem("appOwnerKey")
      )
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.setUp = res.body;
        this.requestLoader = false;
      });
  }

  fetchLoanSetup() {
    this.usableLoanTypeId = this.isEmpty(this.topUploanTypeId)
      ? this.loanInfo.loanTypeId
      : this.topUploanTypeId;

    this.loanTypes = [];
    this.configService
      .fetchLoanTypes(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.loanApplicationFormInit(this.loanInfo);

        const setUp = res.body;
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < setUp.length; index++) {
          this.loanTypes.push({
            id: setUp[index],
            text: setUp[index].loanName,
          });

          if (this.usableLoanTypeId == setUp[index].loanTypeId) {
            this.loanSelected = [
              { id: setUp[index], text: setUp[index].loanName },
            ];
            this.loanApplicationForm.controls["Loan"].setValue(setUp[index], {
              onlySelf: true,
              emitEvent: true,
            });
            this.loanApplicationForm.updateValueAndValidity({
              onlySelf: true,
              emitEvent: true,
            });
            this.selectedLoanType(
              { id: setUp[index], text: setUp[index].loanName },
              this.loanInfo.repaymentMethod
            );
          }
        }

        this.loanApplicationForm
          .get("ExistingSupportingDocuments")
          .setValue(this.ExistingSupportingDocuments);
      });
  }

  selectedLoanType(ev, previousSelectedRepaymentMethod) {
    this.feeModified = false;
    this.loanApplicationForm.get("LoanTypeId").setValue(ev.id.loanTypeId);
    // this.tenorList = [];
    this.loanApplicationForm.controls["Loan"].setValue(ev.id, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });

    this.LoanTypeSelected = ev.id;
    if (this.LoanTypeSelected?.loanDepositSettings) {
      this.LoanTypeSelected.loanDepositSettings = JSON.parse(
        this.LoanTypeSelected?.loanDepositSettings
      );
    }
    this.prepopulateDepositAmount(
      this.LoanTypeSelected?.loanDepositSettings?.DepositValue,
      this.loanApplicationForm.value.LoanAmount
    );
    this.repaymentMethods = JSON.parse(this.LoanTypeSelected.repaymentMethods);

    this.updateSelectedRepaymentMethodBasedOnAvailableRepaymentMethods(
      this.repaymentMethods,
      previousSelectedRepaymentMethod
    );

    this.showBuyOver = this.LoanTypeSelected.buyOverEligibility;
    if (this.loanApplicationForm.get("LoanAmount").value !== "") {
      this.getLoanDurationParameters({
        LoanAmount: this.loanApplicationForm.get("LoanAmount").value,
        LoanTypeId: this.usableLoanTypeId, //this.LoanTypeSelected.loanTypeId
        LoanInterestRate: this.loanApplicationForm.get("LoanInterest").value,
      });
    } else {
      this.loanApplicationForm.controls["LoanDuration"].setValue("");
      this.loanApplicationForm.controls["LoanDuration"].disable();
      this.loanApplicationForm.updateValueAndValidity();
    }

    if (
      !this.user?.permission?.includes("Override Loan Product Interest Rate")
    ) {
      this.loanApplicationForm.get("LoanInterest").setValue(ev.id.interestRate);
    }
  }

  updateSelectedRepaymentMethodBasedOnAvailableRepaymentMethods(
    methodsArray,
    previousSelectedRepaymentMethod
  ) {
    const repaymentMethod = methodsArray.find(
      (x) => x == previousSelectedRepaymentMethod
    );

    if (repaymentMethod === undefined) {
      this.loanApplicationForm.controls["RepaymentMethod"].setValue("");
    } else {
      this.loanApplicationForm.controls["RepaymentMethod"].setValue(
        repaymentMethod
      );
    }
    this.loanApplicationForm.updateValueAndValidity();
  }

  prepopulateDepositAmount(depositValue: number, LoanAmount: number) {
    if (this.LoanTypeSelected?.isDepositRequired) {
      if (this.LoanTypeSelected?.loanDepositSettings?.DepositType === "Fixed") {
        this.loanApplicationForm.get("depositAmount").setValue(depositValue);
      }

      if (
        this.LoanTypeSelected?.loanDepositSettings?.DepositType === "Percent" &&
        depositValue <= 100
      ) {
        const value = (depositValue / 100) * LoanAmount;
        this.loanApplicationForm.get("depositAmount").setValue(value);
      }
    } else {
      this.loanApplicationForm.get("depositAmount").reset(null);
    }
  }

  checkIfLoanTypeSelected() {
    if (
      this.LoanTypeSelected != null &&
      this.loanApplicationForm.get("LoanAmount").value !== ""
    ) {
      this.getLoanDurationParameters({
        LoanAmount: this.loanApplicationForm.get("LoanAmount").value,
        LoanTypeId: this.LoanTypeSelected.loanTypeId,
        LoanInterestRate: this.loanApplicationForm.get("LoanInterest").value,
      });
    } else {
      this.loanApplicationForm.controls["LoanDuration"].setValue("");
      this.loanApplicationForm.controls["LoanDuration"].disable();
      this.loanApplicationForm.updateValueAndValidity();
    }
  }

  getLoanDurationParameters(data) {
    this.durationLoader = true;
    this.tenorList = [];
    this.configService
      .getLoanTypeParametersByLoanAmountAndLoanTypeId(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.durationLoader = false;
          for (let index = 1; index <= res.body.tenorAllowable; index++) {
            this.tenorList.push(index);
          }
          this.loanApplicationForm.controls["LoanDuration"].enable();
          this.loanApplicationForm.updateValueAndValidity();
          this.disableLoanDuration(this.loanInfo);
        },
        (err) => {
          this.loanApplicationForm.controls["LoanDuration"].disable();
          this.loanApplicationForm.updateValueAndValidity();
          this.durationLoader = false;

          //  Swal.fire('Error', err.error, 'error');
        }
      );
  }

  disableLoanDuration(data: any) {
    if (data.loan != null) {
      if (!this.isEmpty(data.loan.loanCode)) {
        this.loanApplicationForm.controls["LoanDuration"].disable();
        this.loanApplicationForm.updateValueAndValidity();
      }
    }
  }
  paymentDone(ev) {
    this.loanApplicationForm.controls["CardPrime"].setValue(true, {
      onlySelf: true,
      emitEvent: true,
    });
    // this.loanApplicationForm.controls['CardPrime'].updateValueAndValidity();
    this.loanApplicationForm.controls["TransactionRef"].setValue(ev.reference, {
      onlySelf: true,
      emitEvent: true,
    });
    // this.loanApplicationForm.controls['TransactionRef'].updateValueAndValidity();
    this.loanApplicationForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  paymentCancel() {}

  removedLoanType(ev) {}

  fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
        this.fetchUserInBranch();
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
      });
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

  loanPreview(personinfo, newloanrow, oldloanrow, content) {
    this.loanhistoryperson = personinfo;
    this.loanhistoryinformation = oldloanrow;
    this.newloaninformation = newloanrow;
    this.modalService.open(content, {
      size: "lg",
      ariaLabelledBy: "modal-basic-title",
      windowClass: "custom-modal-style opq2",
    });
  }

  submitLoanRequest(type, loanid) {
    this.requestLoader = true;

    this.loanoperationService
      .getActivities(type, loanid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.requestLoader = false;
          this.loanactivities = res.body;
        },
        (err) => {
          this.requestLoader = false;
          //  Swal.fire({   type: 'error',   title: 'Error',   text: err.error });
        }
      );
  }

  printThisDocument(content, reporttype) {
    const host = window.location.host;

    // tslint:disable-next-line:one-variable-per-declaration
    let printContents = null,
      popupWin = null,
      title = null,
      data = null;
    switch (reporttype) {
      case "to_be_printed":
        printContents = document.getElementById(content).innerHTML;
        title =
          this.loanhistoryinformation.applicationCode + "_Loan_Information";
        data = this.loanhistoryinformation;
        break;
      default:
        Swal.fire({
          type: "error",
          title: "Error",
          text: "Print Content seems to be empty",
        });
        break;
    }
    if (data != null && data.length !== 0 && printContents != null) {
      popupWin = window.open(
        "",
        "_blank",
        "top=0,left=0,height=100%,width=auto"
      );
      popupWin.document.open();
      popupWin.document.write(`
            <html>
              <head>
                <title>${title}</title>
                <link rel="stylesheet" href="http://${host}/assets/css/bootstrap.min.css" type="text/css"/>
                <style>
                //........Customized style.......
                @page { margin: 0 }
                body { margin: 0 }
                .sheet {
                  margin: 0;
                  overflow: hidden;
                  position: relative;
                  box-sizing: border-box;
                  page-break-after: always;
                }

                /** Paper sizes **/
                body.A3               .sheet { width: 297mm; height: 419mm }
                body.A3.landscape     .sheet { width: 420mm; height: 296mm }
                body.A4               .sheet { width: 210mm; height: 296mm }
                body.A4.landscape     .sheet { width: 297mm; height: 209mm }
                body.A5               .sheet { width: 148mm; height: 209mm }
                body.A5.landscape     .sheet { width: 210mm; height: 147mm }
                body.letter           .sheet { width: 216mm; height: 279mm }
                body.letter.landscape .sheet { width: 280mm; height: 215mm }
                body.legal            .sheet { width: 216mm; height: 356mm }
                body.legal.landscape  .sheet { width: 357mm; height: 215mm }

                /** Padding area **/
                .sheet.padding-10mm { padding: 10mm }
                .sheet.padding-15mm { padding: 15mm }
                .sheet.padding-20mm { padding: 20mm }
                .sheet.padding-25mm { padding: 25mm }

                /** For screen preview **/
                @media screen {
                  body { background: #e0e0e0 }
                  .sheet {
                    background: white;
                    box-shadow: 0 .5mm 2mm rgba(0,0,0,.3);
                    margin: 5mm auto;
                  }
                }

                /** Fix for Chrome issue #273306 **/
                @media print {
                          body.A3.landscape { width: 420mm }
                  body.A3, body.A4.landscape { width: 297mm }
                  body.A4, body.A5.landscape { width: 210mm }
                  body.A5                    { width: 148mm }
                  body.letter, body.legal    { width: 216mm }
                  body.letter.landscape      { width: 280mm }
                  body.legal.landscape       { width: 357mm }
                }
                nav, aside, footer, button {
                  display: none !important;
                  }

                  .row {
                    display: -ms-flexbox;
                    display: flex;
                    -ms-flex-wrap: wrap;
                    flex-wrap: wrap;
                    // margin-right: -1.6rem;
                    // margin-left: -1.6rem
                }

                .black {
                  color: #000;
               }

              .orange {
                  color: #ff015b;
                }


            .f-12 {
              font-size: 12px
              }

              .mb-1,
              .my-1 {
                  margin-bottom: .4rem !important
              }



                  .col-md-6 {
                    -ms-flex: 0 0 50%;
                    flex: 0 0 50%;
                    max-width: 50%
                }

                  .clay {
                    width: 50%;
                  }

                  .dt-card__title {
                    margin: 0;
                    margin-top: 4px;
                    font-size: 8px;
                    color: #262626
                }



                  .modal-header {
                    padding: 10px;
                  }

                  .table {
                    width: 100%;
                    margin-bottom: 0.4rem;
                    font-size:8px

                }


                .table th {
                      padding: 0.2rem;
                    vertical-align: top;
                    border-bottom:1pt solid black;
                    border-top:1pt solid black;

                    border-collapse: collapse;
                    border-spacing: 0;

                }

                .table td {
                  padding: 0.5rem;
                  vertical-align: top;
                  border-bottom-width: 1px solid #e8e8e8
              }



                  .text-center {
                    text-align: center;
                  }

                  .text-left {
                    text-align: left;
                  }

                  .text-right {
                    text-align: right;
                  }
                </style>
              </head>
          <body onload="window.print();window.close();">${printContents}</body>
            </html>`);
      popupWin.document.close();
    }
  }

  getFromJson(stringArray, expectedResult) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }

  getObjectFromJson(stringArray) {
    let result = "";
    if (stringArray != null || stringArray !== "") {
      result = JSON.parse(stringArray);
    }
    return result;
  }

  getFullDateDiff(date1, date2) {
    const dateOut1 = new Date(date1);
    const dateOut2 = new Date(date2);

    let message = "";

    if (date1 != null && date2 != null) {
      const diff = Math.floor(dateOut1.getTime() - dateOut2.getTime());
      const day = 1000 * 60 * 60 * 24;

      const days = Math.floor(diff / day);
      const months = Math.floor(days / 31);
      const years = Math.floor(months / 12);

      // tslint:disable-next-line:use-isnan
      if (Number.isNaN(days) || Number.isNaN(months) || Number.isNaN(years)) {
        message = "Could not calculate";
      } else {
        // message += days + " days : \n"
        message += months + " months : \n";
        message += years + " years ago \n";
      }
    }

    return message;
  }

  customRepaymentDate() {
    this.viewRepaymentSchedule("");
  }

  toggleRepaymentStartDate() {
    this.showRepaymentInputBox = !this.showRepaymentInputBox;
  }

  isEmpty(value) {
    var isEmpty = false;
    if (value == "" || value == null) {
      isEmpty = true;
    }
    return isEmpty;
  }

  onLoanDateChange(datestr) {
    let date = this.getDate(datestr);
    this.loanDateError = date == false;
  }

  onDateChange(datestr) {
    let date = this.getDate(datestr);
    this.dateError = date == false;
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

  getDate(datestr) {
    if (!datestr) {
      return false;
    }
    try {
      const d = new Date(datestr);
      let yyyy = `${d.getFullYear()}`;
      let mm = `0${d.getMonth() + 1}`.slice(-2);
      let dd = `0${d.getDate()}`.slice(-2);
      return `${yyyy}-${mm}-${dd}`;
    } catch (error) {
      return false;
    }
  }

  fetchBranches() {
    this.configService
      .spoolAccessibleBranches({
        UserId: this.authService.decodeToken().nameid,
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.branches = res.body;
        },
        (err) => {}
      );
  }

  removeFeeRow(i) {
    this.feelines.splice(i, 1);
    this.feeModified = true;
  }
}
