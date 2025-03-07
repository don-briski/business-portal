import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { forkJoin, Observable, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  CRMCustomerDetail,
  CustomerType,
} from "../../../crm.types";
import Swal from "sweetalert2";
import { toTitleCase } from "src/app/modules/shared/helpers/generic.helpers";
import { ActivatedRoute, Router } from "@angular/router";
import { CrmService } from "../../../crm.service";
import { customDateFormat } from "src/app/util/finance/financeHelper";
import { LoanProfile } from "src/app/modules/loan-section/loan.types";
import { AuthService } from "src/app/service/auth.service";
import { VerifyBankAccount } from "src/app/modules/configuration/models/configuration";

@Component({
  selector: "lnd-add-edit-customer",
  templateUrl: "./add-edit-customer.component.html",
  styleUrls: ["./add-edit-customer.component.scss"],
})
export class AddEditCustomerComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject<void>();

  isLoading = false;

  isFetching = false;

  colorTheme: ColorThemeInterface;

  genders: CustomDropDown[] = [];

  maritalStatuses: CustomDropDown[] = [];

  employmentStatuses: CustomDropDown[] = [];

  banks: CustomDropDown[] = [];

  currencySymbol: string;

  form = new FormGroup({
    firstName: new FormControl("", Validators.required),
    lastName: new FormControl("", Validators.required),
    dateOfBirth: new FormControl(""),
    phoneNumber: new FormControl("", [
      Validators.minLength(11),
      Validators.maxLength(11),
    ]),
    bvn: new FormControl("", [
      Validators.minLength(11),
      Validators.maxLength(11),
    ]),
    email: new FormControl("", Validators.email),
    gender: new FormControl(null),
    maritalStatus: new FormControl(null),
    employmentStatus: new FormControl(null),
    address: new FormControl(""),
    nextOfKinFirstName: new FormControl(""),
    nextOfKinLastName: new FormControl(""),
    nextOfKinDateOfBirth: new FormControl(""),
    nextOfKinPhoneNumber: new FormControl("", [
      Validators.minLength(11),
      Validators.maxLength(11),
    ]),
    nextOfKinRelationship: new FormControl(""),
    nextOfKinEmailAddress: new FormControl("", Validators.email),
    nextOfKinAddress: new FormControl(""),
    bankId: new FormControl(null),
    bankAccountName: new FormControl(""),
    bankAccountNumber: new FormControl(""),
    netIncome: new FormControl(0),
  });

  allowCreateCustomer = false;

  customer: CRMCustomerDetail;

  validatingBankAccount = false;
  validatingBvn = false;
  profile: LoanProfile;
  customerType: CustomerType;
  CUSTOMER_TYPE = CustomerType;

  constructor(
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService,
    private router: Router,
    private crmService: CrmService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    if (this.route.snapshot.params["id"]) {
      this.customer = {
        ...this.customer,
        id: this.route.snapshot.params["id"],
      };
    }

    this.initializeRequirements();
  }

  ngOnInit(): void {
    this.loadTheme();
    this.watchFormChanges();
  }

  private watchFormChanges() {
    this.form.valueChanges
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => this.updateAllowCreateCustomer(res));
  }

  private updateAllowCreateCustomer(formValues){
    this.allowCreateCustomer = false;
    for (const key in formValues) {
      if (formValues[key]?.length === 0 || formValues["netIncome"] === 0) {
        this.allowCreateCustomer = false;
        return;
      } else {
        this.allowCreateCustomer = true;
      }
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

  private initializeRequirements() {
    this.isFetching = true;
    this.getCurrencySymbol();

    this.genders = [
      { id: "Male", text: "Male" },
      { id: "Female", text: "Female" },
    ];

    this.maritalStatuses = [
      { id: "Single", text: "Single" },
      { id: "Married", text: "Married" },
    ];

    this.employmentStatuses = [
      { id: "Employed", text: "Employed" },
      { id: "SelfEmployed", text: "Self-Employed" },
      { id: "Unemployed", text: "Unemployed" },
    ];

    let sources: Observable<any>[] = [
      this.configService.spoolBanks({ provider: "Paystack" }).pipe(
        map((response) =>
          response.body.map((bank) => ({
            id: `${bank.bankId}.${bank.sortCode}`,
            text: bank.bankName,
          }))
        ),
        map((banks) => banks.sort((a, b) => a.text.localeCompare(b.text)))
      ),
    ];

    if (this.customer?.id) {
      sources.push(this.crmService.getCustomer(this.customer?.id));
    }

    forkJoin(sources)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.banks = res[0];
          if (this.customer?.id) {
            this.patchForm(res[1]?.body?.data);
          }
          this.isFetching = false;
        },
        error: () => {
          this.isFetching = false;
        },
      });
  }

  private getCurrencySymbol() {
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

  validateBvn() {
    this.validatingBvn = true;
    this.configService
      .validateBVN({
        bvn: this.form.value.bvn || this.customer?.bvn,
        emailAddress: this.form.value.email,
        userId: this.authService.decodeToken().nameid,
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.profile = {
            name: `${res.body.data.first_name} ${
              res.body.data.middleName || ""
            } ${res.body.data.last_name}`,
            dob: res.body.data.dob,
            imgUrl: res.body.data.bvnImageUrl,
          };
          this.validatingBvn = false;
        },
        error: () => {
          this.profile = null;
          this.form.get("bvn").setErrors({ invalidBvn: true });
          this.validatingBvn = false;
        },
      });
  }

  validateBank() {
    this.validatingBankAccount = true;
    const sortCode = this.form.value.bankId[0]?.id.split(".")[1];
    const payload: VerifyBankAccount = {
      sortCode,
      accountNumber: this.form.value.bankAccountNumber,
    };
    this.configService
      .validateBankAccount(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.form.get("bankAccountName").setValue(res.body.data.accountName);
          this.validatingBankAccount = false;
        },
        error: () => {
          this.form.get("bankAccountName").setValue("");
          this.form
            .get("bankAccountName")
            .setErrors({ invalidBankDetails: true });
          this.validatingBankAccount = false;
        },
      });
  }

  submit(type: CustomerType) {
    this.isLoading = true;
    this.customerType = type;
    const { bankId, employmentStatus, gender, maritalStatus, ...rest } =
      this.form.getRawValue();

    const payload: CRMCustomerDetail = {
      ...rest,
      bankId: bankId?.length > 0 ? +bankId?.[0]?.id?.split(".")[0] : "",
      employmentStatus:
        employmentStatus?.length > 0 ? employmentStatus?.[0]?.id : "None",
      gender: gender?.length > 0 ? gender?.[0]?.id : "None",
      maritalStatus:
        maritalStatus?.length > 0 ? maritalStatus?.[0]?.id : "None",
    };

    type === this.CUSTOMER_TYPE.Prospect && this.saveProspect(payload);
    type === this.CUSTOMER_TYPE.Customer && this.createCustomer(payload);
  }

  saveProspect(payload) {
    this.isLoading = true;
    if (!this.customer?.id) {
      this.crmService
        .saveProspect(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.postSuccess(
              this.CUSTOMER_TYPE.Prospect,
              payload,
              res.body.data
            );
          },
          error: () => {
            this.isLoading = false;
          },
        });
    }

    if (this.customer?.id) {
      this.crmService
        .updateDraft({ ...payload, id: this.customer?.id })
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => {
            this.postSuccess(this.CUSTOMER_TYPE.Prospect, payload);
          },
          error: () => {
            this.isLoading = false;
          },
        });
    }
  }

  createCustomer(customer: CRMCustomerDetail) {
    this.isLoading = true;
    let payload = customer;
    if (
      !this.customer?.id ||
      (this.customer.status === CustomerType.Prospect && this.form.valid)
    ) {
      if (this.customer?.id) {
        payload = { ...payload, id: this.customer?.id };
      }
      this.crmService
        .createCustomer({ ...payload, ...customer })
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.postSuccess(
              this.CUSTOMER_TYPE.Customer,
              payload,
              res.body.data
            );
          },
          error: () => {
            this.isLoading = false;
          },
        });
    }

    if (
      this.customer?.id &&
      this.customer.status === CustomerType.Customer
    ) {
      this.crmService
        .updateProspect({ ...payload, id: this.customer?.id })
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.postSuccess(
              this.CUSTOMER_TYPE.Customer,
              payload,
              res.body.data
            );
          },
          error: () => {
            this.isLoading = false;
          },
        });
    }
  }

  postSuccess(type: CustomerType, payload?: CRMCustomerDetail, id?: string) {
    this.isLoading = false;
    const customerId = id || this.customer?.id;
    let title = "";

    if (type === this.CUSTOMER_TYPE.Customer) {
      title = "Customer ";
      if (this.customer?.id) {
        title = title + "Updated";
      } else {
        title = title + "Created";
      }
    }

    if (type === this.CUSTOMER_TYPE.Prospect) {
      title = "Profile ";
      if (this.customer?.id) {
        title = title + "Updated";
      } else {
        title = title + "Saved";
      }
    }

    Swal.fire({
      title,
      html:
        type === this.CUSTOMER_TYPE.Prospect
          ? `Prospect's profile has been ${
              this.customer?.id ? "Updated" : "saved"
            }`
          : `You have successfully ${
              this.customer?.id ? "updated the" : "created a"
            } Profile for ` +
            "<b>" +
            toTitleCase(payload.firstName) +
            " " +
            toTitleCase(payload.lastName) +
            "</b>",
      confirmButtonText: "Continue",
      confirmButtonColor: this.colorTheme.secondaryColor,
      showCancelButton: true,
      showCloseButton: true,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      imageUrl:
        type === this.CUSTOMER_TYPE.Prospect
          ? "/assets/images/green-bg-tick-circle.svg"
          : "/assets/images/crm-customer.svg",

      customClass: {
        cancelButton: "swal-cancel-btn",
        confirmButton: "swal-confirm-btn",
        closeButton: "swal-close-btn",
        actions: "swal-actions",
      },
    }).then((result) => {
      if (result?.value) {
        this.router.navigateByUrl(`/crm/customers/${customerId}`);
      }
    });
  }

  patchForm(customer: CRMCustomerDetail) {
    this.customer = customer;
    this.customer.gender =
      this.customer?.gender && this.customer.gender !== "None"
        ? ([
            { id: this.customer.gender, text: this.customer.gender },
          ] as unknown as string)
        : "";

    this.customer.maritalStatus =
      this.customer?.maritalStatus && this.customer.maritalStatus !== "None"
        ? ([
            {
              id: this.customer.maritalStatus,
              text: this.customer.maritalStatus,
            },
          ] as unknown as string)
        : "";

    this.customer.employmentStatus =
      this.customer?.employmentStatus &&
      this.customer.employmentStatus !== "None"
        ? ([
            {
              id: this.customer.employmentStatus,
              text: this.customer.employmentStatus,
            },
          ] as unknown as string)
        : "";

    if (this.customer.bankId) {
      const bank = this.banks.filter(
        (bank) => bank.text === this.customer.bankName
      );
      this.customer.bankId = bank as unknown as number;
      this.form.get("bankId").markAsDirty();
      this.form.get("bankId").updateValueAndValidity();
    }
    this.customer.dateOfBirth = this.customer?.dateOfBirth
      ? customDateFormat(this.customer?.dateOfBirth)
      : "";
    this.customer.nextOfKinDateOfBirth = this.customer?.nextOfKinDateOfBirth
      ? customDateFormat(this.customer?.nextOfKinDateOfBirth)
      : "";
    if (this.customer.bvn) {
      this.validateBvn();
      this.form.get("bvn").markAsDirty();
      this.form.get("bvn").updateValueAndValidity();
    }
    if (this.customer.bankAccountNumber) {
      this.form.get("bankAccountNumber").markAsDirty();
      this.form.get("bankAccountNumber").updateValueAndValidity();
    }
    this.form.patchValue(this.customer);

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();
    this.updateAllowCreateCustomer(this.form.value)
    this.isFetching = false;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
