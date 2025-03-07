import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { debounceTime, map, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ConfigurationService } from "src/app/service/configuration.service";
import { InvestmentService } from "src/app/service/investment.service";
import { nonZero } from "src/app/util/validators/validators";
import { InvestmentDetails } from "../../types/investment.type";
import { InvestmentTypeAdditionalInfo } from "../../types/generics";
import { customDateFormat } from "src/app/util/finance/financeHelper";
import { InvestorType } from "../../types/Investor";
import { Store } from "@ngrx/store";
import { AppWideState } from "src/app/store/models";
import { selectCrmCustomerFeature, } from "src/app/store/selectors";
import { CRMCustomerDetail, } from "src/app/modules/crm/crm.types";

@Component({
  selector: "lnd-add-edit-inv-form",
  templateUrl: "./add-edit-investment-form.component.html",
  styleUrls: ["./add-edit-investment-form.component.scss"],
})
export class AddEditInvestmentForm implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  @Input() currentTab: number;
  @Input() currencySymbol: number;
  @Input() states: CustomDropDown[] = [];
  @Input() banks: CustomDropDown[] = [];
  @Input() investmentTypes: CustomDropDown[] = [];
  @Input() accounts: CustomDropDown[] = [];
  @Input() investmentInitialIsActive: boolean;
  @Input() isEditing: boolean;
  @Input() investmentDetails: InvestmentDetails;
  @Input() investorType: InvestorType;

  @Output() formValue = new EventEmitter();

  form: FormGroup;

  lgas: CustomDropDown[] = [];

  fetchingLgas = false;

  validatingBankAccount = false;

  verifyingUser = false;

  accountName = "";

  investmentTypeAdditionalInfo: InvestmentTypeAdditionalInfo;

  investorId: number;

  Investor_Type = InvestorType;

  selectedFile: File;
  crmCustomer:CRMCustomerDetail;

  constructor(
    private configureService: ConfigurationService,
    private invService: InvestmentService,
    private store: Store<AppWideState>
  ) {  }

  ngOnInit(): void {
    this.initForm();
    this.watchFormChanges();
    this.setupPersonalOrBusinessInfoEffects();
    this.setupFinanceInteractionEffects();

    if (this.isEditing && this.investmentDetails) {
      this.patchForm();
      this.isEditing = false
     }
    this.listenForCrmCustomer()

}

  private initForm() {
    this.form = new FormGroup({
      firstName: new FormControl(""),
      middleName: new FormControl(""),
      lastName: new FormControl(""),
      emailAddress: new FormControl("", [
        Validators.required,
        Validators.email,
      ]),
      phoneNumber: new FormControl(""),
      address: new FormGroup({
        houseNumber: new FormControl(""),
        street1: new FormControl(""),
        nearestLandMark: new FormControl(""),
        country: new FormControl("Nigeria"),
        state: new FormControl(""),
        stateId: new FormControl(null),
        localGovernmentArea: new FormControl(""),
        lgaId: new FormControl(null),
        address: new FormControl(""),
      }),
      bankAccountName: new FormControl("", Validators.required),
      bank: new FormControl("", Validators.required),
      bvn: new FormControl("", [
        Validators.minLength(11),
        Validators.maxLength(11),
        Validators.required,
      ]),
      bankAccountNumber: new FormControl("", Validators.required),
      investmentTypeId: new FormControl(null, Validators.required),
      investmentAmount: new FormControl(0, [
        Validators.required,
        nonZero.bind(this),
      ]),
      investmentRate: new FormControl(null, Validators.required),
      investmentTenor: new FormControl(null, Validators.required),
      startDate: new FormControl("", Validators.required),
      collectionPeriod: new FormControl(null, Validators.required),
      financeInteractionCashOrBankAccountId: new FormControl(null),
      hasFinanceInteraction: new FormControl(false, Validators.required),
      businessName: new FormControl(""),
      directorName: new FormControl(""),
      directorPhoneNumber: new FormControl(""),
      supportingDocument: new FormControl(null),
    });
  }

  private watchFormChanges() {
    this.form.valueChanges
      .pipe(debounceTime(600), takeUntil(this.unsubscriber$))
      .subscribe(() => {
        this.formValue.emit({
          isValid: this.form.valid,
          data: { ...this.form.getRawValue(), investorId: this.investorId },
        });
      });

    this.form
      .get("investmentTypeId")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res?.length > 0) {
          this.setupInvTypeEffects(res);
        }
      });

    this.form
      .get("investmentTenor")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => this.setupCollectionPeriodEffects(res));
  }

  private setupCollectionPeriodEffects(investmentTenor) {
    if (
      !this.form
        .get("collectionPeriod")
        .hasValidator(Validators.max(investmentTenor))
    ) {
      this.form
        .get("collectionPeriod")
        .setValidators([Validators.max(investmentTenor), Validators.required]);
    }

    this.form.get("collectionPeriod").updateValueAndValidity();
  }

  private setupPersonalOrBusinessInfoEffects() {
    if (this.investorType === this.Investor_Type.individual) {
      this.form.get("firstName").addValidators(Validators.required);
      this.form.get("lastName").addValidators(Validators.required);
      this.form.get("phoneNumber").addValidators(Validators.required);
    }

    if (this.investorType === this.Investor_Type.corporate) {
      this.form.get("businessName").addValidators(Validators.required);
      this.form.get("phoneNumber").addValidators(Validators.required);
      this.form.get("directorName").addValidators(Validators.required);
      this.form.get("directorPhoneNumber").addValidators(Validators.required);
      this.form.get("emailAddress").addValidators(Validators.required);
    }
  }

  private setupFinanceInteractionEffects() {
    if (this.investmentInitialIsActive) {
      this.form
        .get("financeInteractionCashOrBankAccountId")
        .addValidators(Validators.required);
      this.form
        .get("financeInteractionCashOrBankAccountId")
        .updateValueAndValidity();
    } else {
      this.form.get("financeInteractionCashOrBankAccountId").clearValidators();
      this.form
        .get("financeInteractionCashOrBankAccountId")
        .updateValueAndValidity();
    }
  }

  private setupInvTypeEffects(investmentType) {
    this.investmentTypeAdditionalInfo = JSON.parse(
      this.investmentTypes.find(
        (invType) => invType?.id === investmentType[0]?.id
      )?.additionalInfo
    );

    if (this.investmentTypeAdditionalInfo) {
      this.form
        .get("investmentRate")
        .addValidators([
          Validators.min(this.investmentTypeAdditionalInfo?.minInterest),
          Validators.max(this.investmentTypeAdditionalInfo?.maxInterest),
        ]);

      this.form
        .get("investmentAmount")
        .addValidators([
          Validators.min(this.investmentTypeAdditionalInfo?.minAmount),
          Validators.max(this.investmentTypeAdditionalInfo?.maxAmount),
        ]);

      this.form
        .get("investmentTenor")
        .addValidators([
          Validators.min(this.investmentTypeAdditionalInfo?.minTenor),
          Validators.max(this.investmentTypeAdditionalInfo?.maxTenor),
        ]);

      this.form.get("investmentRate").updateValueAndValidity();
      this.form.get("investmentAmount").updateValueAndValidity();
      this.form.get("investmentTenor").updateValueAndValidity();
    }
  }

  getStateLGAs(stateId: number) {
    this.form.get("address.localGovernmentArea").reset("");
    this.fetchingLgas = true;
    this.configureService
      .spoolLgasByState(stateId)
      .pipe(
        map((response) =>
          response.body.data.map((state) => ({
            id: state.id,
            text: state.name,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (lgas) => {
          this.lgas = lgas;
          if (this.isEditing) {
            const lga = this.lgas.filter(
              (lga) =>
                lga.id === this.investmentDetails?.billingAddressData?.lgaId
            ) as unknown as string;
            this.form.get("address.localGovernmentArea").setValue(lga);
          }
          this.fetchingLgas = false;
        },
        error: () => {
          this.fetchingLgas = false;
        },
      });
  }

  validateAccount() {
    if (
      this.form.value.bank &&
      this.form.value.bankAccountNumber &&
      this.form.get("bankAccountNumber").valid
    ) {
      const bankId = this.form.value.bank[0]["id"];
      const payload = {
        sortCode: bankId.split(".")[1],
        accountNumber: this.form.value.bankAccountNumber,
      };

      this.validatingBankAccount = true;

      this.invService
        .verifyBankAccount(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.accountName = res.body["data"]?.accountName;
            this.form
              .get("bankAccountName")
              .setValue(res.body["data"]?.accountName);
            this.validatingBankAccount = false;
          },
          error: () => {
            this.accountName = "err";
            this.validatingBankAccount = false;
            this.form.get("bankAccountNumber").setErrors({ invalid: true });
            this.form.get("bankAccountNumber").updateValueAndValidity();
          },
        });
    }
  }

  verifyUser() {
    if (this.form.value.emailAddress) {
      this.verifyingUser = true;
      this.invService
        .verifyInvestorEmailAddress(this.form.value.emailAddress)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            if (res.body) {
              this.form.patchValue({
                firstName: res.body?.firstName,
                lastName: res.body?.lastName,
                middleName: res.body?.middleName,
                phoneNumber: res.body?.phoneNumber,
              });
              this.investorId = res.body?.personId;
            } else {
              this.form.patchValue({
                firstName: "",
                lastName: "",
                middleName: "",
                phoneNumber: "",
              });
              this.investorId = null;
            }
            this.verifyingUser = false;
          },
          error: () => {
            this.verifyingUser = false;
          },
        });
    }
  }

  private patchForm() {
    const bank = this.banks.filter(
      (bank) => bank.text === this.investmentDetails?.additionalInfo?.bankName
    ) as unknown as string;

    const investmentType = [
      {
        id: this.investmentDetails?.investmentTypeInfo?.investmentTypeId,
        text: this.investmentDetails?.investmentTypeInfo?.investmentName,
      },
    ] as unknown as string;

    const financeAccount = this.accounts.filter(
      (account) =>
        account.id ===
        this.investmentDetails?.financeInteractionCashOrBankAccountId
    ) as unknown as string;

    const state = this.states.filter(
      (state) =>
        state.id === this.investmentDetails?.billingAddressData?.stateId
    ) as unknown as string;

    this.getStateLGAs(+this.investmentDetails?.billingAddressData?.stateId);

    this.form.patchValue({
      firstName: this.investmentDetails?.firstName,
      middleName: this.investmentDetails?.middleName,
      lastName: this.investmentDetails?.lastName,
      emailAddress: this.investmentDetails?.additionalInfo?.investorEmail,
      phoneNumber: this.investmentDetails?.additionalInfo?.phoneNumber,
      address: {
        houseNumber: this.investmentDetails?.billingAddressData?.houseNumber,
        street1: this.investmentDetails?.billingAddressData?.street1,
        nearestLandMark:
          this.investmentDetails?.billingAddressData?.nearestLandMark,
        country: this.investmentDetails?.billingAddressData?.country,
        state: state,
        stateId: this.investmentDetails?.billingAddressData?.stateId,
        lgaId: this.investmentDetails?.billingAddressData?.lgaId,
        address: this.investmentDetails?.billingAddressData?.address,
      },
      bankAccountName: this.investmentDetails?.additionalInfo?.bankAccountName,
      bank: bank,
      bvn: this.investmentDetails?.additionalInfo?.bvn,
      bankAccountNumber:
        this.investmentDetails?.additionalInfo?.bankAccountNumber,
      investmentTypeId: investmentType,
      investmentAmount: this.investmentDetails?.investmentAmount,
      investmentRate: this.investmentDetails?.investmentRate,
      investmentTenor: this.investmentDetails?.investmentTenor,
      startDate: customDateFormat(this.investmentDetails?.startDate),
      collectionPeriod: this.investmentDetails?.collectionPeriod,
      financeInteractionCashOrBankAccountId: financeAccount,
      hasFinanceInteraction: this.investmentDetails?.hasFinanceInteraction,
      businessName: this.investmentDetails?.investorName,
      directorName: this.investmentDetails?.additionalInfo?.directorName,
      directorPhoneNumber:
        this.investmentDetails?.additionalInfo.directorPhoneNumber,
    });

    this.form.get("collectionPeriod").disable();
    this.form.get("financeInteractionCashOrBankAccountId").disable();
    this.form.get("startDate").disable();
    this.form.get("investmentAmount").disable();
    this.form.get("investmentTypeId").disable();

    this.validateAccount();
    this.setupInvTypeEffects(investmentType);
  }

  handleFileInput(file: FileList): void {
    this.selectedFile = file[0];
    this.form.get("supportingDocument").setValue([file.item(0)]);
  }

  private listenForCrmCustomer() {
    this.store
      .select(selectCrmCustomerFeature)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((customer) => {
        this.crmCustomer = customer;
        if (this.crmCustomer) {
          this.investorId = customer?.InvestorId;
          const bank = this.banks.filter(bank => bank.text === customer?.bankName);
          this.form.patchValue({
            businessName: customer?.businessName,
            gmail: '',
            emailAddress: customer?.email,
            phoneNumber: customer?.phoneNumber,
            firstName: customer?.firstName,
            lastName: customer?.lastName,
            bankAccountNumber: customer?.bankAccountNumber,
            bvn: customer?.bvn,
            bank,
          });
          if (bank) {
            this.validateAccount();
          }

          this.form.get("emailAddress").disable();
        if(this.crmCustomer?.firstName || this.crmCustomer?.lastName ) {
          this.form.get("phoneNumber").disable();
          this.form.get("firstName").disable();
          this.form.get("lastName")?.disable();
          this.form.get("bvn").disable();
          this.form.get("businessName").disable();
          this.form.get("investmentRate").enable();
          this.form.get("investmentAmount").enable();
          this.form.get("collectionPeriod").enable();
        }

        if(this.crmCustomer?.bankName &&
          this.crmCustomer?.bankId &&
          this.crmCustomer?.bankAccountNumber ){
          this.form.get("bankAccountNumber").disable();
           this.form.get("bank").disable();
        }

        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
