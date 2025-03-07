import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { monthList } from "src/app/util/helpers/date.helpers";
import * as moment from "moment";
import { saveAs } from "file-saver";
import {
  fileSizeIsAboveBound,
  isExcel,
} from "src/app/modules/shared/helpers/fileValidator.helper";
import swal from "sweetalert2";
import { excelToJson } from "src/app/modules/shared/helpers/excel_to_json.helper";
import { PayrollData, payroll } from "../../loan.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { toFormData } from "src/app/util/finance/financeHelper";
import { searchList } from "src/app/modules/shared/helpers/generic.helpers";
import { UploadStat } from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-payroll",
  templateUrl: "./payroll.component.html",
  styleUrls: ["./payroll.component.scss"],
})
export class PayrollComponent implements OnInit, OnDestroy {
  private subs$ = new Subject();
  currentTheme: ColorThemeInterface;
  payrollUploadForm: UntypedFormGroup;
  isClearingData = false;
  months: CustomDropDown[] = monthList;
  isLoading = false;
  showSummary = false;
  file: File & { fileSize?: string };
  originalPayrollData: payroll[] = [];
  payrollData: PayrollData = { items: [] };
  currencySymbol: string;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    filter: null,
    jumpArray: [],
  };
  isFetchingEmployers = false;
  employers: CustomDropDown[] = [];
  uploadText = "Easily upload your financial payroll for civil servants to facilitate seamless loan evaluations.";
  progressValue = 0;
  uploadStats:UploadStat[] = [];

  constructor(
    private colorThemeService: ColorThemeService,
    private fb: UntypedFormBuilder,
    private loanOpService: LoanoperationsService,
    private configService: ConfigurationService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.initPayrollUploadForm();
    this.getEmployers();
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private initPayrollUploadForm() {
    this.payrollUploadForm = this.fb.group({
      institutionId: new UntypedFormControl("", Validators.required),
      year: new UntypedFormControl("", Validators.required),
      month: new UntypedFormControl("", Validators.required),
      file: new UntypedFormControl(null, Validators.required),
    });
  }

  getEmployers() {
    this.isFetchingEmployers = true;
    this.configService
      .spoolEmployers({ pageNumber: 1, pageSize: 1000 })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.employers = res.body?.value?.data?.map((item) => ({
            id: item.employerId,
            text: item.employerName,
          }));
          this.isFetchingEmployers = false;
        },
        error: () => {
          this.isFetchingEmployers = false;
        },
      });
  }

  onSelectOrDeselect(value: string, type: "Institution" | "Month" | "Year") {
    if (type === "Institution") {
      this.payrollUploadForm.get("institutionId").setValue(value);
    } else if (type === "Month") {
      this.payrollUploadForm.get("month").setValue(value);
    } else if (type === "Year") {
      this.payrollUploadForm.get("year").setValue(value);
    }
  }

  downloadTemplate() {
    this.isLoading = true;
    this.loanOpService
      .getPayrollTemplate()
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          const fileName = `payroll-template-${moment().format(
            "YYYY-MM-DD-HH:mm:ss"
          )}`;
          this.isLoading = false;
          saveAs(res.body, fileName);
        },
        () => (this.isLoading = false)
      );
  }

  deleteFile() {
    this.file = null;
    this.showSummary = false;
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
    } else if (fileSizeIsAboveBound(file.item(0).size, 10)) {
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
          this.originalPayrollData = [...payrollData];
          this.fetchPayroll(null, payrollData);

          this.payrollUploadForm.get("file").setValue(this.file);
        }else{
          throw new Error(JSON.stringify(payrollData))
        }
      })
      .catch((err) => {
        if (err.message === '[]') {
          swal.fire({
            type: "error",
            text: "The sheet should contain at least one row",
            title: "Invalid Sheet",
            confirmButtonText: "OK",
            confirmButtonColor: "#558E90",
          });
          this.progressValue = 0;
          this.showSummary = false;
        }else{
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

  getYears(startYear?: number): CustomDropDown[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    startYear = startYear || 2000;

    while (startYear <= currentYear) {
      years.push(startYear++);
    }
    return years.map((yr) => ({ id: yr, text: yr.toString() }));
  }

  sanitizePayrollData(payrollDataArray: any[]) {
    if (!payrollDataArray || !payrollDataArray?.length) return;

    const sanitizedDataArray: any[] = [];

    for (let i = 0; i < payrollDataArray.length; i++) {
      const modifiedObj = {};

      for (const key in payrollDataArray[i]) {
        let sanitizedHeader: string;

        if (key.includes("*")) {
          sanitizedHeader = key.replace("*", "");
        } else {
          sanitizedHeader = key;
        }

        if (sanitizedHeader.includes("(")) {
          sanitizedHeader = sanitizedHeader.split("(")[0];
        } else {
          sanitizedHeader = sanitizedHeader;
        }

        if (typeof payrollDataArray[i][key] === 'string') {
          modifiedObj[sanitizedHeader] = payrollDataArray[i][key].trim();
        } else {
          modifiedObj[sanitizedHeader] = payrollDataArray[i][key];
        }
      }
      sanitizedDataArray.push(modifiedObj);
    }

    return sanitizedDataArray;
  }

  fetchPayroll(event, payrollData) {
    payrollData = this.sanitizePayrollData(payrollData);

    if (event) {
      this.pagination.pageSize = +event.pageSize;
      this.pagination.pageNumber = +event.pageNumber;
    }
    if (event?.keyword) {
      payrollData = searchList(
        event.keyword,
        [...payrollData],
        ["BVN", "Email"]
      );
    }

    let start =
      this.pagination.pageNumber === 1 && this.pagination.pageSize === 10
        ? 0
        : (this.pagination.pageNumber - 1) * this.pagination.pageSize + 1;
    let end =
      this.pagination.pageNumber === 1 && this.pagination.pageSize === 10
        ? 10
        : start - 1 + this.pagination.pageSize + 1;

    if (start + this.pagination.pageNumber > payrollData.length) {
      start = start - 1;
      end = start + (payrollData.length - start);
    }

    this.payrollData = {
      items: payrollData.slice(start, end),
      rows: payrollData.length,
    };
    const totalNetPay = this.payrollData.items.reduce(
      (accumulator, currentValue) => {
        return (
          accumulator +
          (currentValue["Gross Salary"] - currentValue["Total Deductions"])
        );
      },
      0
    );
    this.payrollData.totalNetPay = totalNetPay;

    this.uploadStats = [
      {value:this.payrollData.rows},
      {value:this.payrollData?.totalNetPay},
    ]

    const pagination = {
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
      totalCount: payrollData.length,
      hasNextPage: this.hasNextPage(
        payrollData.length,
        this.pagination.pageNumber,
        this.pagination.pageSize
      ),
      hasPreviousPage: this.hasPreviousPage(this.pagination.pageNumber),
      totalPages: Math.ceil(payrollData.length / this.pagination.pageSize),
      count: payrollData.length,
    };
    this.setPagination(pagination);
  }

  hasNextPage(dataLength, currentPage, itemsPerPage) {
    const totalPages = Math.ceil(dataLength / itemsPerPage);
    return currentPage < totalPages;
  }

  hasPreviousPage(currentPage) {
    return currentPage > 1;
  }

  private setPagination(res: any): void {
    this.pagination.pageSize = res?.pageSize;
    this.pagination.pageNumber = res?.pageNumber;
    this.pagination.totalCount = res?.totalCount;
    this.pagination.hasNextPage = res?.hasNextPage;
    this.pagination.hasPreviousPage = res?.hasPreviousPage;
    this.pagination.totalPages = res?.totalPages;
    this.pagination.count = this.payrollData.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  openPreviewModal(content) {
    this.modalService.open(content, {
      centered: true,
      size: "lg",
    });
  }

  closeModal(): void {
    this.modalService.dismissAll();
    this.fetchPayroll(null, [...this.originalPayrollData]);
  }

  onSubmit() {
    this.isLoading = true;
    const { institutionId, year, month, file } = this.payrollUploadForm.value;
    const payload = toFormData({ institutionId, year, month, file });
    this.loanOpService
      .uploadPayroll(payload)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        () => {
          this.isLoading = false;
          this.clearData();

          swal.fire({
            type: "success",
            text: "Your payroll has been successfully submitted. We will work silently in the background and update the data. A mail would be sent once this process is complete!",
            title: "Upload Successful!",
            confirmButtonText: "Continue",
            confirmButtonColor: "#558E90",
          });
        },
        () => (this.isLoading = false)
      );
  }

  clearData() {
    this.isClearingData = true;
    this.payrollUploadForm.reset();
    this.deleteFile();
    setTimeout(() => {
      this.isClearingData = false;
    }, 1);
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
