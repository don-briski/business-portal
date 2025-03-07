import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { ConfigurationService } from "src/app/service/configuration.service";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import * as moment from "moment";
import * as _ from "underscore";
import { LoanReScheduleStatus } from "src/app/model/reschedule";
import Swal from "sweetalert2";

@Component({
  selector: "app-reschedule-loan",
  templateUrl: "./reschedule-loan.component.html",
  styleUrls: ["./reschedule-loan.component.scss"],
})
export class RescheduleLoanComponent implements OnInit {
  @Input() loanStage: LoanReScheduleStatus;
  @Input() loanId: number;
  loanInformation: any;
  loader = false;
  loanScheduleForm: UntypedFormGroup;
  repaymentScheduleArray = [];
  tenorList = [];
  repaymentLoader = false;
  interestAsAtToday = 0;
  loanPrincipal = 0;
  CurrentDate: any;
  requestLoader = false;
  settlementInformation: any;
  rescheduleLoader = false;
  hasPaymentOnAccount = false;

  public loanAmountSelectionArray: Array<string> = [
    "Current Loan Amount",
    "Loan Balance With Settlement Threshold Considered",
    "Loan Balance Without Settlement Threshold Considered",
    "Total Amount Due",
  ];
  selectedLoanAmountType = "";
  selectedLoanAmount = 0;
  @Output() close = new EventEmitter();

  constructor(
    private loanOperationService: LoanoperationsService,
    private configurationService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.getLoanById(this.loanId);
  }

  closeModal() {
    this.close.emit("close");
  }

  getRepaymentSchedule() {
    let data = {
      NetIncome: parseFloat(
        this.configurationService.getFromJson(
          this.loanInformation.employmentInfo,
          "netIncome"
        )
      ),
      Amount: this.selectedLoanAmount,
      LoanType: this.loanInformation.loanTypeId,
      Duration: this.loanScheduleForm.get("LoanTenor").value,
      RepaymentDate: this.loanScheduleForm.get("RepaymentDate").value,
      LoanStartDate: this.loanInformation.loanStartDate,
      DateDisbursed: this.loanScheduleForm.get("DateDisbursed").value,
      InterestRate: this.configurationService.getFromJson(
        this.loanInformation.loanTypeInfo,
        "loanInterestRate"
      ),
      Status: "LoanReschedule",
    };
    this.repaymentScheduleArray = [];
    this.repaymentLoader = true;
    this.configurationService.getRepaymentSchedule(data).subscribe(
      (response) => {
        this.repaymentLoader = false;
        if (response.body.repaymentCalculate != 0) {
          this.repaymentScheduleArray = response.body.repaymentSchedule;
          this.getSettlementAmount();
        } else {
          Swal.fire("Error", response.body.resultMessage, "error");
        }
      },
      (err) => {
        this.repaymentLoader = false;
      }
    );
  }

  loanScheduleFormInit() {
    this.loanScheduleForm = new UntypedFormGroup({
      ///  RepaymentDate: new FormControl(this.loanInformation.repaymentSchedule.length > 0 ? moment(this.loanInformation.repaymentSchedule[0].paymentDueDate).format('l') : '', []),
      RepaymentDate: new UntypedFormControl(
        this.loanInformation.preferredFirstRepaymentDate != null
          ? moment(this.loanInformation.preferredFirstRepaymentDate).format("l")
          : "",
        []
      ),

      DateDisbursed: new UntypedFormControl(
        this.loanInformation.dateDisbursed != null
          ? moment(this.loanInformation.dateDisbursed).format("l")
          : "",
        []
      ),
      LoanId: new UntypedFormControl(this.loanId, []),
      LoanTenor: new UntypedFormControl(
        this.configurationService.getFromJson(
          this.loanInformation.loanTypeInfo,
          "loanDuration"
        ),
        []
      ),
      LoanAmount: new UntypedFormControl("", [Validators.required]),
      LoanStage: new UntypedFormControl(this.loanStage, [Validators.required]),
      EndDate: new UntypedFormControl(""),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
    });
  }

  saveScheduleForm() {
    this.loader = true;

    this.loanScheduleForm.controls["EndDate"].patchValue(this.CurrentDate);
    this.loanScheduleForm.controls["LoanStage"].patchValue(this.loanStage);
    this.loanOperationService
      .rescheduleLoan(this.loanScheduleForm.value)
      .subscribe(
        (res) => {
          this.loader = false;
          Swal.fire("Successful", res.body.value.feedbackmessage, "success");
          this.closeModal();
        },
        (err) => {
          this.loader = false;
          Swal.fire("Error", err.error, "error");
        }
      );
  }

