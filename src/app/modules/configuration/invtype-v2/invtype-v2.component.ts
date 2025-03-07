import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  FormArray,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Step, StepStatus } from "../../shared/shared.types";
import { nonZero } from "src/app/util/validators/validators";
import { InvestmentService } from "src/app/service/investment.service";
import Swal from "sweetalert2";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { AuthService } from "src/app/service/auth.service";
import { InvestmentType } from "../../treasury/types/investment-type.interface";

@Component({
  selector: "lnd-invtype-v2",
  templateUrl: "./invtype-v2.component.html",
  styleUrls: ["./invtype-v2.component.scss"],
})
export class InvtypeV2Component implements OnInit, OnDestroy {
  currentTheme: ColorThemeInterface;
  subs$ = new Subject();
  invTypeForm: UntypedFormGroup;
  stepStatusEnum = StepStatus;
  currentStepIndex = 0;
  interestRateTypes = ["Compounding", "Flat"];
  isLoading = false;
  isInitializing = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  steps: Step[] = [
    {
      id: "invDetails",
      stage: "Investment Details",
      type: "Configuration",
      status: this.stepStatusEnum.current,
    },
    {
      id: "fees",
      stage: "Investment Fees",
      type: "Set Fees",
      status: this.stepStatusEnum.pending,
    },
    {
      id: "parameters",
      stage: "Investment Parameters",
      type: "Customization",
      status: this.stepStatusEnum.pending,
    },
    {
      id: "certificate",
      stage: "Investment Certificate",
      type: "Certificate setup",
      status: this.stepStatusEnum.pending,
    },
  ];
  selectedInvTypeId: number;
  constructor(
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private invService: InvestmentService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.url.pipe(takeUntil(this.subs$)).subscribe((res) => {
      if (res[1].path === "edit") {
        this.route.paramMap
          .pipe(takeUntil(this.subs$))
          .subscribe((params: ParamMap) => {
            this.selectedInvTypeId = +params.get("id");
          });
      }
    });
    this.loadTheme();
    this.initInvTypeForm();
  }

