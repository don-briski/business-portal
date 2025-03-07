import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import Swal from "sweetalert2";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { CheckoutAdminService } from "../../../checkout-admin.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { nonZero } from "src/app/util/validators/validators";
import {
  CreditAffordModeEnum,
  OpenLoanFilter,
  RiskAssessmentReqBody,
} from "../../../checkout-admin.types";
import { lightenColor } from "src/app/modules/shared/helpers/generic.helpers";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { User } from "src/app/modules/shared/shared.types";
import { setConfigHero } from "src/app/store/actions";
import { Store } from "@ngrx/store";
import { AppWideState } from "src/app/store/models";

@Component({
  selector: "lnd-risk-assessment",
  templateUrl: "./risk-assessment.component.html",
  styleUrls: ["./risk-assessment.component.scss"],
})
export class RiskAssessmentComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  user: User;
  config: RiskAssessmentReqBody;
  openLoanFilter: OpenLoanFilter[];
  haveConfig = false;
  mode = CreditAffordModeEnum.View;
  riskAssessmentModeEnum = CreditAffordModeEnum;
  currentTheme: ColorThemeInterface;
  currentTabIndex = 0;
  attributes: CustomDropDown[] = [
    { id: "Tenor", text: "Tenor" },
    { id: "Cycle", text: "Cycle" },
    { id: "LoanType", text: "Loan Type" },
  ];

  operators: CustomDropDown[] = [
    { id: "StartsWith", text: "StartsWith" },
    { id: "EndsWith", text: "EndsWith" },
    { id: "GreaterThan", text: "GreaterThan" },
    { id: "LessThan", text: "LessThan" },
    { id: "GreaterThanOrEqualTo", text: "GreaterThanOrEqualTo" },
    { id: "LessThanOrEqualTo", text: "LessThanOrEqualTo" },
    { id: "EqualTo", text: "EqualTo" },
    { id: "NotEqualTo", text: "NotEqualTo" },
    { id: "Contains", text: "Contains" },
  ];
  form = new FormGroup({
    runKYCCheck: new FormControl(false, Validators.required),
    loanTypeExceptions: new FormControl(null, Validators.required),
    creditFileRecencyThresholdInDays: new FormControl(null, [
      Validators.required,
      nonZero.bind(this),
    ]),
    creditProfileRecencyThresholdInDays: new FormControl(null, [
      Validators.required,
      nonZero.bind(this),
    ]),
    creditHistoryThresholdInYears: new FormControl(null, [
      Validators.required,
      nonZero.bind(this),
    ]),
    openLoanFilter: new FormArray([], Validators.required),
    closedLoanAgeThresholdInDays: new FormControl(null, [
      Validators.required,
      nonZero.bind(this),
    ]),
    loanRecencyYearsForInstallmentMetrics: new FormControl(null, [
      Validators.required,
      nonZero.bind(this),
    ]),
  });
  loansExcluded = [];
  isLoading = false;
  fetching = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private colorThemeService: ColorThemeService,
    private checkoutAdminService: CheckoutAdminService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly store:Store<AppWideState>
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.setHeroState();
    this.listenForTabChange();
    this.addFilter();
    this.getRiskAssessmentConfig();
    this.getUser();
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  getRiskAssessmentConfig() {
    this.fetching = true;
    this.checkoutAdminService
      .getRiskAssessmentConfig()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          const { openLoanFilter, ...rest } = res.body.data;
          this.config = res.body.data;
          this.haveConfig = this.config && Object.keys(this.config).length > 0;
          this.openLoanFilter = this.config.openLoanFilter;
          this.loansExcluded = rest.loanTypeExceptions;

          if (this.openLoanFilter && this.openLoanFilter.length) {
            this.openLoanFilters().clear();
            openLoanFilter.forEach((filter) => {
              this.addFilter({
                attribute: [{ id: filter.attribute, text: filter.attribute }],
                operator: [{ id: filter.operator, text: filter.operator }],
                value: filter.value,
              });
            });
          }

          if (this.haveConfig) {
            this.onModeChange(this.riskAssessmentModeEnum.View);
          } else {
            this.onModeChange(this.riskAssessmentModeEnum.None);
          }

          this.fetching = false;
        },
        (er) => (this.fetching = false)
      );
  }

  patchForm() {
    const { openLoanFilter, ...rest } = this.config;
    this.form.patchValue(rest);
  }

  onModeChange(value: CreditAffordModeEnum) {
    if (value === this.riskAssessmentModeEnum.Edit) {
      this.patchForm();
    }

    this.mode = value;
  }

  openLoanFilters(): FormArray {
    return this.form.get("openLoanFilter") as FormArray;
  }

  addFilter(openLoanFilter?) {
    const filter = new FormGroup({
      attribute: new FormControl(
        openLoanFilter?.attribute || "",
        Validators.required
      ),
      operator: new FormControl(
        openLoanFilter?.operator || "",
        Validators.required
      ),
      value: new FormControl(
        openLoanFilter?.value || null,
        Validators.required
      ),
    });
    this.openLoanFilters().push(filter);
  }

  private listenForTabChange() {
    this.checkoutAdminService.tabIndex$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((tabIndex) => (this.currentTabIndex = tabIndex));
  }

  private setHeroState() {
    const heroProps = {
      title: "Risk Assessment",
      subTitle:
        "This section allows you to completely customise the risk assessment for all customers going through Checkout by Lendastack",
      tabs: ["Configuration Setup"],
    };

    this.store.dispatch(setConfigHero(heroProps))

  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  removeFilter(index: number) {
    this.openLoanFilters().removeAt(index);
  }

  excludeLoans(loans: string) {
    this.loansExcluded = loans.trim().split(",");
    this.form.get("loanTypeExceptions").setValue(this.loansExcluded);
  }

  toggleSwitch(value: boolean, control: string) {
    this.form.get(control).setValue(value);
  }

  submit() {
    this.isLoading = true;
    const { openLoanFilter, ...rest } = this.form.value;
    const transFormedOpenLoanFilter = openLoanFilter.map((filter) => ({
      attribute: filter.attribute[0]?.id,
      operator: filter.operator[0]?.id,
      value: filter.value,
    }));
    const payload = { ...rest, openLoanFilter: transFormedOpenLoanFilter };

    this.checkoutAdminService
      .configureRiskAssessment(payload as RiskAssessmentReqBody)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        () => {
          this.toast.fire({
            type: "success",
            title: "Risk Config updated successfully!",
          });

          this.onModeChange(this.riskAssessmentModeEnum.View);
          this.getRiskAssessmentConfig();
          this.isLoading = false;
        },
        () => (this.isLoading = false)
      );
  }

  getLightenedColor(color: string) {
    return lightenColor(color, 170);
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
