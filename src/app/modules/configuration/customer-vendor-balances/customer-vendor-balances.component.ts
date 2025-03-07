import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import * as moment from "moment";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomerService } from "src/app/service/customer.service";
import { saveAs } from "file-saver";
import {
  fileSizeIsAboveBound,
  isExcel,
} from "../../shared/helpers/fileValidator.helper";
import swal from "sweetalert2";
import { excelToJson } from "../../shared/helpers/excel_to_json.helper";
import {
  ImportError,
  ImportErrorEnum,
  TableConfig,
  TableData,
  TableHeader,
  UploadStat,
} from "../../shared/shared.types";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { serializerError } from "../../shared/helpers/generic.helpers";
import { FinancePersonType } from "../../finance/finance.types";
import { VendorMgtService } from "src/app/service/vendor-mgt.service";

@Component({
  selector: "lnd-customer-vendor-balances",
  templateUrl: "./customer-vendor-balances.component.html",
  styleUrls: ["./customer-vendor-balances.component.scss"],
})
export class CustomerVendorBalancesComponent implements OnInit, OnDestroy {
  @ViewChild("importErrorsModal")
  private importErrorsModal: TemplateRef<HTMLElement>;

  @Input() currentTheme: ColorThemeInterface;
  @Input() resource?: "Customer" | "Vendor";

  subs$ = new Subject();
  uploadText: string;
  isLoading = false;
  showSummary = false;
  file: File & { fileSize?: string };
  totalRows = 0;
  progressValue = 0;
  uploadStats: UploadStat[];
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
    private customerService: CustomerService,
    private vendorService: VendorMgtService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.uploadText = `Upload/Import your outstanding ${this.resource}s`;
  }

  downloadTemplate() {
    if (this.resource === "Customer") {
      this.isLoading = true;
      this.customerService
        .getCustomerBalancesTemplate()
        .pipe(takeUntil(this.subs$))
        .subscribe(
          (res) => {
            const fileName = `customer-balances-${moment().format(
              "YYYY-MM-DD-HH:mm:ss"
            )}`;
            this.isLoading = false;
            saveAs(res.body, fileName);
          },
          () => (this.isLoading = false)
        );
    }

    if (this.resource === "Vendor") {
      this.isLoading = true;
      this.vendorService
        .getVendorBalancesTemplate()
        .pipe(takeUntil(this.subs$))
        .subscribe(
          (res) => {
            const fileName = `vendor-balances-${moment().format(
              "YYYY-MM-DD-HH:mm:ss"
            )}`;
            this.isLoading = false;
            saveAs(res.body, fileName);
          },
          () => (this.isLoading = false)
        );
    }
  }

  setUploadStats(payrollData){
    const totalCredits = payrollData.reduce(
      (accumulator, currentValue) => {
        return accumulator + currentValue["Credit Balance"];
      },
      0
    );

    if (this.resource === "Customer") {
      const totalReceivables = payrollData.reduce(
        (accumulator, currentValue) => {
          return accumulator + currentValue["Receivable Balance"];
        },
        0
      );

      this.uploadStats = [
        { value: payrollData.length },
        { label: "Total Receivables", value: totalReceivables || 0 },
        { label: "Total Credits", value: totalCredits || 0 },
      ];
    }

    if (this.resource === "Vendor") {
      const totalPayables = payrollData.reduce(
        (accumulator, currentValue) => {
          return accumulator + currentValue["Payable Balance"];
        },
        0
      );

      this.uploadStats = [
        { value: payrollData.length },
        { label: "Total Receivables", value: totalPayables || 0 },
        { label: "Total Credits", value: totalCredits || 0 },
      ];
    }
  }

  handleFileInput(file: FileList) {
    this.file = file.item(0);
    this.file.size / 1024 < 1024
      ? (this.file.fileSize = Math.round(this.file.size / 1024) + " KB")
      : (this.file.fileSize = this.file.size * 1024 + " MB");

    if (!isExcel(file.item(0)?.name)) {
      swal.fire({
        type: "error",
        text: "Please select a valid excel file!",
        title: "Invalid File",
        confirmButtonText: "OK",
        confirmButtonColor: "#558E90",
      });
      return;
    } else if (fileSizeIsAboveBound(file.item(0).size, 100)) {
      swal.fire({
        type: "error",
        text: "File is greater than allowed size of 10MB",
        title: "Invalid File Size",
        confirmButtonText: "OK",
        confirmButtonColor: "#558E90",
      });
      return;
    }

    this.showSummary = true;

    excelToJson(file.item(0))
      .then((payrollData) => {
        if (payrollData.length > 0) {
          this.totalRows = payrollData.length;
          this.setUploadStats(payrollData)
        } else {
          throw new Error(JSON.stringify(payrollData));
        }
      })
      .catch((err) => {
        if (err.message === "[]") {
          swal.fire({
            type: "error",
            text: "The sheet should contain at least one row",
            title: "Invalid Sheet",
            confirmButtonText: "OK",
            confirmButtonColor: "#558E90",
          });
          this.progressValue = 0;
          this.showSummary = false;
        } else {
          swal.fire({
            type: "error",
            text: "Something Went Wrong",
            title: "Error",
            confirmButtonText: "OK",
            confirmButtonColor: "#558E90",
          });

          this.progressValue = 0;
          this.showSummary = false;
        }
      });
  }

  deleteFile() {
    this.file = null;
    this.showSummary = false;
  }

  openModal(content, options?: NgbModalOptions) {
    this.modalService.open(content, options);
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  handleImportError(error) {
    this.isLoading = false;
    this.importErrors = error;
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

  submit() {
    this.isLoading = true;
    let payload = {
      financePersonType: FinancePersonType.FinanceCustomer,
      file: this.file,
      isBalanceUpload: true,
    };

    if (this.resource === "Customer") {
      this.customerService
        .importCustomerBalances(payload)
        .pipe(pluck("body", "message"), takeUntil(this.subs$))
        .subscribe(
          (message) => {
            swal.fire({
              type: "success",
              text: "Customer Balances successfully Imported!",
              title: message,
              confirmButtonText: "Continue",
              confirmButtonColor: "#558E90",
            });
            this.file = null;
            this.showSummary = false;
            this.isLoading = false;
          },
          (error) => { this.handleImportError(error.error) }
        );
    }

    if (this.resource === "Vendor") {
      payload.financePersonType = FinancePersonType.FinanceVendor;
      this.vendorService
        .importVendorBalances(payload)
        .pipe(pluck("body", "message"), takeUntil(this.subs$))
        .subscribe(
          (message) => {
            swal.fire({
              type: "success",
              text: "Vendor Balances successfully Imported!",
              title: message,
              confirmButtonText: "Continue",
              confirmButtonColor: "#558E90",
            });
            this.file = null;
            this.showSummary = false;
            this.isLoading = false;
          },
          (error) => { this.handleImportError(error.error) }
        );
    }
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
