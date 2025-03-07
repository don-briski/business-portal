import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
} from "@angular/forms";
import swal from "sweetalert2";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Configuration } from "../../../model/configuration";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { TokenRefreshErrorHandler } from "src/app/service/TokenRefreshErrorHandler";
import { Router } from "@angular/router";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { LoanType } from "../../loan-section/loan.types";
import { getUserReadableLoanRepaymentBalanceType, lightenColor } from "../../shared/helpers/generic.helpers";
import { AccordionItem } from "../../shared/shared.types";

@Component({
  selector: "app-loantypes-page",
  templateUrl: "./loantypes-page.component.html",
  styleUrls: ["./loantypes-page.component.scss"],
})
export class LoantypesPageComponent implements OnInit {
  public AddLoanTypeForm: UntypedFormGroup;
  public EditLoanTypeForm: UntypedFormGroup;
  public ViewLoanTypeForm: UntypedFormGroup;
  private topupConstraintForm: UntypedFormGroup;
  private EditTopupConstraintForm: UntypedFormGroup;

  loanTypes: Configuration[];

  currentuser: any;
  currentuserid: any;
  ownerInformation: any;
  currentdate: any;
  currentuserbranchid: any;

  applicablePlatformsArray: string[] = ["Web", "Mobile", "Ussd"];
  selectedPlatforms: string[] = [];

  showSelect = true;
  editMode = false;

  pagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  currentview: any;
  requestLoader: boolean;
  loader = false;
  dataTable: any;

  MinAmount: number;
  lines: any;
  editCreditLines: any;
  editCategoryLines: any;
  creditlines: any;
  editLines: any;
  topuplines: any;
  buyoverlines: any;
  categorieslines: any;
  categoriesapplicablefeeslines = new Array();
  //selectedRepaymentMethods = new Array();

  editCategoryApplicableFeesLines = new Array();

  feelines: any;
  editFeeLines: any;

  editTopUplines: any;
  editBuyOverlines: any;

  branchlines: any;
  editBranchLines: any;
  editcategoryApplicableFeesArray: any;

  rejectionReasonsSelect: Configuration[];
  rejectionReasonsArray: any[] = [];

  recoveryMeasuresSelect: Configuration[];
  recoveryMeasuresArray: any[] = [];

  feesSelect: Configuration[];
  feesArray: any[] = [];
  branchesArray: any[] = [];
  categoryApplicableFeesArray: any[] = [];

  thresholdparametersArray: any[] = [];

  selectedRecoveryMeasureIDs = new Array();
  selectedRejectionReasonsIDs = new Array();
  selectedRepaymentMethods = new Array();
  selectedRepaymentMethodsArray = new Array();
  viewRejectionReasons: any;
  viewRecoveryMeasures: any;
  selectedBranches = new Array();

  selectedTriggerArray = new Array();
  selectedAccessArray = new Array();
  selectedFeeArray = new Array();

  selectedSettlementThreshold: any;
  selectedSettlementThresholdArray = new Array();

  selectedRepaymentType: any;
  selectedInterestRateUnit: any;
  selectedDayInAYear: any;
  selectedRepaymentBalanceType: any[];

  selectedRepaymentTypeArray = new Array();
  selectedInterestRateUnitArray = new Array();
  selectedDaysInAYearArray = new Array();

  globalCategoriesCounter: any;
  editGlobalCategoriesCounter: any;

  public loggedInUser: any;

  public triggerArray: Array<string> = ["Loan Amount", "Rate", "Tenor", "DSR"];
  public accessArray: Array<string> = ["Customers", "Admin", "Both"];
  public repaymentMethodsArray: string[] = [];
  gettingRepaymentMethods = false;
  public feeMandatoryOptionArray: Array<string> = ["Yes", "No"]
  public feeTypeArray: Array<string> = ["Percentage", "Flat Rate"];
  public feeApplicationArray: Array<string> = ["Deducted Upfront", "Capitalized"]
  public repaymentTypeArray: Array<string> = ["Day", "Week", "Month", "Year"];
  public interestRateUnitArray: Array<string> = [
    "PerDay",
    "PerWeek",
    "PerMonth",
    "PerYear",
  ];
  public daysInAYearArray: Array<number> = [360, 365, 366];
  public repaymentBalanceTypes = [
    {
      id: 1,
      text: "Effective Rate Flat Balance",
      value: "EffectiveRateFlatBalance",
    },
    {
      id: 2,
      text: "Effective Reducing Balance",
      value: "EffectiveReducingBalance",
    },
    { id: 3, text: "Nominal Flat Balance", value: "NominalFlatBalance" },
    {
      id: 4,
      text: "Nominal Reducing Balance",
      value: "NominalReducingBalance",
    },
  ];
  // public categoryApplicableFees : Array<string>;

  activeCatFees = [];
  activeEditCatFees = [];

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  loanType:LoanType;
  accordionItems:AccordionItem;
  lightenAmount = 170;

  constructor(
    private configurationService: ConfigurationService,
    public authService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private userService: UserService,
    private loanOperationService: LoanoperationsService,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private _fb: UntypedFormBuilder
  ) {}

  ngOnInit() {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }

    this.getUserPromise()
      .then((next) => {
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        this.currentview = 1;
        //    this.requestLoader = true;
        this.globalCategoriesCounter = 0;
        this.AddLoanTypeFormInit();
        this.switchviews(this.currentview);
      })
      .catch((err) => {
        // if (this.httpFailureError) { swal.fire('Error', 'User not Loaded'); }
      });

