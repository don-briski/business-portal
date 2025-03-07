import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Observable, Subject, forkJoin } from "rxjs";
import { map, mergeMap, pluck, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpResponse } from "@angular/common/http";

import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { CheckoutAdminService } from "../../checkout-admin.service";
import { toFormData } from "src/app/util/finance/financeHelper";
import { MerchantDetails } from "../../types/merchant";
import { Bank } from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-add-edit-merchant",
  templateUrl: "./add-edit-merchant.component.html",
  styleUrls: ["./add-edit-merchant.component.scss"],
})
export class AddEditMerchantComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();

  colorTheme: ColorThemeInterface;

  @ViewChild("file") logoInput: ElementRef<HTMLInputElement>;
  merchant: MerchantDetails;
  banks: Bank[] = [];
  modifiedBanks: CustomDropDown[] = [];
  fetching = false;
  editing = false;
  submitting = false;
  verifyingAccNumber = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  form = this.fb.group({
    name: ["", Validators.required],
    phoneNumber: [
      "",
      [
        Validators.required,
        Validators.minLength(11),
        Validators.maxLength(11),
        Validators.pattern("^[0-9]*$"),
      ],
    ],
    registrationNumber: ["", Validators.required],
    email: ["", [Validators.required, Validators.email]],
    commission: [0],
    redirectUrl: [""],
    callbackUrl: [""],
    verificationLink: [""],
    address: ["", Validators.required],
    city: ["", Validators.required],
    houseNumber: [""],
    logo: this.fb.control<File>(null),
    maxLoanAmount: [0],
    bankName: ["", Validators.required],
    country: ["", Validators.required],
    countryId: [0, Validators.required],
    state: ["", Validators.required],
    stateId: [0, Validators.required],
    bankSortCode: ["", Validators.required],
    bankId: [0, Validators.required],
    bankArray: this.fb.control<CustomDropDown[]>([]),
    countryObj: this.fb.control<CustomDropDown[]>([]),
    stateObj: this.fb.control<CustomDropDown[]>([]),
    accountNumber: [
      "",
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern("^[0-9]*$"),
      ],
    ],
    bankAccountName: [{ value: "", disabled: true }, Validators.required],
    isActive: [false],
    hasInterestRate: [false],
    hasCommission: [false],
    hasMaximumLoanAmount: [false],
    interestRate: [0],
    downPaymentRequired: [false],
    downPaymentRate: [0],
    isBankAccountValidated: [false],
    notes: [""],
    autoDeclineByCategories: [false],
    autoDeclineByEarningClass: [false],
    categoriesToDecline: this.fb.control<CustomDropDown[]>([]),
    earningClassesToDecline: this.fb.control<CustomDropDown[]>([])
  });
  currencySymbol: string;
  countries: any[] = [];
  states: any[] = [];
  categoriesArr: CustomDropDown[] = [
    {
      id: 'A',
      text: 'Cat A'
    },
    {
      id: 'B',
      text: 'Cat B'
    },
    {
      id: 'C',
      text: 'Cat C'
    },
    {
      id: 'D',
      text: 'Cat D'
    },
    {
      id: 'E',
      text: 'Cat E'
    },
  ]
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
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly colorThemeService: ColorThemeService,
    private readonly configService: ConfigurationService,
    private readonly checkoutAdminService: CheckoutAdminService
  ) {}

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.getCountries();
    this.loadTheme();
    this.watchFormChanges();
    this.resolveEditMode();
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

  resolveEditMode() {
    const id = this.route.snapshot.params["id"];
    if (id) {
      this.editing = true;
      this.getMerchantAndBanks(id);
    } else {
      this.form.get("logo").setValidators(Validators.required);
      this.editing = false;
      this.getBanks();
      this.getStates();
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

  watchFormChanges() {
    this.form
      .get("bankArray")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          if (res[0]) {
            this.form.get("bankName").setValue(res[0].text);
          } else {
            this.form.get("bankName").setValue("");
          }
        },
      });
    this.form
      .get("countryObj")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          if (res[0]) {
            this.form.get("country").setValue(res[0].text);
            this.form.get("countryId").setValue(+res[0].id);
          } else {
            this.form.get("country").setValue("");
            this.form.get("countryId").setValue(0);
          }
        },
      });
    this.form
      .get("stateObj")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          if (res[0]) {
            this.form.get("state").setValue(res[0].text);
            this.form.get("stateId").setValue(+res[0].id);
          } else {
            this.form.get("state").setValue("");
            this.form.get("stateId").setValue(0);
          }
        },
      });
  }

  patchForm() {
    const bus = this.merchant;
    const bankArray: CustomDropDown[] = this.modifiedBanks.filter(
      (b) => b.text === bus.bankName
    );
    const categoriesToDecline = [];
    const earningClassesToDecline = [];
    const selectedAutoDeclineCategories = bus?.autoDeclineConfiguration?.autoDeclineByCategory?.categories;
    if (selectedAutoDeclineCategories && selectedAutoDeclineCategories?.length > 0) {
      selectedAutoDeclineCategories.forEach((cat: string) => {
        categoriesToDecline.push(this.categoriesArr.find(x => x.id === cat));
      })
    }
    const selectedAutoDeclineEarningClasses = bus?.autoDeclineConfiguration?.autoDeclineByEarningClass?.earningClasses;
    if (selectedAutoDeclineEarningClasses && selectedAutoDeclineEarningClasses?.length > 0) {
      selectedAutoDeclineEarningClasses.forEach((cat: string) => {
        earningClassesToDecline.push(this.earningClassArr.find(x => x.id === cat));
      })
    }

    this.form.patchValue({
      name: bus.name,
      phoneNumber: bus.phoneNumber,
      email: bus.email,
      commission: bus.commission,
      logo: null, 
      maxLoanAmount: bus.maxLoanAmount,
      bankName: bus.bankName,
      bankArray,
      accountNumber: bus.accountNumber,
      isActive: bus.status === "Active",
      downPaymentRequired: bus.downPaymentRequired,
      downPaymentRate: bus.downPaymentRate, 
      hasInterestRate: bus.hasInterestRate,
      hasCommission: bus.hasCommission,
      hasMaximumLoanAmount: bus.hasMaximumLoanAmount,
      interestRate: bus.interestRate,
      notes: bus.notes,
      callbackUrl: bus.callBackUrl,
      redirectUrl: bus.redirectUrl,
      registrationNumber: bus.registrationNumber,
      isBankAccountValidated: bus.isBankAccountValidated,
      bankAccountName: bus.bankAccountName,
      houseNumber: bus?.billingAddress?.houseNumber,
      city: bus?.billingAddress?.city,
      address: bus?.billingAddress?.address,
      country: bus?.billingAddress?.country,
      countryId: bus?.billingAddress?.countryId,
      state: bus?.billingAddress?.state,
      stateId: bus?.billingAddress?.stateId,
      autoDeclineByCategories: bus?.autoDeclineConfiguration?.autoDeclineByCategory?.isEnabled ?? false,
      autoDeclineByEarningClass: bus?.autoDeclineConfiguration?.autoDeclineByEarningClass?.isEnabled ?? false,
      categoriesToDecline,
      earningClassesToDecline
    });

    this.onVerifyAccDetails();
  }

  getMerchantAndBanks(id: number) {
    this.fetching = true;

    this.configService
      .spoolBanks({ provider: "Paystack" })
      .pipe(
        mergeMap((val: any) => {
          this.banks = val.body;
          this.modifiedBanks = val.body.map((b) => ({
            id: b.bankId,
            text: b.bankName,
          }));
          return this.checkoutAdminService.fetchMerchant(id);
        })
      )
      .subscribe({
        next: (res) => {
          this.merchant = res.body.data;
          this.patchForm();
          const countryObj = {id: this.merchant?.billingAddress?.countryId, text: this.merchant?.billingAddress?.country}
          this.form.get("countryObj").patchValue([countryObj]);
          this.getStates();
          this.fetching = false;
        },
        error: () => {
          this.fetching = false;
        },
      });
  }

  getBanks() {
    this.configService
      .spoolBanks({ provider: "Paystack" })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.banks = res.body;
          this.modifiedBanks = res.body.map((b) => ({
            id: b.bankId,
            text: b.bankName,
          }));
        },
      });
  }

  toggleStatusSwitch(value: boolean) {
    this.form.get("isActive").setValue(value);
  }

  handleFileInput(filelist: FileList): void {
    const file = filelist.item(0);
    const isValid = this.validateFileType(file.type);
    if (!isValid) {
      this.logoInput.nativeElement.value = null;
      return;
    }

    if (filelist.length) {
      this.form.get("logo").setValue(file);
    } else {
      this.form.get("logo").setValue(null);
    }
  }

  validateFileType(type: string): boolean {
    const fileExt = type.split("/")[1];
    const isValid =
      fileExt && (fileExt === "jpeg" || fileExt === "jpg" || fileExt === "png");

    if (!isValid) {
      Swal.fire({
        type: "error",
        title: "Wrong File Type",
        text: "Logo can only be a jpeg, jpg or png",
        confirmButtonText: "Okay",
        confirmButtonColor: "#558E90",
      }).then(() => {});
    }

    return isValid;
  }

  generateValidators(min = 0, max?: number): any[] {
    const validators = [Validators.required, Validators.min(min)];

    if (max) {
      validators.push(Validators.max(max));
    }

    return validators;
  }

  toggleSwitch(
    value: boolean,
    field: "interestRate" | "downPayment" | "commission" | "loanAmount" | "categories" | "earningClass"
  ) {
    if (field === "interestRate") {
      this.form.get("hasInterestRate").setValue(value);
      const interestRateCtrl = this.form.get("interestRate");
      if (value) {
        interestRateCtrl.addValidators(this.generateValidators(0, 100));
      } else {
        interestRateCtrl.setValue(0);
        interestRateCtrl.clearValidators();
      }
      interestRateCtrl.updateValueAndValidity();
    } else if (field === "downPayment") {
      this.form.get("downPaymentRequired").setValue(value);
      const downPaymentRateCtrl = this.form.get("downPaymentRate");
      if (value) {
        downPaymentRateCtrl.addValidators(this.generateValidators(0.1, 100));
      } else {
        downPaymentRateCtrl.setValue(0);
        downPaymentRateCtrl.clearValidators();
      }
      downPaymentRateCtrl.updateValueAndValidity();
    } else if (field === "commission") {
      this.form.get("hasCommission").setValue(value);
      const hasCommissionCtrl = this.form.get("commission");
      if (value) {
        hasCommissionCtrl.addValidators(this.generateValidators(0.1, 100));
      } else {
        hasCommissionCtrl.setValue(0);
        hasCommissionCtrl.clearValidators();
      }
      hasCommissionCtrl.updateValueAndValidity();
    } else if (field === 'loanAmount') {
      this.form.get("hasMaximumLoanAmount").setValue(value);
      const maximumLoanAmountCtrl = this.form.get("maxLoanAmount");
      if (value) {
        maximumLoanAmountCtrl.addValidators(this.generateValidators(1));
      } else {
        maximumLoanAmountCtrl.setValue(0);
        maximumLoanAmountCtrl.clearValidators();
      }
      maximumLoanAmountCtrl.updateValueAndValidity();
    } else if (field === 'categories') {
      this.form.get('autoDeclineByCategories').patchValue(value);
      const categoriesToDecline = this.form.get('categoriesToDecline');
      if (value) {
        categoriesToDecline.addValidators([Validators.required]);
      } else {
        categoriesToDecline.setValue([]);
        categoriesToDecline.clearValidators();
      }
    } else if (field === 'earningClass') {
      this.form.get('autoDeclineByEarningClass').patchValue(value);
      const earningClassesToDecline = this.form.get('earningClassesToDecline');
      if (value) {
        earningClassesToDecline.addValidators([Validators.required]);
      } else {
        earningClassesToDecline.setValue([]);
        earningClassesToDecline.clearValidators();
      }
    }
    this.form.updateValueAndValidity();
  }

  onVerifyAccDetails() {
    this.form.get("isBankAccountValidated").patchValue(false);

    const sortCode = this.banks.find(
      (bank) => bank.bankName === this.form.value.bankName
    )?.sortCode;
    const bankId = this.banks.find(
      (bank) => bank.bankName === this.form.value.bankName
    )?.bankId;

    if (sortCode && bankId) {
      this.verifyingAccNumber = true;
      this.checkoutAdminService
        .verifyAccountNumber({
          accountNumber: this.form.value.accountNumber,
          sortCode,
        })
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.verifyingAccNumber = false;
            this.form.get("bankSortCode").patchValue(sortCode ?? null);
            this.form.get("bankId").patchValue(bankId ?? null);
            this.form.get("isBankAccountValidated").patchValue(true);
            this.form.get("bankAccountName").patchValue(res.account_name);
          },
          error: () => {
            this.verifyingAccNumber = false;
            this.form.get("isBankAccountValidated").setValue(false);
          },
        });
    } else {
      this.toast.fire({
        type: "info",
        title: `Please select your bank`,
      });
    }
  }

  onSubmit() {
    this.submitting = true;

    const {
      bankArray,
      city,
      countryObj,
      country,
      countryId,
      state,
      stateId,
      stateObj,
      address,
      houseNumber,
      autoDeclineByCategories,
      autoDeclineByEarningClass,
      categoriesToDecline,
      earningClassesToDecline,
      ...rest
    } = this.form.getRawValue();
    const billingAddress = {
      city,
      state,
      stateId,
      houseNumber,
      address,
      country,
      countryId,
    };
    const autoDeclineByCategory = {
      isEnabled: autoDeclineByCategories,
      categories: categoriesToDecline.map((val: CustomDropDown) => {return val.id})
    };
    if (!autoDeclineByCategory.isEnabled) delete autoDeclineByCategory.categories;
    const autoDeclineByEarningClasses = {
      isEnabled: autoDeclineByEarningClass,
      earningClasses: earningClassesToDecline.map((val: CustomDropDown) => {return val.id})
    };
    
    if (!autoDeclineByEarningClasses.isEnabled) delete autoDeclineByEarningClasses.earningClasses;
    rest["billingAddress"] = billingAddress;
    rest["autoDeclineByCategory"] = autoDeclineByCategory;
    rest["autoDeclineByEarningClass"] = autoDeclineByEarningClasses;

    const formData = toFormData(rest);
    if (categoriesToDecline.length > 0 && autoDeclineByCategories) {
      formData.delete('autoDeclineByCategory.categories');
      autoDeclineByCategory.categories.forEach((cat: string) => {
        formData.append('autoDeclineByCategory.categories', cat);
      })
    } else {
      formData.delete('autoDeclineByCategory.categories');
    }
    if (earningClassesToDecline.length > 0 && autoDeclineByEarningClass) {
      formData.delete('autoDeclineByEarningClass.earningClasses');
      autoDeclineByEarningClasses.earningClasses.forEach((earningClass: string) => {
        formData.append('autoDeclineByEarningClass.earningClasses', earningClass);
      })
    } else {
      formData.delete('autoDeclineByEarningClass.earningClasses');
    }
    let req: Observable<HttpResponse<any>>;

    if (this.editing) {
      req = this.checkoutAdminService.editMerchant({
        payload: formData,
        id: this.merchant.id,
      });
    } else {
      req = this.checkoutAdminService.createMerchant(formData);
    }

    req.pipe(takeUntil(this.unsubscriber$)).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.fire({
          type: "success",
          title: `Merchant ${
            this.editing ? "edited" : "created"
          } successfully!`,
        });
        this.router.navigateByUrl("/checkout-admin/config/merchants");
      },
      error: (err) => {
        this.submitting = false;
        if (typeof err.error === "object") {
          const errorMessage = err.error.errors.join(" ");
          Swal.fire({
            type: "error",
            title: "Please check the following",
            text: errorMessage,
          });
        }
      },
    });
  }

  private getCountries(): void {
    this.configService
      .spoolCountries()
      .pipe(
        pluck("body"),
        map((countries) => {
          return countries.map(({ id, name }) => {
            return { id: id, text: name };
          });
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((res) => {
        this.countries = res;
        if (!this.editing) this.preselectCountry();
      });
  }

  private getStates(): void {
    this.configService
      .getStates()
      .pipe(
        pluck("body"),
        map((states) => {
          return states.data.map(({ id, name }) => {
            return { id: id, text: name };
          });
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((res) => {
        this.states = res;

        if (this.editing) {
          const selectedState = this.states.find(x => x.text.toLowerCase() === this.merchant?.billingAddress?.state?.toLowerCase());
          this.form.get("stateObj").setValue([selectedState]);
        }
      });
  }

  preselectCountry(): void {
    const nigeriaObj = this.countries.find(
      (x) => x.text.toLowerCase() === "nigeria"
    );

    if (nigeriaObj) {
      this.form.get("countryObj").patchValue([nigeriaObj]);
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
