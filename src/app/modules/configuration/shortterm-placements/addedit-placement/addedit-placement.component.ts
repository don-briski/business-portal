import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { map, pluck, takeUntil } from "rxjs/operators";
import { FinancialInstitutionService } from "src/app/service/financialinstitution.service";
import { ShortTermPlacementService } from "src/app/service/shorttermplacement.service";
import Swal from "sweetalert2";

@Component({
  selector: "addedit-placement-type",
  templateUrl: "./addedit-placement.component.html",
  styleUrls: ["./addedit-placement.component.scss"],
})
export class AddeditPlacementTypeComponent implements OnInit, OnDestroy {
  @Input() currentTheme: any;
  @Input() shortTermPlacementTypeId: number;
  @Output() closeModelEvent = new EventEmitter<string>();
  private _unsubscriber$ = new Subject();
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  placementTypeForms: UntypedFormGroup;
  isLoading: boolean = false;
  requiresApproval: boolean;
  placementTypes: any[] = [
    { id: 1, text: "Fixed Deposits" },
    { id: 2, text: "Mutual Funds" },
    { id: 3, text: "Promissory Notes" },
    { id: 4, text: "Call Account" },
  ];

  institutions: any[] = [];
  tenorTypes: any[] = [
    { id: 1, text: "Day" },
    { id: 2, text: "Month" },
    { id: 3, text: "Year" },
  ];

  interestTypes: any[] = [
    { id: 1, text: "Compound" },
    { id: 2, text: "Flat" },
  ];

  interestCycles: any[] = [
    { id: 1, text: "Daily" },
    { id: 2, text: "Monthly" },
    { id: 3, text: "Annually" },
  ];

  statuses: any[] = [
    { id: 1, text: "Active" },
    { id: 2, text: "Inactive" },
  ];

  constructor(
    private _fb: UntypedFormBuilder,
    private _financialInstitution: FinancialInstitutionService,
    private _shorttermPlacementTypeService: ShortTermPlacementService
  ) {}

  ngOnInit(): void {
    if (this.shortTermPlacementTypeId) {
      this._getShortTermPlacementsType(this.shortTermPlacementTypeId);
    }

    this._getFinancialInstitutions();
    this._initForm();
  }

  private _getShortTermPlacementsType(id: number): void {
    this.isLoading = true;
    this._shorttermPlacementTypeService
      .getShortTermPlacementType(id)
      .pipe(pluck("body", "data"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this._patchForm(res);
      });
  }

  private _getFinancialInstitutions(): void {
    this._financialInstitution
      .getAll()
      .pipe(
        pluck("body"),
        map((institutions: any[]) => {
          return institutions.map((institution) => ({
            id: institution.financialInstitutionId,
            text: institution.name,
          }));
        }),
        takeUntil(this._unsubscriber$)
      )
      .subscribe((res) => (this.institutions = res));
  }

  private _initForm(): void {
    this.placementTypeForms = this._fb.group({
      placementName: new UntypedFormControl(null, Validators.required),
      placementTypeObj: new UntypedFormControl(null, Validators.required),
      placementType: new UntypedFormControl(null, Validators.required),
      amount: new UntypedFormControl(null, Validators.required),
      tenor: new UntypedFormControl(null, Validators.required),
      tenorTypeObj: new UntypedFormControl(null, Validators.required),
      tenorType: new UntypedFormControl(null, Validators.required),
      penalCharge: new UntypedFormControl(null),
      whtRate: new UntypedFormControl(null),
      interestRate: new UntypedFormControl(null, Validators.required),
      interestTypeObj: new UntypedFormControl(null, Validators.required),
      interestType: new UntypedFormControl(null, Validators.required),
      interestCycleObj: new UntypedFormControl(null, Validators.required),
      interestCycle: new UntypedFormControl(null, Validators.required),
      statusObj: new UntypedFormControl(null, Validators.required),
      status: new UntypedFormControl(null, Validators.required),
      financialInstitutionIdObj: new UntypedFormControl(null, Validators.required),
      financialInstitutionId: new UntypedFormControl(null, Validators.required),
      requireApproval: new UntypedFormControl(false, Validators.required),
    });
    this._watchFormChanges();
  }

