import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import Swal from "sweetalert2";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import {
  CALoanConfiguration,
  LoanConfig,
  LoanConfigForm,
  LoanConfigFormControls,
  CreditAffordModeEnum,
} from "../../../checkout-admin.types";
import { CheckoutAdminService } from "../../../checkout-admin.service";
import {
  AccordionItem,
  AccordionItemData,
  User,
} from "src/app/modules/shared/shared.types";
import { lightenColor } from "src/app/modules/shared/helpers/generic.helpers";
import { ConfigurationService } from "src/app/service/configuration.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { StringHumanifyPipe } from "src/app/util/custom-pipes/string-humanify.pipe";

@Component({
  selector: "lnd-loan-config",
  templateUrl: "./loan-config.component.html",
  styleUrls: ["./loan-config.component.scss"],
})
export class LoanConfigComponent implements OnInit, OnDestroy {
  @Input() config?: LoanConfig;
  @Input() user: User;
  @Output() retrieveConfig = new EventEmitter();

  private unsubscriber$ = new Subject();

  mode = CreditAffordModeEnum.View;
  hideHints = true;
  currentTheme: ColorThemeInterface;
  form: FormGroup<LoanConfigForm>;
  maxTenorRange = [...Array(12).keys()].map((i) => i + 1);
  useSameSettings = false;
  displaySwitches = true;
  isLoading = false;
  accordionItems: AccordionItem;
  creditAffordModeEnum = CreditAffordModeEnum;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  lightenAmount = 170;
  currencySymbol: string;
  secondaryRoutes: CustomDropDown[] = [
    { id: "CreditCheckOnly", text: "Credit Check Only" },
  ];

  previousLoanCat:string;
  earningClassArr: CustomDropDown[] = [
    {
      id: 'SalaryEarner',
      text: 'Salary Earner'
    },
    {
      id: 'GigWorker',
      text: 'Gig Worker'
    },
    {
      id: 'NoClass',
      text: 'No Class'
    }
  ]

  constructor(
    private colorThemeService: ColorThemeService,
    private checkoutAdminService: CheckoutAdminService,
    private readonly configService: ConfigurationService,
    private humanifyPipe: StringHumanifyPipe
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.initForm();
    this.setInitialMode();
    this.getCurrencySymbol();
    this.watchFormChanges();
  }

