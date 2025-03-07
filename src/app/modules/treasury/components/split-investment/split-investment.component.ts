import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import {
  UntypedFormBuilder,
  Validators,
  UntypedFormArray,
  AbstractControl,
  ValidationErrors,
  UntypedFormGroup,
  UntypedFormControl,
} from "@angular/forms";
import { Router } from "@angular/router";
import { InvestmentService } from "../../../../service/investment.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import * as moment from "moment";
import Swal from "sweetalert2";
import { SplitInvestment } from "../../types/SplitInvestment";
import { ConfigurationService } from "../../../../service/configuration.service";

@Component({
  selector: "app-split-investment",
  templateUrl: "./split-investment.component.html",
  styleUrls: ["./split-investment.component.scss"],
})
export class SplitInvestmentComponent implements OnInit, OnDestroy {
  @Input() currentTheme: ColorThemeInterface;
  @Input() investmentId: number;
  @Input() investmentAmount: number;
  @Input() mergeState: string;

  splitForm: UntypedFormGroup;
  unsubscriber$ = new Subject<void>();
  investmentTypeList = [];
  invTypeSelected: any;
  StartDateNotification = "";
  loading: boolean = false;
  remainingBalance: number;
  CurrentInvestmentAmount: number;
  greaterThanError: boolean = false;
  ownerInformation;
  controlIndex: number;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  allSplitInvestmentStartDate:string;
  currencySymbol: string;
  
  constructor(
    private fb: UntypedFormBuilder,
    private invService: InvestmentService,
    private router: Router,
    private configurationService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.getConfigInfo();
    this.fetchInvestmentType();
    this.initSplitForm();
    this.addNewInvestmentControls();
    this.addNewInvestmentControls();

    this.remainingBalance = this.investmentAmount;
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configurationService.currencySymbol;
    if (!this.currencySymbol) {
      this.configurationService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  getConfigInfo() {
    this.configurationService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  initSplitForm(): void {
    this.splitForm = this.fb.group({
      investmentId: [this.investmentId, Validators.required],
      newInvestments: this.fb.array([]),
      transactionPin: [{ value: "", disabled: false }, Validators.required],
    });

    this._watchFormChanges();
  }

  private _watchFormChanges(): void {
    this.splitForm
      .get("newInvestments")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((controls: any[]) => {
        this.remainingBalance = this.investmentAmount;
        controls.forEach((control, index) => {
          control.investmentAmount
            ? (this.remainingBalance -= control.investmentAmount)
            : null;
          this.remainingBalance = +this.remainingBalance.toFixed(2);
          if (this.remainingBalance < 0 && control.investmentAmount) {
            control.balanceOver = true;
            this.toast.fire({
              type: "error",
              text: "Amount Cannot Be Greater Than Remaining Balance",
              timer: 3000,
            });
          } else {
            control.balanceOver = false;
          }

        });
      });
  }

  setAllInvStartDate(date:string){
    this.allSplitInvestmentStartDate = date;
  }

  newInvestments(): UntypedFormArray {
    return this.splitForm.controls["newInvestments"] as UntypedFormArray;
  }

  addNewInvestmentControls(): void {
    const newInvestment = this.fb.group({
      investmentTypeId: [
        { value: "", disabled: false },
        [Validators.required, this.setInvType.bind(this)],
      ],
      investmentAmount: [
        { value: 0, disabled: true },
        [Validators.required, this.checkInvAmount.bind(this)],
      ],
      investmentRate: [
        { value: "", disabled: true },
        [Validators.required, this.checkInvRate.bind(this)],
      ],
      investmentTenor: [
        { value: "", disabled: true },
        [Validators.required, this.checkInvTenor.bind(this)],
      ],
      collectionPeriod: [
        { value: "", disabled: true },
        [Validators.required, this.checkCollectionPeriod.bind(this)],
      ],
      amountTextInfo: "",
      showRemainingBalHelper: new UntypedFormControl("hide"),
    });

    this.newInvestments().push(newInvestment);
  }

  removeControl(index: number): void {
    if (this.newInvestments().length > 2) {
      this.newInvestments().removeAt(index);
    }
  }

  fetchInvestmentType(): void {
    this.invService
      .fetchActiveInvestmentType()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.investmentTypeList = res.body;
          $(document).ready(() => {
            $.getScript("assets/js/script.js");
          });
        },
        (err) => {}
      );
  }

  onSelect(invTyp, controlIndex: number): void {
    this.newInvestments().at(controlIndex).get("investmentAmount").enable();
    this.newInvestments().at(controlIndex).get("investmentRate").enable();
    this.newInvestments().at(controlIndex).get("investmentTenor").enable();

    this.setAmountInfo(invTyp, controlIndex);
    const investmentAmount = this.newInvestments()
      .at(controlIndex)
      .get("investmentAmount");
    investmentAmount.updateValueAndValidity();
  }

  onTenorChange(controlIndex: number): void {
    this.controlIndex = controlIndex;
    const collectionPeriod = this.newInvestments()
      .at(controlIndex)
      .get("collectionPeriod");
    collectionPeriod.enable();
  }

  setAmountInfo(invTyp, controlIndex: number): void {
    const selectedControl = this.newInvestments()
      .at(controlIndex)
      .get("amountTextInfo");

    const invTypeSelected = this.investmentTypeList.find(
      (x) => x.investmentTypeId === parseInt(invTyp, 0)
    );

    const amountTextInfo =
      `(${this.currencySymbol}` +
      invTypeSelected.minAmount.toLocaleString() +
      ` - ${this.currencySymbol}` +
      invTypeSelected.maxAmount.toLocaleString() +
      ")";

    selectedControl.setValue(amountTextInfo);
  }

  setInvType(control: AbstractControl): ValidationErrors | null {
    this.invTypeSelected = this.investmentTypeList.find(
      (x) => x.investmentTypeId === parseInt(control.value, 0)
    );
    return null;
  }

  checkInvAmount(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      return this.checkInvRange(
        this.invTypeSelected.minAmount,
        this.invTypeSelected.maxAmount,
        parseInt(control.value, 0)
      );
    }

    return null;
  }