  private initInvTypeForm() {
    this.invTypeForm = this.fb.group({
      userId: new UntypedFormControl(
        this.authService.decodeToken().nameid,
        Validators.required
      ),
      status: new UntypedFormControl("NonActive", Validators.required),
      approvalRequired: new UntypedFormControl(false, Validators.required),
      invDetails: this.fb.group({
        investmentName: new UntypedFormControl("", Validators.required),
        investmentCode: new UntypedFormControl("", Validators.required),
      }),
      fees: this.fb.group({
        withHoldingTax: new UntypedFormControl("", Validators.required),
        penalCharge: new UntypedFormControl("", Validators.required),
      }),
      parameters: this.fb.group({
        minAmount: new UntypedFormControl(0, [
          Validators.required,
          nonZero.bind(this),
        ]),
        maxAmount: new UntypedFormControl(0, [
          Validators.required,
          nonZero.bind(this),
        ]),
        minNetInterest: new UntypedFormControl(0, [
          Validators.required,
          nonZero.bind(this),
        ]),
        maxNetInterest: new UntypedFormControl(0, [
          Validators.required,
          nonZero.bind(this),
        ]),
        minInvestmentTenor: new UntypedFormControl(0, [
          Validators.required,
          nonZero.bind(this),
        ]),
        maxInvestmentTenor: new UntypedFormControl(0, [
          Validators.required,
          nonZero.bind(this),
        ]),
        interestRate: new UntypedFormControl(0, [
          Validators.required,
          nonZero.bind(this),
        ]),
        interestRateType: new UntypedFormControl(0, [
          Validators.required,
          nonZero.bind(this),
        ]),
      }),
      certificate: this.fb.group({
        displayTermsAndConditions: new UntypedFormControl(false, Validators.required),
        termsAndConditions: new UntypedFormArray([])
      })
    });

    this.invTypeForm
      .get("parameters.interestRate")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.invTypeForm.get("parameters.interestRateType").setValue(res[0]);
      });

      this.invTypeForm.get('certificate.displayTermsAndConditions')
        .valueChanges.pipe(takeUntil(this.subs$))
        .subscribe((res: boolean) => {
          if (this.termsAndConditions.length === 0 && res) this.addToTAndC();
        })

    this.invTypeForm.valueChanges.pipe(takeUntil(this.subs$)).subscribe(() => {
      this.updateStepStatus();
    });

    if (this.selectedInvTypeId) {
      this.getInvType();
    }
  }

  private patchInvTypeForm(investmentType: InvestmentType) {
    this.invTypeForm.patchValue({
      status: investmentType?.status,
      approvalRequired: investmentType?.approvalRequired,
      invDetails: {
        investmentName: investmentType?.investmentName,
        investmentCode: investmentType?.investmentCode,
      },
      fees: {
        withHoldingTax: investmentType?.withHoldingTax,
        penalCharge: investmentType?.penalCharge,
      },
      parameters: {
        minAmount: investmentType?.minAmount,
        maxAmount: investmentType?.maxAmount,
        minNetInterest: investmentType?.minNetInterest,
        maxNetInterest: investmentType?.maxNetInterest,
        minInvestmentTenor: investmentType?.minInvestmentTenor,
        maxInvestmentTenor: investmentType?.maxInvestmentTenor,
        interestRate: [investmentType?.interestRateType],
        interestRateType: investmentType?.interestRateType,
      },
      certificate: {
        displayTermsAndConditions: investmentType?.termsAndConditionsInfoSetup?.displayTermsAndConditions,
      }
    });

    const termsAndConditions: any[] = investmentType?.termsAndConditionsInfoSetup?.termsAndConditions ?? [];

    if (termsAndConditions.length > 0) {
      this.onRemoveTAndC(0);
      termsAndConditions.forEach((data: any) => {
        this.addToTAndC(data);
      })
    }
    this.invTypeForm.markAllAsTouched();
    this.updateStepStatus();
  }

  private getInvType() {
    this.isInitializing = true;
    this.invService
      .getInvestmentType(this.selectedInvTypeId)
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe((investmentType) => {
        this.patchInvTypeForm(investmentType);
        this.isInitializing = false;
      });
  }

  private updateStepStatus() {
    if (
      this.invTypeForm.get("invDetails").touched &&
      this.invTypeForm.get("invDetails").valid
    ) {
      this.steps[0].status = this.stepStatusEnum.complete;
    } else if (
      this.invTypeForm.get("invDetails").touched &&
      this.invTypeForm.get("invDetails").invalid
    ) {
      this.steps[0].status = this.stepStatusEnum.invalid;
    }

    if (
      this.invTypeForm.get("fees").touched &&
      this.invTypeForm.get("fees").valid
    ) {
      this.steps[1].status = this.stepStatusEnum.complete;
    } else if (
      this.invTypeForm.get("fees").touched &&
      this.invTypeForm.get("fees").invalid
    ) {
      this.steps[1].status = this.stepStatusEnum.invalid;
    }

    if (
      this.invTypeForm.get("parameters").touched &&
      this.invTypeForm.get("parameters").valid
    ) {
      this.steps[2].status = this.stepStatusEnum.complete;
    } else if (
      this.invTypeForm.get("parameters").touched &&
      this.invTypeForm.get("parameters").invalid
    ) {
      this.steps[2].status = this.stepStatusEnum.invalid;
    }

    if (
      this.invTypeForm.get("certificate").touched &&
      this.invTypeForm.get("certificate").valid
    ) {
      this.steps[3].status = this.stepStatusEnum.complete;
    } else if (
      this.invTypeForm.get("certificate").touched &&
      this.invTypeForm.get("certificate").invalid
    ) {
      this.steps[4].status = this.stepStatusEnum.invalid;
    }
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  toggleSwitch(value: boolean, type: string) {
    if (type === "status") {
      const status = value ? "Active" : "NonActive";
      this.invTypeForm.get("status").setValue(status);
    }

    if (type === "approval") {
      this.invTypeForm.get("approvalRequired").setValue(value);
    }
    if (type === 'certificate') {
      this.invTypeForm.get('certificate.displayTermsAndConditions').patchValue(value);
    }
  }

  previous(id?: number) {
    id ? (this.currentStepIndex = id) : this.currentStepIndex;
    if (this.currentStepIndex > 0) {
      this.steps[this.currentStepIndex - 1].status =
        this.stepStatusEnum.current;
      !id && this.currentStepIndex--;
      this.invTypeForm
        .get("status")
        .setValue(this.invTypeForm.get("status").value);
    }
  }

  next(id?: number) {
    const stepIndex = id - 1 || this.currentStepIndex;
    if (this.invTypeForm.get(this.steps[stepIndex].id).valid) {
      this.steps[this.currentStepIndex + 1].status =
        this.stepStatusEnum.current;
      id ? (this.currentStepIndex = id) : this.currentStepIndex++;

      this.invTypeForm
        .get("status")
        .setValue(this.invTypeForm.get("status").value);
    }
  }

  switchStep(id: number) {
    if (this.currentStepIndex !== id && id < this.currentStepIndex) {
      this.previous(id);
    }

    if (this.currentStepIndex !== id && id > this.currentStepIndex) {
      this.next(id);
    }
  }

  submit() {
    let payload = {
      ...this.invTypeForm.get("invDetails").value,
      ...this.invTypeForm.get("fees").value,
      ...this.invTypeForm.get("parameters").value,
      status: this.invTypeForm.get("status").value,
      approvalRequired: this.invTypeForm.get("approvalRequired").value,
      userId: this.authService.decodeToken().nameid,
    };
    payload['termsAndConditionsInfoSetup'] = {
      displayTermsAndConditions: this.invTypeForm.get("certificate.displayTermsAndConditions").value,
      termsAndConditions: this.termsAndConditions.value
    }
    this.isLoading = true;
    if (!this.selectedInvTypeId) {
      this.invService
        .addInvestmentType(payload)
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: "Investment Type added successfully",
            });
            this.router.navigateByUrl("/configurations/investment-types");
          },
          () => (this.isLoading = false)
        );
    } else {
      payload = {
        ...payload,
        investmentTypeId: this.selectedInvTypeId,
      };
      this.invService
        .editInvestmentType(payload)
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: "Loan Type updated successfully",
            });
            this.router.navigateByUrl("/configurations/investment-types");
          },
          () => (this.isLoading = false)
        );
    }
  }

  get termsAndConditions(): FormArray {
    return this.invTypeForm.get("certificate.termsAndConditions") as FormArray;
  }

  addToTAndC(data?: any) {
    if (this.termsAndConditions.length == 5) {
      this.toast.fire({
        type: "error",
        title: "A maximum of 5 entries are allowed",
      });
      return;
    }

    const ctrl = this.fb.group({
      id: new UntypedFormControl(data ? data.id : this.termsAndConditions.length),
      description: new UntypedFormControl(data ? data.description : null, [Validators.required])
    })

    this.termsAndConditions.push(ctrl);
  }

  onRemoveTAndC(index: number) {
    if (this.termsAndConditions.length === 0) return;
    this.termsAndConditions.removeAt(index);
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }

  getFromJson(stringArray: string, expectedResult: string) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }
}