  getLoanById(id: number) {
    this.rescheduleLoader = true;
    this.tenorList = [];
    this.loanOperationService.getLoanapplicationbyid(id).subscribe(
      (res) => {
        // this.loader = false;
        this.loanInformation = res.body;
        this.selectedLoanAmount = this.loanInformation.loanAmount;
        for (
          let index = 1;
          index <= this.loanInformation?.loanType?.loanTypeTenor;
          index++
        ) {
          this.tenorList.push(index);
        }
        this.loanScheduleFormInit();
        this.getRepaymentSchedule();
      },
      (err) => {
        this.rescheduleLoader = false;
        Swal.fire("Error", err.error, "error");
      }
    );
  }

  formatDate(data) {
    const date = new Date(data.toString());
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const yyyy = date.getFullYear();

    const MM = m >= 10 ? m + "" : "0" + m;
    const dd = d >= 10 ? d + "" : "0" + d;
    return yyyy + "-" + MM + "-" + dd;
  }

  getSettlementAmount() {
    this.requestLoader = true;
    const date = new Date();
    this.CurrentDate = this.formatDate(date);

    const model = {
      EndDate: this.CurrentDate,
      LoanId: this.loanId,
      SpoolReason: "settlementamountcheck",
    };
    this.loanOperationService.getSettlementAmount(model).subscribe(
      (res) => {
        this.rescheduleLoader = false;
        this.settlementInformation = res.body;
        this.loanPrincipal = this.settlementInformation?.settlementAmount;
        this.loanScheduleForm.get("LoanAmount").setValue(this.loanPrincipal);
        this.setupView();
      },
      (err) => {
        this.rescheduleLoader = false;
        Swal.fire("Error", err.error, "error");
      }
    );
  }

  selected(data) {
    this.selectedLoanAmountType = data.text;

    if (this.selectedLoanAmountType == "Current Loan Amount") {
      this.selectedLoanAmount = this.loanInformation.loanAmount;
      this.loanStage = LoanReScheduleStatus.ExtendLoanAmount;
    } else if (
      this.selectedLoanAmountType ==
      "Loan Balance With Settlement Threshold Considered"
    ) {
      this.selectedLoanAmount = this.settlementInformation.settlementAmount;
      this.loanStage =
        LoanReScheduleStatus.ExtendLoanBalanceThresholdConsidered;
    } else if (
      this.selectedLoanAmountType ==
      "Loan Balance Without Settlement Threshold Considered"
    ) {
      this.selectedLoanAmount =
        this.settlementInformation.settlementAmountWithoutThresholdConsidered;
      this.loanStage =
        LoanReScheduleStatus.ExtendLoanBalanceWithoutThresholdConsidered;
    } else if (this.selectedLoanAmountType == "Loan Balance") {
      this.selectedLoanAmount = this.settlementInformation.settlementAmount;
      this.loanStage =
        LoanReScheduleStatus.ExtendLoanBalanceWithoutThresholdConsidered;
    } else if (this.selectedLoanAmountType == "Total Amount Due") {
      this.selectedLoanAmount = this.settlementInformation.totalRepaymentsDue;
      this.loanStage = LoanReScheduleStatus.ExtendTotalDue;
    } else {
      this.selectedLoanAmountType = "";
    }

    this.getRepaymentSchedule();
  }

  setupView() {
    if (
      this.settlementInformation.totalRepaid == 0 ||
      this.settlementInformation.totalRepaymentsDue == 0
    ) {
      // predisbursement or disbursed with no repayment
      this.hasPaymentOnAccount = true;
      this.selectedLoanAmountType = this.loanInformation.loanAmount;
    }

    if (this.settlementInformation.thresholdParameterId == null) {
      this.loanAmountSelectionArray.splice(
        this.loanAmountSelectionArray.indexOf(
          "Loan Balance With Settlement Threshold Considered"
        ),
        1
      );
      this.loanAmountSelectionArray.splice(
        this.loanAmountSelectionArray.indexOf(
          "Loan Balance Without Settlement Threshold Considered"
        ),
        1
      );

      this.loanAmountSelectionArray.push("Loan Balance");
    }

    if (this.settlementInformation?.settlementAmount == 0) {
      this.loanAmountSelectionArray.splice(
        this.loanAmountSelectionArray.indexOf("Loan Balance"),
        1
      );
    }
  }
}
