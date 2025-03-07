import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { map, pluck, takeUntil, tap } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { AuthService } from "src/app/service/auth.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ApplicableFee, LoanType } from "../../loan-section/loan.types";
import { UserService } from "src/app/service/user.service";
import { WacsService } from "../services/wacs.service";
import { CreateLoanProductReq } from "../types/loan-products";
import { ActivatedRoute, Router } from "@angular/router";
import Swal from "sweetalert2";
import { LoanProduct } from "../types/loan-products";
import { toNGNFormat } from "../../shared/helpers/generic.helpers";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";

@Component({
  selector: "lnd-add-edit-wacs-loan-product",
  templateUrl: "./add-edit-wacs-loan-product.component.html",
  styleUrls: ["./add-edit-wacs-loan-product.component.scss"],
})
export class AddEditWacsLoanProductComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  form = new FormGroup({
    loanTypeId: new FormControl(null, Validators.required),
    status: new FormControl("Active"),
    productName: new FormControl("", Validators.required),
    description: new FormControl("", Validators.required),
    category: new FormControl("IPPIS"),
    paybackPeriod: new FormControl(null, Validators.required),
    moratoriumPeriod: new FormControl(1),
    feature: new FormControl(null),
    amountTo: new FormControl(null, Validators.required),
    amountFrom: new FormControl(null, Validators.required),
    interestRate: new FormControl(null, Validators.required),
    applicableFees: new FormArray([]),
  });
  loanTypeList: CustomDropDown[] = [];
  loanTypes: LoanType[] = [];
  selectedLoanType: LoanType;
  applicableFees: ApplicableFee[] = [];
  togglePaybackPeriod = false;
  toggleFees = false;
  fees: CustomDropDown[] = [];
  feeCalculation: string[] = ["Deducted Upfront", "Capitalized"];
  feeTypes: string[] = ["Percentage"];
  feeMandatoryOptions: string[] = ["Yes", "No"];
  isProcessing = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  loanTypeId: number;
  isLoading = false;
  wacsLoanProduct: LoanProduct;
  totalFees = 0;
  branchId: number;
  selectedFeeType: CustomDropDown;

  constructor(
    private authService: AuthService,
    private configService: ConfigurationService,
    private userService: UserService,
    private wacsService: WacsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loanTypeId = this.route.snapshot.params["id"];
  }

  ngOnInit(): void {
    this.getLoanTypes();
    this.getUserBranchId();
  }

  private getLoanTypes() {
    if (this.loanTypeId) {
      this.isLoading = true;
    }
    this.configService
      .fetchLoanTypes(this.authService.decodeToken().nameid)
      .pipe(
        map((response) =>
          response.body.filter((loanType) => {
            if (loanType.repaymentMethods) {
              const repaymentMethods = JSON.parse(loanType.repaymentMethods);
              if (repaymentMethods.includes("Wacs")) {
                return loanType;
              }
            }
          })
        ),
        tap((loanTypes) => (this.loanTypes = loanTypes)),
        map((loanTypes) =>
          loanTypes.map((loanType) => ({
            id: loanType?.loanTypeId,
            text: loanType?.loanName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (loanTypeList) => {
          this.loanTypeList = loanTypeList;
          if (this.loanTypeId) {
            this.getLoanProduct();
          }
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  selectLoanType(value: CustomDropDown) {
    this.selectedLoanType = this.loanTypes.find(
      (loanType) => loanType.loanTypeId === value.id
    );
    if (this.selectedLoanType && this.selectedLoanType.applicableFees) {
      this.feeLines().clear();
      this.form.get("loanTypeId").setValue(this.selectedLoanType.loanTypeId);
      this.form.get("amountTo").setValue(this.selectedLoanType.maxAmount);
      this.form
        .get("amountTo")
        .setValidators([
          Validators.max(this.selectedLoanType?.maxAmount),
          Validators.min(this.selectedLoanType?.minAmount),
        ]);
      this.form.get("amountFrom").setValue(this.selectedLoanType.minAmount);
      this.form
        .get("amountFrom")
        .setValidators([
          Validators.min(this.selectedLoanType?.minAmount),
          Validators.max(this.selectedLoanType?.maxAmount),
        ]);
      this.form
        .get("interestRate")
        .setValue(this.selectedLoanType.interestRate);
      this.form
        .get("interestRate")
        .setValidators(Validators.max(this.selectedLoanType?.interestRate));

      this.form.get("amountTo").updateValueAndValidity();
      this.form.get("amountFrom").updateValueAndValidity();
      this.form.get("interestRate").updateValueAndValidity();

      const JsonParsedApplicableFees = JSON.parse(
        this.selectedLoanType.applicableFees
      );

      this.applicableFees = JsonParsedApplicableFees.map((fee) => {
        if (fee?.FeeType === "Percentage") {
          fee.FeeAmount = `${fee?.FeeAmount}%`;
        }

        if (
          fee?.FeeType === "Flat Rate" &&
          fee?.FeeApplication === "Deducted Upfront" &&
          !this.loanTypeId
        ) {
          this.addFee({
            feeAmount: fee?.FeeAmount,
            feeApplication: fee?.FeeApplication,
            feeID: fee?.FeeID,
            feeIsMandatory: fee?.FeeIsMandatory,
            feeName: fee?.FeeName,
            feeType: fee?.FeeType,
          });
          fee.FeeAmount = toNGNFormat(fee?.FeeAmount);
        }

        return {
          Fee: fee?.FeeName,
          "Fee Application": fee?.FeeApplication,
          "Fee Type": fee?.FeeType,
          "Is Mandatory": fee?.FeeIsMandatory,
          "Fee Amount": fee?.FeeAmount,
        };
      });

      if (this.feeLines().controls.length > 0) {
        this.toggleFees = true;
        this.calculateTotalAmount(this.feeLines().value);
      }
    }
  }

  removeLoanType() {
    this.selectedLoanType = null;
    this.form.get("loanTypeId").setValue("");
  }

  toggleFeesFn() {
    this.toggleFees = !this.toggleFees;
    if (this.toggleFees) {
      this.addFee();
    } else {
      this.feeLines().clear();
    }
  }

  private getUserBranchId() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(pluck("body", "branchId"), takeUntil(this.unsubscriber$))
      .subscribe((currentUserBranchId) => {
        this.branchId = currentUserBranchId;
        this.getFees(this.branchId);
      });
  }

  private getFees(currentUserBranchId: number) {
    this.configService
      .spoolFeesforSelect(currentUserBranchId)
      .pipe(
        pluck("body"),
        map((fees) =>
          fees.map((fee) => ({ id: fee?.feeId, text: fee?.feeName }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((fees) => {
        this.fees = fees;
      });
  }

  unselectLoanType() {
    this.selectedLoanType = null;
  }

  toggleActive(value: boolean) {
    const status = value ? "Active" : "NonActive";
    this.form.get("status").setValue(status);
  }

  feeLines() {
    return this.form.get("applicableFees") as FormArray;
  }

  addFee(applicableFee?: ApplicableFee) {
    const fee = new FormGroup({
      feeID: new FormControl(applicableFee?.feeID || ""),
      feeName: new FormControl(
        applicableFee
          ? [{ id: applicableFee?.feeID, text: applicableFee?.feeName }]
          : "",
        Validators.required
      ),
      feeApplication: new FormControl(
        ["Deducted Upfront"],
        Validators.required
      ),
      feeType: new FormControl(
        this.selectedFeeType?.text || null,
        Validators.required
      ),
      feeAmount: new FormControl(
        applicableFee?.feeAmount || "",
        Validators.required
      ),
      feeIsMandatory: new FormControl(
        applicableFee ? [applicableFee?.feeIsMandatory] : "Yes",
        Validators.required
      ),
    });

    this.feeLines().push(fee);
    this.feeLines()
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((fees) => {
        this.calculateTotalAmount(fees);
      });
  }

  private calculateTotalAmount(fees) {
    this.totalFees = 0;
    fees.forEach((fee) => (this.totalFees += fee?.feeAmount));
  }

  removeFee(index: number) {
    this.feeLines().removeAt(index);
  }

  getLoanProduct() {
    this.wacsService
      .getLoanProduct(this.loanTypeId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.wacsLoanProduct = res.body.data;
          this.patchForm(this.wacsLoanProduct);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  patchForm(loanProduct: LoanProduct) {
    this.form.patchValue({
      loanTypeId: loanProduct?.loanTypeId,
      status: loanProduct?.status,
      productName: loanProduct?.productName,
      description: loanProduct?.description,
      category: loanProduct?.category,
      paybackPeriod: loanProduct?.paybackPeriod,
      moratoriumPeriod: loanProduct?.moratoriumPeriod,
      feature: loanProduct?.features?.join(","),
      amountTo: loanProduct?.amountTo,
      amountFrom: loanProduct?.amountFrom,
      interestRate: loanProduct?.interestRate,
    });

    if (this.form.value.loanTypeId) {
      this.selectLoanType({
        id: this.form.value.loanTypeId,
        text: this.form.value.productName,
      });
    }

    if (loanProduct.applicableFees.length > 0) {
      this.toggleFees = true;
      loanProduct?.applicableFees.forEach((fee) => this.addFee(fee));
      this.form.get("applicableFees").setValue(this.feeLines().value);
    }
  }

  getSearchLoanTypeService(): Select2SearchApi {
    let payload = {
      branchId: this.branchId,
      pageNumber: 1,
      pageSize: 100,
    };
    return {
      search: (keyword: string) => {
        if (keyword) {
          return this.configService.spoolLoanTypes({
            ...payload,
            filter: keyword,
          });
        } else {
          this.getLoanTypes();
          return this.configService.fetchLoanTypes(
            this.authService.decodeToken().nameid
          );
        }
      },
    };
  }

  updateDropdown($event): void {
    if ($event.value.data) {
      this.loanTypes = [...this.loanTypes, ...$event.value.data];
      this.loanTypeList = $event.value.data.map((loanType) => ({
        id: loanType?.loanTypeId,
        text: loanType?.loanName,
      }));
    }
  }

  setFeeType(feeType: CustomDropDown) {
    this.selectedFeeType = feeType.text ? feeType : null;
    const value = this.selectedFeeType?.text || null;
    this.feeLines().controls.forEach((control) => {
      control.get("feeType").setValue(value);
    });
  }

  submit() {
    const applicableFees = this.form.get("applicableFees").value.map((fee) => ({
      ...fee,
      feeApplication: fee?.feeApplication?.[0],
      feeID: fee?.feeName?.[0]?.id,
      feeName: fee?.feeName?.[0]?.text,
      feeIsMandatory: fee?.feeIsMandatory[0],
    }));

    let payload = {
      ...this.form.value,
      applicableFees,
      feature: [this.form.value.feature],
    } as unknown as CreateLoanProductReq;

    this.isProcessing = true;
    if (!this.loanTypeId) {
      this.wacsService
        .createLoanProduct(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => {
            this.isProcessing = false;
            this.toast.fire({
              type: "success",
              title: "Loan Product Created Successfully",
            });
            this.router.navigate(["/wacs/loan-products"]);
          },
          error: () => {
            this.isProcessing = false;
          },
        });
    } else {
      this.wacsService
        .updateLoanProduct({
          ...payload,
          wacsLoanProductId: this.wacsLoanProduct?.id,
        })
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => {
            this.isProcessing = false;
            this.toast.fire({
              type: "success",
              title: "Loan Product Updated Successfully",
            });
            this.router.navigate(["/wacs/loan-products"]);
          },
          error: () => {
            this.isProcessing = false;
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
