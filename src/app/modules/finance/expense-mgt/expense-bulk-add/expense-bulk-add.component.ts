import { Component, OnDestroy, OnInit, TemplateRef } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  UntypedFormArray,
} from "@angular/forms";
import { FinanceService } from "../../service/finance.service";
import { fromEvent, Subject } from "rxjs";
import {
  debounceTime,
  takeUntil,
  distinctUntilChanged,
  filter,
  pluck,
  switchMap,
  share,
  map,
} from "rxjs/operators";
import { Router } from "@angular/router";
import { Customer } from "src/app/model/Customer.dto";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { BankAccount } from "../../types/Account";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { transfromAccs } from "src/app/util/finance/financeHelper";
import { FinanceCustomer } from "../../finance.types";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { User } from "src/app/modules/shared/shared.types";

@Component({
  selector: "app-expense-bulk-add",
  templateUrl: "./expense-bulk-add.component.html",
  styleUrls: ["./expense-bulk-add.component.scss"],
})
export class ExpenseBulkAddComponent implements OnInit, OnDestroy {
  bulkExpenseForm: UntypedFormGroup;
  accounts: any[] = [];
  bankAccounts: CustomDropDown[] = [];
  unsubscriber$ = new Subject();
  vendors: any[] = [];
  customers: CustomDropDown[] = [];
  isLoading = false;
  private _vendorSet = false;
  private _customerSet = false;
  user: User;

  constructor(
    private fb: UntypedFormBuilder,
    private financeService: FinanceService,
    private router: Router,
    private modalService: NgbModal,
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this._getAccounts();
    this.getBankAccounts();
    this._getVendors();
    this._getCustomers();
    this.addExpense();
    this.addExpense();
    this.fetchUser();
  }

  initForm(): void {
    this.bulkExpenseForm = this.fb.group({
      data: this.fb.array([]),
      status: new UntypedFormControl(null),
    });

    this.watchChanges();
  }

  fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
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
          filter: "CustomersOnly",
          pageNumber: "1",
          pageSize: "10",
          keyword,
        };
        return this.financeService.getCustomersOrVendorsSummary(model);
      },
    };
  }

  updateDropdown($event: any, type: string): void {
    if (type === "vendor" && $event?.items.length > 0) {
      this.vendors = $event?.items;
    } else if (type === "customer" && $event?.items.length > 0) {
      this.customers = $event.items;
    }
    else if (type === "paidThrough"){
      this.bankAccounts = transfromAccs($event?.items)
    }
  }

  private watchChanges(): void {
    this.bulkExpenseForm.valueChanges
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((controls) => {
        controls.data.forEach((control, index) => {
          this.expense()
            .at(index)
            .get("vendorId")
            .setValue(control?.vendor[0]?.id, { emitEvent: false });

          this.expense()
            .at(index)
            .get("customerId")
            .setValue(control?.customer[0]?.id, { emitEvent: false });
        });
      });
  }

  private _getAccounts(): void {
    this.financeService
      .getAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => (this.accounts = res.body));
  }

  getBankAccounts(): void {
    this.financeService
      .getAccountsByClass({ filter: "bank" })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.bankAccounts = res.body.items.map((acc: BankAccount) => ({
          id: acc.accountId,
          text: acc.name,
        }));
      });
  }

  getPaidThroughService(): Select2SearchApi {
    return {
      search: (accountName: string) =>
        this.financeService.getAccountsByClass({
          keyword: accountName,
          pageNumber: "1",
          pageSize: "10",
          filter:"bank"
        }),
    };
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
    const payload = {
      pageNumber: 1,
      pageSize: 10,
    };
    this.financeService
      .getCustomers(payload)
      .pipe(
        pluck("body", "items"),
        map((customers: FinanceCustomer[]) =>
          customers.map((customer: FinanceCustomer) => ({
            id: customer.id,
            text: customer.fullName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((customers: CustomDropDown[]) => {
        this.customers = customers;
      });
  }

  public setVendor(): void {
    if (!this._vendorSet) {
      fromEvent($("#vendor")[0], "keyup")
        .pipe(
          debounceTime(500),
          pluck("target", "value"),
          distinctUntilChanged(),
          filter((value: string) => value.length > 2),
          share(),
          switchMap((searchTerm) => {
            return this.financeService
              .getVendorsLimitedView({ searchTerm })
              .pipe(pluck("body"), takeUntil(this.unsubscriber$));
          })
        )
        .subscribe((vendors) => (this.vendors = vendors));
    }

    this._vendorSet = true;
  }

  public setCustomer(): void {
    if (!this._customerSet) {
      fromEvent($("#customer")[0], "keyup")
        .pipe(
          debounceTime(500),
          pluck("target", "value"),
          distinctUntilChanged(),
          filter((value: string) => value.length > 2),
          share(),
          switchMap((searchTerm) => {
            return this.financeService
              .getCustomersLimitedView({ searchTerm })
              .pipe(pluck("body"), takeUntil(this.unsubscriber$));
          })
        )
        .subscribe((customers) => (this.customers = customers));
    }

    this._customerSet = true;
  }

  expense(): UntypedFormArray {
    return this.bulkExpenseForm.controls["data"] as UntypedFormArray;
  }

  addExpense() {
    const expense = this.fb.group({
      date: new UntypedFormControl("", Validators.required),
      expenseAccountId: new UntypedFormControl(null, Validators.required),
      amount: new UntypedFormControl(0, Validators.required),
      paidThroughAccountId: new UntypedFormControl(null, Validators.required),
      vendor: new UntypedFormControl([]),
      vendorId: new UntypedFormControl(null),
      customer: new UntypedFormControl([]),
      customerId: new UntypedFormControl(null),
      reference: new UntypedFormControl(null),
      status: new UntypedFormControl(null),
    });

    this.expense().push(expense);
  }

  removeExpense(index: number): void {
    if (this.expense().length > 1) {
      this.expense().removeAt(index);
    }
  }

  setValue(value, controlName: string, index?: number) {
    if (controlName === "paidThroughAccountId") {
      this.expense()
        .at(index)
        .get("paidThroughAccountId")
        .setValue(value.id);
    }

    if (controlName === "expenseAccount") {
      this.expense()
        .at(index)
        .get("expenseAccountId")
        .setValue(value.accountId);
    }
  }

  openModal(modal: TemplateRef<any>): void {
    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  submit(status: "SentForApproval" | "Posted", transactionPin?: string) {
    this.bulkExpenseForm.get("status").setValue(status);

    this.isLoading = true;
    this.financeService
      .createBulkExpense(this.bulkExpenseForm.value, transactionPin)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.isLoading = false;
          this.router.navigate(["finance/expenses"]);
        },
        (err) => (this.isLoading = false)
      );
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