  private _patchForm(res: any): void {
    const placementType = this.placementTypes.filter(
      (placementType) =>
        placementType.text.replace(/ +/g, "") === res.placementType
    );
    const tenorType = this.tenorTypes.filter(
      (tenorType) => tenorType.text === res.tenorType
    );
    const interestType = this.interestTypes.filter(
      (interestType) => interestType.text === res.interestType
    );
    const interestCycle = this.interestCycles.filter(
      (interestCycle) => interestCycle.text === res.interestCycle
    );
    const status = this.statuses.filter((status) => status.text === res.status);

    this.placementTypeForms.patchValue({
      placementName: res.placementName,
      placementType: res.placementType,
      placementTypeObj: placementType,
      amount: res.amount,
      tenor: res.tenor,
      tenorTypeObj: tenorType,
      tenorType: res.tenorType,
      penalCharge: res?.penalCharge,
      whtRate: res?.whtRate,
      interestRate: res.interestRate,
      interestTypeObj: interestType,
      interestType: res.interestType,
      interestCycleObj: interestCycle,
      interestCycle: res.interestCycle,
      statusObj: status,
      status: res.status,
      financialInstitutionIdObj: [
        { id: res.financialInstitutionId, text: res.financialInstitution },
      ],
      financialInstitutionId: res.financialInstitutionId,
      requireApproval: res.requireApproval ? true : false,
    });

    this.placementTypeForms.addControl(
      "shortTermPlacementTypeId",
      new UntypedFormControl(res.shortTermPlacementTypeId, Validators.required)
    );

    this.requiresApproval = res.requireApproval;

    this.isLoading = false;
  }

  private _watchFormChanges(): void {
    this.placementTypeForms
      .get("placementTypeObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        const placementType = res[0]?.text.replace(/ +/g, "");
        this.placementTypeForms.get("placementType").setValue(placementType);
        this.placementTypeForms.get("placementType").markAsTouched();
        this.placementTypeForms.get("placementType").updateValueAndValidity();
      });

    this.placementTypeForms
      .get("financialInstitutionIdObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.placementTypeForms
          .get("financialInstitutionId")
          .setValue(res[0]?.id);
        this.placementTypeForms.get("financialInstitutionId").markAsTouched();
        this.placementTypeForms
          .get("financialInstitutionId")
          .updateValueAndValidity();
      });

    this.placementTypeForms
      .get("tenorTypeObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.placementTypeForms.get("tenorType").setValue(res[0]?.text);
        this.placementTypeForms.get("tenorType").markAsTouched();
        this.placementTypeForms.get("tenorType").updateValueAndValidity();
      });

    this.placementTypeForms
      .get("interestTypeObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.placementTypeForms.get("interestType").setValue(res[0]?.text);
        this.placementTypeForms.get("interestType").markAsTouched();
        this.placementTypeForms.get("interestType").updateValueAndValidity();
      });

    this.placementTypeForms
      .get("interestCycleObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.placementTypeForms.get("interestCycle").setValue(res[0]?.text);
        this.placementTypeForms.get("interestCycle").markAsTouched();
        this.placementTypeForms.get("interestCycle").updateValueAndValidity();
      });

    this.placementTypeForms
      .get("statusObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.placementTypeForms.get("status").setValue(res[0]?.text);
        this.placementTypeForms.get("status").markAsTouched();
        this.placementTypeForms.get("status").updateValueAndValidity();
      });
  }

  setApproval(value: boolean): void {
    this.placementTypeForms.get("requireApproval").setValue(value);
  }
  closeModal(state?: string): void {
    this.closeModelEvent.emit(state);
  }

  private _cleanupForm(): void {
    this.placementTypeForms.removeControl("financialInstitutionIdObj");
    this.placementTypeForms.removeControl("interestCycleObj");
    this.placementTypeForms.removeControl("interestTypeObj");
    this.placementTypeForms.removeControl("placementTypeObj");
    this.placementTypeForms.removeControl("statusObj");
    this.placementTypeForms.removeControl("tenorTypeObj");
  }

  submit(): void {
    this.isLoading = true;
    this._cleanupForm();

    if (!this.shortTermPlacementTypeId) {
      this._shorttermPlacementTypeService
        .addShortTermPlacementType(this.placementTypeForms.value)
        .pipe(takeUntil(this._unsubscriber$))
        .subscribe((res) => {
          if (res.status === 200) {
            this.toast.fire({
              type: "success",
              title: "Short Term Placement Type Created Successfully",
            });
            this.isLoading = false;
            this.closeModal("refresh");
          }
        });
    } else {
      this._shorttermPlacementTypeService
        .updateShortTermPlacementType(this.placementTypeForms.value)
        .pipe(takeUntil(this._unsubscriber$))
        .subscribe((res) => {
          if (res.status === 200) {
            this.toast.fire({
              type: "success",
              title: "Short Term Placement Type Updated Successfully",
            });
            this.isLoading = false;
            this.closeModal("refresh");
          }
        });
    }
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
