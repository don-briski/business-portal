import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Observable, Subject } from "rxjs";
import { take, takeUntil, pluck, tap, map } from "rxjs/operators";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { AuthService } from "src/app/service/auth.service";
import { BillsMgtService } from "src/app/service/bills-mgt.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import {
  customDateFormat,
  toFormData,
  transfromAccs,
} from "src/app/util/finance/financeHelper";
import Swal from "sweetalert2";
import { FinanceService } from "../../service/finance.service";
import { FinancePayment } from "../../finance.types";
import { AppOwnerInformation, User } from "src/app/modules/shared/shared.types";

@Component({
  selector: "app-add-edit-payments-made",
  templateUrl: "./add-edit-payments-made.component.html",
  styleUrls: ["./add-edit-payments-made.component.scss"],
})
export class AddEditPaymentsMadeComponent implements OnInit, OnDestroy {
  vendors: any[] = [];
  paymentModes: any[] = [];
  unsubscriber$ = new Subject<void>();
  loadingVendor: boolean;
  selectedVendor: any;
  allVendors: any[] = [];
  allPaymentModes: any[] = [];
  paymentForm: UntypedFormGroup;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  loader: boolean;
  currentTheme: ColorThemeInterface;
  accounts: any[] = [];
  bankAccounts: CustomDropDown[] = [];
  taxes: CustomDropDown[] = [];
  allBills: any[] = [];
  isEditing: boolean = false;
  amountUsed = 0;
  amountExcess = 0;
  totalTax: number = 0;
  paymentMadeId: number;
  paymentMade: FinancePayment;
  ownerInformation: AppOwnerInformation;
  user: User;

  constructor(
    private financeService: FinanceService,
    private billService: BillsMgtService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService,
    private coaService: ChartOfAccountService,
    private configService: ConfigurationService,
    private userService: UserService,
    private authService: AuthService,
    private modalService: NgbModal
  ) {
    this.route.url.pipe(takeUntil(this.unsubscriber$)).subscribe((res: any) => {
      if (res[1].path === "edit") {
        this.isEditing = true;

        this.route.paramMap
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe((params: ParamMap) => {
            this.paymentMadeId = +params.get("id");
          });
      } else {
        this.isEditing = false;
      }
    });
  }

  ngOnInit(): void {
    this.fetchUser();
    this.initForm();
    this._getVendors();
    this._loadTheme();
    this._getAccounts();
    this.getBankAccounts();
    this._getTaxes();
    this._getPaymentModes();

    this.getApplicationownerinformation();

    if (this.isEditing) {
      this._getPaymentMade();
    }
  }

  getSearchVendorService(): Select2SearchApi {
    return {
      search: (keyword: string) => {
        const model = {
          filter: "VendorsOnly",
          pageNumber: "1",
          pageSize: "10",
          keyword,
        };
        return this.financeService.getCustomersOrVendorsSummary(model);
      },
    };
  }

  getPaymentModeService(): Select2SearchApi {
    return {
      search: (paymentModeName: string) =>
        this.financeService.getPaymentModes({
          paymentModeName: paymentModeName,
          pageNumber: "1",
          pageSize: "10",
          isActive: true,
        }),
    };
  }

  getPaidThroughService(): Select2SearchApi {
    return {
      search: (accountName: string) =>
        this.financeService.getAccountsByClass({
          keyword: accountName,
          pageNumber: "1",
          pageSize: "10",
          filter: "bank",
        }),
    };
  }

  updateDropdown($event: any, type: string): void {
    if (type === "vendor" && $event?.items.length > 0) {
      this.vendors = $event?.items;
    } else if (type === "paymentMode" && $event?.length > 0) {
      this.paymentModes = $event?.map((paymentMode: any) => {
        return {
          id: paymentMode?.financePaymentModeId,
          text: paymentMode?.name,
        };
      });
    } else if (type === "paidThrough") {
      this.bankAccounts = transfromAccs($event?.items);
    }
  }

