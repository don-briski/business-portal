import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  FormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  FormControl,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { map, pluck, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Step, StepStatus } from "../../shared/shared.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { nonZero } from "src/app/util/validators/validators";
import Swal from "sweetalert2";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { LoanType, LoanTypeForm } from "../../loan-section/loan.types";
import { RemitaIntegrationNameEnum } from "src/app/model/configuration";
import { LOAN_REPAYMENT_BALANCE_TYPES } from "../../shared/helpers/generic.helpers";

@Component({
  selector: "lnd-loan-type-setup",
  templateUrl: "./loan-type-setup.component.html",
  styleUrls: ["./loan-type-setup.component.scss"],
})
export class LoanTypeSetupComponent implements OnInit, OnDestroy {
  loanTypeForm: FormGroup<LoanTypeForm>;
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject();
  stepStatusEnum = StepStatus;
  currentStepIndex = 0;

  steps: Step[] = [
    {
      id: "loanDetails",
      stage: "Loan Details",
      type: "Configuration",
      status: this.stepStatusEnum.current,
    },
    {
      id: "termsAndParameters",
      stage: "Loan Parameters",
      type: "Customization",
      status: this.stepStatusEnum.pending,
    },
    {
      id: "repayment",
      stage: "Repayment Structure",
      type: "Payment and Access",
      status: this.stepStatusEnum.pending,
    },
    {
      id: "applicableFees",
      stage: "Applicable Fees",
      type: "Set Fees (Optional)",
      status: this.stepStatusEnum.pending,
    },
    {
      id: "topUpConstraints",
      stage: "Top-up Constraints",
      type: "Set Restrictions (Optional)",
      status: this.stepStatusEnum.pending,
    },
  ];
  branches: CustomDropDown[] = [];
  selectedBranches: CustomDropDown[] = [];
  applicablePlatforms: string[] = ["Web", "Mobile", "Ussd"];
  selectedAppPlatforms: string[] = [];
  repaymentType: string[] = ["Day", "Week", "Month", "Year"];
  selectedRepaymentType: CustomDropDown[];
  repaymentBalanceType = LOAN_REPAYMENT_BALANCE_TYPES;
  repaymentMethods: string[] = [];
  selectedRepaymentMethods: string[] = [];
  loggedInUser;
  thresholdparameters;
  daysInYear: number[] = [360, 365, 366];
  feeCalculation: string[] = ["Deducted Upfront", "Capitalized"];
  feeTypes: string[] = ["Percentage", "Flat Rate"];
  feeMandatoryOptions: string[] = ["Yes", "No"];
  fees: CustomDropDown[] = [];
  isLoading = false;
  isInitializing = false;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  loanType: LoanType;
  selectedRepaymentBalType: CustomDropDown[];
  selectedThreshold: CustomDropDown[];
  selectedLoanTypeId: number;
  currentUserBranchId: number;
  interestRateUnitArray: CustomDropDown[] = [
    { id: "PerDay", text: "Per Day" },
    { id: "PerWeek", text: "Per Week" },
    { id: "PerMonth", text: "Per Month" },
    { id: "PerYear", text: "Per Year" },
  ];
  depositType: CustomDropDown[] = [
    { id: "Fixed", text: "Fixed Amount" },
    { id: "Percent", text: "Percentage of Loan Amount" },
  ];
  selectedInterestRateUnit: CustomDropDown[];
  isClearingRepaymentType = false;
  approvalWorkflows: CustomDropDown[] = [];
  gettingApprovalWorkflows = false;

