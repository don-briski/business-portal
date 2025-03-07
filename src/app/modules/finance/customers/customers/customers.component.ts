import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Customer } from "src/app/model/Customer.dto";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { FinanceService } from "../../service/finance.service";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { toFormData } from "src/app/util/finance/financeHelper";
import Swal from "sweetalert2";
import { SharedService } from "src/app/service/shared.service";
import * as moment from "moment";
import { saveAs } from "file-saver";
import { FinancePersonImportReqBody, FinancePersonType } from "../../finance.types";
import {
  ImportError,
  ImportErrorEnum,
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
} from "src/app/modules/shared/shared.types";
import { serializerError } from "src/app/modules/shared/helpers/generic.helpers";

@Component({
  selector: "lnd-customers",
  templateUrl: "./customers.component.html",
  styleUrls: ["./customers.component.scss"],
})
export class CustomersComponent implements OnInit, OnDestroy {
  @ViewChild("importErrorsModal")
  private importErrorsModal: TemplateRef<HTMLElement>;
  private _unsubscriber$ = new Subject();
  customers: any[] = [];
  customer: Customer;
  viewCustomerProp: boolean = false;
  isLoading: boolean = false;
  currentTheme: ColorThemeInterface;
  user: any;
  pagination:Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
    searchColumns:[]
  };
  isImporting = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  copy_hover = false;
  importErrors: ImportError[] = [];
  importErrorsConfig: TableConfig = {
    theadLight: true,
    small: true,
    striped: true,
    bordered: true,
  };
  importErrorsHeaders: TableHeader[] = [
    { name: "Affected Row" },
    { name: "Affected Column" },
    { name: "Error" },
  ];
  importErrorsData: TableData[] = [];

  constructor(
    private _financeService: FinanceService,
    private _userService: UserService,
    private _authService: AuthService,
    private _colorThemeService: ColorThemeService,
    private _configService: ConfigurationService,
    private _modalService: NgbModal,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this._loadTheme();
    this._fetchUser();
    this.getCustomers();
  }

  private _fetchUser(): void {
    this._userService
      .getUserInfo(this._authService.decodeToken().nameid)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  private _loadTheme(): void {
    this._colorThemeService
      .getTheme()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }
  private _setPagination(res): void {
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

  getCustomers(data?: any): void {
    this.isLoading = true;
    const payload = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      ...data,
    };

    this._financeService
      .getCustomers(payload)
      .pipe(pluck("body"), takeUntil(this._unsubscriber$))
      .subscribe(
        (res) => {
          this.customers = res.items;
          this._setPagination(res);
          this.isLoading = false;
        },
        () => (this.isLoading = false)
      );
  }

  viewCustomer(customer: Customer, element?: HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.customer = customer;
        this.viewCustomerProp = !this.viewCustomerProp;
        this._configService.isSidebarClosed$.next(true);
      }
    });
  }

  closeView(): void {
    this.customer = null;
    this.viewCustomerProp = false;
    this._configService.isSidebarClosed$.next(false);
  }

  itemPaginatedJumpModal(): void {
    $(".itemPaginatedJumpModal").toggle();
  }

  //open modal
  openModal(content, options?: NgbModalOptions) {
    this._modalService.open(content, options);
  }

  //close modal
  closeModal(): void {
    this._modalService.dismissAll();
  }

  downImportTemplate() {
    this._financeService
      .downloadCustomerImportTemplate()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        const fileName = `customer-template-${moment().format(
          "YYYY-MM-DD-HH:mm:ss"
        )}`;
        saveAs(res.body, fileName);
      });
  }

  //import file
  importCustomers(customers): void {
    this.isImporting = true;
    let payload: FinancePersonImportReqBody = {
      financePersonType: FinancePersonType.FinanceCustomer,
      file: customers,
      isBalanceUpload: false,
    };
    this._financeService
      .importCustomers(toFormData(payload))
      .pipe(pluck("body", "message"), takeUntil(this._unsubscriber$))
      .subscribe(
        (message) => {
          Swal.fire({
            type: "success",
            title: "Import Successful!",
            text: message,
            confirmButtonText: "Ok",
            confirmButtonColor: "#558E90",
          });
          this.isImporting = false;
          this.getCustomers();
        },
        (error) => {
          this.isImporting = false;
          this.importErrors = error.error;
          if (this.importErrors.length > 0) {
            this.importErrorsData = this.importErrors?.map((error) => ({
              row: { tdValue: error.rowNumber },
              column: { tdValue: error.columnName },
              error: {
                tdValue: serializerError(
                  error.error as ImportErrorEnum,
                  error.columnName
                ),
              },
            }));
          }

          this.openModal(this.importErrorsModal, {
            centered: true,
            size: "lg",
            scrollable: true,
          });
        }
      );
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Customer code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
