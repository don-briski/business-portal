import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { lightenColorV2 } from "../../shared/helpers/generic.helpers";
import Swal from "sweetalert2";
import { Router } from "@angular/router";
import { WacsService } from "../services/wacs.service";
import { RegisteredWacsCustomer, WacsCustomerDetail, } from "../types/customer";

@Component({
  selector: "lnd-create-wacs-customer",
  templateUrl: "./create-wacs-customer.component.html",
  styleUrls: ["./create-wacs-customer.component.scss"],
})
export class CreateWacsCustomerComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  form = new FormGroup({
    id: new FormControl(null),
    mda: new FormControl(""),
    pfaName: new FormControl(""),
    accountName: new FormControl(""),
    accountNumber: new FormControl(""),
    bank: new FormControl(""),
    bankCode: new FormControl(""),
    bvn: new FormControl(""),
    currentSalary: new FormControl(null),
    ippisNumber: new FormControl(""),
    nationality: new FormControl(""),
    address: new FormControl(""),
    state: new FormControl(""),
    employeeStatus: new FormControl(""),
    user: new FormGroup({
      id: new FormControl(null),
      firstName: new FormControl(""),
      lastName: new FormControl(""),
      middleName: new FormControl(""),
      phoneNumber: new FormControl(""),
      email: new FormControl(""),
      dateOfBirth: new FormControl(""),
      role: new FormControl(""),
    }),
    nextOfKinInfo: new FormGroup({
      firstName: new FormControl(""),
      lastName: new FormControl(""),
      phone: new FormControl(""),
      houseNumber: new FormControl(""),
      street1: new FormControl(""),
      nearestLandMark: new FormControl(""),
      country: new FormControl("Nigeria"),
      state: new FormControl(""),
      stateId: new FormControl(""),
      localGovernmentArea: new FormControl(""),
      lgaId: new FormControl(""),
    }),
    refereeInfo: new FormGroup({
      firstName: new FormControl(""),
      lastName: new FormControl(""),
      phone: new FormControl(""),
      houseNumber: new FormControl(""),
      street1: new FormControl(""),
      nearestLandMark: new FormControl(""),
      country: new FormControl("Nigeria"),
      state: new FormControl(""),
      stateId: new FormControl(""),
      localGovernmentArea: new FormControl(""),
      lgaId: new FormControl(""),
    }),
  });
  banks: CustomDropDown[] = [];
  lighterSecondaryBg: string;
  isProcessing = false;
  states: CustomDropDown[] = [];
  lgas: CustomDropDown[] = [];
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  isLoading = false;
  genders = ["Male", "Female"];
  currencySymbol: string;
  customer: RegisteredWacsCustomer;

  constructor(
    private configService: ConfigurationService,
    private colorThemeService: ColorThemeService,
    private router: Router,
    private wacsService: WacsService
  ) {
    const wacsCustomerPayload = sessionStorage.getItem("wacs-customer-payload");
    if (wacsCustomerPayload) {
      this.customer = JSON.parse(wacsCustomerPayload);
      this.form.patchValue(this.customer);
    }
  }

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.getBanks();
    this.getCountries();
    this.loadTheme();
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.lighterSecondaryBg = lightenColorV2(res.secondaryColor, 20);
      });
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

  private getBanks() {
    this.configService
      .spoolBanks({ provider: "Paystack" })
      .pipe(
        map((response) =>
          response.body.map((bank) => ({
            id: `${bank.bankId}.${bank.sortCode}`,
            text: bank.bankName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((banks) => {
        this.banks = banks;
      });
  }

  private getCountries() {
    this.configService.spoolCountries().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      const countryIdForNigeria = res.body.find(country => country?.name?.toLowerCase() === "nigeria")?.id;
      if (countryIdForNigeria) {
        this.getStates(countryIdForNigeria)
      }
    })
  }

  private getStates(id:number) {
    this.configService
      .spoolStatesByCountry(id)
      .pipe(
        map((res) =>
          res.body.map((state) => ({ id: state.id, text: state.name }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((states) => {
        this.states = states;
      });
  }

  private getLGA(stateId: number) {
    this.configService
      .getLGA(stateId)
      .pipe(
        map((res) =>
          res.body.data.map((lga) => ({ id: lga.id, text: lga.name }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((lgas) => {
        this.lgas = lgas;
      });
  }

  setState(value: CustomDropDown, setValue: boolean) {
    if (setValue) {
      this.getLGA(+value.id);
    } else {
      this.lgas = [];
    }
  }


  submit() {
    this.isProcessing = true;
    let payload:WacsCustomerDetail = {
      customer:this.customer,
      nextOfKinInfo: {
        ...this.form.value.nextOfKinInfo,
        stateId: this.form.value?.nextOfKinInfo?.state[0]?.["id"],
        state: this.form.value?.nextOfKinInfo?.state[0]?.["text"],
        lgaId: this.form.value?.nextOfKinInfo?.localGovernmentArea[0]?.["id"],
        localGovernmentArea:
          this.form.value?.nextOfKinInfo?.localGovernmentArea[0]?.["text"],
      },
      refereeInfo: [
        {
          ...this.form.value.refereeInfo,
          stateId: this.form.value?.refereeInfo?.state[0]?.["id"],
          state: this.form.value?.refereeInfo?.state[0]?.["text"],
          lgaId: this.form.value?.refereeInfo?.localGovernmentArea[0]?.["id"],
          localGovernmentArea:
            this.form.value?.refereeInfo?.localGovernmentArea[0]?.["text"],
        },
      ],
    };

    this.wacsService.createCustomers(payload).pipe(takeUntil(this.unsubscriber$)).subscribe({
      next:() => {
        this.isProcessing = false;
        this.toast.fire({
          type: "success",
          title: "Customer created successfully!",
        });
        sessionStorage.removeItem("wacs-customer-payload")
        this.router.navigateByUrl("wacs/customers");
      },
      error:() => {
        this.isProcessing = false;
      }
    })
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
