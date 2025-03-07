import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { CheckoutAdminService } from "../../../checkout-admin.service";
import {
  CreditAffordModeEnum,
  IncomeCipherReqBody,
  SalaryAdjustmentEnum,
} from "../../../checkout-admin.types";
import Swal from "sweetalert2";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { User } from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-income-cipher",
  templateUrl: "./income-cipher.component.html",
  styleUrls: ["./income-cipher.component.scss"],
})
export class IncomeCipherComponent implements OnInit, OnDestroy {
  @Input() bankStatementLengthMonths: number;
  @Input() config: IncomeCipherReqBody;
  @Input() user: User;

  @Output() retrieveConfig = new EventEmitter();

  private subs$ = new Subject();

  creditAffordModeEnum = CreditAffordModeEnum;
  mode = CreditAffordModeEnum.View;
  salaryAdjustmentEnum = SalaryAdjustmentEnum;
  hideHints = true;
  currentTheme: ColorThemeInterface;
  form = new FormGroup({
    salaryDateOffset: new FormControl(null, [
      Validators.required,
      Validators.min(1),
    ]),
    salaryCalculatorMethod: new FormControl(null, Validators.required),
    salaryAdjustment: new FormControl([], Validators.required),
    salaryAdjustmentFlatTypePercentageValue: new FormControl(null),
    rangedAdjustmentConfig: new FormArray([]),
    salaryDateRecencyCheck: new FormControl(null, [
      Validators.required,
      Validators.min(1),
    ]),
  });
  isLoading = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  salaryCalculatorMethods: CustomDropDown[] = [
    { id: "MinRecentSalary", text: "Mininum Recent Salary" },
    { id: "MaxRecentSalary", text: "Maximum Recent Salary" },
    { id: "MedianAllSalary", text: "Median All Salary" },
  ];

  salaryAdjustments: CustomDropDown[] = [
    { id: SalaryAdjustmentEnum.NoAdjustment, text: "No Adjustment" },
    { id: SalaryAdjustmentEnum.FlatAdjustment, text: "Flat Adjustment" },
    { id: SalaryAdjustmentEnum.RangedAdjustment, text: "Ranged Adjustment" },
  ];

  constructor(
    private colorThemeService: ColorThemeService,
    private checkoutAdminService: CheckoutAdminService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.watchFormChanges();
    this.setInitialMode();
  }

  setInitialMode() {
    if (!this.config) {
      this.mode = CreditAffordModeEnum.None;
    }
  }

  initForm() {
    const { rangedAdjustmentConfig, ...rest } = this.config;
    const salaryCalculatorMethod = this.salaryCalculatorMethods.filter(
      (salaryCalMtd) => salaryCalMtd.id === this.config.salaryCalculatorMethod
    );
    this.form.patchValue({
      ...rest,
      salaryAdjustment: [
        {
          id: this.config.salaryAdjustment,
          text: this.config.salaryAdjustment,
        },
      ],
      salaryCalculatorMethod,
    });
    if (this.config.rangedAdjustmentConfig) {
      this.form
        .get("rangedAdjustmentConfig")
        .setValidators(Validators.required);
      this.form.get("rangedAdjustmentConfig").updateValueAndValidity();
      const entries = Object.entries(rangedAdjustmentConfig);
      entries.forEach(([key, value], index) => {
        this.rangedAdjustmentControl().at(index).get("value").setValue(value);
      });
    }
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  rangedAdjustmentControl(): FormArray {
    return this.form.get("rangedAdjustmentConfig") as FormArray;
  }

  setRangeTooltip(index: number): string {
    let range;

    if (index === 0) {
      range = "100% and 95%";
    } else if (index === 1) {
      range = "95% and 80%";
    } else if (index === 2) {
      range = "80% and 65%";
    } else if (index === 3) {
      range = "65% and 50%";
    } else {
      range = "<50%";
    }
    let tooltip = `Please enter the salary adjustment percentage rate (e.g 5%) to be used for the confidence interval score, which falls between ${range}`;
    return tooltip;
  }

  addAdjustment(key: string, index: number) {
    index = index + 1;
    let validators = [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ];

    const control = new FormGroup({
      key: new FormControl(key),
      prop: new FormControl(`r${index}`),
      value: new FormControl(null, validators),
      tooltip: new FormControl(this.setRangeTooltip(index)),
    });

    this.rangedAdjustmentControl().push(control);
  }

  private watchFormChanges() {
    this.form
      .get("salaryAdjustment")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res[0]?.id === "RangedAdjustment") {
          const keys = [
            "Range 1 (96% - 100%)",
            "Range 2 (81% - 95%)",
            "Range 3 (66% - 80%)",
            "Range 4 (51% - 65%)",
            "Range 5 (1% - 50%)",
          ];
          keys.forEach((key, index) => this.addAdjustment(key, index));
          this.form
            .get("salaryAdjustmentFlatTypePercentageValue")
            .clearValidators();
          this.form
            .get("salaryAdjustmentFlatTypePercentageValue")
            .updateValueAndValidity();
        }

        if (res[0]?.id === SalaryAdjustmentEnum.FlatAdjustment) {
          this.form
            .get("salaryAdjustmentFlatTypePercentageValue")
            .addValidators(Validators.required);
        } else {
          this.form
            .get("salaryAdjustmentFlatTypePercentageValue")
            .removeValidators(Validators.required);
        }

        if (res[0]?.id !== SalaryAdjustmentEnum.RangedAdjustment) {
          this.form.get("rangedAdjustmentConfig").clearValidators();
          this.form.get("rangedAdjustmentConfig").updateValueAndValidity();
        }
      });
  }

  submit() {
    const {
      salaryAdjustment,
      rangedAdjustmentConfig,
      salaryAdjustmentFlatTypePercentageValue,
      salaryCalculatorMethod,
      ...rest
    } = this.form.value;
    let payload = {
      salaryAdjustment: salaryAdjustment[0]?.id,
      salaryCalculatorMethod: salaryCalculatorMethod[0]?.id,
      ...rest,
    };
    if (salaryAdjustment[0]?.id === "FlatAdjustment") {
      payload["salaryAdjustmentFlatTypePercentageValue"] =
        salaryAdjustmentFlatTypePercentageValue;
    }

    if (salaryAdjustment[0]?.id === "RangedAdjustment") {
      let transformedRangedAdjustmentConfig = {};
      rangedAdjustmentConfig.forEach((range) => {
        let newObj = {};
        newObj[`${range.prop}`] = range.value;
        transformedRangedAdjustmentConfig = {
          ...transformedRangedAdjustmentConfig,
          ...newObj,
        };
      });

      payload["rangedAdjustmentConfig"] = {
        ...transformedRangedAdjustmentConfig,
      };
    }

    this.isLoading = true;

    this.checkoutAdminService
      .configureIncomeCipher(payload as IncomeCipherReqBody)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        () => {
          this.retrieveConfig.emit();
          this.isLoading = false;
          this.toast.fire({
            type: "success",
            title: "Income cipher updated successfully!",
          });

          this.onModeChange(CreditAffordModeEnum.View);
        },
        () => (this.isLoading = false)
      );
  }

  onModeChange(value: CreditAffordModeEnum) {
    if (value === CreditAffordModeEnum.Edit) {
      this.initForm();
    }

    this.mode = value;
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