  private watchFormChanges(){
    this.categoriesControls().valueChanges.pipe(takeUntil(this.unsubscriber$)).subscribe(categories => {
      categories.forEach((category, index) => {
        if (!category.useSecondaryRoute) {
          category.route = null;
        }

        // if (category.autoDeclineByEarningClassIsTrue && category.earningClassesToDecline) {
        //   const value = category.earningClassesToDecline.map(x => {return x.id});
        //   this.categoriesControls().at(index).get("autoDeclineByEarningClassCategories").patchValue(value, { emitEvent: false });
        // } else {
        //   this.categoriesControls().at(index).get("autoDeclineByEarningClassCategories").patchValue([], { emitEvent: false });
        // }

        if (category.useSecondaryRoute) {
          this.categoriesControls().at(index).get("route").setValidators(Validators.required);
        } else {
          this.categoriesControls().at(index).get("route").clearValidators();
        }
        this.categoriesControls().at(index).get("route").updateValueAndValidity({ emitEvent: false });
        
      })
    })
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

  setInitialMode() {
    if (this.config) {
      this.viewLoanConfig();
      this.mode = CreditAffordModeEnum.View;
    } else {
      this.mode = CreditAffordModeEnum.None;
    }
  }

  private initForm() {
    this.form = new FormGroup({
      categories: new FormArray([]),
    });

    if (!this.config) {
      const keys = ["A", "B", "C", "D", "E"];
      keys.forEach((key) => this.addCategories(key));
    }
  }

  getCatData(cat: CALoanConfiguration): AccordionItemData[] {
    let response:AccordionItemData[] = [
      {
        title: "Limit Threshold Amount",
        value: cat.limitThresholdAmount,
        type: "currency",
      },
      {
        title: "Min Income Amount",
        value: cat.minIncomeAmount,
        type: "currency",
      },
      {
        title: "Max Tenor",
        value: `${cat.maxTenor} Month${cat.maxTenor > 1 ? "s" : ""}`,
      },
      {
        title: "Min Loan Amount",
        value: cat.minLoan,
        type: "currency",
      },
      {
        title: "Max Loan Amount",
        value: cat.maxLoan,
        type: "currency",
      },
      {
        title: "Max DTI (%)",
        value: cat.maxDTI,
        type: "currency",
      },
      {
        title: "Installment Multiplier",
        value: cat.instalmentMultiplier,
        type: "currency",
      },
      {
        title: "Interest Rate",
        value: `${cat.interestRate}%`,
      },
      {
        title: "Auto Decline",
        value: cat.autoDecline ? "On" : "Off",
        type: "string",
      },
      {
        title: "No Bank Check",
        value: cat.noBankCheck ? "On" : "Off",
        type: "string",
      },
      // {
      //   title: "Auto Decline By Earning Class",
      //   value: cat?.autoDeclineByEarningClass?.isEnabled ? "On" : "Off",
      //   type: "string",
      // },
      // {
      //   title: "Auto Decline By Earning Selected Classes",
      //   value: cat?.autoDeclineByEarningClass?.earningClasses ? cat?.autoDeclineByEarningClass?.earningClasses.map(x => {return this.humanifyPipe.transform(x)}).join(", ") : '',
      //   type: "string",
      // },
    ];

    if (cat.route) {
      response.push({
        title: "Secondary Route",
        value: cat.route,
        type: "string",
      })
    }
    return response
  }

  viewLoanConfig() {
    const catAConfig = this.config["CAT A"].loanConfiguration;
    const catBConfig = this.config["CAT B"].loanConfiguration;
    const catCConfig = this.config["CAT C"].loanConfiguration;
    const catDConfig = this.config["CAT D"].loanConfiguration;
    const catEConfig = this.config["CAT E"].loanConfiguration;

    this.accordionItems = {
      categoryA: this.getCatData(catAConfig),
      categoryB: this.getCatData(catBConfig),
      categoryC: this.getCatData(catCConfig),
      categoryD: this.getCatData(catDConfig),
      categoryE: this.getCatData(catEConfig),
    };
  }

  private patchLoanConfig() {
    this.categoriesControls().controls = [];
    for (const key in this.config) {
      this.addCategories(key.split(" ")[1], {
        ...this.config[key].loanConfiguration,
        maxTenor: [this.config[key].loanConfiguration.maxTenor],
      });
    }

    this.previousLoanCat = JSON.stringify(this.categoriesControls().value);
  }

  categoriesControls(): FormArray {
    return this.form.get("categories") as FormArray;
  }

  private addCategories(key: string, category?: CALoanConfiguration) {
    const secondaryRoute = this.secondaryRoutes.filter(
      (secondaryRoute) => secondaryRoute.id === category?.route
    );
    const categories = new FormGroup<LoanConfigFormControls>({
      key: new FormControl(`cat${key}`, Validators.required),
      title: new FormControl(`Category ${key}`, Validators.required),
      noBankCheck: new FormControl(
        category?.noBankCheck || false,
        Validators.required
      ),
      autoDecline: new FormControl(
        category?.autoDecline || false,
        Validators.required
      ),
      limitThresholdAmount: new FormControl(
        category?.limitThresholdAmount || null,
        Validators.required
      ),
      minIncomeAmount: new FormControl(
        category?.minIncomeAmount || null,
        Validators.required
      ),
      maxTenor: new FormControl(
        category?.maxTenor || null,
        Validators.required
      ),
      minLoan: new FormControl(category?.minLoan || null, Validators.required),
      maxLoan: new FormControl(category?.maxLoan || null, Validators.required),
      maxDTI: new FormControl(category?.maxDTI || null, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]),
      instalmentMultiplier: new FormControl(
        category?.instalmentMultiplier || null,
        [Validators.required, Validators.min(0.1)]
      ),
      interestRate: new FormControl(category?.interestRate || null, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]),
      useSecondaryRoute: new FormControl(
        category?.useSecondaryRoute || false,
        Validators.required
      ),
      route: new FormControl(secondaryRoute || ""),
      // earningClassesToDecline: new FormControl([]),
      // autoDeclineByEarningClassIsTrue: new FormControl(category?.autoDeclineByEarningClass?.isEnabled ?? false),
      // autoDeclineByEarningClassCategories: new FormControl(category?.autoDeclineByEarningClass?.earningClasses ?? [])
    });

