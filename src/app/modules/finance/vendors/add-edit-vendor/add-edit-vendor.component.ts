import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  UntypedFormArray,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { Subject } from "rxjs";
import { map, pluck, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "../../../../model/CustomDropdown";
import { FinanceService } from "../../service/finance.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import Swal from "sweetalert2";
import { ConfigurationService } from "src/app/service/configuration.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Vendor } from "../../models/vendor.interface";

@Component({
  selector: "app-add-edit-vendor",
  templateUrl: "./add-edit-vendor.component.html",
  styleUrls: ["./add-edit-vendor.component.scss"],
})
export class AddEditVendorComponent implements OnInit, OnDestroy {
  @Input() showHeader: boolean = true;
  @Output() vendorAdded = new EventEmitter();

  vendorForm: UntypedFormGroup;
  salutations: CustomDropDown[] = [
    { id: 1, text: "Mr" },
    { id: 2, text: "Mrs" },
    { id: 3, text: "Miss" },
  ];
  protocols: CustomDropDown[] = [
    { id: 0, text: "http" },
    { id: 1, text: "https" },
  ];
  protocol: string = "https";
  countries: CustomDropDown[] = [];
  states: CustomDropDown[] = [];
  allBanks: CustomDropDown[] = [];
  addBankIndex: number;
  selectedBank: any | null = null;
  terms: CustomDropDown[] = [];
  showShipping: boolean = false;
  isLoading: boolean = false;
  isEditing: boolean;
  unsubscriber$ = new Subject();
  vendor?: Vendor;
  currentTheme: ColorThemeInterface;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  private _selectedVendorId: number;

  constructor(
    private fb: UntypedFormBuilder,
    private financeService: FinanceService,
    private route: ActivatedRoute,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService,
    private modalService: NgbModal
  ) {
    this.route.url.pipe(takeUntil(this.unsubscriber$)).subscribe((res: any) => {
      if (res[1].path === "edit") {
        this.isEditing = true;

        this.route.paramMap
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe((params: ParamMap) => {
            this._selectedVendorId = +params.get("id");
          });
      } else {
        this.isEditing = false;
      }
    });
  }

  ngOnInit(): void {
    this.loadTheme();
    this.getBanks();
    this.getCountries();
    this.initForm();
    this.getPaymentTerms();
    if (this.isEditing) {
      this._getVendor();
    }
  }

  openModal(modal: any, index: number): void {
    this.addBankIndex = index;
    this.modalService.open(modal, { centered: true });
  }

  toggleShipping(): void {
    this.showShipping = !this.showShipping;
    this.toggleShippingControl();
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  newBank(event): void {
    this.banks().at(this.addBankIndex).get("bankName").setValue(event.bankName);
    this.banks().at(this.addBankIndex).get("newBank").setValue(true);

    this.selectedBank = event;
  }

  toggleShippingControl(): void {
    if (this.showShipping) {
      this.vendorForm.get("shippingAttention").enable();
      this.vendorForm.get("shippingCountry").enable();
      this.vendorForm.get("shippingAddress").enable();
      this.vendorForm.get("shippingStreet1").enable();
      this.vendorForm.get("shippingStreet2").enable();
      this.vendorForm.get("shippingCity").enable();
      this.vendorForm.get("shippingState").enable();
      this.vendorForm.get("shippingZipcode").enable();
      this.vendorForm.get("shippingPhone").enable();
      this.vendorForm.get("shippingFax").enable();
    } else {
      this.vendorForm.get("shippingAttention").disable();
      this.vendorForm.get("shippingCountry").disable();
      this.vendorForm.get("shippingAddress").disable();
      this.vendorForm.get("shippingStreet1").disable();
      this.vendorForm.get("shippingStreet2").disable();
      this.vendorForm.get("shippingCity").disable();
      this.vendorForm.get("shippingState").disable();
      this.vendorForm.get("shippingZipcode").disable();
      this.vendorForm.get("shippingPhone").disable();
      this.vendorForm.get("shippingFax").disable();
    }
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private getBanks(): void {
    this.configService
      .spoolBanks()
      .pipe(
        pluck("body"),
        map((banks) => {
          return banks.map(({ bankId, bankName }) => {
            return { id: bankId, text: bankName };
          });
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((res) => {
        this.allBanks = res;
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
      });
  }

  private getStatesByCountry(countryId: number): void {
    this.configService
      .spoolStatesByCountry(countryId)
      .pipe(
        pluck("body"),
        map((states) => {
          return states.map(({ id, name }) => {
            return { id: id, text: name };
          });
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((res) => {
        this.states = res;
      });
  }

  initForm(): void {
    this.vendorForm = this.fb.group({
      name: new UntypedFormControl(null, Validators.required),
      address: new UntypedFormControl(null),
      taxIdNumber: new UntypedFormControl(null),
      contactDetails: this.fb.array([]),
      bankDetails: this.fb.array([]),
      emailAddress: new UntypedFormControl(null, [
        Validators.required,
        Validators.email,
      ]),
      websiteUrl: new UntypedFormControl(
        null,
        Validators.pattern(
          "(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?"
        )
      ),
      paymentTerm: new UntypedFormControl(null),
      paymentTermId: new UntypedFormControl(null, Validators.required),

      salutations: new UntypedFormControl(null),
      salutation: new UntypedFormControl(null),
      firsName: new UntypedFormControl(null),
      lastName: new UntypedFormControl(null),
      email: new UntypedFormControl(null),
      phoneNumber: new UntypedFormControl(null,[Validators.minLength(11),Validators.maxLength(11)]),

      billingAttention: new UntypedFormControl(null),
      billingCountry: new UntypedFormControl(null),
      billingCountryId: new UntypedFormControl(null),
      billingAddress: new UntypedFormControl(null),
      billingStreet1: new UntypedFormControl(null),
      billingStreet2: new UntypedFormControl(null),
      billingCity: new UntypedFormControl(null),
      billingState: new UntypedFormControl(null),
      billingZipcode: new UntypedFormControl(null),
      billingPhone: new UntypedFormControl(null),
      billingFax: new UntypedFormControl(null),

      shippingAttention: new UntypedFormControl({ value: null, disabled: true }),
      shippingCountry: new UntypedFormControl({ value: null, disabled: true }),
      shippingCountryId: new UntypedFormControl({ value: null, disabled: true }),
      shippingAddress: new UntypedFormControl({ value: null, disabled: true }),
      shippingStreet1: new UntypedFormControl({ value: null, disabled: true }),
      shippingStreet2: new UntypedFormControl({ value: null, disabled: true }),
      shippingCity: new UntypedFormControl({ value: null, disabled: true }),
      shippingState: new UntypedFormControl({ value: null, disabled: true }),
      shippingZipcode: new UntypedFormControl({ value: null, disabled: true }),
      shippingPhone: new UntypedFormControl({ value: null, disabled: true }),
      shippingFax: new UntypedFormControl({ value: null, disabled: true }),
    });

    this._watchFormChanges();
  }

  private _watchFormChanges(): void {
    this.vendorForm
      .get("salutations")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.vendorForm.get("salutation").setValue(res[0]?.text);
      });

    this.vendorForm
      .get("paymentTerm")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.vendorForm.get("paymentTermId").setValue(res[0]?.id);
      });
  }

  private _getVendor(): void {
    this.isLoading = true;
    this.financeService
      .getVendor(this._selectedVendorId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.vendor = res.body;
        this.patchVendorForm(res.body);
        if (res?.body?.shippingAddress) {
          Object.keys(res.body.shippingAddress).length !== 0
          ? (this.showShipping = true)
          : (this.showShipping = false);
        }
        this.isLoading = false;
      });
  }

  getPaymentTerms(): void {
    const model = {
      pageNum: 1,
      pageSize: 100,
    };
    this.financeService
      .spoolAllPaymentTerms(model)
      .pipe(
        pluck("body", "data", "items"),
        map((terms) => {
          return terms.map((term, index) => {
            return { id: term.paymentTermId, text: term.paymentTermName };
          });
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((terms) => {
        this.terms = terms;
      });
  }

  get vendorFormControl() {
    return this.vendorForm.controls;
  }

  selectBank(event, controlIndex: number): void {
    this.banks().at(controlIndex).get("bankName").setValue(event.text);
  }

  contacts(): UntypedFormArray {
    return this.vendorForm.controls["contactDetails"] as UntypedFormArray;
  }

  banks(): UntypedFormArray {
    return this.vendorForm.controls["bankDetails"] as UntypedFormArray;
  }

  addContact(): void {
    const contact = this.fb.group({
      salutation: new UntypedFormControl(null),
      firsName: new UntypedFormControl(null),
      lastName: new UntypedFormControl(null),
      email: new UntypedFormControl(null, Validators.email),
      phoneNumber: new UntypedFormControl(null, [Validators.minLength(11),Validators.maxLength(11)]),
    });

    this.contacts().push(contact);
  }

  addBank(): void {
    const bank = this.fb.group({
      bankName: new UntypedFormControl(null, Validators.required),
      accountName: new UntypedFormControl(null, Validators.required),
      accountNumber: new UntypedFormControl(null, Validators.required),
      newBank: new UntypedFormControl(false),
    });

    this.banks().push(bank);
  }

  removeContact(index: number): void {
    this.contacts().removeAt(index);
  }

  removeBank(index: number): void {
    this.banks().removeAt(index);
  }

  switchTabs(tab: string): void {
    switch (tab) {
      case "other-details":
        $("#nav-other-details").addClass("active-tab");
        $("#nav-address,#nav-contact,#nav-bank-details").removeClass(
          "active-tab"
        );

        $("#tab-other-details").addClass("active show");
        $(
          "#tab-address,#tab-contact,#tab-bank-details,#tab-bank-details"
        ).removeClass("active show");
        break;

      case "address":
        $("#nav-address").addClass("active-tab");
        $("#nav-other-details,#nav-contact,#nav-bank-details").removeClass(
          "active-tab"
        );

        $("#tab-address").addClass("active show");
        $("#tab-other-details,#tab-contact,#tab-bank-details").removeClass(
          "active show"
        );
        break;

      case "contact":
        $("#nav-contact").addClass("active-tab");
        $("#nav-other-details,#nav-address,#nav-bank-details").removeClass(
          "active-tab"
        );

        $("#tab-contact").addClass("active show");
        $("#tab-other-details,#tab-address,#tab-bank-details").removeClass(
          "active show"
        );
        if (this.contacts().length === 0) {
          this.addContact();
        }
        break;

      case "bank-details":
        $("#nav-bank-details").addClass("active-tab");
        $("#nav-other-details,#nav-address,#nav-contact").removeClass(
          "active-tab"
        );

        $("#tab-bank-details").addClass("active show");
        $("#tab-other-details,#tab-address,#tab-contact").removeClass(
          "active show"
        );
        if (this.banks().length === 0) {
          this.addBank();
        }
        break;
      default:
        break;
    }
  }

  selectCountry(event, initiator: string) {
    let countryId;
    if (initiator === "billing") {
      this.vendorForm.get("billingCountry").setValue(event.text);
      countryId = this.vendorForm.get("billingCountryId");
      countryId.setValue(event.id);
    } else {
      this.vendorForm.get("shippingCountry").setValue(event.text);
      countryId = this.vendorForm.get("shippingCountryId");
      countryId.setValue(event.id);
    }

    this.getStatesByCountry(countryId.value);
  }

  selectState(event, initiator: string) {
    if (initiator === "billing") {
      this.vendorForm.get("billingState").setValue(event.text);
    } else {
      this.vendorForm.get("shippingState").setValue(event.text);
    }
  }

  selectTerms(event): void {
    this.vendorForm.get("paymentTermId").setValue(event.id);
  }

  selectSalutation(event, initiator?: string, controlIndex?: number) {
    initiator === "contact"
      ? this.contacts().at(controlIndex).get("salutation").setValue(event.text)
      : this.vendorForm.get("salutation").setValue(event.text);
  }

  patchVendorForm(vendor: Vendor): void {
    const salutation = this.salutations.filter(
      (salutation) => salutation.text === vendor?.primaryContact?.salutation
    );
    this.vendorForm.patchValue({
      name: vendor?.name,
      address: vendor?.address,
      taxIdNumber: vendor?.taxIdNumber,
      contactDetails: vendor?.contactDetails,
      bankDetails: vendor?.bankDetails,
      emailAddress: vendor?.emailAddress,
      websiteUrl: vendor?.websiteUrl,
      paymentTerm: [{ id: vendor.paymentTermId, text: vendor.paymentTermName }],
      paymentTermId: vendor?.paymentTermId,

      salutations: salutation,
      salutation: vendor?.primaryContact?.salutation,
      firsName: vendor?.primaryContact?.firsName,
      lastName: vendor?.primaryContact?.lastName,
      email: vendor?.primaryContact?.email,
      phoneNumber: vendor?.primaryContact?.phoneNumber,

      billingAttention: vendor?.billingAddress?.attention,
      billingCountry: vendor?.billingAddress?.country,
      billingAddress: vendor?.billingAddress?.address,
      billingStreet1: vendor?.billingAddress?.street1,
      billingStreet2: vendor?.billingAddress?.street2,
      billingCity: vendor?.billingAddress?.city,
      billingState: vendor?.billingAddress?.state,
      billingZipcode: vendor?.billingAddress?.zipCode,
      billingPhone: vendor?.billingAddress?.phone,
      billingFax: vendor?.billingAddress?.fax,

      shippingAttention: vendor?.shippingAddress?.attention,
      shippingCountry: vendor?.shippingAddress?.country,
      shippingAddress: vendor?.shippingAddress?.address,
      shippingStreet1: vendor?.shippingAddress?.street1,
      shippingStreet2: vendor?.shippingAddress?.street2,
      shippingCity: vendor?.shippingAddress?.city,
      shippingState: vendor?.shippingAddress?.state,
      shippingZipcode: vendor?.shippingAddress?.zipCode,
      shippingPhone: vendor?.shippingAddress?.phone,
      shippingFax: vendor?.shippingAddress?.fax,
    });

    vendor.contactDetails.forEach((contactLine) => {
      const contact = this.fb.group({
        salutation: new UntypedFormControl(contactLine.salutation),
        firsName: new UntypedFormControl(contactLine.firsName),
        lastName: new UntypedFormControl(contactLine.lastName),
        email: new UntypedFormControl(contactLine.email, Validators.email),
        phoneNumber: new UntypedFormControl(contactLine.phoneNumber),
      });

      this.contacts().push(contact);
    });

    vendor.bankDetails.forEach((bankLine) => {
      const bank = this.fb.group({
        bankName: new UntypedFormControl(bankLine.bankName),
        accountName: new UntypedFormControl(bankLine.accountName),
        accountNumber: new UntypedFormControl(bankLine.accountNumber),
      });

      this.banks().push(bank);
    });

    this.vendorForm.addControl(
      "isActive",
      new UntypedFormControl(vendor?.status === "Active" ? true : false)
    );
  }

  patchSalutation(name?: string): any {
    if (!name) {
      return this.salutations.filter(
        (salutation) =>
          salutation.text === this.vendor?.primaryContact?.salutation
      );
    } else {
      return this.salutations.filter((salutation) => salutation.text === name);
    }
  }

  activateUser(): void {
    this.vendorForm.get("isActive").setValue(true);
  }

  submit() {
    this.isLoading = true;
    let payload: any = {
      name: this.vendorForm.value.name,
      address: this.vendorForm.value.address,
      taxIdNumber: this.vendorForm.value.taxIdNumber,
      emailAddress: this.vendorForm.value.emailAddress,
      websiteUrl: this.vendorForm.value.websiteUrl,
      paymentTermId: this.vendorForm.value.paymentTermId,

      contactDetails: this.vendorForm.value.contactDetails,

      bankDetails: this.vendorForm.value.bankDetails,
      isActive: this.vendorForm.value.isActive,

      primaryContact: {
        salutation: this.vendorForm.value.salutation,
        firsName: this.vendorForm.value.firsName,
        lastName: this.vendorForm.value.lastName,
        email: this.vendorForm.value.email,
        phoneNumber: this.vendorForm.value.phoneNumber,
      },

      billingAddress: {
        attention: this.vendorForm.value.billingAttention,
        country: this.vendorForm.value.billingCountry,
        address: this.vendorForm.value.billingAddress,
        street1: this.vendorForm.value.billingStreet1,
        street2: this.vendorForm.value.billingStreet2,
        city: this.vendorForm.value.billingCity,
        state: this.vendorForm.value.billingState,
        zipcode: this.vendorForm.value.billingZipcode,
        phone: this.vendorForm.value.billingPhone,
        fax: this.vendorForm.value.billingFax,
      },

      shippingAddress: {
        attention: this.vendorForm.value.shippingAttention,
        country: this.vendorForm.value.shippingCountry,
        address: this.vendorForm.value.shippingAddress,
        street1: this.vendorForm.value.shippingStreet1,
        street2: this.vendorForm.value.shippingStreet2,
        city: this.vendorForm.value.shippingCity,
        state: this.vendorForm.value.shippingState,
        zipcode: this.vendorForm.value.shippingZipcode,
        phone: this.vendorForm.value.shippingPhone,
        fax: this.vendorForm.value.shippingFax,
      },
    };

    if (!this.isEditing) {
      this.financeService
        .createVendor(payload)
        .pipe(pluck("body"), takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Vendor created successfully.",
            });
            this.isLoading = false;

            if (this.showHeader) {
              this.router.navigate(["finance/vendors"]);
            } else {
              this.vendorAdded.emit({ id: res.item2, text: payload.name });
              this.closeModal();
            }
          },
          () => (this.isLoading = false)
        );
    } else {
      payload = { ...payload, vendorId: this.vendor.vendorId };
      this.financeService
        .updateVendor(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          () => {
            this.toast.fire({
              type: "success",
              title: "Vendor Updated successfully.",
            });
            this.isLoading = false;
            this.router.navigate(["finance/vendors"]);
          },
          () => (this.isLoading = false)
        );
    }
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