  checkInvRange(minAmt: number, maxAmt: number, invAmt: number) {
    if (invAmt < minAmt || invAmt > maxAmt) {
      return { OutOfRange: "Investment amount is out of range." };
    }
  }

  checkInvTenor(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      if (
        this.invTypeSelected.minInvestmentTenor <= parseInt(control.value, 0) &&
        parseInt(control.value, 0) <= this.invTypeSelected.maxInvestmentTenor
      ) {
        return null;
      } else {
        return {
          OutOfRange: `Min: ${this.invTypeSelected.minInvestmentTenor} - Max: ${this.invTypeSelected.maxInvestmentTenor}`,
        };
      }
    }
  }

  checkCollectionPeriod(control: AbstractControl): ValidationErrors | null {
    const investmentTenor = this.newInvestments()
      .at(this.controlIndex)
      .get("investmentTenor");
    if (investmentTenor) {
      if (control.value > investmentTenor.value) {
        return {
          OutOfRange: "Collection period must be less than or equal to Investment Tenor",
        };
      } else {
        return null;
      }
    }
  }

  checkInvRate(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      if (
        this.invTypeSelected.minInterestRate <= parseInt(control.value, 0) &&
        parseInt(control.value, 0) <= this.invTypeSelected.maxInterestRate
      ) {
        return null;
      } else {
        return {
          OutOfRange: `Min: ${this.invTypeSelected.minInterestRate} - Max: ${this.invTypeSelected.maxInterestRate}`,
        };
      }
    } else {
      return null;
    }
  }

  notifyAgent(control: AbstractControl): ValidationErrors | null {
    if (
      control.value !== "" &&
      moment(control.value).isBefore(moment(), "days")
    ) {
      this.StartDateNotification = "This investment start date is in the PAST.";
      return null;
    } else if (
      control.value !== "" &&
      moment(control.value).isAfter(moment(), "days")
    ) {
      this.StartDateNotification =
        "This investment start date is in the FUTURE.";
      return null;
    } else {
      this.StartDateNotification = "";
      return null;
    }
  }

  prevValue(controlIndex: number): void {
    this.CurrentInvestmentAmount = this.newInvestments()
      .at(controlIndex)
      .get("investmentAmount").value;
  }

  submit() {

    const newInvestments = this.splitForm.get("newInvestments").value.map((investment) => {
      delete investment.amountTextInfo;
      return {...investment,startDate:this.allSplitInvestmentStartDate};
    });

    const payload: SplitInvestment = {
      ...this.splitForm.value,
      newInvestments: newInvestments,
    };


    Swal.fire({
      type: "info",
      text:
        "This investment will be split into " +
        newInvestments.length +
        " different investments",
      title: "Split Investment",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.invService
          .splitInvestment(payload)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.loading = false;
              Swal.fire({
                type: "success",
                title: "Splitting Successful!",
                showCancelButton: false,
                confirmButtonText: "Continue",
                confirmButtonColor: "#558E90",
              }).then((res) => {
                if (res.value) {
                  this.router.navigate(["treasury/investments"]);
                }
              });
            },
            (error) => {
              this.loading = false;
            }
          );
      }
    });
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
