import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { pluck, takeUntil, map } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Customer } from "src/app/model/Customer.dto";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { FinanceService } from "../../service/finance.service";
import Swal from "sweetalert2";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";

@Component({
  selector: "lnd-add-edit-customer",
  templateUrl: "./add-edit-customer.component.html",
  styleUrls: ["./add-edit-customer.component.scss"],
})
export class AddEditCustomerComponent implements OnInit, OnDestroy {
  @Input() addCustomerPopup = false;

  @Output() customerAdded = new EventEmitter();

  private _unsubscriber$ = new Subject();

  isEditing: boolean = false;
  isLoading: boolean = false;
  customer: Customer;
  loggedInUser: any;
  branchId: number;
  currentTheme: ColorThemeInterface;
  customerForm: UntypedFormGroup;
  salutations: CustomDropDown[] = [
    { id: 1, text: "Mr" },
    { id: 2, text: "Mrs" },
    { id: 3, text: "Ms" },
  ];
  countries: any[] = [];
  states: any[] = [];
  allBanks: any[] = [];
  customerId: number;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private _colorThemeService: ColorThemeService,
    private _fb: UntypedFormBuilder,
    private _configService: ConfigurationService,
    private _financeService: FinanceService,
    private _userService: UserService,
    private _authService: AuthService,
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this._route.url
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any) => {
        if (res[1].path === "edit") {
          this.isEditing = true;

          this._route.paramMap
            .pipe(takeUntil(this._unsubscriber$))
            .subscribe((params: ParamMap) => {
              this.customerId = +params.get("id");
            });
        } else {
          this.isEditing = false;
        }
      });
  }

  ngOnInit(): void {
    this._initForm();

    this.loggedInUser = this._authService.decodeToken();
    this._getUserPromise();
    this._loadTheme();
    this._getCountries();
    this._getBanks();

    if (this.isEditing) {
      this._getCustomer(this.customerId);
    } else {
      this.addAddress();
    }
  }

  private _getCustomer(id: number): void {
    this.isLoading = true;
    this._financeService
      .getCustomer(id)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(
        (res) => {
          this.customer = res.body.data;
          this._patchForm(this.customer);
          this.isLoading = false;
        this.addCustomerPopup && this.customerAdded.emit(this.customer);
        },
        () => (this.isLoading = false)
      );
  }

  private _getBanks(): void {
    this._configService
      .spoolBanks()
      .pipe(
        pluck("body"),
        map((banks) => {
          return banks.map(({ bankId, bankName }) => {
            return { id: bankId, text: bankName };
          });
        }),
        takeUntil(this._unsubscriber$)
      )
      .subscribe((res) => {
        this.allBanks = res;
      });
  }

  private _getCountries(): void {
    this._configService
      .spoolCountries()
      .pipe(
        pluck("body"),
        map((countries) => {
          return countries.map(({ id, name }) => {
            return { id: id, text: name };
          });
        }),
        takeUntil(this._unsubscriber$)
      )
      .subscribe((res) => {
        this.countries = res;
      });
  }

  private _getStatesByCountry(countryId: number): void {
    this._configService
      .spoolStatesByCountry(countryId)
      .pipe(
        pluck("body"),
        map((states) => {
          return states.map(({ id, name }) => {
            return { id: id, text: name };
          });
        }),
        takeUntil(this._unsubscriber$)
      )
      .subscribe((res) => {
        this.states = res;
      });
  }

  private _getUserPromise() {
    this._userService
      .getUserInfo(this.loggedInUser.nameid)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((user) => {
        this.branchId = user.body.branchId;
        this.customerForm?.get("branchId").setValue(this.branchId);
      });
  }

  contactDetails(): UntypedFormArray {
    return this.customerForm.controls["contactDetails"] as UntypedFormArray;
  }

  addresses(): UntypedFormArray {
    return this.customerForm.controls["addresses"] as UntypedFormArray;
  }

  bankDetails(): UntypedFormArray {
    return this.customerForm.controls["bankDetails"] as UntypedFormArray;
  }

  get customerFormControls() {
    return this.customerForm.controls;
  }

  setIsOrg(event: boolean) {
    this.customerForm.get("isOrganisation").setValue(event);
  }

  private _initForm(): void {
    this.customerForm = this._fb.group({
      fullName: new UntypedFormControl(null, Validators.required),
      phoneNumber: new UntypedFormControl(null, [Validators.required, Validators.minLength(11), Validators.maxLength(11)]),
      emailAddress: new UntypedFormControl(null, [
        Validators.required,
        Validators.email,
      ]),
      isOrganisationObj: new UntypedFormControl(false),
      isOrganisation: new UntypedFormControl(false),
      branchId: new UntypedFormControl(null, Validators.required),
      isActive: new UntypedFormControl(true),

      contactDetails: this._fb.array([]),
      addresses: this._fb.array([]),
      bankDetails: this._fb.array([]),
    });

    this.customerForm
      .get("isOrganisationObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) =>
        this.customerForm.get("isOrganisation").setValue(res)
      );

    if (this.isEditing && this.customer) {
      this.customer.contactDetails.forEach((contact) =>
        this.addContact(contact)
      );

      this.customer.addresses.forEach((address) => this.addAddress(address));
    }
  }

  private _patchForm(customer: Customer): void {
    this.customerForm.patchValue({
      fullName: customer?.fullName,
      phoneNumber: customer?.phoneNumber,
      emailAddress: customer?.emailAddress,
      isOrganisationObj: customer?.isOrganisation,
      isOrganisation: customer?.isOrganisation,
      branchId: customer?.branchId,
      isActive: customer?.isActive,
    });

    this.customerForm.addControl("id", new UntypedFormControl(customer.id));

    if (customer.contactDetails.length > 0) {
      customer.contactDetails.forEach((contact) => this.addContact(contact));
    }

    if (customer.bankDetails.length > 0) {
      customer.bankDetails.forEach((bank) => this.addBank(bank));
    }

    customer.addresses.length > 0
      ? customer.addresses.forEach((address) => this.addAddress(address))
      : this.addAddress();
  }

  addContact(data?): void {
    let selSalutaion = this.salutations.filter(
      (salutation) => salutation.text === data?.salutation
    );
    const contact = this._fb.group({
      salutationObj: new UntypedFormControl(data ? selSalutaion : null),
      salutation: new UntypedFormControl(data ? data?.salutation : null),
      firsName: new UntypedFormControl(data ? data?.firsName : null),
      lastName: new UntypedFormControl(data ? data?.lastName : null),
      email: new UntypedFormControl(data ? data?.email : null, Validators.email),
      phoneNumber: new UntypedFormControl(data ? data?.phoneNumber : null),
    });

    this.contactDetails().push(contact);

    contact
      .get("salutationObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        contact.get("salutation").setValue(res[0]?.text, { emitEvent: false });
      });
  }

  removeContact(index: number): void {
    this.contactDetails().removeAt(index);
  }

  addAddress(data?): void {
    const address = this._fb.group({
      attention: new UntypedFormControl(data ? data?.attention : null),
      countryObj: new UntypedFormControl(
        data?.countryId && data?.country
          ? [{ id: data?.countryId, text: data?.country }]
          : null
      ),
      country: new UntypedFormControl(data ? data?.country : null),
      countryId: new UntypedFormControl(data ? data?.countryId : null),
      address: new UntypedFormControl(data ? data?.address : null),
      street1: new UntypedFormControl(data ? data?.street1 : null),
      street2: new UntypedFormControl(data ? data?.street2 : null),
      city: new UntypedFormControl(data ? data?.city : null),
      stateObj: new UntypedFormControl(
        data?.stateId && data?.state
          ? [{ id: data?.stateId, text: data?.state }]
          : null
      ),
      state: new UntypedFormControl(data ? data?.state : null),
      stateId: new UntypedFormControl(data ? data?.stateId : null),
      zipCode: new UntypedFormControl(data ? data?.zipCode : null),
      phone: new UntypedFormControl(data ? data?.phone : null),
      fax: new UntypedFormControl(data ? data?.fax : null),
      addressType: new UntypedFormControl(data ? data?.addressTypeName : null),
    });

    this.addresses().push(address);

    address
      .get("countryObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        address.get("countryId").setValue(res[0]?.id);
        address.get("country").setValue(res[0]?.text);

        this._getStatesByCountry(res[0]?.id);
      });

    address
      .get("stateObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        address.get("stateId").setValue(res[0]?.id);
        address.get("state").setValue(res[0]?.text);
      });
  }

  removeAddress(index: number): void {
    this.addresses().removeAt(index);
  }

  addBank(data?): void {
    const bankObj = this.allBanks.filter(
      (bank) => bank.text === data?.bankName
    );
    const bank = this._fb.group({
      bank: new UntypedFormControl(data ? bankObj : null),
      bankName: new UntypedFormControl(data ? data?.bankName : null),
      accountName: new UntypedFormControl(data ? data?.accountName : null),
      accountNumber: new UntypedFormControl(data ? data?.accountNumber : null),
    });

    this.bankDetails().push(bank);

    bank
      .get("bank")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        bank.get("bankName").setValue(res[0]?.text);
      });
  }

  removeBank(index: number): void {
    this.bankDetails().removeAt(index);
  }

  private _loadTheme(): void {
    this._colorThemeService
      .getTheme()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  activateUser(event): void {
    this.customerForm.get("isActive").setValue(event);
  }

  private _cleanData() {
    const contactDetails = this.contactDetails()
      .controls.map((control) => {
        for (const key in control.value) {
          if (control.value[key]) {
            return control.value;
          }
        }
      })
      .filter((_) => _ !== undefined);

    const addresses = this.addresses()
      .controls.map((control) => {
        for (const key in control.value) {
          if (control.value[key]) {
            return control.value;
          }
        }
      })
      .filter((_) => _ !== undefined);

    const bankDetails = this.bankDetails()
      .controls.map((control) => {
        for (const key in control.value) {
          if (control.value[key]) {
            return control.value;
          }
        }
      })
      .filter((_) => _ !== undefined);

    return {
      ...this.customerForm.value,
      contactDetails,
      addresses,
      bankDetails,
    };
  }

  submit(): void {
    const payload = this._cleanData();
    this.isLoading = true;
    if (!this.isEditing) {
      this._financeService
        .createCustomer(payload)
        .pipe(takeUntil(this._unsubscriber$))
        .subscribe(
          (res) => {
            if (res.status === 200) {
              this.toast.fire({
                type: "success",
                title: "Customer created successfully.",
              });
              this.isLoading = false;
              !this.addCustomerPopup ? this._router.navigate(["finance/customers"]) : this._getCustomer(res.body.data.customerId);
            }
          },
          () => (this.isLoading = false)
        );
    } else {
      this.customerForm.addControl("id", new UntypedFormControl(this.customer.id));
      this._financeService
        .updateCustomer(this.customerForm.value)
        .pipe(takeUntil(this._unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Customer updated successfully.",
            });
            this.isLoading = false;
            this._router.navigate(["finance/customers"]);
          },
          () => (this.isLoading = false)
        );
    }
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