    // const earningClasses = category?.autoDeclineByEarningClass?.earningClasses ?? [];
    // if (earningClasses.length > 0) {
    //   const slctDropdown = [];
    //   earningClasses.forEach((val: string) => {
    //     const data = this.earningClassArr.find(x => x.id === val);
    //     if (data) slctDropdown.push(data);
    //   });

    //   categories.get('earningClassesToDecline').patchValue(slctDropdown, { emitEvent: false });
    // }

    this.categoriesControls().push(categories);
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  toggleSwitch(value: boolean, key: string, index?: number) {
    if (key !== "useSameSettings" && key!== 'earningClass') {
      this.categoriesControls().at(index).get(key).setValue(value);
    }

    if (key === "useSameSettings") {
      this.useSameSettingsForOtherCats(value);
    }

    // if (key === 'earningClass') {
    //   this.categoriesControls().at(index).get('autoDeclineByEarningClassIsTrue').setValue(value);
    //   if (value) {
    //     this.categoriesControls().at(index).get('autoDeclineByEarningClassCategories').addValidators([Validators.required]);
    //     this.categoriesControls().at(index).get('earningClassesToDecline').addValidators([Validators.required]);
    //   } else {
    //     this.categoriesControls().at(index).get('autoDeclineByEarningClassCategories').setValue([]);
    //     this.categoriesControls().at(index).get('autoDeclineByEarningClassCategories').clearValidators();
    //     this.categoriesControls().at(index).get('earningClassesToDecline').setValue([]);
    //     this.categoriesControls().at(index).get('earningClassesToDecline').clearValidators();
    //   }

      
    //   this.categoriesControls().at(index).get("autoDeclineByEarningClassCategories").updateValueAndValidity({ emitEvent: false });
    //   this.categoriesControls().at(index).get("earningClassesToDecline").updateValueAndValidity({ emitEvent: false });
    // }
  }

  useSameSettingsForOtherCats(value: boolean) {
    this.useSameSettings = value;
    const catAValues = this.categoriesControls().at(0).value;
    this.categoriesControls().controls.forEach((control, index) => {
      if (index !== 0) {
        if (this.useSameSettings) {
          control.patchValue({
            ...catAValues,
            key: control.value.key,
            title: control.value.title,
          });
        } else {
          const previousControlValue = JSON.parse(this.previousLoanCat)[index];
          control.patchValue(previousControlValue);
        }

        this.displaySwitches = false;
        setTimeout(() => {
          this.displaySwitches = true;
        });
      }
    });
  }

  resetControls(control: AbstractControl) {
    const { key, title } = control.value;
    control.reset({});
    control.patchValue({ key, title });
  }

  submit() {
    let payload = {};

    this.form.value.categories.forEach((category) => {
      const { key, title, ...rest } = category;
      const transformedKey = key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toUpperCase();
      payload[transformedKey] = {
        ...rest,
        maxTenor: rest.maxTenor[0],
        route: category.route ? category.route[0]?.["id"] : null,
        useSameSettings: this.useSameSettings,
      };
      // payload[transformedKey]['autoDeclineByEarningClass'] = {
      //   isEnabled: autoDeclineByEarningClassIsTrue,
      //   earningClasses: [...autoDeclineByEarningClassCategories]
      // }
    });

    this.isLoading = true;
    this.checkoutAdminService
      .configureLoan({ creditAffordabilityConfig: payload })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.retrieveConfig.emit(true);
          this.isLoading = false;
          this.toast.fire({
            type: "success",
            title: "Loan configured successfully!",
          });
          this.onModeChange(CreditAffordModeEnum.View);
        },
        () => (this.isLoading = false)
      );
  }

  onModeChange(value: CreditAffordModeEnum) {
    if (value === CreditAffordModeEnum.Configure) {
      this.initForm();
    } else if (value === CreditAffordModeEnum.Edit) {
      this.patchLoanConfig();
    }

    this.mode = value;
  }

  getLightenedColor(color: string) {
    return lightenColor(color, this.lightenAmount);
  }


  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
