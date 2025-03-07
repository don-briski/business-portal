import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ConfigurationService } from "src/app/service/configuration.service";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { AppOwnerInformation } from "../../shared/shared.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { LoanRepaymentMethodEnum } from "../enums/loan-repayment-method.enum";
import { CustomerDetailsFromRemita, LoanInformation } from "../loan.types";
@Component({
  selector: "bank-statement-analysis",
  templateUrl: "./bank-statement-analysis.component.html",
  styleUrls: ["./bank-statement-analysis.component.scss"],
})
export class BankStatementAnalysisComponent implements OnInit, OnDestroy {
  @Input() currentTheme: ColorThemeInterface;
  @Input() ownerInformation: AppOwnerInformation;
  @Input() loanInformation: LoanInformation;
  decideInfo;
  filters: CustomDropDown[] = [
    { id: 1, text: "Queued" },
    { id: 2, text: "Processing" },
    { id: 3, text: "Done" },
    { id: 4, text: "Failed" },
  ];
  filter: string;
  loanInfo: any;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  private _unsubscriber$ = new Subject();

  showManualTrigger: boolean = false;
  queue: any[] = [];
  isLoading: boolean = false;
  triggerLoading: boolean = false;
  status = new UntypedFormControl();
  appOwnerInfo: AppOwnerInformation;
  hoverBankStatementDecide = false;
  hoverInflightRemita = false;
  hoverCreditCheck = false;
  usesRemitaRepaymentMethod = false;
  loadingCreditScore = false;
  customerDetailsFromRemita: CustomerDetailsFromRemita;
  selectedRemitaInfo: "Salary" | "Loan";

  constructor(
    private loanoperationService: LoanoperationsService,
    private modalService: NgbModal,
    private _configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this._getAppOwnerInfo();
    const empInfo = JSON.parse(this.loanInformation.employmentInfo);

    this.loanInfo = {
      loanId: this.loanInformation.loanId,
      loanAmount: this.loanInformation.loanAmount,
      tenor: this.loanInformation.loanTenor,
      branchName: this.loanInformation.branch.branchName,
      email: this.loanInformation.person.emailAddress,
      phoneNumber: this.loanInformation.person.phoneNumber,
      bankStatement: empInfo?.bankStatement,
      loanStage: this.loanInformation.loanStage,
      isDecideActive:this.loanInformation?.isDecideActive
    };

    if (this.loanInfo.bankStatement) {
      this._getBankStatementAnalysisRequestsByLoan();
    }

    this.status.valueChanges
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.filter = res[0]?.text;

        this.getBankStatementAnalysisRequests({ status: this.filter });
      });

    this.initializeProps();
  }

  initializeProps() {
    if (this.loanInformation?.repaymentInfo) {
      const decodedRepaymentInfo = JSON.parse(
        this.loanInformation?.repaymentInfo
      );

      this.usesRemitaRepaymentMethod =
        decodedRepaymentInfo.repaymentMethod ===
        LoanRepaymentMethodEnum.InflightCollectionsRemita;
    }

    if (this.loanInformation?.remitaLoanInformation) {
      const decoded = JSON.parse(this.loanInformation.remitaLoanInformation);

      this.customerDetailsFromRemita =
        decoded?.CustomerSalaryRemitaResponse?.Data;

      this.customerDetailsFromRemita["SalaryPaymentDetails"] =
        this.customerDetailsFromRemita["SalaryPaymentDetails"].map((item) => ({
          accountNumber: item["AccountNumber"],
          amount: item["Amount"],
          bankCode: item["BankCode"],
          paymentDate: item["PaymentDate"],
        }));

      this.customerDetailsFromRemita["LoanHistoryDetails"] =
        this.customerDetailsFromRemita["LoanHistoryDetails"].map((item) => ({
          loanAmount: item["LoanAmount"],
          loanDisbursementDate: item["LoanDisbursementDate"],
          loanProvider: item["LoanProvider"],
          outstandingAmount: item["OutstandingAmount"],
          repaymentAmount: item["RepaymentAmount"],
          repaymentFreq: item["RepaymentFreq"],
          status: item["Status"],
        }));
    }
  }

  openModal(content, index: number) {
    this.decideInfo = this.queue[index];
    this.modalService.open(content, {
      ariaLabelledBy: "modal-basic-title",
      size: "lg",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  private _getAppOwnerInfo(): void {
    this._configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.appOwnerInfo = res?.body;
        if (res.body.decideInfo.trigger === "Manual") {
          this.showManualTrigger = true;
        }
      });
  }

  private _getBankStatementAnalysisRequestsByLoan(): void {
    this.isLoading = true;
    const model = {
      pageNumber: 1,
      pageSize: 1000,
      loanId: this.loanInfo?.loanId,
    };
    this.loanoperationService
      .getBankStatementAnalysisRequestsByLoan(model)
      .pipe(pluck("body", "data"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.queue = res.items;
        this.isLoading = false;
        if (res.items.length === 0) {
          this.showManualTrigger = true;
        }
      });
  }

  getBankStatementAnalysisRequests(options: any): void {
    let payload: any = {
      pageNumber: 1,
      pageSize: 1000,
      loanId: this.loanInfo?.loanId,
    };

    payload = { ...payload, ...options };

    if (this.filter) {
      payload.status = this.filter;
    }

    if (payload.code || payload.status) {
      this.isLoading = true;

      this.loanoperationService
        .getBankStatementAnalysisRequests(payload)
        .pipe(pluck("body", "data", "items"), takeUntil(this._unsubscriber$))
        .subscribe((res) => {
          this.queue = res;
          this.isLoading = false;
        });
    }
  }

  manualTrigger(): void {
    this.triggerLoading = true;
    this.loanoperationService
      .requestBankStatementAnalysisForLoan(this.loanInfo?.loanId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(
        (res) => {
          this.isLoading = false;
          this.toast.fire("Your Request has been Queued", "", "success");
          this._getBankStatementAnalysisRequestsByLoan();
        },
        (error) => (this.triggerLoading = false)
      );
  }

  getCreditRegistryCustomerData() {
    this.loadingCreditScore = true;
    if (this.loanInformation.bvnInfo) {
      const bvn = this.getFromJson(this.loanInformation.bvnInfo, "bvnNumber");
      if (bvn) {
        this.loanoperationService.getCreditRegistryCustomerData(bvn).subscribe(
          (res) => {
            this.loadingCreditScore = false;
            if (res.body.success && res.body.pdfReport.success) {
              const pdfWindow = window.open("_blank");
              // tslint:disable-next-line:max-line-length
              pdfWindow.document.write(
                `<iframe width='100%' height='100%' src='data:application/pdf;base64,${encodeURI(
                  res.body.pdfReport.pdfContent
                )}'></iframe>`
              );
            } else {
              Swal.fire("Error", res.body.message, "warning");
            }
          },
          (err) => {
            this.loadingCreditScore = false;
          }
        );
      } else {
        this.loadingCreditScore = false;
        Swal.fire("Error", "Customer does not have a bvn", "warning");
      }
    }
  }

  canUseCrc() {
    return this.getFromJson(
      this.ownerInformation?.appOwnerCreditRegistryInfo,
      "IsActive"
    );
  }

  getFromJson(stringArray: string, expectedResult: string) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }

  ngOnDestroy() {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
