import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  UntypedFormArray,
} from "@angular/forms";
import { Router } from "@angular/router";
import {
  calculateExpenseLines,
  toFormData,
  transfromAccs,
} from "src/app/util/finance/financeHelper";
import { FinanceService } from "../../service/finance.service";
import { ActivatedRoute } from "@angular/router";
import * as moment from "moment";
import { Subject } from "rxjs";
import { takeUntil, pluck, map } from "rxjs/operators";
import Swal from "sweetalert2";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ExpenseDetails } from "../../types/expense";
import { FinanceCustomer, Tax } from "../../finance.types";
@Component({
  selector: "app-add-edit-expense",
  templateUrl: "./add-edit-expense.component.html",
  styleUrls: ["./add-edit-expense.component.scss"],
})
export class AddEditExpenseComponent implements OnInit, OnDestroy {
  accounts: any[] = [];
  bankAccounts: CustomDropDown[] = [];
  taxes: Tax[] = [];
  expenseForm: UntypedFormGroup;
  itemize: boolean = false;
  expenseFiles: any[] = [];
  expenseViewFiles: any[] = [];
  isEditing = false;
  cloning = false;
  expenses: any[] = [];
  singleExpense: ExpenseDetails;
  vendors;
  customers;
  unsubscriber$ = new Subject();
  isLoading: boolean = false;
  fileDelete: boolean = false;
  subTotal: number = 0;
  subTotalTax: number = 0;
  expenseTotal: number = 0;
  taxesObj: any[] = [];
  taxesDropdata: CustomDropDown[] = [];
  zeroItems: any[] = [];
  private _selectedExpenseId: number;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  @Output() isEditingEvent = new EventEmitter<boolean>();
  @Output() expensesEvent = new EventEmitter<ExpenseDetails>();
  ownerInformation: any;
  user;

  constructor(
    private fb: UntypedFormBuilder,
    private financeService: FinanceService,
    private router: Router,
    private route: ActivatedRoute,
    private configService: ConfigurationService,
    private userService: UserService,
    private authService: AuthService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this._initForm();
    this.resolveEditOrCloneMode();
    this.fetchUser();
    this._getAccounts();
    this.getBankAccounts();
    this._getVendors();
    this._getCustomers();
    this._getTaxes();
    this.getApplicationownerinformation();
  }

