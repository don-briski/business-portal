import { Component, OnInit } from "@angular/core";
import { Validators, FormBuilder } from "@angular/forms";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil, pluck, map } from "rxjs/operators";
import Swal from "sweetalert2";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { nonZero } from "src/app/util/validators/validators";
import { StepStatus, Step } from "../../shared/shared.types";
import {
  AddEditPlacementTypeReqBody,
  PlacementType,
} from "../../treasury/types/placement-type";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { FinancialInstitutionService } from "src/app/service/financialinstitution.service";
import { ShortTermPlacementService } from "src/app/service/shorttermplacement.service";

@Component({
  selector: "lnd-add-edit-placement-type",
  templateUrl: "./add-edit-placement-type.component.html",
  styleUrls: ["./add-edit-placement-type.component.scss"],
})
export class AddEditPlacementTypeComponent implements OnInit {
  currentTheme: ColorThemeInterface;
  subs$ = new Subject();
  stepStatusEnum = StepStatus;
  currentStepIndex = 0;
  placementTypes = [
    { id: "FixedDeposits", text: "Fixed Deposits" },
    { id: "MutualFunds", text: "Mutual Funds" },
    { id: "PromissoryNotes", text: "Promissory Notes" },
    { id: "CallAccount", text: "Call Account" },
  ];
  interestTypes = ["Compound", "Flat"];
  tenorTypes = ["Day", "Month", "Year"];
  interestCycles = ["Daily", "Monthly", "Annually"];
  institutions: CustomDropDown[] = [];
  isLoading = false;
  placementType: PlacementType;
  isInitializing = true;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  steps: Step[] = [
    {
      id: "placementDetails",
      stage: "Placement Details",
      type: "Configuration",
      status: this.stepStatusEnum.current,
    },
    {
      id: "parameters",
      stage: "Placement Parameters",
      type: "Customization",
      status: this.stepStatusEnum.pending,
    },
    {
      id: "fees",
      stage: "Placement Fees",
      type: "Set Fees",
      status: this.stepStatusEnum.pending,
    },
  ];
  selectedPlacementTypeId: number;

  form = this.fb.group({
    status: ["Inactive", Validators.required],
    requireApproval: [false, Validators.required],
    placementDetails: this.fb.group({
      placementName: ["", Validators.required],
      placementTypeArray: this.fb.control<CustomDropDown[]>(
        [],
        Validators.required
      ),
      placementType: ["", Validators.required],
      financialInstitutionArray: this.fb.control<CustomDropDown[]>(
        [],
        Validators.required
      ),
      financialInstitutionId: [0, [Validators.required]],
    }),
    parameters: this.fb.group({
      minAmount: [0, [Validators.required, nonZero.bind(this)]],
      maxAmount: [0, [Validators.required, nonZero.bind(this)]],
      minInterestRate: [0, [Validators.required, nonZero.bind(this)]],
      maxInterestRate: [0, [Validators.required, nonZero.bind(this)]],
      minTenor: [0, [Validators.required, nonZero.bind(this)]],
      maxTenor: [0, [Validators.required, nonZero.bind(this)]],
      tenorTypeArray: this.fb.control<string[]>([], Validators.required),
      tenorType: ["", Validators.required],
      interestTypeArray: this.fb.control<string[]>([], Validators.required),
      interestType: ["", Validators.required],
      interestCycleArray: this.fb.control<string[]>([], Validators.required),
      interestCycle: ["", Validators.required],
    }),
    fees: this.fb.group({
      whtRate: [0, Validators.required],
      penalCharge: [0, Validators.required],
    }),
  });

  constructor(
    private colorThemeService: ColorThemeService,
    private router: Router,
    private route: ActivatedRoute,
    private finInstitutionService: FinancialInstitutionService,
    private sTPTService: ShortTermPlacementService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getIdFromUrl();
    this.loadData();
    this.watchFormChanges();
  }

  getIdFromUrl() {
    this.route.url.pipe(takeUntil(this.subs$)).subscribe((res) => {
      if (res[1].path === "edit") {
        this.route.paramMap
          .pipe(takeUntil(this.subs$))
          .subscribe((params: ParamMap) => {
            this.selectedPlacementTypeId = +params.get("id");
          });
      }
    });
  }

  loadData() {
    if (this.selectedPlacementTypeId) {
      this.getPlacementType();
    } else {
      this.getFinancialInstitutions();
    }
  }

  watchFormChanges() {
    this.form
      .get("placementDetails.placementTypeArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.form
          .get("placementDetails.placementType")
          .setValue(res[0].id as string);
      });