    this.getRepaymentMethods();
  }

  getRepaymentMethods() {
    this.gettingRepaymentMethods = true;
    this.loanOperationService
      .getLoanRepaymentMethods()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.repaymentMethodsArray = res.body;
          this.gettingRepaymentMethods = false;
        },
        error: () => {
          this.gettingRepaymentMethods = false;
        },
      });
  }

  lightenColor(color:string){
    return lightenColor(color,this.lightenAmount)
  }

  viewLoanType(loanType:LoanType,element?:HTMLElement){
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show") {
        this.loanType = loanType;
        const branches = JSON.parse(this.loanType.branchesApplicable).map(branch => branch.text);
        const fees = JSON.parse(this.loanType.applicableFees).map(fee => {
          fee['feeCalculation'] = fee['FeeApplication'];
          fee['application'] = fee['FeeType'];
          fee['isMandatory'] = fee['FeeIsMandatory'];
          fee['amount'] = fee['FeeAmount'];

          delete fee.FeeID;
          delete fee['FeeApplication'];
          delete fee['FeeType'];
          delete fee['FeeIsMandatory'];
          delete fee['FeeAmount'];
          return fee
        })
        const newFeesArray = [];
        fees.forEach(fee => {
          const feeObj = [];
          let feeMandatoryObj = {};

          for (const key in fee) {
            if (Object.prototype.hasOwnProperty.call(fee, key)) {
              const element = fee[key];
              if (key === 'isMandatory') {
                feeMandatoryObj = {title:key,value:element, showValueAsPill: true, tooltip: 'When a fee is set as mandatory (YES), it will be automatically applied to any loan created. If NO is selected, the user creating the loan has the ability to add or remove this fee during loan origination.'};
              } else if (key === 'feeCalculation') {
                feeObj.push({title: key, value: element, tooltip: '1.DEDUCTED UPFRONT: Deducted from the approved principal amount at disbursement, meaning the client receives less money as actual disbursement, but still has to repay full loan amount by the end of the loan term.  2.CAPITALIZED: Added to the approved principal amount at disbursement, meaning the client receives the approved amount as actual disbursement, but has to repay a higher amount, including the loan fees, by the end of the loan term.'})
              } else if (key === 'application') {
                feeObj.push({title: key, value: element, tooltip: 'Percentage: % of Loan amount.'})
              } else if (key === 'amount') {
                feeObj.push({title: key, value: element, tooltip: 'The amount for the fee.', type: 'currency'})
              }
              else if (key === 'FeeName') {
                feeObj.push({title: key, value: element, tooltip: 'The name of the fee.'})
              } else {
                feeObj.push({title:key,value:element})
              }
            }
          }
          feeObj.push(feeMandatoryObj);
          newFeesArray.push(feeObj);
        })

        this.accordionItems = {
          loanDetails:[
            {
              title:'Loan Name',
              value:this.loanType?.loanName,
              tooltip: 'The name used to identify this loan type.'
            },
            {
              title:'Loan Type Code',
              value:this.loanType?.loanTypeCode,
              tooltip: 'Used to search for loans and segment them according to type.'
            },
            {
              title:'Applicable Branches',
              value:branches,
              type:'list',
              tooltip: 'Locations through which Borrower can make repayments.'
            },
            {
              title:'Applicable Platforms',
              value:this.loanType.applicablePlatform,
              type:'list',
              tooltip: 'Channels through which Borrower can make repayments.'
            },
            {
              title:'Terms & Conditions',
              value:this.loanType.termsAndConditions,
              tooltip: 'The terms of service in detail.'
            },
            {
              title:'Requires Workflow Approval',
              value:this.loanType.isMultiLevelLoanApproval ? `Yes - ${this.loanType?.loanApplicationWorkflow}` : 'No',
              tooltip: 'Indicates if loan approval is required for this loan type'
            }
          ],
          params:[
            {
              title:'Min Loan Amount',
              value:this.loanType?.minAmount,
              type:'currency',
              tooltip: 'Minimum amount that can be disbursed in this loan type. Borrower cannot select an amount less than this.'
            },
            {
              title:'Max Loan Amount',
              value:this.loanType?.maxAmount,
              type:'currency',
              tooltip: 'Maximum amount that can be disbursed in this loan type. Borrower cannot select an amount greater than this.'
            },
            {
              title:'Debt Service Ratio (DSR)',
              value:this.loanType?.dsrRate,
              type:'percentage',
              tooltip: "Minimum ratio in which a loan can be approved for disbursement. Set this number by dividing Borrowers' disposable income by debt."
            },
            {
              title:'Interest',
              value:this.loanType?.interestRate,
              type:'percentage',
              tooltip: 'Rate of interest that will result in the maximum interest amount. Borrowers cannot be charged higher than this rate.'
            },
            {
              title:'Maximum Tenor Limit',
              value:this.loanType?.loanTypeTenor,
              tooltip: 'Maximum length of time in which the loan must be fully repaid. Input a period in months when the borrower must fully repay the loan.',
              type: 'number'
            },
            {
              title:'Deposit Required',
              value:this.loanType?.isDepositRequired ? 'True' : 'False',
              tooltip: 'If a deposit is required or not.'
            },
            {
              title:'Deposit Type',
              value:this.loanType?.loanDepositSettings?.depositType,
              tooltip: 'The type of deposit.'
            },

            {
              title:'Deposit Amount',
              value:this.loanType?.loanDepositSettings?.depositValue,
              type:this.loanType?.loanDepositSettings?.depositType === 'Percent' ? 'percentage' : 'currency',
              tooltip: 'The amount so deposited.'
            },
          ],
          repayment:[
            {
              title:'Repayment Type',
              value:this.loanType?.repaymentType,
              tooltip: 'The schedule for the borrower as a guide to paying back the loan.'
            },
            {
              title:'Repayment Balance Type',
              value: getUserReadableLoanRepaymentBalanceType(this.loanType?.repaymentBalanceType),
              tooltip: 'The repayment balance type.'
            },
            {
              title:'Applicable Repayment Method',
              value:JSON.parse(this.loanType?.repaymentMethods),
              type:'list',
              tooltip: 'The repayment methods for a loan of this type.'
            },
            {
              title:'Settlement Threshold',
              value:this.loanType?.thresholdParameter?.thresholdParameterName,
              tooltip: 'Maximum length of time in which the loan must be fully repaid. Input a period in months when the borrower must fully repay the loan.'
            },
            {
              title:'Days in a year',
              value:this.loanType?.daysInAYear,
              tooltip: 'The set number of days in a fiscal calendar year.',
              type: 'number'
            },
            {
              title:'Account Closure Value',
              value:this.loanType?.accountClosureValue,
              tooltip: 'Loan accounts under this product whose loan balance falls between 0 and Value entered here will be automatically closed (settled).',
              type: 'number'
            },
          ],
          fees:newFeesArray,
          topup:[
            {
              title:'Volume Of Repayments',
              trailing: this.loanType?.topUpConstraints?.volumeOfRepaymentsIsActive ? 'Active' : 'Inactive',
              value: this.loanType?.topUpConstraints?.volumeOfRepayments ? `${this.loanType?.topUpConstraints?.volumeOfRepayments}%` : '',
              tooltip: 'Volume of Repayments Made (%). (Percentage of Total Repayments Expected).'
            },
            {
              title:'DSR Threshold',
              trailing: this.loanType?.topUpConstraints?.topUpDsrIsActive ? 'Active' : 'Inactive',
              value: this.loanType?.topUpConstraints?.topUpDsr ? `${this.loanType?.topUpConstraints?.topUpDsr}%` : '',
              tooltip: 'The dsr threshold.'
            },
            {
              title:'Number Of Repayments',
              trailing: this.loanType?.topUpConstraints?.numberOfRepaymentsIsActive ? 'Active' : 'Inactive',
              value: this.loanType?.topUpConstraints?.numberOfRepayments,
              tooltip: 'The number of repayments.',
              type: 'number'
            },
            {
              title:'Min Loan Tenor',
              trailing: this.loanType?.topUpConstraints?.minLoanTenorIsActive ? 'Active' : 'Inactive',
              value: this.loanType?.topUpConstraints?.minLoanTenor,
              tooltip: 'The minimum loan tenor.',
              type: 'number'
            },
            {
              title:'Number Of Late Repayments Allowable',
              trailing: this.loanType?.topUpConstraints?.lateRepaymentsAllowableIsActive ? 'Active' : 'Inactive',
              value: this.loanType?.topUpConstraints?.lateRepaymentsAllowable,
              tooltip: 'The number of late repayments allowed.',
              type: 'number'
            },
          ],
        }
      }
    });
  }

  toggleSwitch(event, switchName: string, isEdit?: boolean): void {
    switch (switchName) {
      case "lateRepaymentsAllowableIsActive":
        if (!isEdit) {
          this.topupConstraintForm
            .get("lateRepaymentsAllowableIsActive")
            .setValue(event);
        } else {
          this.EditTopupConstraintForm.get(
            "lateRepaymentsAllowableIsActive"
          ).setValue(event);
        }
        break;

      case "topUpDsrIsActive":
        if (!isEdit) {
          this.topupConstraintForm.get("topUpDsrIsActive").setValue(event);
        } else {
          this.EditTopupConstraintForm.get("topUpDsrIsActive").setValue(event);
        }
        break;

      case "numberOfRepaymentsIsActive":
        if (!isEdit) {
          this.topupConstraintForm
            .get("numberOfRepaymentsIsActive")
            .setValue(event);
        } else {
          this.EditTopupConstraintForm.get(
            "numberOfRepaymentsIsActive"
          ).setValue(event);
        }
        break;

      case "minLoanTenorIsActive":
        if (!isEdit) {
          this.topupConstraintForm.get("minLoanTenorIsActive").setValue(event);
        } else {
          this.EditTopupConstraintForm.get("minLoanTenorIsActive").setValue(
            event
          );
        }
        break;

      default:
        if (!isEdit) {
          this.topupConstraintForm
            .get("volumeOfRepaymentsIsActive")
            .setValue(event);
        } else {
          this.EditTopupConstraintForm.get(
            "volumeOfRepaymentsIsActive"
          ).setValue(event);
        }
        break;
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

  switchviews(view) {
    if (view === 1) {
      this.currentview = 1;
      this.getLoanTypes();
      this.requestLoader = true;
      this.getConstants();
    } else if (view === 2) {
      this.currentview = 2;
    }
  }

  getLoanTypes(pageNum = this.pagination.pageNum, filter = null) {
    this.loanTypes = [];
    this.requestLoader = true;

    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    const paginationmodel = {
      BranchId: this.currentuserbranchid,
      pageNumber: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
      filter: this.pagination.searchTerm,
    };

    this.configurationService.spoolLoanTypes(paginationmodel).subscribe(
      (response) => {
        this.loanTypes = response.body.value.data;

        this.pagination.maxPage = response.body.value.pages;
        this.pagination.totalRecords = response.body.value.totalRecords;
        this.pagination.count = this.loanTypes.length;
        this.pagination.jumpArray = Array(this.pagination.maxPage);
        for (let i = 0; i < this.pagination.jumpArray.length; i++) {
          this.pagination.jumpArray[i] = i + 1;
        }

        this.chRef.detectChanges();

        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = true;
      }
    );
  }

  openModal(content) {
    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "loantypes-class",
    });

    this.lines.splice(0, 1);
    this.creditlines.splice(0, 1);

    this.selectedRepaymentMethods = [];
    this.selectedRepaymentMethodsArray = [];
    this.selectedBranches = [];

    this.AddLoanTypeFormInit();
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  AddLoanTypeFormInit() {
    this.editMode = false;
    this.globalCategoriesCounter = 0;
    // tslint:disable-next-line:max-line-length
    this.lines = [
      {
        Trigger: null,
        MinConditionLoanAmount: null,
        MaxConditionLoanAmount: null,
        MinConditionRange: null,
        MaxConditionRange: null,
        MinConditionInterestRate: null,
        MaxConditionInterestRate: null,
        MinConditionDsr: null,
        MaxConditionDsr: null,
        ViewAccess: null,
      },
    ];
    this.creditlines = [
      {
        Description: null,
        MinCreditScore: null,
        MaxCreditScore: null,
        Tag: null,
      },
    ];
    this.feelines = [
      { FeeID: null, FeeName: null, FeeApplication: null, FeeType: null, FeeAmount: null, FeeIsMandatory: null },
    ];
    this.topuplines = [
      {
        VolumeOfRepayments: null,
        LateRepaymentsAllowable: null,
        TopUpDsr: null,
      },
    ];
    this.buyoverlines = [{ MinimumTransferrableAmount: null }];
    this.categorieslines = [
      {
        CategoryId: this.globalCategoriesCounter + 1,
        CategoryName: null,
        MinCategoryLoanAmount: null,
        MaxCategoryLoanAmount: null,
        MinCategoryTenor: null,
        MaxCategoryTenor: null,
        MinCategoryInterestRate: null,
        MaxCategoryInterestRate: null,
        MinCategoryDsr: null,
        MaxCategoryDsr: null,
        CategoryApplicableFees: null,
      },
    ];
    this.categoriesapplicablefeeslines = [
      { CategoryId: null, FeeID: null, FeeName: null },
    ];
    this.selectedRepaymentMethods = [];
    this.selectedRepaymentMethodsArray = [];
    this.selectedBranches = [];
    this.selectedPlatforms = [];
    this.activeCatFees = [[]];

    //  this.getConstants();
    this.AddLoanTypeForm = new UntypedFormGroup({
      LoanName: new UntypedFormControl("", [Validators.required]),
      LoanTypeCode: new UntypedFormControl("", [Validators.required]),
      LoanTypeTenor: new UntypedFormControl("", [Validators.required]),
      MinAmount: new UntypedFormControl("", [Validators.required]),
      MaxAmount: new UntypedFormControl("", [Validators.required]),
      Status: new UntypedFormControl("", [Validators.required]),
      InterestRate: new UntypedFormControl("", [Validators.required]),
      DaysInAYear: new UntypedFormControl("", Validators.required),
      RepaymentBalanceType: new UntypedFormControl(""),
      DsrRate: new UntypedFormControl(""),
      MinimumCreditScore: new UntypedFormControl(""),
      MaximumCreditScore: new UntypedFormControl(""),
      CreditScoringRule: new UntypedFormControl(""),
      UserId: new UntypedFormControl(""),
      AlternativeScoringPattern: new UntypedFormControl(""),
      TermsAndConditions: new UntypedFormControl(""),
      AlternativeConditions: new UntypedFormControl(""),
      RecoveryMeasure: new UntypedFormControl(""),
      RejectionReason: new UntypedFormControl(""),
      RepaymentMethods: new UntypedFormControl(""),
      RepaymentType: new UntypedFormControl(""),
      ApplicableFees: new UntypedFormControl(""),
      topUpConstraints: new UntypedFormControl(""),
      BuyOverConstraints: new UntypedFormControl(""),
      LoanTypeCategories: new UntypedFormControl(""),
      BranchId: new UntypedFormControl(""),
      ThresholdParameterId: new UntypedFormControl(""),
      BranchesApplicable: new UntypedFormControl(""),
      ApplicablePlatform: new UntypedFormControl(""),
      AccountClosureValue: new UntypedFormControl(""),
      RateUnit: new UntypedFormControl(""),
    });

    this._initTopupForm();
  }

  private _initTopupForm(): void {
    this.topupConstraintForm = this._fb.group({
      volumeOfRepaymentsIsActive: new UntypedFormControl(false, [Validators.required]),
      volumeOfRepayments: new UntypedFormControl(0, [Validators.required]),
      lateRepaymentsAllowableIsActive: new UntypedFormControl(false, [
        Validators.required,
      ]),
      lateRepaymentsAllowable: new UntypedFormControl(0, [Validators.required]),
      topUpDsrIsActive: new UntypedFormControl(false, [Validators.required]),
      topUpDsr: new UntypedFormControl(0, [Validators.required]),
      numberOfRepaymentsIsActive: new UntypedFormControl(false, [Validators.required]),
      numberOfRepayments: new UntypedFormControl(0, [Validators.required]),
      minLoanTenorIsActive: new UntypedFormControl(false, [Validators.required]),
      minLoanTenor: new UntypedFormControl(0, [Validators.required]),
    });
  }

  openViewModal(content, data) {
    this.editLines = [];

    this.ViewLoanTypeForm = new UntypedFormGroup({
      LoanName: new UntypedFormControl(data.loanName),
      LoanTypeCode: new UntypedFormControl(data.loanTypeCode),
      LoanTypeTenor: new UntypedFormControl(data.loanTypeTenor),
      MinAmount: new UntypedFormControl(data.minAmount),
      MaxAmount: new UntypedFormControl(data.maxAmount),
      Status: new UntypedFormControl(data.status),
      RepaymentBalancetype: new UntypedFormControl(data.repaymentBalanceType),
      InterestRate: new UntypedFormControl(data.interestRate),
      DsrRate: new UntypedFormControl(data.dsrRate),
      MinimumCreditScore: new UntypedFormControl(data.minimumCreditScore),
      MaximumCreditScore: new UntypedFormControl(data.maximumCreditScore),
      AlternativeScoringPattern: new UntypedFormControl(
        data.alternativeScoringPattern
      ),
      TermsAndConditions: new UntypedFormControl(data.termsAndConditions),
      ThresholdParameterId: new UntypedFormControl(""),
      // AlternativeConditions: new FormControl(data.alternativeConditions),
      // RecoveryMeasure: new FormControl(data.recoveryMeasure),
      // RejectionReason: new FormControl(data.rejectionReason)
    });

    this.selectedRejectionReasonsIDs = JSON.parse(data.rejectionReason);
    //  this.viewRecoveryMeasures =  [''];//data.recoveryMeasure;
    const incomingLines = JSON.parse(data.alternativeConditions);
    if (incomingLines.length < 1) {
      // this.editLines = [{ number: 1,  label: '' }];
    } else {
      this.editLines = incomingLines;
    }

    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  submitLoanTypeForm(val: any) {
    //   if (this.AddLoanTypeForm.valid) {
    const repaymentBalanceType = this.repaymentBalanceTypes.find((rbt) => {
      return this.selectedRepaymentBalanceType[0].text === rbt.text;
    });

    this.loader = true;
    const fee_lines = [];
    var topup_line = null;
    var buyover_line = null;
    const category_lines = [];
    let feeNameError = [false, 0];
    let CategoryNameError = [false, 0];

    if (this.feelines != null) {
      this.feelines.forEach((line, index) => {
        line.FeeAmount = line.FeeAmount == null ? 0 : line.FeeAmount;

        if (line.FeeName === null) {
          feeNameError = [true, index + 1];
          feeNameError = [true, index + 1];
          return false;
        }
        if (line.FeeType === null || line.FeeName === null) {
          return false;
        } else {
          fee_lines.push(line);
        }
      });
    }

    if (this.topuplines != null) {
      this.topuplines.forEach((line, index) => {
        if (
          line.VolumeOfRepayments === null ||
          line.LateRepaymentsAllowable === null ||
          line.TopUpDsr === null
        ) {
          return false;
        } else {
          line.VolumeOfRepayments =
            line.VolumeOfRepayments == null ? 0 : line.VolumeOfRepayments;
          line.LateRepaymentsAllowable =
            line.LateRepaymentsAllowable == null
              ? 0
              : line.LateRepaymentsAllowable;
          line.TopUpDsr = line.TopUpDsr == null ? 0 : line.TopUpDsr;

          // topup_lines.push(line);
          topup_line = {
            VolumeOfRepayments: line.VolumeOfRepayments,
            LateRepaymentsAllowable: line.LateRepaymentsAllowable,
            TopUpDsr: line.TopUpDsr,
          };
        }
      });
    }

    if (this.buyoverlines != null) {
      this.buyoverlines.forEach((line, index) => {
        if (line.MinimumTransferrableAmount === null) {
          return false;
        } else {
          line.MinimumTransferrableAmount =
            line.MinimumTransferrableAmount == null
              ? 0
              : line.MinimumTransferrableAmount;
          //   buyover_lines.push(line);
          buyover_line = {
            MinimumTransferrableAmount: line.MinimumTransferrableAmount,
          };
        }
      });
    }

    if (this.categorieslines != null) {
      this.categorieslines.forEach((line, index) => {
        let categoryApplicableFeesholder = [
          { CategoryId: null, FeeID: null, FeeName: null },
        ];

        line.MinCategoryLoanAmount =
          line.MinCategoryLoanAmount == null ? 0 : line.MinCategoryLoanAmount;
        line.MaxCategoryLoanAmount =
          line.MaxCategoryLoanAmount == null ? 0 : line.MaxCategoryLoanAmount;
        line.MinCategoryTenor =
          line.MinCategoryTenor == null ? 0 : line.MinCategoryTenor;
        line.MaxCategoryTenor =
          line.MaxCategoryTenor == null ? 0 : line.MaxCategoryTenor;
        line.MinCategoryInterestRate =
          line.MinCategoryInterestRate == null
            ? 0
            : line.MinCategoryInterestRate;
        line.MaxCategoryInterestRate =
          line.MaxCategoryInterestRate == null
            ? 0
            : line.MaxCategoryInterestRate;
        line.MinCategoryDsr =
          line.MinCategoryDsr == null ? 0 : line.MinCategoryDsr;
        line.MaxCategoryDsr =
          line.MaxCategoryDsr == null ? 0 : line.MaxCategoryDsr;

        this.categoriesapplicablefeeslines.forEach((innerLine, innerIndex) => {
          if (line.CategoryId == innerLine.CategoryId) {
            //checks if global fees is updated
            const found = this.feelines.some(
              (item) => item.FeeID === innerLine.FeeID
            );

            if (found) {
              categoryApplicableFeesholder.push({
                CategoryId: line.CategoryId,
                FeeID: innerLine.FeeID,
                FeeName: innerLine.FeeName,
              });
            }

            for (var i = 0; i < categoryApplicableFeesholder.length; i++) {
              //remove null items from array
              if (categoryApplicableFeesholder[i].CategoryId === null) {
                categoryApplicableFeesholder.splice(i, 1);
              }
            }
          }
        });

        line.CategoryApplicableFees = JSON.stringify(
          categoryApplicableFeesholder
        );

        if (line.CategoryName === null) {
          return false;
        } else {
          category_lines.push(line);
        }
      });
    }

    /* if(this.categoriesapplicablefeeslines != null){
             this.categoriesapplicablefeeslines.forEach((line, index) => {
               const found = this.feelines.some(item => item.FeeID === line.FeeID);
             if(!found && line.FeeID != null){
               for( var i = 0; i < this.categoriesapplicablefeeslines.length; i++){
                   //remove item if it is contained in the previouslly selected array
                   if ( this.categoriesapplicablefeeslines[i].FeeID === line.FeeID) {
                       this.categoriesapplicablefeeslines.splice(i, 1);
                   }
             } }
           });
     } */

    if (this.selectedRepaymentMethods.length < 1) {
      swal.fire({
        type: "error",
        title: "Error",
        text: "Repayment Method selection cannot be empty",
      });
      this.loader = false;
      return false;
    }

    if (
      this.selectedRepaymentType === null ||
      this.selectedRepaymentType === ""
    ) {
      swal.fire({
        type: "error",
        title: "Error",
        text: "Repayment Type selection cannot be empty",
      });
      this.loader = false;
      return false;
    }

    if (
      this.selectedInterestRateUnit === null ||
      this.selectedInterestRateUnit === ""
    ) {
      swal.fire({
        type: "error",
        title: "Error",
        text: "Interest Rate Unit selection cannot be empty",
      });
      this.loader = false;
      return false;
    }

    if (CategoryNameError[0]) {
      // if (triggerError[0]) {
      //   swal.fire({ type: 'error', title: 'Error', text: 'No Trigger was selected for line ' + triggerError[1], });
      // }
      // if (viewAccessError[0]) {
      //   swal.fire({ type: 'error', title: 'Error', text: 'No access parameter was selected for line ' + viewAccessError[1], });
      // }

      // if(feeNameError[0]){
      //   swal.fire({ type: 'error', title: 'Error', text: 'No Fee selected for line ' + feeNameError[1], });
      // }

      // if(feeTypeError[0]){
      //   swal.fire({ type: 'error', title: 'Error', text: 'No Fee Type selected for line ' + feeTypeError[1], });
      // }

      this.loader = false;
    } else {
      this.AddLoanTypeForm.controls["RepaymentMethods"].patchValue(
        JSON.stringify(this.selectedRepaymentMethods)
      );
      this.AddLoanTypeForm.controls["RepaymentType"].patchValue(
        this.selectedRepaymentType
      );
      this.AddLoanTypeForm.controls["RejectionReason"].patchValue(
        JSON.stringify(this.selectedRejectionReasonsIDs)
      );
      this.AddLoanTypeForm.controls["RecoveryMeasure"].patchValue(
        JSON.stringify(this.selectedRecoveryMeasureIDs)
      );
      //  this.AddLoanTypeForm.controls['AlternativeConditions'].patchValue(JSON.stringify(entry_lines));
      // this.AddLoanTypeForm.controls['CreditScoringRule'].patchValue(JSON.stringify(credit_lines));
      this.AddLoanTypeForm.controls["ApplicableFees"].patchValue(
        JSON.stringify(fee_lines)
      );

      this.AddLoanTypeForm.controls["topUpConstraints"].patchValue(
        this.topupConstraintForm.value
      );
      this.AddLoanTypeForm.controls["BuyOverConstraints"].patchValue(
        JSON.stringify(buyover_line)
      );
      this.AddLoanTypeForm.controls["LoanTypeCategories"].patchValue(
        JSON.stringify(category_lines)
      );
      this.AddLoanTypeForm.controls["UserId"].patchValue(this.currentuserid);
      this.AddLoanTypeForm.controls["BranchId"].patchValue(
        this.currentuserbranchid
      );
      this.AddLoanTypeForm.controls["BranchesApplicable"].patchValue(
        JSON.stringify(this.selectedBranches)
      );
      this.AddLoanTypeForm.controls["ThresholdParameterId"].patchValue(
        this.selectedSettlementThreshold
      );
      this.AddLoanTypeForm.controls["ApplicablePlatform"].patchValue(
        this.selectedPlatforms
      );
      this.AddLoanTypeForm.controls["DaysInAYear"].patchValue(
        this.selectedDayInAYear
      );
      this.AddLoanTypeForm.controls["RateUnit"].patchValue(
        this.selectedInterestRateUnit
      );
      this.AddLoanTypeForm.controls["RepaymentBalanceType"].patchValue(
        repaymentBalanceType.value
      );

      this.configurationService
        .createLoanType(this.AddLoanTypeForm.value)
        .subscribe(
          (res) => {
            swal.fire({
              type: "success",
              text: "Loan Type has been added",
              title: "Successful",
            });
            this.modalService.dismissAll();
            this.AddLoanTypeForm.reset();
            this.selectedRepaymentMethods = [];
            // tslint:disable-next-line:max-line-length
            this.lines = [
              {
                Trigger: null,
                MinConditionLoanAmount: null,
                MaxConditionLoanAmount: null,
                MinConditionRange: null,
                MaxConditionRange: null,
                MinConditionInterestRate: null,
                MaxConditionInterestRate: null,
                MinConditionDsr: null,
                MaxConditionDsr: null,
                ViewAccess: null,
              },
            ];
            this.creditlines = [
              {
                Description: null,
                MinCreditScore: null,
                MaxCreditScore: null,
                Tag: null,
              },
            ];
            this.feelines = [
              { FeeID: null, FeeName: null,   FeeApplication: null, FeeType: null, FeeAmount: null, FeeIsMandatory: null },
            ];
            this.categorieslines = [
              {
                CategoryId: null,
                CategoryName: null,
                MinCategoryLoanAmount: null,
                MaxCategoryLoanAmount: null,
                MinCategoryTenor: null,
                MaxCategoryTenor: null,
                MinCategoryInterestRate: null,
                MaxCategoryInterestRate: null,
                MinCategoryDsr: null,
                MaxCategoryDsr: null,
              },
            ];
            this.topuplines = [
              {
                VolumeOfRepayments: null,
                LateRepaymentsAllowable: null,
                TopUpDsr: null,
              },
            ];
            this.buyoverlines = [{ MinimumTransferrableAmount: null }];
            this.categoriesapplicablefeeslines = [
              { CategoryId: null, FeeID: null, FeeName: null },
            ];

            this.switchviews(1);
            this.loader = false;
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }
  //}

  openEditModal(content, data) {
    this.editMode = true;

    this.selectedRepaymentBalanceType = [
      this.repaymentBalanceTypes.find(
        (x) => x.value === data.repaymentBalanceType
      ),
    ];

    this.selectedRepaymentMethods = [];
    this.selectedRepaymentMethodsArray = [];
    this.selectedBranches = [];
    // this.selectedSettlementThreshold = [];
    this.selectedSettlementThresholdArray = [];
    this.categoryApplicableFeesArray = [];
    this.editGlobalCategoriesCounter = 0;
    this.editCategoryApplicableFeesLines = [];
    this.editBuyOverlines = [];
    this.editTopUplines = [];
    this.selectedDaysInAYearArray = [];
    this.selectedInterestRateUnitArray = [];
    this.selectedRepaymentTypeArray = [];
    this.activeEditCatFees = [];
    this.selectedPlatforms = data.applicablePlatform;

    this.editLines = [];
    this.editCreditLines = [];
    this.editFeeLines = [];
    this.editcategoryApplicableFeesArray = [];
    this.editCategoryLines = [];

    this.getConstants();

    this.EditLoanTypeForm = new UntypedFormGroup({
      LoanTypeId: new UntypedFormControl(data.loanTypeId),
      LoanName: new UntypedFormControl(data.loanName),
      LoanTypeCode: new UntypedFormControl(data.loanTypeCode),
      LoanTypeTenor: new UntypedFormControl(data.loanTypeTenor),
      MinAmount: new UntypedFormControl(data.minAmount),
      MaxAmount: new UntypedFormControl(data.maxAmount),
      Status: new UntypedFormControl(data.status),
      RepaymentBalanceType: new UntypedFormControl(
        this.selectedRepaymentBalanceType[0].value
      ),
      InterestRate: new UntypedFormControl(data.interestRate),
      DsrRate: new UntypedFormControl(data.dsrRate),
      MinimumCreditScore: new UntypedFormControl(data.minimumCreditScore),
      MaximumCreditScore: new UntypedFormControl(data.maximumCreditScore),
      DaysInAYear: new UntypedFormControl(data.daysInAYear, Validators.required),
      AlternativeConditions: new UntypedFormControl(""),
      CreditScoringRule: new UntypedFormControl(""),
      AlternativeScoringPattern: new UntypedFormControl(
        data.alternativeScoringPattern
      ),
      TermsAndConditions: new UntypedFormControl(data.termsAndConditions),
      RepaymentMethods: new UntypedFormControl(""),
      RepaymentType: new UntypedFormControl(""),
      ApplicableFees: new UntypedFormControl(""),
      topUpConstraints: new UntypedFormControl(""),
      BuyOverConstraints: new UntypedFormControl(""),
      LoanTypeCategories: new UntypedFormControl(""),
      BranchId: new UntypedFormControl(data.branchId),
      UserId: new UntypedFormControl(""),
      BranchesApplicable: new UntypedFormControl(""),
      ThresholdParameterId: new UntypedFormControl(data.thresholdParameterId),
      ApplicablePlatform: new UntypedFormControl(""),
      AccountClosureValue: new UntypedFormControl(data.accountClosureValue),
      RateUnit: new UntypedFormControl(""),
    });
    this.EditTopupConstraintForm = this._fb.group({
      volumeOfRepaymentsIsActive: new UntypedFormControl(
        data?.topUpConstraints?.volumeOfRepaymentsIsActive || false
      ),
      volumeOfRepayments: new UntypedFormControl(
        data?.topUpConstraints?.volumeOfRepayments || 0
      ),
      lateRepaymentsAllowableIsActive: new UntypedFormControl(
        data?.topUpConstraints?.lateRepaymentsAllowableIsActive || false
      ),
      lateRepaymentsAllowable: new UntypedFormControl(
        data?.topUpConstraints?.lateRepaymentsAllowable || 0
      ),
      topUpDsrIsActive: new UntypedFormControl(
        data?.topUpConstraints?.topUpDsrIsActive || false
      ),
      topUpDsr: new UntypedFormControl(data?.topUpConstraints?.topUpDsr || 0),
      numberOfRepaymentsIsActive: new UntypedFormControl(
        data?.topUpConstraints?.numberOfRepaymentsIsActive || false
      ),
      numberOfRepayments: new UntypedFormControl(
        data?.topUpConstraints?.numberOfRepayments || 0
      ),
      minLoanTenorIsActive: new UntypedFormControl(
        data?.topUpConstraints?.minLoanTenorIsActive || false
      ),
      minLoanTenor: new UntypedFormControl(data?.topUpConstraints?.minLoanTenor || 0),
    });

    this.editMode = true;

    if (
      data.alternativeConditions == null ||
      data.alternativeConditions === ""
    ) {
      // tslint:disable-next-line:max-line-length
      this.editLines = [
        {
          Trigger: null,
          MinConditionLoanAmount: null,
          MaxConditionLoanAmount: null,
          MinConditionRange: null,
          MaxConditionRange: null,
          MinConditionInterestRate: null,
          MaxConditionInterestRate: null,
          MinConditionDsr: null,
          MaxConditionDsr: null,
          ViewAccess: null,
        },
      ];
    } else {
      const incomingLines = JSON.parse(data.alternativeConditions);
      this.editLines = incomingLines;
    }

    if (data.creditScoringRule === "" || data.creditScoringRule == null) {
      this.editCreditLines = [
        {
          Description: null,
          MinCreditScore: null,
          MaxCreditScore: null,
          Tag: null,
        },
      ];
    } else {
      const incomingCreditLines = JSON.parse(data.creditScoringRule);

      this.editCreditLines = incomingCreditLines;
    }

    if (
      data.applicableFees === "" ||
      data.applicableFees == null ||
      data.applicableFees === "[]"
    ) {
      this.editFeeLines = [
        { FeeID: null, FeeName: null,  FeeApplication: null, FeeType: null, FeeAmount: null, FeeIsMandatory: null },
      ];
    } else {
      const incomingFeeLines = JSON.parse(data.applicableFees);
      this.editFeeLines = incomingFeeLines;
      this.editcategoryApplicableFeesArray = [];
      this.editFeeLines.forEach((line, innerindex) => {
        this.editcategoryApplicableFeesArray.push({
          id: line.FeeID,
          text: line.FeeName,
        });
      });
    }

    if (data.repaymentMethods != null && data.repaymentMethods !== "") {
      JSON.parse(data.repaymentMethods).forEach((line, index) => {
        this.selectedRepaymentMethodsArray.push({ id: line, text: line });
        this.selectedRepaymentMethods.push(line);
      });
    }

    if (data.repaymentType !== "") {
      this.selectedRepaymentTypeArray = [
        { id: data.repaymentType, text: data.repaymentType },
      ];
      this.selectedRepaymentType = data.repaymentType;
    }

    if (data.rateUnit !== "") {
      this.selectedInterestRateUnitArray = [
        { id: data.rateUnit, text: data.rateUnit },
      ];
      this.selectedInterestRateUnit = data.rateUnit;
    }

    if (data.daysInAYear !== "") {
      this.selectedDaysInAYearArray = [
        { id: data.daysInAYear, text: data.daysInAYear },
      ];
      this.selectedDayInAYear = data.daysInAYear;
    }

    if (data.branchesApplicable !== "" && data.branchesApplicable != null) {
      JSON.parse(data.branchesApplicable).forEach((line, index) => {
        this.selectedBranches.push(line);
      });
    }

    if (
      data.loanTypeCategories === "" ||
      data.loanTypeCategories == null ||
      data.loanTypeCategories == "[]"
    ) {
      this.editCategoryLines = [
        {
          CategoryId: this.editGlobalCategoriesCounter + 1,
          CategoryName: null,
          MinCategoryLoanAmount: null,
          MaxCategoryLoanAmount: null,
          MinCategoryTenor: null,
          MaxCategoryTenor: null,
          MinCategoryInterestRate: null,
          MaxCategoryInterestRate: null,
          MinCategoryDsr: null,
          MaxCategoryDsr: null,
          CategoryApplicableFees: null,
        },
      ];
      this.editCategoryApplicableFeesLines = [
        { Id: null, CategoryId: null, FeeID: null, FeeName: null },
      ];
      this.activeEditCatFees = [[]];
    } else {
      const incomingCategoryLines = JSON.parse(data.loanTypeCategories);
      this.editCategoryLines = incomingCategoryLines;
      this.activeEditCatFees = [];
      //loop throught the category line to set the
      this.editCategoryLines.forEach((line, index) => {
        //   const found = this.editFeeLines.some(item => item.FeeID === line.FeeID);
        const editCatFeeLine = [];
        if (
          line.CategoryApplicableFees != "" &&
          line.CategoryApplicableFees !== null
        ) {
          JSON.parse(line.CategoryApplicableFees).forEach(
            (innerLine, innerIndex) => {
              //push each row's application fee
              if (innerLine.Id === line.Id) {
                this.editCategoryApplicableFeesLines.push({
                  Id: innerLine.Id,
                  CategoryId: null,
                  FeeID: innerLine.FeeID,
                  FeeName: innerLine.FeeName,
                });
                editCatFeeLine.push({
                  id: innerLine.FeeID,
                  text: innerLine.FeeName,
                });
              }
            }
          );
          this.activeEditCatFees.push(editCatFeeLine);
        }
      });

      //  });
    }

    if (data.thresholdParameterId !== "" && data.thresholdParameterId != null) {
      // tslint:disable-next-line:max-line-length
      this.selectedSettlementThresholdArray = [
        {
          id: data.thresholdParameterId,
          text:
            data.thresholdParameter.thresholdParameterName +
            ": " +
            data.thresholdParameter.thresholdParameterValue,
        },
      ];
      this.selectedSettlementThreshold = data.thresholdParameterId;
    }

    if (data.topUpConstraints === "" || data.topUpConstraints == null) {
      this.editTopUplines = [
        {
          VolumeOfRepayments: null,
          LateRepaymentsAllowable: null,
          TopUpDsr: null,
        },
      ];
    } else {
      const incomingTopUpLines = data.topUpConstraints;
      // this.editTopUplines = incomingTopUpLines;
      this.editTopUplines.push({
        VolumeOfRepayments: incomingTopUpLines.volumeOfRepayments,
        LateRepaymentsAllowable: incomingTopUpLines.lateRepaymentsAllowable,
        TopUpDsr: incomingTopUpLines.topUpDsr,
      });
    }

    if (data.buyOverConstraints === "" || data.buyOverConstraints == null) {
      this.editBuyOverlines = [{ MinimumTransferrableAmount: null }];
    } else {
      const incomingBuyOverLines = JSON.parse(data.buyOverConstraints);
      //  this.editBuyOverlines = incomingBuyOverLines;
      this.editBuyOverlines.push({
        MinimumTransferrableAmount:
          incomingBuyOverLines.MinimumTransferrableAmount,
      });
    }

    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  selectAll(type, data): void {
    switch (type) {
      case "Repayment":
        this.selectedRepaymentMethods = this.repaymentMethodsArray;
        break;

      case "Branch":
        this.selectedBranches = this.branchesArray;
        break;

      case "ApplicablePlatform":
        this.selectedPlatforms = this.applicablePlatformsArray;
        break;
    }
  }

  deSelectAll(type, data): void {
    switch (type) {
      case "Repayment":
        this.selectedRepaymentMethods = [];
        break;

      case "Branch":
        this.selectedBranches = [];
        break;

      case "ApplicablePlatform":
        this.selectedPlatforms = [];
        break;
    }
  }

  selected(type, data, index, parentindex) {
    if (type === "Rejection") {
      this.selectedRejectionReasonsIDs.push(data);
    } else if (type === "RepaymentBalanceType") {
      this.selectedRepaymentBalanceType = [data];
    } else if (type === "Recovery") {
      this.selectedRecoveryMeasureIDs.push(data);
    } else if (type === "Trigger") {
      this.lines[index].Trigger = data.id;
    } else if (type === "Access") {
      this.lines[index].ViewAccess = data.id;
    } else if (type === "Repayment") {
      this.selectedRepaymentMethods.push(data.id);
    } else if (type === "Fee") {
      this.feelines[index].FeeID = data.id;
      this.feelines[index].FeeName = data.text;

      //Triggers the categories fee to reflect update

      //store previous categories entries before emptying the variable.
      const categorieslineHolder = this.categorieslines;
      this.categorieslines = [];

      // update category array with general applicable fees
      this.categoryApplicableFeesArray = [];
      this.feelines.forEach((line, innerindex) => {
        this.categoryApplicableFeesArray.push({
          id: line.FeeID,
          text: line.FeeName,
        });
      });

      // populates former entries in the background
      if (categorieslineHolder != null) {
        categorieslineHolder.forEach((line, index) => {
          this.categorieslines.push({
            CategoryId: line.CategoryId,
            CategoryName: line.CategoryName,
            MinCategoryLoanAmount: line.MinCategoryLoanAmount,
            MaxCategoryLoanAmount: line.MaxCategoryLoanAmount,
            MinCategoryTenor: line.MinCategoryTenor,
            MaxCategoryTenor: line.MaxCategoryTenor,
            MinCategoryInterestRate: line.MinCategoryInterestRate,
            MaxCategoryInterestRate: line.MaxCategoryInterestRate,
            MinCategoryDsr: line.MinCategoryDsr,
            MaxCategoryDsr: line.MaxCategoryDsr,
          });
        });
      }
    } else if (type === "FeeType") {
      this.feelines[index].FeeType = data.id;
    }else if (type === "FeeApplication") {
      this.feelines[index].FeeApplication = data.id;
    } else if (type === "FeeIsMandatory") {
      this.feelines[index].FeeIsMandatory = data.id;
    }else if (type === "Branch") {
      this.selectedBranches.push(data);
    } else if (type === "Threshold") {
      this.selectedSettlementThreshold = data.id;
    } else if (type === "CategoryFees") {
      this.categoriesapplicablefeeslines.push({
        CategoryId: parentindex,
        FeeID: data.id,
        FeeName: data.text,
      });
      // this.activeCatFees[index].push({id: data.id, text: data.text})
    } else if (type === "RepaymentType") {
      this.selectedRepaymentType = data.text;
    } else if (type === "ApplicablePlatform") {
      let check = this.selectedPlatforms.some((x) => x == data.text);
      if (!check) {
        this.selectedPlatforms.push(data.text);
      }
    } else if (type === "InterestRateUnit") {
      this.selectedInterestRateUnit = data.text;
    } else if (type === "DaysInAYear") {
      this.selectedDayInAYear = data.text;
      if (this.editMode) {
        this.EditLoanTypeForm.get("DaysInAYear").setValue(data.text);
      } else {
        this.AddLoanTypeForm.get("DaysInAYear").setValue(data.text);
      }
    }
  }

  setSelected(type, row, currentindex, clientid, serverid) {
    const selectedArray = new Array();
    if (type === "FeeName") {
      row.forEach((line, index) => {
        if (currentindex === index) {
          if (line.FeeID) {
            selectedArray.push({ id: line.FeeID, text: line.FeeName });
            this.editFeeLines[index].FeeID = line.FeeID;
            this.editFeeLines[index].FeeName = line.FeeName;
          }
        }
      });
    } else if (type === "FeeType") {
      row.forEach((line, index) => {
        if (currentindex === index) {
          if (line.FeeID) {
            selectedArray.push({ id: line.FeeType, text: line.FeeType });
            this.editFeeLines[index].FeeType = line.FeeType;
          }
          //      this.editFeeLines[index].FeeType = "";
        }
      });
    } else if (type === "FeeApplication") {
      row.forEach((line, index) => {
        if (currentindex === index) {
          if (line.FeeID) {
            selectedArray.push({ id: line.FeeApplication, text: line.FeeApplication });
            this.editFeeLines[index].FeeApplication = line.FeeApplication;
          }
          //      this.editFeeLines[index].FeeType = "";
        }
      });
    }else if (type === "FeeIsMandatory") {
        row.forEach((line, index) => {
          if (currentindex === index) {
            if (line.FeeID) {
              selectedArray.push({ id: line.FeeIsMandatory, text: line.FeeIsMandatory });
              this.editFeeLines[index].FeeIsMandatory = line.FeeIsMandatory;
            }
            //      this.editFeeLines[index].FeeType = "";
          }
        });
    }else if (type === "Trigger") {
      row.forEach((line, index) => {
        if (currentindex === index) {
          //  this.editLines[index].Trigger = "";
          selectedArray.push({ id: line.Trigger, text: line.Trigger });
          this.editLines[index].Trigger = line.Trigger;
        }
      });
    } else if (type === "Access") {
      row.forEach((line, index) => {
        if (currentindex === index) {
          selectedArray.push({ id: line.ViewAccess, text: line.ViewAccess });
          this.editLines[index].ViewAccess = line.ViewAccess;
        }
      });
    } else if (type === "CategoryFees") {
      var selectedFeeArray = row;

      //clear current categories holder
      // this.categoriesapplicablefeeslines[currentindex] = [];

      if (selectedFeeArray !== null && selectedFeeArray !== "") {
        selectedFeeArray.forEach((line, index) => {
          //verifies that its the same category row
          if (clientid === line.CategoryId) {
            //checks if global fees is updated
            const found = this.feelines.some(
              (item) => item.FeeID === line.FeeID
            );

            if (found) {
              //push each row's application fee
              selectedArray.push({ id: line.FeeID, text: line.FeeName });

              //add to the new categories holder array
              // this.categoriesapplicablefeeslines.push({ CategoryId: parentid, FeeID: line.FeeID, FeeName: line.FeeName});

              //remember to update the categoriesfeelines when posting to the server
            }
          }
        });
      }
    } else if (type === "EditCategoryFees") {
      var clientIdAvailable = typeof clientid !== "undefined" ? true : false;

      //loop through array
      //insert in each row by their respective indexes

      var applicableFeesArray = row;
      if (applicableFeesArray !== null && applicableFeesArray !== "") {
        //loop through whole array
        applicableFeesArray.forEach((categoryline, index) => {
          if (clientIdAvailable) {
            //verify if applicable fees on the row is not empty
            if (categoryline !== "" && categoryline !== null) {
              //check for current row to update content
              if (categoryline.CategoryId == clientid) {
                //checks if global edit fees is updated
                const found = this.editFeeLines.some(
                  (item) => item.FeeID === categoryline.FeeID
                );

                if (found) {
                  //push each row's application fee
                  selectedArray.push({
                    id: categoryline.FeeID,
                    text: categoryline.FeeName,
                  });
                }
              }
            }
          } else {
            //serverid used to
            //verify if applicable fees on the row is not empty
            if (categoryline !== "" && categoryline !== null) {
              //check for current row to update content
              if (categoryline.Id == serverid) {
                //checks if global edit fees is updated
                const found = this.editFeeLines.some(
                  (item) => item.FeeID === categoryline.FeeID
                );

                if (found) {
                  //push each row's application fee
                  selectedArray.push({
                    id: categoryline.FeeID,
                    text: categoryline.FeeName,
                  });

                  //checks if fee row exit in global category array
                  //const feelinefound = this.editFeeLines.some(item => item.FeeID === categoryline.FeeID);
                }
              }
            }
          }
        });
      }
    }

    return selectedArray;
  }

  selectedEdit(type, data, index, clientid, serverid) {
    if (type === "Trigger") {
      this.editLines[index].Trigger = data.id;
    } else if (type === "RepaymentBalanceType") {
      this.selectedRepaymentBalanceType = [data];
    } else if (type === "Access") {
      this.editLines[index].ViewAccess = data.id;
    } else if (type === "Repayment") {
      this.selectedRepaymentMethods.push(data.id);
    } else if (type === "Fee") {
      this.editFeeLines[index].FeeID = data.id;
      this.editFeeLines[index].FeeName = data.text;

      //Triggers the categories fee to reflect update

      //store previous categories entries before emptying the variable.
      const categorieslineHolder = this.editCategoryLines;
      this.editCategoryLines = [];

      // update category array with general applicable fees
      this.editcategoryApplicableFeesArray = [];
      this.editFeeLines.forEach((line, innerindex) => {
        this.editcategoryApplicableFeesArray.push({
          id: line.FeeID,
          text: line.FeeName,
        });
      });

      // populates former entries in the background
      if (categorieslineHolder != null) {
        categorieslineHolder.forEach((line, index) => {
          this.editCategoryLines.push({
            Id: line.Id,
            CategoryId: line.CategoryId,
            CategoryName: line.CategoryName,
            MinCategoryLoanAmount: line.MinCategoryLoanAmount,
            MaxCategoryLoanAmount: line.MaxCategoryLoanAmount,
            MinCategoryTenor: line.MinCategoryTenor,
            MaxCategoryTenor: line.MaxCategoryTenor,
            MinCategoryInterestRate: line.MinCategoryInterestRate,
            MaxCategoryInterestRate: line.MaxCategoryInterestRate,
            MinCategoryDsr: line.MinCategoryDsr,
            MaxCategoryDsr: line.MaxCategoryDsr,
            CategoryApplicableFees: line.CategoryApplicableFees,
          });
        });
      }
    } else if (type === "FeeType") {
      this.editFeeLines[index].FeeType = data.id;
    } else if (type === "FeeApplication") {
      this.editFeeLines[index].FeeApplication = data.id;
    }
    else if (type === "FeeIsMandatory") {
      this.editFeeLines[index].FeeIsMandatory = data.id;
    } else if (type === "Branch") {
      this.selectedBranches.push(data);
    } else if (type === "RepaymentType") {
      this.selectedRepaymentType = data.text;
    } else if (type === "CategoryFees") {
      this.editCategoryApplicableFeesLines.push({
        Id: serverid,
        CategoryId: clientid,
        FeeID: data.id,
        FeeName: data.text,
      });

      // this.activeEditCatFees[index].push({id: data.id, text: data.text})
    }
  }

  submitEditLoanTypeForm(val: any) {
    if (this.EditLoanTypeForm.valid) {
      const repaymentBalanceType = this.repaymentBalanceTypes.find((rbt) => {
        return this.selectedRepaymentBalanceType[0].text === rbt.text;
      });

      this.loader = true;
      const entry_lines = [];
      const credit_lines = [];
      const fee_lines = [];
      var topup_line = null;
      var buyover_line = null;
      const category_lines = [];

      if (this.selectedRepaymentMethods.length < 1) {
        swal.fire({
          type: "error",
          title: "Error",
          text: "Repayment Method selection cannot be empty",
        });
        this.loader = false;
        return false;
      }

      if (
        this.selectedRepaymentType === null ||
        this.selectedRepaymentType === ""
      ) {
        swal.fire({
          type: "error",
          title: "Error",
          text: "Repayment Type selection cannot be empty",
        });
        this.loader = false;
        return false;
      }

      if (
        this.selectedInterestRateUnit === null ||
        this.selectedInterestRateUnit === ""
      ) {
        swal.fire({
          type: "error",
          title: "Error",
          text: "Interest Rate Unit selection cannot be empty",
        });
        this.loader = false;
        return false;
      }

      if (this.editFeeLines != null) {
        this.editFeeLines.forEach((line, index) => {
          line.FeeAmount = line.FeeAmount == null ? 0 : line.FeeAmount;

          if (line.FeeType === null || line.FeeName === null) {
            return false;
          } else {
            fee_lines.push(line);
          }
        });
      }

      if (this.editTopUplines != null) {
        this.editTopUplines.forEach((line, index) => {
          if (
            line.VolumeOfRepayments === null ||
            line.LateRepaymentsAllowable === null ||
            line.TopUpDsr === null
          ) {
            return false;
          } else {
            line.VolumeOfRepayments =
              line.VolumeOfRepayments == null ? 0 : line.VolumeOfRepayments;
            line.LateRepaymentsAllowable =
              line.LateRepaymentsAllowable == null
                ? 0
                : line.LateRepaymentsAllowable;
            line.TopUpDsr = line.TopUpDsr == null ? 0 : line.TopUpDsr;

            topup_line = {
              VolumeOfRepayments: line.VolumeOfRepayments,
              LateRepaymentsAllowable: line.LateRepaymentsAllowable,
              TopUpDsr: line.TopUpDsr,
            };
          }
        });
      }

      if (this.editBuyOverlines != null) {
        this.editBuyOverlines.forEach((line, index) => {
          if (line.MinimumTransferrableAmount === null) {
            return false;
          } else {
            line.MinimumTransferrableAmount =
              line.MinimumTransferrableAmount == null
                ? 0
                : line.MinimumTransferrableAmount;
            buyover_line = {
              MinimumTransferrableAmount: line.MinimumTransferrableAmount,
            };
          }
        });
      }

      if (this.editCategoryLines != null) {
        this.editCategoryLines.forEach((line, index) => {
          let categoryApplicableFeesholder = [
            { Id: null, CategoryId: null, FeeID: null, FeeName: null },
          ];

          line.MinCategoryLoanAmount =
            line.MinCategoryLoanAmount == null ? 0 : line.MinCategoryLoanAmount;
          line.MaxCategoryLoanAmount =
            line.MaxCategoryLoanAmount == null ? 0 : line.MaxCategoryLoanAmount;
          line.MinCategoryTenor =
            line.MinCategoryTenor == null ? 0 : line.MinCategoryTenor;
          line.MaxCategoryTenor =
            line.MaxCategoryTenor == null ? 0 : line.MaxCategoryTenor;
          line.MinCategoryInterestRate =
            line.MinCategoryInterestRate == null
              ? 0
              : line.MinCategoryInterestRate;
          line.MaxCategoryInterestRate =
            line.MaxCategoryInterestRate == null
              ? 0
              : line.MaxCategoryInterestRate;
          line.MinCategoryDsr =
            line.MinCategoryDsr == null ? 0 : line.MinCategoryDsr;
          line.MaxCategoryDsr =
            line.MaxCategoryDsr == null ? 0 : line.MaxCategoryDsr;

          this.editCategoryApplicableFeesLines.forEach(
            (innerLine, innerIndex) => {
              //checks if global fees is updated
              const found = this.editFeeLines.some(
                (item) => item.FeeID === innerLine.FeeID
              );

              if (
                line.CategoryId !== null &&
                line.CategoryId === innerLine.CategoryId
              ) {
                if (found) {
                  categoryApplicableFeesholder.push({
                    Id: innerLine.Id,
                    CategoryId: innerLine.CategoryId,
                    FeeID: innerLine.FeeID,
                    FeeName: innerLine.FeeName,
                  });
                }
              } else if (line.Id !== null && line.Id === innerLine.Id) {
                if (found) {
                  categoryApplicableFeesholder.push({
                    Id: innerLine.Id,
                    CategoryId: innerLine.CategoryId,
                    FeeID: innerLine.FeeID,
                    FeeName: innerLine.FeeName,
                  });
                }
              }
            }
          );

          for (var i = 0; i < categoryApplicableFeesholder.length; i++) {
            //remove null items from array
            if (categoryApplicableFeesholder[i].FeeID === null) {
              categoryApplicableFeesholder.splice(i, 1);
            }
          }

          line.CategoryApplicableFees = JSON.stringify(
            categoryApplicableFeesholder
          );

          if (line.CategoryName === null) {
            return false;
          } else {
            category_lines.push(line);
          }
        });
      }

      this.EditLoanTypeForm.controls["RepaymentMethods"].patchValue(
        JSON.stringify(this.selectedRepaymentMethods)
      );
      this.EditLoanTypeForm.controls["RepaymentType"].patchValue(
        this.selectedRepaymentType
      );
      this.EditLoanTypeForm.controls["AlternativeConditions"].patchValue(
        JSON.stringify(entry_lines)
      );
      this.EditLoanTypeForm.controls["CreditScoringRule"].patchValue(
        JSON.stringify(credit_lines)
      );
      this.EditLoanTypeForm.controls["ApplicableFees"].patchValue(
        JSON.stringify(fee_lines)
      );
      this.EditLoanTypeForm.controls["topUpConstraints"].patchValue(
        this.EditTopupConstraintForm.value
      );
      this.EditLoanTypeForm.controls["BuyOverConstraints"].patchValue(
        JSON.stringify(buyover_line)
      );
      this.EditLoanTypeForm.controls["LoanTypeCategories"].patchValue(
        JSON.stringify(category_lines)
      );
      this.EditLoanTypeForm.controls["UserId"].patchValue(this.currentuserid);
      this.EditLoanTypeForm.controls["BranchId"].patchValue(
        this.currentuserbranchid
      );
      this.EditLoanTypeForm.controls["BranchesApplicable"].patchValue(
        JSON.stringify(this.selectedBranches)
      );
      this.EditLoanTypeForm.controls["ThresholdParameterId"].patchValue(
        this.selectedSettlementThreshold
      );
      this.EditLoanTypeForm.controls["ApplicablePlatform"].patchValue(
        this.selectedPlatforms
      );
      this.EditLoanTypeForm.controls["DaysInAYear"].patchValue(
        this.selectedDayInAYear
      );
      this.EditLoanTypeForm.controls["RepaymentBalanceType"].patchValue(
        repaymentBalanceType.value
      );
      this.EditLoanTypeForm.controls["RateUnit"].patchValue(
        this.selectedInterestRateUnit
      );

      this.configurationService
        .EditLoanType(this.EditLoanTypeForm.value)
        .subscribe(
          (res) => {
            swal.fire({
              type: "success",
              text: "Loan Type has been updated",
              title: "Successful",
            });
            this.modalService.dismissAll();

            this.EditLoanTypeForm.reset();
            this.selectedRepaymentMethods = [];
            // tslint:disable-next-line:max-line-length
            this.editLines = [
              {
                Trigger: null,
                MinConditionLoanAmount: null,
                MaxConditionLoanAmount: null,
                MinConditionRange: null,
                MaxConditionRange: null,
                MinConditionInterestRate: null,
                MaxConditionInterestRate: null,
                MinConditionDsr: null,
                MaxConditionDsr: null,
                ViewAccess: null,
              },
            ];
            this.editCreditLines = [
              {
                Description: null,
                MinCreditScore: null,
                MaxCreditScore: null,
                Tag: null,
              },
            ];
            this.editFeeLines = [
              { FeeID: null, FeeName: null,   FeeApplication: null, FeeType: null, FeeAmount: null, FeeIsMandatory: null },
            ];
            this.editCategoryLines = [
              {
                CategoryId: null,
                CategoryName: null,
                MinCategoryLoanAmount: null,
                MaxCategoryLoanAmount: null,
                MinCategoryTenor: null,
                MaxCategoryTenor: null,
                MinCategoryInterestRate: null,
                MaxCategoryInterestRate: null,
                MinCategoryDsr: null,
                MaxCategoryDsr: null,
              },
            ];
            this.editTopUplines = [
              {
                VolumeOfRepayments: null,
                LateRepaymentsAllowable: null,
                TopUpDsr: null,
              },
            ];
            this.editBuyOverlines = [{ MinimumTransferrableAmount: null }];
            this.editCategoryApplicableFeesLines = [
              { Id: null, CategoryId: null, FeeID: null, FeeName: null },
            ];

            this.switchviews(1);
            this.loader = false;
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  getConstants() {
    this.configurationService
      .spoolRecoveryMeasuresforSelect(this.currentuserbranchid)
      .subscribe(
        (response) => {
          this.recoveryMeasuresArray = [];
          if (response.body != null) {
            response.body.forEach((element) => {
              this.recoveryMeasuresArray.push({
                id: element.recoveryMeasureId,
                text: element.recoveryMeasureName,
              });
            });
          }
        },
        (error) => {}
      );

    this.configurationService
      .spoolRejectionReasonsforSelect(this.currentuserbranchid)
      .subscribe(
        (response) => {
          this.rejectionReasonsArray = [];
          response.body.forEach((element) => {
            this.rejectionReasonsArray.push({
              id: element.noteId,
              text: element.noteName,
            });
          });
        },
        (error) => {}
      );

    this.configurationService
      .spoolFeesforSelect(this.currentuserbranchid)
      .subscribe(
        (response) => {
          this.feesArray = [];
          response.body.forEach((element) => {
            this.feesArray.push({ id: element.feeId, text: element.feeName });
          });
        },
        (error) => {}
      );

    this.configurationService
      .spoolthresholdparametersforSelect(this.currentuserbranchid)
      .subscribe(
        (response) => {
          this.thresholdparametersArray = [];
          response.body.forEach((element) => {
            // tslint:disable-next-line:max-line-length
            this.thresholdparametersArray.push({
              id: element.thresholdParameterId,
              text:
                element.thresholdParameterName +
                ": " +
                element.thresholdParameterValue,
            });
          });
        },
        (error) => {}
      );

    const datamodel = {};

    this.configurationService.spoolBranches(datamodel).subscribe(
      (response) => {
        this.branchesArray = [];
        response.body.forEach((element) => {
          this.branchesArray.push({
            id: element.branchId,
            text: element.branchName,
          });
        });
      },
      (error) => {}
    );

    this.requestLoader = false;
  }

  addRow() {
    // tslint:disable-next-line:max-line-length
    this.lines.push({
      Trigger: null,
      MinConditionLoanAmount: null,
      MaxConditionLoanAmount: null,
      MinConditionRange: null,
      MaxConditionRange: null,
      MinConditionInterestRate: null,
      MaxConditionInterestRate: null,
      MinConditionDsr: null,
      MaxConditionDsr: null,
      ViewAccess: null,
    });
  }

  addCategoryRow() {
    this.globalCategoriesCounter = this.globalCategoriesCounter + 1;
    // tslint:disable-next-line:max-line-length
    this.categorieslines.push({
      CategoryId: this.globalCategoriesCounter + 1,
      CategoryName: null,
      MinCategoryLoanAmount: null,
      MaxCategoryLoanAmount: null,
      MinCategoryTenor: null,
      MaxCategoryTenor: null,
      MinCategoryInterestRate: null,
      MaxCategoryInterestRate: null,
      MinCategoryDsr: null,
      MaxCategoryDsr: null,
    });
    this.categoriesapplicablefeeslines.push({
      CategoryId: null,
      FeeID: null,
      FeeName: null,
      FeeType: null,
      FeeApplication: null,
      FeeIsMandatory: null
    });
    this.activeCatFees.push([]);
  }

  paginationPopover() {
    $(".pagination-menu").toggle();
  }

  addFeeRow() {
    this.feelines.push({
      FeeID: null,
      FeeName: null,
      FeeApplication: null,
      FeeType: null,
      FeeAmount: null,
      FeeIsMandatory: null
    });
  }

  addCreditRow() {
    this.creditlines.push({
      Description: null,
      MinCreditScore: null,
      MaxCreditScore: null,
      Tag: null,
    });
  }

  addEditRow() {
    // tslint:disable-next-line:max-line-length
    this.editLines.push({
      Trigger: null,
      MinConditionLoanAmount: null,
      MaxConditionLoanAmount: null,
      MinConditionRange: null,
      MaxConditionRange: null,
      MinConditionInterestRate: null,
      MaxConditionInterestRate: null,
      MinConditionDsr: null,
      MaxConditionDsr: null,
      ViewAccess: null,
    });
  }

  addEditFeeRow() {
    this.editFeeLines.push({
      FeeID: null,
      FeeName: null,
      FeeApplication: null,
      FeeType: null,
      FeeAmount: null,
      FeeIsMandatory: null
    });
  }

  addEditCategoryRow() {
    this.editGlobalCategoriesCounter = this.editGlobalCategoriesCounter + 1;
    // tslint:disable-next-line:max-line-length
    this.editCategoryLines.push({
      CategoryId: this.editGlobalCategoriesCounter + 1,
      CategoryName: null,
      MinCategoryLoanAmount: null,
      MaxCategoryLoanAmount: null,
      MinCategoryTenor: null,
      MaxCategoryTenor: null,
      MinCategoryInterestRate: null,
      MaxCategoryInterestRate: null,
      MinCategoryDsr: null,
      MaxCategoryDsr: null,
      CategoryApplicableFees: null,
    });
    this.editCategoryApplicableFeesLines.push({
      Id: null,
      CategoryId: null,
      FeeID: null,
      FeeName: null,
      FeeType: null,
      FeeApplication: null,
      FeeIsMandatory: null
    });

    this.activeEditCatFees.push([]);
  }

  addEditCreditRow() {
    this.editCreditLines.push({
      Description: null,
      MinCreditScore: null,
      MaxCreditScore: null,
      Tag: null,
    });
  }

  setDescription($e, i) {
    this.creditlines[i].Description = $e;
  }

  setTag($e, i) {
    this.creditlines[i].Tag = $e;
  }

  setCategory($e, i) {
    this.categorieslines[i].CategoryName = $e;
  }

  setEditDescription($e, i) {
    this.editCreditLines[i].Description = $e;
  }

  setEditTag($e, i) {
    this.editCreditLines[i].Tag = $e;
  }

  setEditCategory($e, i) {
    this.editCategoryLines[i].CategoryName = $e;
  }

  removeRow(i) {
    this.lines.splice(i, 1);
  }

  removeEditRow(i) {
    this.editLines.splice(i, 1);
  }

  removeFeeRow(i) {
    let removedFee = this.feelines[i];
    this.feelines.splice(i, 1);
    this.categoryApplicableFeesArray.splice(
      this.categoryApplicableFeesArray.findIndex(
        (fee) => fee.id === removedFee.FeeID
      ),
      1
    );

    let newArray = [];
    this.categoryApplicableFeesArray.forEach((element) => {
      newArray.push(element);
    });
    this.categoryApplicableFeesArray = newArray;

    let newcatfeelines = this.activeCatFees;
    newcatfeelines.forEach((element, index) => {
      element.splice(
        element.findIndex((x) => x.id == removedFee.FeeID),
        1
      );
      this.activeCatFees[index] = [...element];
    });
  }

  removeEditFeeRow(i) {
    let removedFee = this.editFeeLines[i];
    this.editFeeLines.splice(i, 1);
    this.editcategoryApplicableFeesArray.splice(
      this.editcategoryApplicableFeesArray.findIndex(
        (fee) => fee.id === removedFee.FeeID
      ),
      1
    );
    let newArray = [];
    this.editcategoryApplicableFeesArray.forEach((element) => {
      newArray.push(element);
    });
    this.editcategoryApplicableFeesArray = newArray;

    let newcatfeelines = this.activeEditCatFees;
    newcatfeelines.forEach((element, index) => {
      element.splice(
        element.findIndex((x) => x.id == removedFee.FeeID),
        1
      );
      this.activeEditCatFees[index] = [...element];
    });
  }

  removeCreditRow(i) {
    this.creditlines.splice(i, 1);
  }

  removeEditCreditRow(i) {
    this.editCreditLines.splice(i, 1);
  }

  removeCategoryRow(i) {
    this.categorieslines.splice(i, 1);
    this.activeCatFees.splice(i, 1);
  }

  removeEditCategoryRow(i) {
    this.editCategoryLines.splice(i, 1);
    this.activeEditCatFees.splice(i, 1);
  }

  removed(type, data, index, serverid, clientid) {
    if (type === "Rejection") {
      this.selectedRejectionReasonsIDs.splice(
        this.selectedRejectionReasonsIDs.indexOf(data.id),
        1
      );
    } else if (type === "Recovery") {
      this.selectedRecoveryMeasureIDs.splice(
        this.selectedRecoveryMeasureIDs.indexOf(data.id),
        1
      );
    } else if (type === "Access") {
      this.lines[index].ViewAccess.splice(
        this.lines[index].ViewAccess.indexOf(data.id),
        1
      );
    } else if (type === "Repayment") {
      this.selectedRepaymentMethods.splice(
        this.selectedRepaymentMethods.indexOf(data.id),
        1
      );
    } else if (type === "Branch") {
      this.selectedBranches.splice(this.selectedBranches.indexOf(data.id), 1);
    } else if (type === "CategoryFees") {
      var clientIdAvailable = typeof clientid !== "undefined" ? true : false;
      for (var i = 0; i < this.categoriesapplicablefeeslines.length; i++) {
        //remove  items from array
        if (this.categoriesapplicablefeeslines[i].Id === serverid) {
          this.categoriesapplicablefeeslines.splice(i, 1);
        } else if (
          clientIdAvailable &&
          this.categoriesapplicablefeeslines[i].CategoryId === clientid
        ) {
          this.categoriesapplicablefeeslines.splice(i, 1);
        }
      }
    } else if (type === "EditCategoryFees") {
      var clientIdAvailable = typeof clientid !== "undefined" ? true : false;
      for (var i = 0; i < this.editCategoryApplicableFeesLines.length; i++) {
        //remove  items from array
        if (this.editCategoryApplicableFeesLines[i].Id === serverid) {
          this.editCategoryApplicableFeesLines.splice(i, 1);
        } else if (
          clientIdAvailable &&
          this.editCategoryApplicableFeesLines[i].CategoryId === clientid
        ) {
          this.editCategoryApplicableFeesLines.splice(i, 1);
        }
      }
    } else if (type === "ApplicablePlatform") {
      this.selectedPlatforms.splice(
        this.selectedPlatforms.indexOf(data.text),
        1
      );
    } else if (type === "Threshold") {
      this.selectedSettlementThreshold = null;
    }
  }

  controlCondtionView() {}

  setTrigger($e, i) {
    this.lines[i].Trigger = $e.id;
  }

  setAccess($e, i) {
    this.lines[i].ViewAccess = $e.id;
  }

  // removeFromArray(arr, value){

  // }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;

    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getLoanTypes(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination.searchTerm = filter === "" ? null : filter;
    this.getLoanTypes(pageNumber, filter);
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentuser = user.body;
          this.currentuserid = this.currentuser.userId;
          this.currentuserbranchid = this.currentuser.branchId;
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  refreshSelect() {
    this.showSelect = false;
    this.showSelect = true;
  }
}