  resolveEditOrCloneMode() {
    const urlSegments = this.route.snapshot.url;
    if (urlSegments[1].path === "edit") {
      this.isEditing = true;
    } else if (urlSegments[2] && urlSegments[2].path === "clone") {
      this.cloning = true;
    } else {
      this.isEditing = false;
      this.cloning = false;
    }

    if (this.isEditing || this.cloning) {
      const id = this.route.snapshot.params.id;
      this._selectedExpenseId = id;

      if (!this.cloning) {
        this.isEditingEvent.emit(true);
      }
      this._getExpense();

      this.itemize = true;
    } else {
      this.addExpense();
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

  getSearchCustomerService(): Select2SearchApi {
    return {
      search: (keyword: string) => {
        const model = {
          pageNumber: 1,
          pageSize: 10,
          selectedSearchColumn: "fullName",
          keyword,
        };
        return this.financeService.getCustomers(model);
      },
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

  transformCustomerDropdown(customers: FinanceCustomer[]) {
    return customers.map((item) => {
      return {
        id: item?.id,
        text: item?.fullName,
      };
    });
  }

  updateDropdown($event: any, type: string): void {
    if (type === "vendor" && $event?.items.length > 0) {
      this.vendors = $event?.items;
    } else if (type === "customer" && $event?.items.length > 0) {
      this.customers = this.transformCustomerDropdown($event.items);
    } else if (type === "paidThrough") {
      this.bankAccounts = transfromAccs($event?.items);
    }
  }

  private fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe(
        (res) => {
          this.user = res.body;
        },
        (err) => {}
      );
  }

  toggleItemize() {
    this.itemize = !this.itemize;
    if (this.itemize) {
      this.expense().at(0).reset();
      this.expense().at(0).get("amount").setValue(0);
    }
  }

  private _getAccounts(): void {
    this.financeService
      .getAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.accounts = res.body;
      });
  }

  getBankAccounts(): void {
    this.financeService
      .getAccountsByClass({ filter: "bank" })
      .pipe(
        pluck("body", "items"),
        map((accounts) => transfromAccs(accounts)),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((res) => {
        this.bankAccounts = res;
      });
  }

  private getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  private _getVendors(): void {
    const model = {
      filter: "VendorsOnly",
      pageNumber: "1",
      pageSize: "10",
    };
    this.financeService
      .getCustomersOrVendorsSummary(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.vendors = res.body.items;
      });
  }

  private _getCustomers(): void {
    const model = {
      pageNumber: "1",
      pageSize: "10",
    };
    this.financeService
      .getCustomers(model)
      .pipe(
        pluck("body", "items"),
        map((customers) => this.transformCustomerDropdown(customers)),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((customers) => {
        this.customers = customers;
      });
  }

  private _getExpense(): void {
    this.financeService
      .getExpense(this._selectedExpenseId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.singleExpense = res.body.data;
        this.patchExpenseForm(this.singleExpense);
        this.expensesEvent.emit(this.singleExpense);
      });
  }

  private _getTaxes(): void {
    this.financeService
      .getTaxes({ pageNumber: 1, pageSize: 100, isActive: true })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.taxes = res.body.items;

        this.taxesDropdata = this.taxes.map((acc: any) => {
          return {
            id: acc?.financeTaxId,
            text: `${acc?.name} (${acc?.value}%)`,
          };
        });
      });
  }

  expense(): UntypedFormArray {
    return this.expenseForm.controls["expenseLines"] as UntypedFormArray;
  }

  private _initForm(): void {
    this.expenseForm = this.fb.group({
      date: new UntypedFormControl(null, Validators.required),
      paidThroughAccountId: new UntypedFormControl(null, Validators.required),
      vendorId: new UntypedFormControl(null),
      customerId: new UntypedFormControl(null),
      amount: new UntypedFormControl(0),
      reference: new UntypedFormControl(null),
      notes: new UntypedFormControl(null),
      project: new UntypedFormControl(null),
      status: new UntypedFormControl("SentForApproval", Validators.required),
      existingFiles: new UntypedFormControl([]),
      expenseLines: this.fb.array([]),
    });

    this._watchFormChanges();
  }

  private _watchFormChanges(): void {
    this.expenseForm
      .get("expenseLines")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        res.forEach((line) => {
          if (line.expenseAccountId && line.amount > 0) {
            this.zeroItems = this.zeroItems.filter(
              (item) => item.expenseAccountId !== line.expenseAccountId
            );
          } else {
            line.expenseAccountId ? this.zeroItems.push(line) : null;
          }
        });
      });

    this.expenseForm
      .get("amount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.expense().at(0).get("amount").setValue(res);
      });
  }

  addExpense(): void {
    const expense = this.fb.group({
      amount: new UntypedFormControl(0, Validators.required),
      notes: new UntypedFormControl(null),
      expenseAccountId: new UntypedFormControl(null, Validators.required),
      taxId: new UntypedFormControl(null),
    });

    this.expense().push(expense);
  }

  removeExpense(index: number): void {
    if (this.expense().length > 1) {
      const amount = this.expense().at(index).get("amount").value;
      const tax = this.taxesObj[index].value;
      this.subTotal -= amount;
      this.taxesObj.splice(index, 1);
      const sum = -(amount + tax);
      this.expenseTotal += sum;
      this.expense().removeAt(index);
    }
  }

  handleFile(files): void {
    this.clearFileHandler();
    for (let i = 0; i < files.length; i++) {
      this.expenseFiles.push(files.item(i));
      this.expenseViewFiles = [...this.expenseViewFiles, files.item(i)];
    }
  }

  clearFileHandler() {
    this.expenseFiles = [];
  }

  getExpenseFiles(): void {
    this.financeService
      .getExpenseFiles(this._selectedExpenseId)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((expenseFiles) => (this.expenseFiles = expenseFiles));
  }
  removeFile(index: number): void {
    this.expenseViewFiles.splice(index, 1);
  }

  setTaxes(value: any, controlIndex: number): void {
    this.expense().at(controlIndex).get("taxId").setValue(value.id);
    const amount = this.expense().at(controlIndex).get("amount").value;

    if (amount > 0) {
      this.calculateTax();
    }
  }

  setValue(value, controlName: string, index?: number) {
    if (controlName === "paidThroughAccountId") {
      this.expenseForm.get("paidThroughAccountId").setValue(value.id);
    }

    if (controlName === "vendorId") {
      this.expenseForm.get("vendorId").setValue(value.id);
    }

    if (controlName === "customerId") {
      this.expenseForm.get("customerId").setValue(value.id);
    }

    if (controlName === "expenseAccount") {
      this.expense()
        .at(index)
        .get("expenseAccountId")
        .setValue(value.accountId);
    }

    if (controlName === "accountSingle") {
      this.expense().at(0).get("expenseAccountId").setValue(value.accountId);
    }

    if (controlName === "amountSingle") {
      this.expense().at(0).get("amount").setValue(+value);
    }

    if (controlName === "notesSingle") {
      this.expense().at(0).get("notes").setValue(value);
    }
  }

  accumulateAmount(): void {
    // const amount = this.expense().at(i).get("amount").value;
    // this.subTotal += amount;
    let total = 0;

    const expenseLines = this.expense().value;
    expenseLines.forEach((line) => {
      total += line.amount;
    });

    this.subTotal = total;
    this.expenseTotal = total;
    this.taxesObj.forEach((tax) => {
      this.expenseTotal += tax.value;
    });
  }

  calculateTax(): void {
    const lines = this.expense().value;

    this.taxesObj = calculateExpenseLines(lines, this.taxes);
    this.accumulateAmount();
  }

  patchExpenseForm(expense) {
    this.expenseForm.patchValue({
      date: this._formatDate(expense.date),
      paidThroughAccountId: expense.paidThroughAccountId,
      vendorId: expense.vendorId,
      customerId: expense.customerId,
      reference: expense.reference,
      notes: expense.notes,
      project: expense.project,
      status: expense.status,
    });
    this.expenses = expense.expenseLines;
    this.expenses.forEach((line, index) => {
      const expenseControl = this.fb.group({
        amount: new UntypedFormControl(line.amount),
        notes: new UntypedFormControl(line.notes),
        expenseAccountId: new UntypedFormControl(line?.expenseAccount?.accountId),
        taxId: new UntypedFormControl(line?.taxId),
      });

      this.expense().push(expenseControl);

      this.calculateTax();
    });

    this.expenseViewFiles = this.isEditing ? [...expense.files] : [];
  }

  private _formatDate(dateString: string): string {
    let date = new Date(dateString);
    return moment(date).format("yyyy-MM-DD");
  }

  submit(event): void {
    this.isLoading = true;
    this.expenseForm.get("status").setValue(event?.status || event);

    this.expenseForm.removeControl("amount");

    const payload = { ...this.expenseForm.value, files: this.expenseFiles };
    if (this.isEditing) {
      payload.expenseId = this._selectedExpenseId;
      this.expenseViewFiles.map((file) => {
        if (file.fileId) {
          payload.existingFiles.push(file.fileId);
        }
      });
    }

    const formData = toFormData(payload);

    if (!this.isEditing) {
      this.financeService
        .createExpense(formData, event?.transactionPin)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: `Expense ${this.cloning ? 'cloned' : 'created'} successfully!`,
            });
            this.isLoading = false;

            this.router.navigate(["finance/expenses"]);
          },
          (error) => (this.isLoading = false)
        );
    } else {
      this.financeService
        .updateExpense(formData, event?.transactionPin)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Expense Updated successfully",
            });
            this.isLoading = false;
            this.router.navigate(["finance/expenses"]);
          },
          (error) => (this.isLoading = false)
        );
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

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