  constructor(
    private fb: UntypedFormBuilder,
    private colorThemeService: ColorThemeService,
    private configurationService: ConfigurationService,
    private loanOperationService: LoanoperationsService,
    private userService: UserService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.url.pipe(takeUntil(this.unsubscriber$)).subscribe((res: any) => {
      if (res[1].path === "edit") {
        this.route.paramMap
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe((params: ParamMap) => {
            this.selectedLoanTypeId = +params.get("id");
          });
      }
    });

    this.loggedInUser = this.authService.decodeToken();
    this.loadTheme();
    this.getBranches();
    this.getRepaymentMethods();
    this.initLoanTypeForm();
    this.getUserBranchId();
    this.getLoanApprovalWorkflows();

    if (this.selectedLoanTypeId) {
      this.getLoanType(this.selectedLoanTypeId);
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

  private getLoanType(loanTypeId) {
    this.isInitializing = true;
    this.configurationService
      .getLoanType({ loanTypeId })
      .pipe(
        pluck("body"),
        map((loanType) => ({
          ...loanType,
          branchesApplicable: JSON.parse(loanType?.branchesApplicable),
          applicablePlatform: loanType?.applicablePlatform,
          repaymentMethods: JSON.parse(loanType?.repaymentMethods),
          topUpConstraints: loanType?.topUpConstraints,
        })),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((res) => {
        this.loanType = res;
        this.patchLoanTypeForm(this.loanType);
        this.isInitializing = false;
      });
  }

  private initLoanTypeForm() {
    this.loanTypeForm = new FormGroup<LoanTypeForm>({
      status: new FormControl("NonActive"),
      userId: new FormControl(null, Validators.required),
      loanDetails: this.fb.group({
        loanName: new FormControl("", Validators.required),
        loanTypeCode: new FormControl("", Validators.required),
        branchesApplicable: new FormControl("", Validators.required),
        applicablePlatform: new FormControl("", Validators.required),
        termsAndConditions: new FormControl(""),
      }),
      termsAndParameters: this.fb.group({
        interestRate: new FormControl("", Validators.required),
        rateUnit: new FormControl("", Validators.required),
        loanTypeTenor: new FormControl("", Validators.required),
        minAmount: new FormControl("", Validators.required),
        maxAmount: new FormControl("", Validators.required),
        dsrRate: new FormControl(""),
        isDepositRequired: new FormControl(false),
        depositType: new FormControl(null),
        depositValue: new FormControl(0),
      }),
      repayment: this.fb.group({
        repaymentType: new FormControl("", Validators.required),
        repaymentBalanceType: new FormControl("", Validators.required),
        repaymentMethods: new FormControl("", Validators.required),
        accountClosureValue: new FormControl(""),
        thresholdParameterId: new FormControl(""),
        daysInAYear: new FormControl("", Validators.required),
      }),
      topUpConstraints: this.fb.group({
        isTopUpActive: new FormControl(false),
        volumeOfRepaymentsIsActive: new FormControl(false),
        volumeOfRepayments: new FormControl(""),
        lateRepaymentsAllowableIsActive: new FormControl(false),
        lateRepaymentsAllowable: new FormControl(""),
        topUpDsrIsActive: new FormControl(false),
        topUpDsr: new FormControl(""),
        numberOfRepaymentsIsActive: new FormControl(""),
        numberOfRepayments: new FormControl(""),
        minLoanTenorIsActive: new FormControl(""),
        minLoanTenor: new FormControl(""),
      }),
      applicableFees: this.fb.array([]),
      loanApplicationWorkflow: new FormControl(""),
      loanApplicationWorkflowId: new FormControl(""),
      isMultiLevelLoanApproval: new FormControl(false),
    });

    this.loanTypeForm.valueChanges
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(() => {
        this.updateStepStatus();
      });
  }

  private updateStepStatus() {
    if (
      this.loanTypeForm.get("loanDetails").touched &&
      this.loanTypeForm.get("loanDetails").valid
    ) {
      this.steps[0].status = this.stepStatusEnum.complete;
    } else if (
      this.loanTypeForm.get("loanDetails").touched &&
      this.loanTypeForm.get("loanDetails").invalid &&
      this.steps[0].status === this.stepStatusEnum.current
    ) {
      this.steps[0].status = this.stepStatusEnum.invalid;
    }

    if (
      this.loanTypeForm.get("termsAndParameters").touched &&
      this.loanTypeForm.get("termsAndParameters").valid
    ) {
      this.steps[1].status = this.stepStatusEnum.complete;
    } else if (
      this.loanTypeForm.get("termsAndParameters").touched &&
      this.loanTypeForm.get("termsAndParameters").invalid &&
      this.steps[1].status === this.stepStatusEnum.current
    ) {
      this.steps[1].status = this.stepStatusEnum.invalid;
    }

    if (
      this.loanTypeForm.get("repayment").touched &&
      this.loanTypeForm.get("repayment").valid
    ) {
      this.steps[2].status = this.stepStatusEnum.complete;
    } else if (
      this.loanTypeForm.get("repayment").touched &&
      this.loanTypeForm.get("repayment").invalid &&
      this.steps[2].status === this.stepStatusEnum.current
    ) {
      this.steps[2].status = this.stepStatusEnum.invalid;
    }

    if (
      this.loanTypeForm.get("applicableFees").touched &&
      this.loanTypeForm.get("applicableFees").valid
    ) {
      this.steps[3].status = this.stepStatusEnum.complete;
    } else if (
      this.loanTypeForm.get("applicableFees").touched &&
      this.loanTypeForm.get("applicableFees").invalid &&
      this.steps[3].status === this.stepStatusEnum.current
    ) {
      this.steps[3].status = this.stepStatusEnum.invalid;
    }

    if (
      this.loanTypeForm.get("topUpConstraints").dirty &&
      this.loanTypeForm.get("topUpConstraints").valid
    ) {
      this.steps[4].status = this.stepStatusEnum.complete;
    } else if (
      this.loanTypeForm.get("topUpConstraints").touched &&
      this.loanTypeForm.get("topUpConstraints").invalid &&
      this.steps[4].status === this.stepStatusEnum.current
    ) {
      this.steps[4].status = this.stepStatusEnum.invalid;
    }
  }

  private patchLoanTypeForm(data: any) {
    this.selectedBranches = data?.branchesApplicable;
    this.selectedAppPlatforms = data?.applicablePlatform;
    this.selectedRepaymentMethods = data?.repaymentMethods;
    this.selectedInterestRateUnit = this.interestRateUnitArray.filter(
      (unit) => unit.id === data.rateUnit
    );

    this.selectedRepaymentBalType = this.repaymentBalanceType.filter(
      (rbt) => rbt.value === data?.repaymentBalanceType
    );
    this.selectedThreshold = this.thresholdparameters?.filter(
      (threshold) => threshold.id === data?.thresholdParameterId
    );

    this.loanTypeForm.patchValue({
      status: data?.status,
      userId: this.loggedInUser.nameid,
      loanDetails: {
        loanName: data?.loanName,
        loanTypeCode: data?.loanTypeCode,
        branchesApplicable: data?.branchesApplicable,
        applicablePlatform: data?.applicablePlatform,
        termsAndConditions: data?.termsAndConditions,
      },
      termsAndParameters: {
        interestRate: data?.interestRate,
        loanTypeTenor: data?.loanTypeTenor,
        rateUnit: data?.rateUnit,
        minAmount: data?.minAmount,
        maxAmount: data?.maxAmount,
        dsrRate: data?.dsrRate,
        isDepositRequired: data?.isDepositRequired,
        depositType: data?.loanDepositSettings?.depositType,
        depositValue: data?.loanDepositSettings?.depositValue,
      },
      repayment: {
        repaymentType: data?.repaymentType,
        repaymentBalanceType: data?.repaymentBalanceType,
        repaymentMethods: data?.repaymentMethods,
        accountClosureValue: data?.accountClosureValue,
        thresholdParameterId: data?.thresholdParameterId,
        daysInAYear: data?.daysInAYear,
      },
      topUpConstraints: {
        isTopUpActive: data?.topUpConstraints?.isTopUpActive,
        volumeOfRepaymentsIsActive:
          data?.topUpConstraints?.volumeOfRepaymentsIsActive,
        volumeOfRepayments: data?.topUpConstraints?.volumeOfRepayments,
        lateRepaymentsAllowableIsActive:
          data?.topUpConstraints?.lateRepaymentsAllowableIsActive,
        lateRepaymentsAllowable:
          data?.topUpConstraints?.lateRepaymentsAllowable,
        topUpDsrIsActive: data?.topUpConstraints?.topUpDsrIsActive,
        topUpDsr: data?.topUpConstraints?.topUpDsr,
        numberOfRepaymentsIsActive:
          data?.topUpConstraints?.numberOfRepaymentsIsActive,
        numberOfRepayments: data?.topUpConstraints?.numberOfRepayments,
        minLoanTenorIsActive: data?.topUpConstraints?.minLoanTenorIsActive,
        minLoanTenor: data?.topUpConstraints?.minLoanTenor,
      },
      isMultiLevelLoanApproval: data?.isMultiLevelLoanApproval,
      loanApplicationWorkflow: data?.loanApplicationWorkflow,
      loanApplicationWorkflowId: data?.loanApplicationWorkflowId,
    });

    this.selectedRepaymentType = [
      { id: this.loanType?.repaymentType, text: this.loanType?.repaymentType },
    ];

    JSON.parse(data.applicableFees).forEach((fee) => {
      this.addFee(fee);
    });

    this.loanTypeForm.get("loanDetails").markAsTouched();
    this.loanTypeForm.get("termsAndParameters").markAsTouched();
    this.loanTypeForm.get("repayment").markAsTouched();
    this.loanTypeForm.get("applicableFees").markAsTouched();
    this.loanTypeForm.get("topUpConstraints").markAsDirty();

    this.updateStepStatus();
  }

  feeLines(): UntypedFormArray {
    return this.loanTypeForm.get("applicableFees") as UntypedFormArray;
  }

  addFee(fee?) {
    const appFee = this.fb.group({
      FeeID: new UntypedFormControl(fee?.FeeID || "", Validators.required),
      FeeName: new UntypedFormControl(fee?.FeeName || "", Validators.required),
      FeeApplication: new UntypedFormControl(
        fee?.FeeApplication || "",
        Validators.required
      ),
      FeeType: new UntypedFormControl(fee?.FeeType || "", Validators.required),
      FeeAmount: new UntypedFormControl(fee?.FeeAmount || 0, [
        Validators.required,
        nonZero.bind(this),
      ]),
      FeeIsMandatory: new UntypedFormControl(
        fee?.FeeIsMandatory || "",
        Validators.required
      ),
    });

    this.feeLines().push(appFee);
  }

  removeFee(index: number) {
    this.feeLines().removeAt(index);
  }

  private getBranches() {
    this.configurationService
      .spoolBranches({ pageNumber: 1, pageSize: 10 })
      .pipe(
        pluck("body"),
        map((branches) =>
          branches.map((branch) => ({
            id: branch.branchId,
            text: branch.branchName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((branches) => {
        this.branches = branches;
      });
  }

  private getRepaymentMethods() {
    this.loanOperationService
      .getLoanRepaymentMethods()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.repaymentMethods = res.body;
        },
      });
  }

  private getUserBranchId() {
    this.userService
      .getUserInfo(this.loggedInUser.nameid)
      .pipe(pluck("body", "branchId"), takeUntil(this.unsubscriber$))
      .subscribe((currentUserBranchId) => {
        this.currentUserBranchId = currentUserBranchId;
        this.loanTypeForm.get("userId").setValue(currentUserBranchId);
        this.getThreshold(currentUserBranchId);
        this.getFees(currentUserBranchId);
      });
  }

  private getThreshold(currentUserBranchId: number) {
    this.configurationService
      .spoolthresholdparametersforSelect(currentUserBranchId)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.thresholdparameters = [];
        response.forEach((element) => {
          this.thresholdparameters.push({
            id: element.thresholdParameterId,
            text:
              element.thresholdParameterName +
              ": " +
              element.thresholdParameterValue,
          });
        });
      });
  }

  private getFees(currentuserbranchid: number) {
    this.configurationService
      .spoolFeesforSelect(currentuserbranchid)
      .pipe(
        pluck("body"),
        map((fees) =>
          fees.map((fee) => ({ id: fee?.feeId, text: fee?.feeName }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((fees) => {
        this.fees = fees;
      });
  }

  getLoanApprovalWorkflows() {
    this.gettingApprovalWorkflows = true;

    this.configurationService
      .getLoanApprovalWorkflows({ pageNumber: 1, pageSize: 10000 })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.approvalWorkflows = res.body?.items?.map((item) => ({
            id: item.id,
            text: item.name,
          }));
          this.gettingApprovalWorkflows = false;
        },
        error: () => {
          this.gettingApprovalWorkflows = false;
        },
      });
  }

  select(
    type: string,
    data: CustomDropDown,
    selectAll?: boolean,
    index?: number
  ) {
    if (type === "branch") {
      selectAll
        ? (this.selectedBranches = this.branches)
        : (this.selectedBranches = [...this.selectedBranches, data]);

      this.loanTypeForm
        .get("loanDetails.branchesApplicable")
        .setValue(JSON.stringify(this.selectedBranches));
    }

    if (type === "platforms") {
      selectAll
        ? (this.selectedAppPlatforms = this.applicablePlatforms)
        : (this.selectedAppPlatforms = [
            ...this.selectedAppPlatforms,
            data.text,
          ]);
      this.loanTypeForm
        .get("loanDetails.applicablePlatform")
        .setValue(this.selectedAppPlatforms);
    }

    if (type === "rateUnit") {
      this.loanTypeForm.get("termsAndParameters.rateUnit").setValue(data?.id);
      if (data.id === "PerDay") {
        this.selectedRepaymentType = [
          { id: this.repaymentType[0], text: this.repaymentType[0] },
        ];
      } else if (data.id === "PerWeek") {
        this.selectedRepaymentType = [
          { id: this.repaymentType[1], text: this.repaymentType[1] },
        ];
      } else if (data.id === "PerMonth") {
        this.selectedRepaymentType = [
          { id: this.repaymentType[2], text: this.repaymentType[2] },
        ];
      } else if (data.id === "PerYear") {
        this.selectedRepaymentType = [
          { id: this.repaymentType[3], text: this.repaymentType[3] },
        ];
      }
      this.select("repaymentType", this.selectedRepaymentType[0]);
    }

    if (type === "depositType") {
      this.loanTypeForm.get("termsAndParameters.depositType").setValue(data.id);
      if (
        data.id === "Percent" &&
        this.loanTypeForm.get("termsAndParameters.depositValue").value === 0
      ) {
        this.loanTypeForm.get("termsAndParameters.depositValue").setValue(1);
        this.loanTypeForm
          .get("termsAndParameters.depositValue")
          .addValidators([Validators.min(1), Validators.max(100)]);
        this.loanTypeForm
          .get("termsAndParameters.depositValue")
          .updateValueAndValidity();
      }
    }

    if (
      type === "repaymentType" ||
      type === "repaymentBalanceType" ||
      type === "repaymentMethod" ||
      type === "daysInAYear"
    ) {
      if (!this.loanTypeForm.get("repayment").touched) {
        this.loanTypeForm.get("repayment").markAsTouched();
      }
    }

    if (type === "repaymentType") {
      this.loanTypeForm.get("repayment.repaymentType").setValue(data.id);
      this.checkForRemitaInflightCollSelection();
    }

    if (type === "repaymentBalanceType") {
      const repaymentBalanceType = this.repaymentBalanceType.find(
        (rbt) => rbt.id === data.id
      );
      if (repaymentBalanceType) {
        this.loanTypeForm
          .get("repayment.repaymentBalanceType")
          .setValue(repaymentBalanceType.value);
      }
    }

    if (type === "repaymentMethod") {
      selectAll
        ? (this.selectedRepaymentMethods = this.repaymentMethods)
        : (this.selectedRepaymentMethods = [
            ...this.selectedRepaymentMethods,
            data.text,
          ]);
      this.loanTypeForm
        .get("repayment.repaymentMethods")
        .setValue(JSON.stringify(this.selectedRepaymentMethods));
      this.checkForRemitaInflightCollSelection();
    }

    if (type === "threshold") {
      this.loanTypeForm.get("repayment.thresholdParameterId").setValue(data.id);
    }

    if (type === "daysInAYear") {
      this.loanTypeForm.get("repayment.daysInAYear").setValue(data.id);
    }

    if (type === "fee") {
      this.feeLines().at(index).get("FeeID").setValue(data.id);
      this.feeLines().at(index).get("FeeName").setValue(data.text);
    }

    if (type === "feeApplication") {
      this.feeLines().at(index).get("FeeApplication").setValue(data.id);
    }

    if (type === "feeType") {
      this.feeLines().at(index).get("FeeType").setValue(data.id);
    }

    if (type === "feeType") {
      this.feeLines().at(index).get("FeeType").setValue(data.id);
    }

    if (type === "feeMandatory") {
      this.feeLines().at(index).get("FeeIsMandatory").setValue(data.id);
    }
  }

  remove(
    type: string,
    data: CustomDropDown,
    removeAll?: boolean,
    index?: number
  ) {
    if (type === "branch") {
      removeAll
        ? (this.selectedBranches = [])
        : (this.selectedBranches = this.selectedBranches.filter(
            (branch) => branch.id !== data.id
          ));
      this.loanTypeForm
        .get("loanDetails.branchesApplicable")
        .setValue(this.selectedBranches);
    }

    if (type === "platforms") {
      removeAll
        ? (this.selectedAppPlatforms = [])
        : (this.selectedAppPlatforms = this.selectedAppPlatforms.filter(
            (platform) => platform !== data.id
          ));
      this.loanTypeForm
        .get("loanDetails.applicablePlatform")
        .setValue(this.selectedAppPlatforms);
    }

    if (type === "rateUnit") {
      this.loanTypeForm.get("termsAndParameters.rateUnit").setValue("");
    }

    if (type === "depositType") {
      this.loanTypeForm.get("termsAndParameters.depositType").setValue(null);
    }

    if (type === "repaymentType") {
      this.loanTypeForm.get("repayment.repaymentType").setValue("");
    }

    if (type === "repaymentBalanceType") {
      this.loanTypeForm.get("repayment.repaymentBalanceType").setValue("");
    }

    if (type === "repaymentMethod") {
      removeAll
        ? (this.selectedRepaymentMethods = [])
        : (this.selectedRepaymentMethods = this.selectedRepaymentMethods.filter(
            (repaymentMtd) => repaymentMtd !== data.text
          ));
      this.loanTypeForm
        .get("repayment.repaymentMethods")
        .setValue(this.selectedRepaymentMethods);
    }
    if (type === "threshold") {
      this.loanTypeForm.get("repayment.thresholdParameterId").setValue("");
    }

    if (type === "daysInAYear") {
      this.loanTypeForm.get("repayment.daysInAYear").setValue("");
    }

    if (type === "feeApplication") {
      this.feeLines().at(index).get("FeeApplication").reset("");
    }

    if (type === "feeType") {
      this.feeLines().at(index).get("FeeType").reset("");
    }

    if (type === "feeMandatory") {
      this.feeLines().at(index).get("FeeIsMandatory").reset("");
    }
  }

  checkForRemitaInflightCollSelection() {
    const inflightCollRemita = this.selectedRepaymentMethods.find(
      (method) => method === RemitaIntegrationNameEnum.InflightCollectionsRemita
    );
    const repaymentType = this.loanTypeForm.get(
      "repayment.repaymentType"
    ).value;
    if (
      inflightCollRemita &&
      repaymentType !== "" &&
      repaymentType !== "Month"
    ) {
      Swal.fire({
        type: "warning",
        title: "Warning",
        text: "Repayment method(s) includes 'Inflight Collections - Remita' which requires repayment type to be set to 'Month'.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#558E90",
      });
      this.loanTypeForm.get("repayment.repaymentType").setValue("");
      if (this.loanType) {
        this.loanType.repaymentType = "";
      }
      this.isClearingRepaymentType = true;
      setTimeout(() => (this.isClearingRepaymentType = false), 500);
    }
  }

  previous() {
    if (this.currentStepIndex > 0) {
      this.switchStep(this.currentStepIndex - 1);
      this.loanTypeForm
        .get("status")
        .setValue(this.loanTypeForm.get("status").value);
    }
  }

  next(id?: number) {
    const stepIndex = id - 1 || this.currentStepIndex;
    if (this.loanTypeForm.get(this.steps[stepIndex].id).valid) {
      this.steps[this.currentStepIndex + 1].status =
        this.stepStatusEnum.current;
      id ? (this.currentStepIndex = id) : this.currentStepIndex++;

      this.loanTypeForm
        .get("status")
        .setValue(this.loanTypeForm.get("status").value);
    }
  }

  toggleSwitch(event: boolean, switchName: string): void {
    switch (switchName) {
      case "status":
        const status = event ? "Active" : "NonActive";
        this.loanTypeForm.get("status").setValue(status);
        break;

      case "lateRepaymentsAllowableIsActive":
        this.loanTypeForm
          .get("topUpConstraints.lateRepaymentsAllowableIsActive")
          .setValue(event);
        break;

      case "topUpDsrIsActive":
        this.loanTypeForm
          .get("topUpConstraints.topUpDsrIsActive")
          .setValue(event);

        break;

      case "numberOfRepaymentsIsActive":
        this.loanTypeForm
          .get("topUpConstraints.numberOfRepaymentsIsActive")
          .setValue(event);

        break;

      case "minLoanTenorIsActive":
        this.loanTypeForm
          .get("topUpConstraints.minLoanTenorIsActive")
          .setValue(event);

        break;

      case "isTopUpActive":
        this.loanTypeForm.get("topUpConstraints.isTopUpActive").setValue(event);
        break;

      case "volumeOfRepaymentsIsActive":
        this.loanTypeForm
          .get("topUpConstraints.volumeOfRepaymentsIsActive")
          .setValue(event);
        break;

      case "isMultiLevelLoanApproval":
        this.loanTypeForm.get("isMultiLevelLoanApproval").setValue(event);
        if (!event) {
          this.loanTypeForm.get("loanApplicationWorkflowId").setValue("");
          this.loanTypeForm.get("loanApplicationWorkflow").setValue("");
        }
        break;

      case "isDepositRequired":
        this.loanTypeForm
          .get("termsAndParameters.isDepositRequired")
          .setValue(event);

        if (event) {
          this.loanTypeForm
            .get("termsAndParameters.depositType")
            .addValidators(Validators.required);

          this.loanTypeForm
            .get("termsAndParameters.depositValue")
            .addValidators(nonZero.bind(this));
        } else {
          this.loanTypeForm
            .get("termsAndParameters.depositType")
            .clearValidators();
          this.loanTypeForm.get("termsAndParameters.depositType").reset(null);
          this.loanTypeForm
            .get("termsAndParameters.depositValue")
            .clearValidators();
          this.loanTypeForm.get("termsAndParameters.depositValue").reset(0);
        }

        this.loanTypeForm
          .get("termsAndParameters.depositType")
          .updateValueAndValidity();
        this.loanTypeForm
          .get("termsAndParameters.depositValue")
          .updateValueAndValidity();
        break;
    }
  }

  switchStep(id: number) {
    this.currentStepIndex = id;

    this.steps.forEach((step) => {
      if (step.status === this.stepStatusEnum.current) {
        step.status = this.stepStatusEnum.pending;
      }
    });

    if (
      this.steps[this.currentStepIndex].status === this.stepStatusEnum.pending
    ) {
      this.steps[this.currentStepIndex].status = this.stepStatusEnum.current;
    }
  }

  onSelect(data: { type: string; value: CustomDropDown }) {
    switch (data.type) {
      case "loanApplicationWorkflow":
        this.loanTypeForm
          .get("loanApplicationWorkflowId")
          .setValue(data.value.id.toString());
        this.loanTypeForm
          .get("loanApplicationWorkflow")
          .setValue(data.value.text);
        break;
    }
  }

  onRemove(data: { type: string }) {
    switch (data.type) {
      case "loanApplicationWorkflow":
        this.loanTypeForm.get("loanApplicationWorkflowId").setValue("");
        this.loanTypeForm.get("loanApplicationWorkflow").setValue("");
        break;
    }
  }

  submit() {
    this.isLoading = true;
    this.loanTypeForm
      .get("loanDetails.branchesApplicable")
      .setValue(JSON.stringify(this.selectedBranches));

    const hasWACSRepaymentMethod = this.selectedRepaymentMethods
      .map((item) => item.toLowerCase())
      .includes("wacs");

    this.loanTypeForm
      .get("repayment.repaymentMethods")
      .setValue(JSON.stringify(this.selectedRepaymentMethods));
    let payload = {
      status: this.loanTypeForm.get("status").value,
      userId: this.loggedInUser.nameid,
      ...this.loanTypeForm.get("loanDetails").value,
      ...this.loanTypeForm.get("termsAndParameters").value,
      ...this.loanTypeForm.get("repayment").value,
      topUpConstraints: this.loanTypeForm.get("topUpConstraints").value,
      applicableFees: JSON.stringify(
        this.loanTypeForm.get("applicableFees").value
      ),
      loanApplicationWorkflow: hasWACSRepaymentMethod
        ? ""
        : this.loanTypeForm.get("loanApplicationWorkflow").value,
      loanApplicationWorkflowId: hasWACSRepaymentMethod
        ? 0
        : +this.loanTypeForm.get("loanApplicationWorkflowId").value,
      isMultiLevelLoanApproval: hasWACSRepaymentMethod
        ? false
        : this.loanTypeForm.get("isMultiLevelLoanApproval").value,
    };

    if (this.selectedLoanTypeId) {
      payload["loanTypeId"] = this.selectedLoanTypeId;
    }

    if (this.loanTypeForm.get("termsAndParameters.isDepositRequired").value) {
      payload["loanDepositSettings"] = {
        depositType: payload?.depositType,
        depositValue: payload?.depositValue,
      };
      delete payload?.depositType;
      delete payload?.depositValue;
    }


    if (!this.loanType) {
      this.configurationService
        .createLoanType(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          () => {
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: "Loan Type added successfully",
            });
            this.router.navigateByUrl("/configurations/loantypes");
          },
          () => (this.isLoading = false)
        );
    } else {
      this.configurationService
        .EditLoanType(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          () => {
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: "Loan Type updated successfully",
            });
            this.router.navigateByUrl("/configurations/loantypes");
          },
          () => (this.isLoading = false)
        );
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