    this.form
      .get("placementDetails.financialInstitutionArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.form
          .get("placementDetails.financialInstitutionId")
          .setValue(res[0].id as number);
      });

    this.form
      .get("parameters.tenorTypeArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.form.get("parameters.tenorType").setValue(res[0]);
      });

    this.form
      .get("parameters.interestTypeArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.form.get("parameters.interestType").setValue(res[0]);
      });

    this.form
      .get("parameters.interestCycleArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.form.get("parameters.interestCycle").setValue(res[0]);
      });

    this.form.valueChanges.pipe(takeUntil(this.subs$)).subscribe(() => {
      this.updateStepStatus();
    });

    if (this.selectedPlacementTypeId) {
      this.getPlacementType();
    }
  }

  patchForm(placementType: PlacementType) {
    const financialInstitutionArray = this.institutions.filter(
      (item) => item.id === placementType?.financialInstitutionId
    );
    const placementTypeArray = this.placementTypes.filter(
      (item) => item.id === placementType.placementType
    );

    this.form.patchValue({
      status: placementType?.status,
      requireApproval: placementType?.requireApproval,
      placementDetails: {
        placementName: placementType?.placementName,
        placementType: placementType.placementType,
        placementTypeArray,
        financialInstitutionId: placementType?.financialInstitutionId,
        financialInstitutionArray,
      },
      parameters: {
        minAmount: placementType?.minAmount,
        maxAmount: placementType?.maxAmount,
        minInterestRate: placementType?.minInterestRate,
        maxInterestRate: placementType?.maxInterestRate,
        minTenor: placementType?.minTenor,
        maxTenor: placementType?.maxTenor,
        tenorType: placementType?.tenorType,
        tenorTypeArray: [placementType?.tenorType],
        interestType: placementType?.interestType,
        interestTypeArray: [placementType?.interestType],
        interestCycle: placementType?.interestCycle,
        interestCycleArray: [placementType?.interestCycle],
      },
      fees: {
        whtRate: placementType?.whtRate,
        penalCharge: placementType?.penalCharge,
      },
    });

    this.form.markAllAsTouched();
    this.updateStepStatus();
  }

  getPlacementType() {
    this.sTPTService
      .getShortTermPlacementType(this.selectedPlacementTypeId)
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe(
        (placementType) => {
          this.placementType = placementType;
          this.getFinancialInstitutions();
        },
        () => {
          this.isInitializing = false;
        }
      );
  }

  updateStepStatus() {
    if (
      this.form.get("placementDetails").touched &&
      this.form.get("placementDetails").valid
    ) {
      this.steps[0].status = this.stepStatusEnum.complete;
    } else if (
      this.form.get("placementDetails").touched &&
      this.form.get("placementDetails").invalid
    ) {
      this.steps[0].status = this.stepStatusEnum.invalid;
    }

    if (
      this.form.get("parameters").touched &&
      this.form.get("parameters").valid
    ) {
      this.steps[1].status = this.stepStatusEnum.complete;
    } else if (
      this.form.get("parameters").touched &&
      this.form.get("parameters").invalid
    ) {
      this.steps[1].status = this.stepStatusEnum.invalid;
    }

    if (this.form.get("fees").touched && this.form.get("fees").valid) {
      this.steps[2].status = this.stepStatusEnum.complete;
    } else if (this.form.get("fees").touched && this.form.get("fees").invalid) {
      this.steps[2].status = this.stepStatusEnum.invalid;
    }
  }

  loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  toggleSwitch(value: boolean, type: string) {
    if (type === "status") {
      const status = value ? "Active" : "Inactive";
      this.form.get("status").setValue(status);
    }

    if (type === "approval") {
      this.form.get("requireApproval").setValue(value);
    }
  }

  previous(id?: number) {
    id ? (this.currentStepIndex = id) : this.currentStepIndex;
    if (this.currentStepIndex > 0) {
      this.steps[this.currentStepIndex - 1].status =
        this.stepStatusEnum.current;
      !id && this.currentStepIndex--;
      this.form.get("status").setValue(this.form.get("status").value);
    }
  }

  next(id?: number) {
    const stepIndex = id - 1 || this.currentStepIndex;
    if (this.form.get(this.steps[stepIndex].id).valid) {
      this.steps[this.currentStepIndex + 1].status =
        this.stepStatusEnum.current;
      id ? (this.currentStepIndex = id) : this.currentStepIndex++;

      this.form.get("status").setValue(this.form.get("status").value);
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

  getFinancialInstitutions(): void {
    this.finInstitutionService
      .getAll()
      .pipe(
        pluck("body"),
        map((institutions) => {
          return institutions.map((institution) => ({
            id: institution.financialInstitutionId,
            text: institution.name,
          }));
        }),
        takeUntil(this.subs$)
      )
      .subscribe(
        (res) => {
          this.institutions = res;
          if (this.selectedPlacementTypeId) {
            this.patchForm(this.placementType);
          }

          this.isInitializing = false;
        },
        () => {
          this.isInitializing = false;
        }
      );
  }

  submit() {
    let payload: AddEditPlacementTypeReqBody = {
      ...this.form.get("placementDetails").value,
      ...this.form.get("fees").value,
      ...this.form.get("parameters").value,
      status: this.form.get("status").value,
      requireApproval: this.form.get("requireApproval").value,
    };

    this.isLoading = true;
    if (!this.selectedPlacementTypeId) {
      this.sTPTService
        .addShortTermPlacementType(payload)
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: "Placement type added successfully!",
            });
            this.router.navigateByUrl("/configurations/placement-types");
          },
          () => (this.isLoading = false)
        );
    } else {
      payload = {
        ...payload,
        shortTermPlacementTypeId: this.selectedPlacementTypeId,
      };
      this.sTPTService
        .updateShortTermPlacementType(payload)
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: "Placement type updated successfully!",
            });
            this.router.navigateByUrl("/configurations/placement-types");
          },
          () => (this.isLoading = false)
        );
    }
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
