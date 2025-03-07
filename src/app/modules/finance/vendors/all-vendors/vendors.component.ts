import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from "@angular/core";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { map, pluck, takeUntil } from "rxjs/operators";
import { FinanceService } from "../../service/finance.service";
import Swal from "sweetalert2";
import { ConfigurationService } from "src/app/service/configuration.service";
import { Vendor } from "../../models/vendor.interface";
import { toFormData } from "src/app/util/finance/financeHelper";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap"
import * as moment from "moment";
import { saveAs } from "file-saver";
import { SharedService } from "src/app/service/shared.service";
import { FinancePersonType } from "../../finance.types";
import { ImportError, ImportErrorEnum, TableConfig, TableData, TableHeader } from "src/app/modules/shared/shared.types";
import { serializerError } from "src/app/modules/shared/helpers/generic.helpers";


@Component({
  selector: "app-vendors",
  templateUrl: "./vendors.component.html",
  styleUrls: ["./vendors.component.scss"],
})
export class VendorsComponent implements OnInit, OnDestroy {
  @ViewChild("importErrorsModal")
  private importErrorsModal: TemplateRef<HTMLElement>;
  user;
  unsubscriber$ = new Subject<void>();
  currentTheme: ColorThemeInterface;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
  };
  fetchingVendors: boolean = false;
  vendors: Vendor[] = [];
  vendor: Vendor;
  isLoading = false;
  viewVendor = false;
  isImporting = false;
  copy_hover = false;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  searchColumns:string[] = [];
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
    private userService: UserService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private financeService: FinanceService,
    private configurationService: ConfigurationService,
    private modalService:NgbModal,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.fetchUser();
    this.loadTheme();
    this.getVendors({
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
    });
  }

  getVendorsPaginatedSearch(pageInfo) {
    this.getVendors({
      pageSize: pageInfo.pageSize,
      pageNumber: pageInfo.pageNumber,
    });
  }

  fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe(
        (res) => {
          this.user = res.body;
        },
        (err) => {}
      );
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getVendors(options?: any): void {
    let pageInfo = {
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
    };
    pageInfo = { ...pageInfo, ...options };
    this.isLoading = true;
    this.financeService
      .getVendors(pageInfo)
      .pipe(map(response => ({...response,body:{...response.body,items:response.body.items.map(vendor => ({...vendor,status:vendor?.status ? "Active" : "Inactive"}))}})),takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.searchColumns = res.body.searchColumns;
        this.vendors = res.body.items;
        $(".itemPaginatedJumpModal").toggle(false);

        this.pagination.pageSize = res.body.pageSize;
        this.pagination.pageNumber = res.body.pageNumber;
        this.pagination.totalCount = res.body.totalCount;
        this.pagination.hasNextPage = res.body.hasNextPage;
        this.pagination.hasPreviousPage = res.body.hasPreviousPage;
        this.pagination.totalPages = res.body.totalPages;
        this.pagination.count = res.body.items.length;

        this.isLoading = false;
        this.pagination.jumpArray = Array(this.pagination.totalPages);
        for (let i = 0; i < this.pagination.jumpArray.length; i++) {
          this.pagination.jumpArray[i] = i + 1;
        }
      });
  }

  setViewVendor(vendorId: number,element?:HTMLElement): void {
    setTimeout(() => {
      const dropdownIndex = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[dropdownIndex] !== "show" && !this.copy_hover) {
        this.isLoading = true;
        this.financeService.getVendor(vendorId).pipe(pluck("body"),takeUntil(this.unsubscriber$)).subscribe(vendor => {
          this.vendor = vendor;
          this.viewVendor = true;
          this.isLoading = false;
          this.configurationService.isSidebarClosed$.next(true);
        })
      }
    });
  }

  closeView() {
    this.viewVendor = false;
    this.vendor = null;
    this.configurationService.isSidebarClosed$.next(false);
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  deactivate(event: Event, vendorId, index: number): void {
    if (event) {
      event.stopPropagation();
      this.vendor = this.vendors[index];
      Swal.fire({
        type: "info",
        text: "This Action will deactivate this Vendor",
        title: "Deactivate Vendor",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Abort",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
      }).then((result) => {
        if (result.value) {
          Swal.fire({
            title: `${this.vendor.name}`,
            type: "info",
            html: 'Deactivating Vendor <i class="icon icon-spin icon-spin2"></i>',
            showConfirmButton: false,
          });
          this.financeService
            .deactivateVendor(vendorId)
            .pipe(takeUntil(this.unsubscriber$))
            .subscribe(
              (res) => {
                this.isLoading = false;
                Swal.fire({ title: "Deactivation Successful", type: "success" });
                this.getVendors({
                  pageSize: this.pagination.pageSize,
                  pageNumber: this.pagination.pageNumber,
                });
              },
              (error) => {
                this.isLoading = false;
              }
            );
        }
      });
    }
  }

  //open modal
  openModal(content, options?) {
    this.modalService.open(content, options);
  }

  //close modal
  closeModal(): void {
    this.modalService.dismissAll();
  }

  downloadTemplate() {
    this.isLoading = true;
    this.financeService
      .downloadVendorImportTemplate()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const fileName = `sample-vendor-template-${moment().format(
          "YYYY-MM-DD-HH:mm:ss"
        )}`;
        this.isLoading = false;
        saveAs(res.body, fileName);
      },() => this.isLoading = false);
  }

   //import file
   importVendors(vendorSheet): void {
    this.isImporting = true;
    const payload = toFormData({
      financePersonType: FinancePersonType.FinanceVendor,
      file: vendorSheet
    });
    this.financeService
      .importVendors(payload)
      .pipe(pluck("body","message"),takeUntil(this.unsubscriber$))
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
          this.getVendors()
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

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Vendor code copied to clipboard",type:'success',timer:3000})
    }
  }

  ngOnDestroy(): void {
    this.closeView();
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