  openModal(modal: any): void {
    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  private fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.user = res.body;
        },
      );
  }

  private _getPaymentMade(): void {
    this.financeService
      .getPayment(this.paymentMadeId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.paymentMade = res.body.data;
        this._patchPaymentsMade(this.paymentMade);
      });
  }

  private _getTaxes(): void {
    this.financeService
      .getTaxes({ pageNumber: 1, pageSize: 100, isActive: true })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.taxes = res.body?.items.map((acc) => {
          return {
            id: acc?.financeTaxId,
            text: `${acc?.name} (${acc?.value}%)`,
          };
        });
      });
  }

  selectVendor(event: any): void {
    this.getVendorInfo(event?.id);
  }

  selectAccount(event: any): void {
    this.paymentForm.get("paidThroughAccountId").patchValue(event.id);
  }

  selectTaxAccount(event: any): void {
    this.paymentForm.get("taxAccountId").patchValue(event.accountId);
  }

  selectPaymentMode(event: any): void {
    this.paymentForm.get("paymentModeId").patchValue(event.id);
  }

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  private initForm(): void {
    this.paymentForm = this.fb.group({
      paymentMode: new UntypedFormControl(null, [Validators.required]),
      paymentModeId: new UntypedFormControl(null, [Validators.required]),
      personId: new UntypedFormControl(null, [Validators.required]),
      paymentAmount: new UntypedFormControl(0, [Validators.required]),
      paymentBankCharges: new UntypedFormControl(0, [Validators.required]),
      paymentCode: new UntypedFormControl(null),
      paymentMadeDate: new UntypedFormControl(null, [Validators.required]),
      paidThroughAccountId: new UntypedFormControl(null, [Validators.required]),
      paymentReference: new UntypedFormControl(null),
      status: new UntypedFormControl(null),
      internalNote: new UntypedFormControl(null),
      linesAffectedTItems: this.fb.array([]),
      transactionDescription: new UntypedFormControl(null),
      taxAccountId: new UntypedFormControl(null),
    });

    this.watchForm();
  }

  private watchForm(): void {
    this.paymentForm
      .get("paymentAmount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.calculateAmountUsed();
      });

    this.paymentForm
      .get("linesAffectedTItems")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.calculateAmountUsed();
        this.totalTax = 0;

        res.forEach((line, index) => {
          let summedVal = line.paymentAmount + line.whtAmount;
          const control = this.lineItems().at(index);
          this._checkForExcess(summedVal, control);
          if (line.whtAmount > 0) {
            this.totalTax += line.whtAmount;
            if (line.paymentAmount === 0) {
              this.lineItems()
                .at(index)
                .get("paymentAmount")
                .setValidators(Validators.required);
              this.lineItems()
                .at(index)
                .get("paymentAmount")
                .updateValueAndValidity({ emitEvent: false });
            }
          }
        });
      });
  }

  private _checkForExcess(value: number, control: any): void {
    if (value > control.value.balanceDue) {
      this.toast.fire({
        type: "error",
        timer: 5000,
        title: `Payment Amount (${value}) cannot be greater than balance due ${control.value.balanceDue}`,
      });
      control.get("paymentAmount").reset(0);
      control.get("whtAmount").reset(0);
    }
  }

  calculateAmountUsed(): void {
    this.amountUsed = 0;
    this.amountExcess = 0;

    const amountPaid = +this.paymentForm.get("paymentAmount").value;
    const lines = this.paymentForm.get("linesAffectedTItems").value;

    lines?.forEach((line) => {
      this.amountUsed += line?.paymentAmount;
    });

    this.amountExcess = +(amountPaid - this.amountUsed).toFixed(2);
  }

  createLineItem(item: any): UntypedFormGroup {
    return this.fb.group({
      billId: new UntypedFormControl(item?.billId),
      paymentAmount: new UntypedFormControl(
        item?.paymentAmount || 0,
        Validators.required
      ),
      whtAmount: new UntypedFormControl(item?.whtAmount),
      tax: new UntypedFormControl(null),
      billDate: new UntypedFormControl(item?.billDate),
      billCode: new UntypedFormControl(item?.billCode),
      totalAmount: new UntypedFormControl(item?.totalAmount),
      billAmount: new UntypedFormControl(item?.totalAmount),
      balanceDue: new UntypedFormControl(item?.balanceDue),
    });
  }

  lineItems(): UntypedFormArray {
    return this.paymentForm.get("linesAffectedTItems") as UntypedFormArray;
  }

  private _getVendors() {
    const model = {
      pageSize: 1000,
      pageNumber: 1,
    };
    this.financeService
      .getVendors(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const filteredVendors = res?.body.items.filter(
          (vendor) => vendor.status === true
        );
        this.allVendors = filteredVendors;
        if (this.allVendors.length > 0) {
          this.vendors = this.allVendors.map(
            (item) =>
              <CustomDropDown>{
                id: item?.id,
                text: item?.fullName,
              }
          );
        }
      });
  }

  private _getPaymentModes() {
    const model = {
      pageSize: 1000,
      pageNumber: 1,
    };
    this.financeService
      .getPaymentModes(model)
      .pipe(
        pluck("body", "data", "items"),
        tap((allPaymentModes: any[]) => {
          this.allPaymentModes = allPaymentModes;
          const paymentMode = allPaymentModes.find(
            (paymentMode) => paymentMode.isDefault
          );

          if (paymentMode) {
            this.paymentForm
              .get("paymentModeId")
              .setValue(paymentMode?.financePaymentModeId);
            this.paymentForm.get("paymentMode").setValue([
              {
                id: paymentMode?.financePaymentModeId,
                text: paymentMode?.name,
              },
            ]);
          }
        }),
        map((paymentModes: any[]) => {
          return paymentModes.map((paymentMode) => ({
            id: paymentMode?.financePaymentModeId,
            text: paymentMode?.name,
          }));
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((paymentMode) => {
        this.paymentModes = paymentMode;
      });
  }

  private getVendorInfo(id: any): void {
    this.paymentForm.get("personId").patchValue(id);
    this.selectedVendor = this.allVendors.find((x) => x.id === id);
    this.loadingVendor = true;
    const model = {
      vendorId: id,
      pageSize: 1000,
      pageNumber: 1,
      billStatus: ["Posted"],
    };
    this.billService
      .spoolAllBills(model)
      .pipe(take(1))
      .subscribe(
        (res) => {
          this.loadingVendor = false;
          this.allBills = res.data?.items;
          this.selectedVendor["bills"] = [];
          this.lineItems().setValue([]);
          this.selectedVendor["bills"] = this.allBills.map((bill, index) => {
            if (this.isEditing) {
              bill["paymentAmount"] =
                this.paymentMade.paymentLines[index]?.amountAllocated;
              bill["whtAmount"] =
                this.paymentMade.paymentLines[index]?.whtAmount || 0;
            } else {
              bill["paymentAmount"] = 0;
              bill["whtAmount"] = 0;
            }
            return bill;
          });

          this.selectedVendor?.bills?.forEach((bill) => {
            if (bill.balanceDue > 0) {
              this.lineItems().push(this.createLineItem(bill));
            }
          });
        },
        (err) => {
          this.loadingVendor = false;
        }
      );
  }

  private _getAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((accounts) => {
        this.accounts = accounts;
      });
  }

  getBankAccounts(options?): void {
    this.financeService
      .getAccountsByClass({
        ...options,
        filter: "bank",
        pageNumber: "1",
        pageSize: "10",
      })
      .pipe(
        pluck("body", "items"),
        map((accounts) => transfromAccs(accounts)),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((bankAccounts) => {
        this.bankAccounts = bankAccounts;
      });
  }

  private _loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  protected sendToService$(
    data: any,
    transactionPin?: string
  ): Observable<any> {
    if (this.isEditing) {
      return this.financeService.updatePaymentMade(data);
    }
    return this.financeService.createPaymentMade(data, transactionPin);
  }

  private _patchPaymentsMade(paymentMade: any): void {
    this.paymentForm.patchValue({
      paymentModeId: paymentMade?.paymentModeId,
      personId: paymentMade?.personId,
      paymentAmount: paymentMade?.paymentAmount,
      paymentBankCharges: paymentMade?.paymentBankCharges,
      paymentCode: paymentMade?.paymentCode,
      paymentMadeDate: customDateFormat(paymentMade?.paymentMadeDate),
      paidThroughAccountId: paymentMade?.paidThroughAccountId,
      paymentReference: paymentMade?.paymentReference,
      status: paymentMade?.status,
      internalNote: paymentMade?.internalNote,
      transactionDescription: paymentMade?.transactionDescription,
      taxAccountId: paymentMade?.taxAccountId,
    });

    if (paymentMade.personId) {
      this.getVendorInfo(paymentMade.personId);
    }
  }

  submitForm(event): void {
    let text;
    let title;

    if (this.totalTax > 0 && !this.paymentForm.get("taxAccountId").value) {
      text = "You need to select a Tax Account";
      title = "Tax Account Not Selected";
    }

    if (this.totalTax === 0 && this.paymentForm.get("taxAccountId").value) {
      text = "You need to add a witholding tax to atleast one of the bills";
      title = "No witholding tax amount set";
    }

    if (
      (this.totalTax > 0 && !this.paymentForm.get("taxAccountId").value) ||
      (this.totalTax === 0 && this.paymentForm.get("taxAccountId").value)
    ) {
      Swal.fire({
        type: "info",
        text: text,
        title: title,
        confirmButtonText: "OK",
        confirmButtonColor: "#558E90",
      });
    } else {
      this.loader = true;
      this.paymentForm.get("status").patchValue(event?.status || event);

      const data = this.paymentForm.value;
      const newLines = this.paymentForm
        .get("linesAffectedTItems")
        .value.filter((line) => line.paymentAmount > 0);

      data.linesAffectedTItems = newLines;

      if (this.isEditing) {
        data.financePaymentId = this.paymentMade?.financePaymentId;
      }

      const formData = toFormData(data);
      this.sendToService$(formData, event?.transactionPin)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            let message = this.isEditing
              ? "Payment has been upated successfully."
              : "Payment has been created successfully.";
            this.toast.fire({
              type: "success",
              text: message,
            });
            this.loader = false;
            this.router.navigateByUrl("/finance/payments-made");
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
