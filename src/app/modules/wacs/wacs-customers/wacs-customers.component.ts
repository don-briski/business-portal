import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
  TablePaginationChange,
} from "../../shared/shared.types";
import { Subject } from "rxjs";
import { WacsService } from "../services/wacs.service";
import { map, takeUntil } from "rxjs/operators";
import { GetWacsCustomersResponse } from "../types/customer";
import { UserService } from "src/app/service/user.service";
import { Router } from "@angular/router";
import { removeNullUndefinedWithReduce } from "../../shared/helpers/generic.helpers";
import { AuthService } from "src/app/service/auth.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ConfigurationService } from "src/app/service/configuration.service";
import { VerifyBankAccount } from "../../configuration/models/configuration";

@Component({
  selector: "lnd-wacs-customers",
  templateUrl: "./wacs-customers.component.html",
  styleUrls: ["./wacs-customers.component.scss"],
})
export class WacsCustomersComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  config: TableConfig = {
    uniqueIdPropLink: "name",
  };

  headers: TableHeader[] = [
    { name: "Customer Code", type: "code" },
    { name: "Name" },
    { name: "IPPIS" },
    { name: "BVN" },
    { name: "Date Created" },
    { name: "Action" },
  ];

  tableData: TableData[] = [];

  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
    searchColumns: [],
  };

  isLoading = false;
  permissions: string[] = [];
  showPopup = false;

  form = new FormGroup({
    ippisNumber: new FormControl("", Validators.required),
    bvn: new FormControl("", [
      Validators.required,
      Validators.minLength(11),
      Validators.maxLength(11),
    ]),
    accountNumber: new FormControl("", Validators.required),
    accountName: new FormControl("", Validators.required),
    bank: new FormControl<CustomDropDown[] | null>(null, Validators.required),
    bankCode: new FormControl("", Validators.required),
  });
  banks: CustomDropDown[] = [];
  isProcessing = false;
  selectedBank: CustomDropDown;
  validatingBankAccount = false;

  constructor(
    private wacsService: WacsService,
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
    private configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.getBanks();
    this.getWacsCustomers();
    this.fetchUser();
  }

  private getBanks() {
    this.configService
      .spoolBanks({ provider: "Paystack" })
      .pipe(
        map((response) =>
          response.body.map((bank) => ({
            id: `${bank.bankId}.${bank.sortCode}`,
            text: bank.bankName,
            additionalInfo:bank.sortCode
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((banks) => {
        this.banks = banks;
      });
  }

  getWacsCustomers(paginationChange?: TablePaginationChange) {
    this.isLoading = true;
    this.wacsService
      .getCustomers(
        removeNullUndefinedWithReduce({
          pageNumber: this.pagination.pageNumber,
          pageSize: this.pagination.pageSize,
          ...paginationChange,
        })
      )
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (response) => {
          this.setTableData(response.body);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private setTableData(data: GetWacsCustomersResponse) {
    this.tableData = data.items.map((customer) => ({
      code: { tdValue: customer?.customerCode, type: "code" },
      name: { tdValue: customer?.displayName, id: customer?.wacsCustomerId },
      ippis: { tdValue: customer?.ippisNumber },
      bvn: { tdValue: customer?.bvn },
      date: { tdValue: customer?.createdAt, type: "date" },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(customer?.wacsCustomerId),
      },
    }));

    this.setPagination(data);
    this.isLoading = false;
  }

  getActionConfig(id: number) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.viewCustomer(id),
      },
    ];
  }

  private setPagination(res: GetWacsCustomersResponse): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;
    this.pagination.searchColumns = res.searchColumns;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  viewCustomer(id: number) {
    this.router.navigateByUrl(`/wacs/customers/${id}`);
  }

  private fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe((res) => {
        this.permissions = res.body?.permission;
      });
  }

  togglePopup() {
    this.showPopup = !this.showPopup;
  }

  continue() {
    const payload = {...this.form.getRawValue(),bank:this.form.value.bank[0].text};
    this.isProcessing = true;
    this.wacsService
      .registerWacsCustomer(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          const payload = JSON.stringify(res.body.data);
          sessionStorage.setItem("wacs-customer-payload", payload);
          this.togglePopup();
          this.isProcessing = false;
          this.router.navigate(["wacs/customers/create"]);
        },
        error: () => (this.isProcessing = false),
      });
  }


  validateBank(){
    this.validatingBankAccount = true;
    const sortCode = (this.form.value.bank[0].id as string).split(".")[1];
    this.form.get("bankCode").setValue(sortCode);
    const payload:VerifyBankAccount = {
      accountNumber: this.form.value.accountNumber,
      sortCode
    }
    this.configService.validateBankAccount(payload).pipe(takeUntil(this.unsubscriber$)).subscribe({
      next:(response) => {
        this.form.get('accountName').setValue(response.body.data.accountName);
        this.form.get('accountName').setErrors(null);
        this.validatingBankAccount = false;
      },
      error: () => {
        this.form.get('accountName').setErrors({validated:false});
        this.validatingBankAccount = false;
      }
    })
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
