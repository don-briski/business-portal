import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  Activity,
  LoanHistoryReq,
  WascCustomerDetail,
} from "../types/customer";
import { Subject } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Tab } from "../../shared/shared.types";
import { TabBarService } from "../../shared/components/tab-bar/tab-bar.service";
import { map, takeUntil, tap } from "rxjs/operators";
import Swal from "sweetalert2";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { WacsService } from "../services/wacs.service";
import { toNGNFormat } from "../../shared/helpers/generic.helpers";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { LoanProduct, WacsLoanApplicationReq } from "../types/loan-products";
import { ConfigurationService } from "src/app/service/configuration.service";

@Component({
  selector: "lnd-wasc-customer",
  templateUrl: "./wasc-customer.component.html",
  styleUrls: ["./wasc-customer.component.scss"],
})
export class WascCustomerComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  customer: WascCustomerDetail;
  isLoading = false;
  tabs: Tab[] = [
    {
      id: "customerInformation",
      text: "Customer Information",
    },
    {
      id: "eligibilityHistory",
      text: "Eligibility History",
    }
  ];
  currentTab = this.tabs[0].id;
  customerIsEligible = false;
  checkingEligibility = false;
  loanProductsList: CustomDropDown[] = [];
  loanProducts: LoanProduct[] = [];
  loanTenors = [...Array(24).keys()].map((i) => i + 1);
  eligibleAmount: number;
  activities: Activity[] = [];
  showLoanAppForm = false;
  form = new FormGroup({
    wacsCustomerId: new FormControl(0, Validators.required),
    wacsLoanProductId: new FormControl("", Validators.required),
    amount: new FormControl(0, [Validators.required]),
    currentSalary: new FormControl(0, Validators.required),
  });
  selectedLoanProduct: LoanProduct;
  submitting = false;
  currencySymbol: string;

  constructor(
    private route: ActivatedRoute,
    private tabBarService: TabBarService,
    private wacsService: WacsService,
    private configService: ConfigurationService,
    private router: Router
  ) {
    const id = +this.route.snapshot.params["id"];
    this.getCustomer(id);
  }

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.listenTabSwitch();
    this.getLoanProducts();
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

  private getLoanProducts() {
    this.wacsService
      .getLoanProducts({ pageNumber: 1, pageSize: 100 })
      .pipe(
        tap((res) => (this.loanProducts = res.body.items)),
        map((res) =>
          res.body.items.map((product) => ({
            id: product?.id,
            text: product?.productName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (products) => {
          this.loanProductsList = products;
        },
      });
  }

  private getCustomer(id: number) {
    this.isLoading = true;

    this.wacsService
      .getCustomer(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.customer = res.body.data;
          this.form
            .get("wacsCustomerId")
            .setValue(this.customer?.wacsCustomerId);
          this.form.get("currentSalary").setValue(this.customer?.currentSalary);
          this.isLoading = false;
          this.getLoanHistory();
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  listenTabSwitch() {
    this.tabBarService.tabSwitched
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (tab) => {
          this.currentTab = tab.tabId;
        },
      });
  }

  private getLoanHistory() {
    const payload: LoanHistoryReq = {
      relatedObject: "WacsCustomer",
      relatedObjectId: this.customer?.wacsCustomerId,
    };
    this.wacsService
      .getLoanHistory(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.activities = res.body.data;
        },
      });
  }

  checkCustomerEligibility() {
    this.checkingEligibility = true;

    this.wacsService
      .checkEligibility(+this.customer.ippisNumber, this.customer.bvn)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.eligibleAmount = res.body.data.amount;
          if (this.eligibleAmount > 0) {
            this.form
              .get("amount")
              .addValidators(Validators.max(this.eligibleAmount));
            this.customerIsEligible = true;
            const amount = toNGNFormat(this.eligibleAmount);
            if (this.customerIsEligible) {
              Swal.fire({
                type: "success",
                title: "Customer Eligible",
                text: `This customer is eligible for a loan up to ${amount}`,
                showCancelButton: true,
                reverseButtons: true,
                cancelButtonText: "Cancel",
                confirmButtonText: "Apply for loan",
                confirmButtonColor: "#1E5A8A",
              }).then((response) => {
                if (response?.value) {
                  this.showLoanAppFormFn();
                }
              });
            }
          } else{
            Swal.fire({
              type: "warning",
              title: "Customer Ineligible",
              text: `Eligible Amount from Third Party (WACS): ${toNGNFormat(this.eligibleAmount)}`,
              confirmButtonText: "Dismiss",
              confirmButtonColor: "#1E5A8A",
            })
          }
          this.checkingEligibility = false;
        },
        error: () => {
          this.checkingEligibility = false;
        },
      });
  }

  showLoanAppFormFn() {
    if (this.customerIsEligible) {
      this.showLoanAppForm = true;
    }
  }

  setLoanProduct(setValue: boolean, value: CustomDropDown) {
    this.selectedLoanProduct = this.loanProducts.find(
      (loanProduct) => loanProduct?.id === value.id
    );
    const id = setValue ? value.id : "";
    this.form.get("wacsLoanProductId").setValue(id as string);
    this.form
      .get("amount")
      .addValidators(Validators.min(this.selectedLoanProduct.amountFrom));
    this.form.get("amount").updateValueAndValidity();
  }

  submitToWacs() {
    this.submitting = true;
    this.wacsService
      .submitToWacs(this.form.value as unknown as WacsLoanApplicationReq)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.submitting = false;
          Swal.fire({
            title: "Success",
            text: "Application has been successfully sent to WACs.",
            type: "success",
            showConfirmButton: true,
            confirmButtonText: "Close",
            reverseButtons: true,
          }).then((res) => {
            if (res.value) {
              this.router.navigateByUrl("/wacs/customers");
            }
          });
        },
        error: () => {
          this.submitting = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
