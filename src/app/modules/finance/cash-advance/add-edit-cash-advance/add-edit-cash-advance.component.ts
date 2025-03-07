import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import * as moment from "moment";
import { Observable, Subject } from "rxjs";
import Swal from "sweetalert2";
import { map, pluck, takeUntil } from "rxjs/operators";

import { CustomDropDown } from "src/app/model/CustomDropdown";
import { CashAdvanceService } from "src/app/service/cash-advance.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { PettyCashTransactionService } from "src/app/service/petty-cash-transaction.service";
import {
  customDateFormat,
  toFormData,
  transfromAccs,
} from "src/app/util/finance/financeHelper";
import { FinanceService } from "../../service/finance.service";
import { BankAccount } from "../../types/Account";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";

@Component({
  selector: "lnd-add-edit-cash-advance",
  templateUrl: "./add-edit-cash-advance.component.html",
  styleUrls: ["./add-edit-cash-advance.component.scss"],
})
export class AddEditCashAdvanceComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();
  cashAdvanceForm: UntypedFormGroup;
  public staffList: any[] = [];
  public loggedInUser: any;
  public loader: boolean;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  accounts: any[] = [];
  staffAccounts: any[] = [];
  bankAccounts: CustomDropDown[] = [];
  cashAdvanceFormFiles: any[] = [];
  cashAdvanceFormViewFiles: any[] = [];
  isEditing: boolean = false;
  selectedCashAdvanceId: number;
  cashAdvanceInformation: any;
  loadingCashAdv: boolean;
  currentTheme: ColorThemeInterface;
  constructor(
    private _fb: UntypedFormBuilder,
    private cashAdvanceService: CashAdvanceService,
    private pettyCashTransactionService: PettyCashTransactionService,
    private coaService: ChartOfAccountService,
    private financeService: FinanceService,
    private router: Router,
    private _route: ActivatedRoute,
    private colorThemeService: ColorThemeService
  ) {
    this._route.url
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: any) => {
        if (res[1].path === "edit") {
          this.isEditing = true;
          this.loadingCashAdv = true;

          this._route.paramMap
            .pipe(takeUntil(this.unsubscriber$))
            .subscribe((params: ParamMap) => {
              this.selectedCashAdvanceId = +params.get("id");
            });
        } else {
          this.isEditing = false;
        }
      });
  }

  ngOnInit(): void {
    this.loadTheme();
    this.fetchStaff();
    this._getAccounts();
    this._getStaffAccounts();
    this.getBankAccounts();
    this.initForm();

    this.isEditing ? this.getCashAdvance(this.selectedCashAdvanceId) : null;
  }

  getStaffService(): Select2SearchApi {
    return {
      search: (name: string) =>
        this.pettyCashTransactionService.getStaff({
          keyword: name
        }),
    };
  }

  getAccountService(filter:string): Select2SearchApi {
    return {
      search: (accountName: string) =>
        this.financeService.getAccountsByClass({
          keyword: accountName,
          pageNumber: "1",
          pageSize: "10",
          filter
        }),
    };
  }

  updateDropdown($event: any, type: string): void {
    if (type === "staff"){
      this.staffList = $event.map(staff => ({id:staff.id,text:staff.name}))
    }

    if (type === "staffAccount") {
      this.staffAccounts = transfromAccs($event?.items)
    }

    if (type === "paidThrough") {
      this.bankAccounts = transfromAccs($event?.items)
    }
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  initForm(): void {
    this.cashAdvanceForm = this._fb.group({
      amount: new UntypedFormControl(0, [Validators.required]),
      paidThroughAccountId: new UntypedFormControl(null, [Validators.required]),
      staffId: new UntypedFormControl(null, [Validators.required]),
      staff: new UntypedFormControl(null, [Validators.required]),
      staffAccountId: new UntypedFormControl(null, [Validators.required]),
      expectedCashAdvanceReceiptDate: new UntypedFormControl(null, [
        Validators.required,
      ]),
      transactionDate: new UntypedFormControl(null),
      description: new UntypedFormControl(null),
    });

    this.watchForm();
  }

  watchForm(): void {
    this.cashAdvanceForm
      .get("transactionDate")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const ecarDate = this.cashAdvanceForm.get(
          "expectedCashAdvanceReceiptDate"
        ).value;
        if (res && ecarDate) {
          const isTransactionDateGreater = this.compareDate(res, ecarDate);

          if (isTransactionDateGreater) {
            this.cashAdvanceForm.get("transactionDate").patchValue(null);
            Swal.fire({
              type: "info",
              title: "Invalid date",
              text: "Expected cash advance receipt date cannot be before transaction date",
            });
          }
        }
      });

    this.cashAdvanceForm
      .get("expectedCashAdvanceReceiptDate")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const transactionDate =
          this.cashAdvanceForm.get("transactionDate").value;
        if (res && transactionDate) {
          const isTransactionDateGreater = this.compareDate(
            res,
            transactionDate
          );
          if (!isTransactionDateGreater) {
            this.cashAdvanceForm
              .get("expectedCashAdvanceReceiptDate")
              .patchValue(null);
            Swal.fire({
              type: "info",
              title: "Invalid date",
              text: "Expected cash advance receipt date cannot be before transaction date",
            });
          }
        }
      });
  }

  submitForm(): void {
    this.loader = true;
    const model = this.cashAdvanceForm.value;
    delete model["staff"];
    model.files = this.cashAdvanceFormFiles;

    const formData = toFormData(model);
    this.sendToService$(formData, this.cashAdvanceInformation?.id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            text: `Cash advance successfully ${
              this.isEditing ? "updated" : "raised"
            }.`,
          });
          this.loader = false;
          this.router.navigateByUrl("finance/cash-advance/all");
          this.cashAdvanceForm.reset();
          this.cashAdvanceInformation = null;
          this.initForm();
          this.loader = false;
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  selectStaff(event: any): void {
    this.cashAdvanceForm.get("staffId").patchValue(event.id);
  }

  selectAccount(event, type: "staff" | "bank"): void {
    type === "bank"
      ? this.cashAdvanceForm.get("paidThroughAccountId").setValue(event.id)
      : this.cashAdvanceForm.get("staffAccountId").setValue(event.id);
  }

  private fetchStaff() {
    this.staffList = [];
    this.pettyCashTransactionService
      .getStaff()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.staffList = res.body.map((x) => {
          return { id: x.id, text: x.name };
        });
      });
  }
  private _getAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((accounts) => {
        this.accounts = accounts;
      });
  }

  private _getStaffAccounts(): void {
    this.financeService
      .getAccountsByClass({ filter: "staff" })
      .pipe(
        pluck("body"),
        takeUntil(this.unsubscriber$),
        map((res) => {
          return res.items.map((account) => ({
            id: account.accountId,
            text: account.name,
          }));
        })
      )
      .subscribe((res) => {
        this.staffAccounts = res;
      });
  }

  getBankAccounts(): void {
    this.financeService
      .getAccountsByClass({ filter: "bank" })
      .pipe(pluck("body","items"),map(accounts => transfromAccs(accounts)),takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.bankAccounts = res
      });
  }

  handleFileInput(filelist: FileList) {
    this.clearFileHandler();
    for (let i = 0; i < filelist.length; i++) {
      this.cashAdvanceFormFiles.push(filelist.item(i));
      this.cashAdvanceFormViewFiles = [
        ...this.cashAdvanceFormViewFiles,
        filelist.item(i),
      ];
    }
  }

  private getCashAdvance(id: any): void {
    this.loadingCashAdv = true;
    this.cashAdvanceService
      .getCashAdvanceById(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.cashAdvanceInformation = res?.body?.data;
          this.cashAdvanceInformation["staff"] = [
            {
              id: this.cashAdvanceInformation.beneficiaryId,
              text: this.cashAdvanceInformation.beneficiary,
            },
          ];
          this.selectStaff(this.cashAdvanceInformation.staff);
          this.cashAdvanceInformation.expectedCashAdvanceReceiptDate =
            customDateFormat(
              this.cashAdvanceInformation.expectedCashAdvanceReceiptDate
            );
          this.cashAdvanceInformation.transactionDate = customDateFormat(
            this.cashAdvanceInformation.createdAt
          );
          this.cashAdvanceForm.patchValue(this.cashAdvanceInformation);
          this.cashAdvanceForm.get("transactionDate").disable();
          this.selectStaff(this.cashAdvanceInformation.staff[0]);

          this.loadingCashAdv = false;
        },
        (err) => {
          this.loadingCashAdv = false;
        }
      );
  }

  clearFileHandler() {
    this.cashAdvanceFormFiles = [];
  }

  public removeFile(index: number): void {
    this.cashAdvanceFormViewFiles.splice(index, 1);
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  protected formatDate(date: string): string {
    let newDate = new Date(date);
    return moment(newDate).format("yyyy-MM-DD");
  }

  protected isGreaterThanToday(value: any): boolean {
    const dateVal = moment(value);
    const today = moment();
    const difference = dateVal.diff(today);
    if (difference > 0) {
      return true;
    } else {
      return false;
    }
  }
  protected compareDate(dateA: any, dateB: any): boolean {
    const dateVal1 = moment(dateA);
    const dateVal2 = moment(dateB);
    const difference = dateVal1.diff(dateVal2);
    if (difference > 0) {
      return true;
    } else {
      return false;
    }
  }

  protected sendToService$(model: any, id?: number): Observable<any> {
    return !this.isEditing
      ? this.cashAdvanceService.raiseCashAdvance(model)
      : this.cashAdvanceService.updateCashAdvance(model, id);
  }
}
