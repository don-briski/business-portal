import { Component, Input, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import * as moment from "moment";
import { Vendor } from "../../models/vendor.interface";
import { FinanceService } from "../../service/finance.service";
import { pluck, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { Customer } from "src/app/model/Customer.dto";
import { AccountStatement } from "../../models/account-statement.interface";

@Component({
  selector: "lnd-account-statement",
  templateUrl: "./account-statement.component.html",
  styleUrls: ["./account-statement.component.scss"],
})
export class AccountStatementComponent implements OnInit {
  @Input() selectedVendor: Vendor;
  @Input() selectedCustomer: Customer;
  @Input() type: "vendor" | "customer";
  @Input() appOwnerName: Vendor;
  @Input() currencySymbol: string;
  @Input() currentTheme;

  private subs$ = new Subject();
  filterForm: UntypedFormGroup;
  showDateRange = false;
  isLoading = false;
  accountStatement: AccountStatement;

  constructor(
    private _fb: UntypedFormBuilder,
    private financeService: FinanceService
  ) {}

  ngOnInit(): void {
    this._initForm();
    this.getAccountStatementOfAccount();
  }

  private _initForm(triggerFetch?: boolean): void {
    this.filterForm = this._fb.group({
      startDate: new UntypedFormControl(
        moment().format("YYYY-MM-DD"),
        Validators.required
      ),
      endDate: new UntypedFormControl(
        moment().format("YYYY-MM-DD"),
        Validators.required
      ),
      range: new UntypedFormControl("Today"),
    });

    if (triggerFetch) {
      this.getAccountStatementOfAccount();
    }
  }

  getAccountStatementOfAccount(): void {
    let payload = { ...this.filterForm.value };
    this.isLoading = true;
    this.showDateRange = false;
    if (this.type === "vendor") {
      payload = { ...payload, VendorId: this.selectedVendor.vendorId };
    } else {
      payload = {
        ...payload,
        FinanceCustomerId: this.selectedCustomer.id,
      };
    }

    delete payload.range;

    this.financeService
      .getAccountStatements(payload)
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe((res) => {
        this.accountStatement = res;
        this.isLoading = false;
      });
  }

  isAsAtDate(): boolean {
    return (
      this.filterForm.get("startDate").value ===
        moment().format("YYYY-MM-DD") &&
      this.filterForm.get("endDate").value === moment().format("YYYY-MM-DD")
    );
  }

  setDateRange(payload) {
    if (this.showDateRange) {
      this._initForm();
    }
    this.filterForm.patchValue({
      startDate: payload.fromDate,
      endDate: payload.toDate,
      range: payload.range,
    });

    this.getAccountStatementOfAccount();
  }

  toggleDateRange(): void {
    this.showDateRange = !this.showDateRange;
  }
}
