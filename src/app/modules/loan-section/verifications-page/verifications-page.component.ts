import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  UntypedFormControl,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LoanoperationsService } from "../../../service/loanoperations.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { Configuration } from "../../../model/configuration";
import swal from "sweetalert2";
import { RealtimeService } from "src/app/service/realtime.service";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { Router } from "@angular/router";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { takeUntil } from "rxjs/operators";
import { SharedService } from "src/app/service/shared.service";
import {
  Pagination,
  SearchParams,
  TableConfig,
  TableData,
  TableHeader,
} from "../../shared/shared.types";
import { GetUnverifiedAppsResBody, UnverifiedApp } from "../loan.types";
import { WacsService } from "../../wacs/services/wacs.service";
import { WacsDisbursementConfirmation } from "../../wacs/types/loan-products";
@Component({
  selector: "app-verifications-page",
  templateUrl: "./verifications-page.component.html",
  styleUrls: ["./verifications-page.component.scss"],
})
export class VerificationsPageComponent implements OnInit {
  applications: Configuration[];
  sideview: any;
  public AddResponseForm: UntypedFormGroup;
  currentuser: any;
  currentuserid: any;
  ownerInformation: any;
  currentdate: any;
  currentuserbranchid: any;

  public toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    //timerProgressBar: true,
    showCloseButton: true,
    background: "#f4f4f4",
  });

  public loggedInUser: any;

  pagination = {
    pageNum: 1,
    pageSize: 25,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  viewloandetails: boolean;
  loaninformation: any;
  lineInformation: any;
  currentFileUrl: any;
  feedbackdata: any;

  selectedloanid: any;
  selectedrepaymentmethod: any;
  selectedcustomer: any;

  currentview: any;
  requestLoader: boolean;
  loader = false;
  dataTable: any;
  currentProcess: boolean;
  loanamount: any;
  schedulelines: any[];

  scheduleView: boolean;
  minimumDate: any;
  banksArray: any[] = [];

  externalidentifier = null;
  globalloanTenor: any;
  selectedBankArray: any[] = [];
  metricsdata: any;
  setupMandate: boolean;
  remitaStatusMessage: string = null;
  cancelDDI: boolean;
  issueDDI: boolean;
  remitaMandate: boolean;
  remitaPayments: any;

  sendingMail: boolean;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  copy_hover = false;

  gettingUnverifiedApps = false;
  unverifiedAppsTableConfig: TableConfig = {
    uniqueIdPropLink: "code",
    striped: true,
  };
  unverifiedAppsTableHeaders: TableHeader[] = [
    { name: "Code", type: "code" },
    { name: "Applicant" },
    { name: "Loan Type" },
    { name: "Amount", type: "amount" },
    { name: "Repayment Method" },
    { name: "Date Approved" },
    { name: "Lag Period" },
    { name: "Status" },
    { name: "" },
  ];
  unverifiedAppsTableData: TableData[] = [];
  unverifiedApps: UnverifiedApp[];
  selectedSearchColumn: string;
  keyword: string;
  filter: string;
  unverifiedAppsPagination: Pagination = {
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
  confirmingDisbAcc = false;
  wacsDisbursementConfirmation: WacsDisbursementConfirmation;

  constructor(
    private configurationService: ConfigurationService,
    private loanoperationService: LoanoperationsService,
    public authService: AuthService,
    private userService: UserService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private fb: UntypedFormBuilder,
    private realtimeService: RealtimeService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private sharedService: SharedService,
    private wacsService: WacsService
  ) {}

  ngOnInit() {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }
    this.tokenRefreshError.tokenNeedsRefresh.subscribe((res) => {
      if (!res) {
        // this.httpFailureError = true;
      }
    });

    this.sideview = 0;
    this.viewloandetails = false;
    this.scheduleView = false;
    this.currentProcess = false;
    this.getUserPromise()
      .then((next) => {
        // this.getUserInfo();
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        this.realTimeListener();

        this.getConstants();
        this.getToday();
        this.addResponseFormInit();
        this.currentview = 1;
        this.switchviews(this.currentview);
      })
      .catch((err) => {
        // swal.fire('Error', 'User not Loaded');
        // if (this.httpFailureError) { swal.fire('Error', 'User not Loaded', 'error'); }
      });
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  realTimeListener() {
    this.realtimeService.NewApplication.subscribe((res) => {
      this.getPoolCount();
    });
  }

  getPoolCount() {
    this.loanoperationService
      .spoolPoolMetrics(this.currentuserbranchid, this.currentuserid)
      .subscribe(
        (response) => {
          this.metricsdata = response.body;
        },
        (error) => {
          // swal.fire('Error', error.error, 'error');
        }
      );
  }

  closeModal() {
    this.modalService.dismissAll();
  }
  openModal(content) {
    this.modalService.open(content, {
      size: "lg",
      ariaLabelledBy: "modal-basic-title",
      windowClass: "custom-modal-style opq2",
    });
  }

  generateRemitaMandate(loan) {
    this.setupMandate = true;
    const userId = parseFloat(sessionStorage.getItem("userId"));
    const data = {
      userId,
      loanId: loan.loanId,
    };

    this.loanoperationService.generateRemitaMandate(data).subscribe(
      () => {
        this.setupMandate = false;
        this.toast.fire({
          type: "success",
          title: "Remita mandate was generated successfully.",
        });
        this.toggleAside();

        this.getLoanDetailsById(loan.loanId);
      },
      () => {
        this.setupMandate = false;
      }
    );
  }

  checkRemitaMandateStatus(loanId: number) {
    this.setupMandate = true;
    const userId = parseFloat(this.loggedInUser.nameid);
    const data = {
      userId,
      loanId,
    };

    this.loanoperationService.getRemitaMandateStatus(data).subscribe(
      (res) => {
        this.setupMandate = false;
        this.remitaStatusMessage = res.body.message;
        setTimeout(() => {
          this.remitaStatusMessage = null;
        }, 5000);
      },
      (err) => {
        this.setupMandate = false;
      }
    );
  }

  addResponseFormInit() {
    this.schedulelines = [
      { ChequeNumber: null, Bank: null, CashDate: null, Amount: null },
    ];

    this.AddResponseForm = this.fb.group({
      LoanId: new UntypedFormControl(""),
      UserId: new UntypedFormControl(""),
      RepaymentMethod: new UntypedFormControl(""),
      InternalNote: new UntypedFormControl(""),
      //  TransactionPin: new FormControl('',[Validators.required]),
      files: [null],
      Content: new UntypedFormControl(""),
    });
  }

  submitResponseForm(val: any) {
    if (this.AddResponseForm.valid) {
      // tslint:disable-next-line:max-line-length
      swal
        .fire({
          type: "info",
          text:
            "Are you sure you want to verify repayment method " +
            this.selectedrepaymentmethod +
            " for " +
            this.selectedcustomer +
            "?",
          title: "Verify",
          confirmButtonText: "Proceed",
          confirmButtonColor: "#558E90",
          showCancelButton: true,
          cancelButtonColor: "#B85353",
          cancelButtonText: "Abort",
        })
        .then((result) => {
          if (result.value) {
            this.loader = true;
            if (this.selectedrepaymentmethod === "Cheque") {
              // tslint:disable-next-line:variable-name
              const cheque_lines = [];
              let chequeNoError = [false, 0];
              let cashDateError = [false, 0];
              let bankError = [false, 0];
              const tempCheckNumberlines = [];
              let duplicateCheckNumberError;

              this.schedulelines.forEach((line, index) => {
                if (line.ChequeNumber === null) {
                  chequeNoError = [true, index + 1];
                  // chequeNoError = [true, index + 1];
                  return false;
                }

                if (line.CashDate === null) {
                  cashDateError = [true, index + 1];
                  return false;
                }

                if (line.Bank === null) {
                  bankError = [true, index + 1];
                  return false;
                }

                if (line.ChequeNumber === null) {
                  return false;
                } else {
                  tempCheckNumberlines.push(line.ChequeNumber);
                  if (this.find_duplicate_in_array(tempCheckNumberlines)) {
                    duplicateCheckNumberError = [true];
                    return false;
                  } else {
                    cheque_lines.push(line);
                  }
                }
              });

              if (
                chequeNoError[0] ||
                cashDateError[0] ||
                bankError[0] ||
                duplicateCheckNumberError
              ) {
                if (chequeNoError[0]) {
                  swal.fire({
                    type: "error",
                    title: "Error",
                    text: "Cheque Number is empty for line " + chequeNoError[1],
                  });
                }

                if (cashDateError[0]) {
                  swal.fire({
                    type: "error",
                    title: "Error",
                    text: "Date is empty for line " + cashDateError[1],
                  });
                }

                if (bankError[0]) {
                  swal.fire({
                    type: "error",
                    title: "Error",
                    text: "No Bank Selected for line " + bankError[1],
                  });
                }

                if (duplicateCheckNumberError) {
                  swal.fire({
                    type: "error",
                    title: "Error",
                    text: "Duplicate entry encountered for Cheque Number ",
                  });
                }

                this.loader = false;
              } else {
                this.AddResponseForm.controls["LoanId"].patchValue(
                  this.selectedloanid
                );
                this.AddResponseForm.controls["UserId"].patchValue(
                  this.currentuserid
                );
                this.AddResponseForm.controls["RepaymentMethod"].patchValue(
                  this.selectedrepaymentmethod
                );

                // tslint:disable-next-line:max-line-length
                this.loanoperationService
                  .createVerifyResponse(
                    this.AddResponseForm.value,
                    cheque_lines
                  )
                  .subscribe(
                    (res) => {
                      swal.fire({
                        type: "success",
                        text: "Loan Repayment Method Verified",
                        title: "Successful",
                      });
                      this.modalService.dismissAll();
                      this.AddResponseForm.reset();
                      this.schedulelines = [];

                      this.closeAside();
                      this.switchviews(1);
                      this.loader = false;
                    },
                    (err) => {
                      this.loader = false;
                      //  swal.fire('Error', err.error, 'error');
                    }
                  );
              }
            } else if (
              this.selectedrepaymentmethod === "Automatic Direct Debit - Remita" || this.selectedrepaymentmethod === "Wacs"
            ) {
              this.AddResponseForm.controls["LoanId"].patchValue(
                this.selectedloanid
              );
              this.AddResponseForm.controls["UserId"].patchValue(
                this.currentuserid
              );
              this.AddResponseForm.controls["RepaymentMethod"].patchValue(
                this.selectedrepaymentmethod
              );
              // this.AddResponseForm.controls['Content']'].patchValue()
              if (this.selectedrepaymentmethod === "Wacs" && !this.wacsDisbursementConfirmation) {
                this.loader = false;
                return
              }else{
                this.AddResponseForm.get("Content").setValue(JSON.stringify(this.wacsDisbursementConfirmation))
              }
              this.loanoperationService
                .createVerifyResponse(this.AddResponseForm.value, "")
                .subscribe(
                  (res) => {
                    swal.fire({
                      type: "success",
                      text: "Loan Repayment Method Verified",
                      title: "Successful",
                    });
                    this.modalService.dismissAll();
                    this.AddResponseForm.reset();
                    this.closeAside();
                    this.switchviews(1);
                    this.loader = false;
                  },
                  (err) => {
                    this.loader = false;
                    // swal.fire('Error', err.error, 'error');
                  }
                );
            }
          }
        });
    }
  }

  canVerifyWithRemita() {
    return (
      this.getFromJson(this.loaninformation.repaymentInfo, "repaymentMethod") ==
        "Automatic Direct Debit - Remita" &&
      this.getFromJson(this.ownerInformation.appOwnerRemitaInfo, "IsActive")
    );
  }

  viewDocument(row, val: any, content) {}

  find_duplicate_in_array(arrayinput) {
    const counts = [];
    for (let i = 0; i <= arrayinput.length; i++) {
      if (counts[arrayinput[i]] === undefined) {
        counts[arrayinput[i]] = 1;
      } else {
        return true;
      }
    }
    return false;
  }

  submitQueryRequest(row, val: any, content) {
    this.feedbackdata = [];

    const source =
      val === 1 ? "remita to create a mandate" : "remita to verify mandate";
    // tslint:disable-next-line:max-line-length
    swal
      .fire({
        type: "info",
        text: "This will initiate a data call from " + source,
        title: "Query Request",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Abort",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
      })
      .then((result) => {
        if (result.value) {
          if (val === 1) {
            // tslint:disable-next-line:max-line-length
            this.modalService.open(content, {
              centered: true,
              ariaLabelledBy: "modal-basic-title",
              windowClass: "custom-modal-style opq2",
            });
            this.requestLoader = true;

            const ReformatStartDate = new Date(
              Date.parse(row.dateApproverApproved)
            );

            const datamodel = {
              RequestID: row.identifier,
              // tslint:disable-next-line:max-line-length
              PayerName:
                this.getFromJson(row.bvnInfo, "bvnFirstName") +
                " " +
                this.getFromJson(row.bvnInfo, "bvnLastName"),
              PayerEmail: row.person.emailAddress,
              PayerPhone: this.getFromJson(row.bvnInfo, "bvnPhoneNumber"),
              PayerAccount: this.getFromJson(row.bankInfo, "bankAccountNumber"),
              PayerBankCode: this.getFromJson(row.bankInfo, "bankSortCode"),
              Amount: row.loanAmount,
              // StartDate: this.formatDate(this.addMonths(ReformatStartDate,1)) + "T06:56:55.660Z",
              //  EndDate: this.formatDate(this.addMonths(ReformatStartDate,row.loanTenor+1)) + "T06:56:55.660Z",
              // tslint:disable-next-line:max-line-length
              StartDate: this.formatDate2(this.addMonths(this.currentdate, 1)), // this.formatDate2(this.addMonths(ReformatStartDate,1)),
              EndDate: this.formatDate2(
                this.addMonths(ReformatStartDate, row.loanTenor + 1)
              ),

              Frequency: 3,
              LoanId: this.selectedloanid,
              UserId: this.currentuserid,
              Source: "Remita",
              UsedRate: this.getFromJson(row.loanTypeInfo, "loanInterestRate"),
            };

            this.loanoperationService.createMandate(datamodel).subscribe(
              (res) => {
                if (res != null && res !== "") {
                  this.feedbackdata = res.body.mandateId + " " + res.status;
                  this.switchviews(1);

                  this.requestLoader = false;
                } else {
                  this.feedbackdata = "No response from " + source;
                  this.requestLoader = false;
                }
              },
              (err) => {
                this.requestLoader = false;

                //  swal.fire({   type: 'error',   title: 'Error',   text: err.error });
              }
            );
          } else if (val === 2) {
            const datamodel = {
              // tslint:disable-next-line:max-line-length
              requestId: this.getFromJson(
                this.getFromJson(row.externalIntegrationIdentifier, "Content"),
                "mandateId"
              ),
              // tslint:disable-next-line:max-line-length
              mandateId: this.getFromJson(
                this.getFromJson(row.externalIntegrationIdentifier, "Content"),
                "requestId"
              ),
              LoanId: this.selectedloanid,
              UserId: this.currentuserid,
              RepaymentMethod: this.selectedrepaymentmethod,
            };

            if (this.externalidentifier === "") {
              // tslint:disable-next-line:max-line-length
              swal.fire({
                type: "info",
                title: "Error",
                text: "No mandateId Found for this loan",
              });
            } else {
              // tslint:disable-next-line:max-line-length
              this.modalService.open(content, {
                centered: true,
                ariaLabelledBy: "modal-basic-title",
                windowClass: "custom-modal-style opq2",
              });
              this.requestLoader = true;

              this.loanoperationService.verifyMandate(datamodel).subscribe(
                (res) => {
                  if (res == null || res === "") {
                    this.feedbackdata = "No response from " + source;
                    this.modalService.dismissAll();
                    this.requestLoader = false;
                  } else {
                    this.feedbackdata = res.body;
                    this.requestLoader = false;
                  }
                },
                (err) => {
                  this.requestLoader = false;
                  this.closeModal();
                  // swal.fire('Error', err.error, 'error');
                }
              );
            }
          }
        }
      });
  }

  switchviews(view) {
    if (view === 1) {
      this.currentview = 1;
      this.getApplications();
      this.requestLoader = true;
    } else if (view === 2) {
    }
  }

  setCheque($e, i) {
    this.schedulelines[i].ChequeNumber = $e;
  }

  getApplications() {
    this.gettingUnverifiedApps = true;
    const data = {
      pageNumber: this.unverifiedAppsPagination.pageNumber,
      pageSize: this.unverifiedAppsPagination.pageSize,
      userId: this.currentuserid,
    };

    if (this.keyword) {
      data["keyword"] = this.keyword;
    }
    if (this.selectedSearchColumn) {
      data["selectedSearchColumn"] = this.selectedSearchColumn;
    }
    if (this.filter) {
      data["filter"] = this.filter;
    }

    this.loanoperationService
      .spoolUnverifiedApprovedLoanApplications(data)
      .subscribe({
        next: (res) => {
          this.unverifiedApps = res.body.items;
          this.setUnverifiedAppsPagination(res.body);
          this.setUnverifiedAppsTableData(res.body.items);

          this.chRef.detectChanges();

          // check if current process is running
          if (this.currentProcess) {
            this.unverifiedApps.forEach((element) => {
              if (element.loanId === this.selectedloanid) {
                this.loaninformation = element;
              }
            });
          }
          this.gettingUnverifiedApps = false;
        },
        error: () => {
          this.gettingUnverifiedApps = false;
        },
      });
  }

  setUnverifiedAppsPagination(res: GetUnverifiedAppsResBody) {
    this.unverifiedAppsPagination = res;
    this.unverifiedAppsPagination.count = res.items.length;

    this.unverifiedAppsPagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.unverifiedAppsPagination.jumpArray.push(i);
    }
  }

  setUnverifiedAppsTableData(apps: UnverifiedApp[]) {
    this.unverifiedAppsTableData = apps.map((app) => ({
      code: { tdValue: app.applicationCode, type: "code", id: app.loanId },
      applicant: { tdValue: app.customerName },
      loanType: { tdValue: app.loanTypeName },
      amount: { tdValue: app.loanAmount, type: "amount" },
      repaymentMethod: {
        tdValue: this.getFromJson(app.repaymentInfo, "repaymentMethod"),
      },
      date: { tdValue: app.dateApproverApproved, type: "date" },
      lag: { tdValue: app.lagPeriod },
      status: {
        tdValue: app.status,
        type: "status",
        statusConfig: { class: this.getStatusClass(app.status) },
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(app.loanId),
      },
    }));
  }

  getActionConfig(id: number) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.getLoanDetailsById(id),
      },
    ];
  }

  getStatusClass(status: string): string {
    if (status === "Approved") {
      return "badge-success";
    }
  }

  onSearchParams(data: SearchParams) {
    this.keyword = data.keyword;
    this.selectedSearchColumn = data.selectedSearchColumn;
    this.getApplications();
  }

  onPaginationChange(data: { pageSize: number; pageNumber: number }) {
    this.unverifiedAppsPagination.pageNumber = data.pageNumber;
    this.unverifiedAppsPagination.pageSize = data.pageSize;
    this.getApplications();
  }

  generateSchedules(loaninformation) {
    if (this.schedulelines.length < 2) {
      this.requestLoader = true;
      const numberofEntries = loaninformation.loanTenor;
      this.globalloanTenor = loaninformation.loanTenor;
      const date = new Date(loaninformation.dateApproverApproved);
      let nextDate = this.addMonths(date, 0); // removed the 1 so i manually recalculate

      this.minimumDate = this.formatDate(this.addMonths(this.currentdate, 1));

      this.loanoperationService
        .getRepaymentInformation(loaninformation.identifier)
        .subscribe(
          (res) => {
            this.loanamount = res.body.repaymentCalculate;
            let i;
            for (i = 0; i <= numberofEntries; ) {
              if (i === 0) {
                this.schedulelines.splice(0, 1);
              } else {
                this.schedulelines.push({
                  ChequeNumber: null,
                  Bank: "",
                  CashDate: this.formatDate(nextDate),
                  Amount: this.loanamount,
                });
              }
              i++;
              nextDate = this.addMonths(nextDate, 1);
            }

            this.scheduleView = true;
            this.requestLoader = false;
          },
          (err) => {
            this.requestLoader = false;
          }
        );
    }
  }

  addMonths(startdate: Date, months: number) {
    const date = new Date();
    date.setTime(startdate.getTime()); // Cloning Date
    const d = date.getDate();
    date.setMonth(date.getMonth() + months);
    if (date.getDate() !== d) {
      date.setDate(0);
    }
    return date;
  }

  removeCreditRow(i) {
    this.schedulelines.splice(i, 1);
    // tslint:disable-next-line:no-unused-expression
    this.globalloanTenor - 1;
  }

  addScheduleRow() {
    this.schedulelines.push({
      ChequeNumber: null,
      Bank: "",
      CashDate: null,
      Amount: this.loanamount,
    });
    // tslint:disable-next-line:no-unused-expression
    this.globalloanTenor + 1;
  }

  selected(type: string, event: any, index: number) {
    if (type === "bank") {
      const data = event.target.value;
      this.schedulelines[index].Bank = data;
      this.schedulelines.forEach((item) => {
        if (item.Bank === "") {
          item.Bank = data;
        }
      });

      //  if (index === 0) {
      //    let i;
      //    for (i = 0; i < this.globalloanTenor; ) {
      //   //  this.selectedBankArray = [{id: data.id, text: data.text}];
      //    this.schedulelines[i].Bank = data;

      //    i++;
      //   }

      // }
    }
  }

  setGlobalBank(tenor) {
    // var i;
  }

  closeAside() {
    (window as any).viewLoan();
  }

  ResetPage() {
    this.switchviews(1);
    this.closeAside();
    this.closeModal();
    // if(this.requestLoader != true){
    //    this.LoanDetails(this.loaninformation);
    //  this.closeAside();
    // }
    this.currentProcess = true;
  }

  LoanDetails(loaninformation) {
    this.loaninformation = loaninformation;
    if (loaninformation?.repaymentInfo) {
      this.loaninformation = {
        ...loaninformation,
        _repaymentInfo: JSON.parse(loaninformation?.repaymentInfo),
      };
    }
    this.viewloandetails = true;
    this.selectedloanid = loaninformation.loanId;
    this.selectedcustomer = loaninformation.person.displayName;
    this.selectedrepaymentmethod = this.getFromJson(
      loaninformation.repaymentInfo,
      "repaymentMethod"
    );
    // tslint:disable-next-line:max-line-length
    this.externalidentifier =
      this.getFromJson(
        this.getFromJson(
          loaninformation.externalIntegrationIdentifier,
          "Content"
        ),
        "mandateId"
      ) === ""
        ? ""
        : this.getFromJson(
            this.getFromJson(
              loaninformation.externalIntegrationIdentifier,
              "Content"
            ),
            "mandateId"
          );

    this.currentProcess = false;
    this.AddResponseForm.reset();

    //  this.schedulelines = [{ChequeNumber:null,Bank:null,CashDate:null,Amount:null}];
    this.schedulelines = [];
  }

  handleFileInput(filelist: FileList) {
    const output = [];
    for (let i = 0; i < filelist.length; i++) {
      output.push(filelist.item(i));
    }
    this.AddResponseForm.controls["files"].patchValue(output);
  }

  clearFileHandler() {
    this.AddResponseForm.controls["files"].patchValue(null);
  }

  getToday() {
    // tslint:disable-next-line:new-parens
    const dateString = new Date();
    this.currentdate = dateString;
  }

  getDateDiff(date1, date2) {
    const dateOut1 = new Date(date1);
    const dateOut2 = new Date(date2);

    const timeDiff = Math.abs(dateOut2.getTime() - dateOut1.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (timeDiff / (1000 * 3600 * 24) < 1) {
      return "Today";
    } else {
      if (diffDays === 1) {
        return diffDays + " day";
      } else {
        return diffDays.toLocaleString() + " days";
      }
    }
  }

  getLoanDetailsById(id) {
    if (!this.copy_hover) {
      this.requestLoader = true;
      this.loanoperationService.getLoanapplicationbyid(id).subscribe(
        (res) => {
          this.requestLoader = false;
          this.LoanDetails(res.body);
          this.toggleAside();
        },
        () => {
          this.requestLoader = false;
        }
      );
    }
  }

  toggleAside() {
    (window as any).viewLoan();
  }

  setDate($e, i) {
    this.schedulelines[i].CashDate = this.formatDate($e);
  }

  showActions() {
    $(".help-button-wrapper").toggleClass("expanded");
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

  formatDate2(data) {
    const date = new Date(data.toString());
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const yyyy = date.getFullYear();

    const MM = m >= 10 ? m + "" : "0" + m;
    const dd = d >= 10 ? d + "" : "0" + d;
    return dd + "/" + MM + "/" + yyyy;
  }

  getFromJson(stringArray, expectedResult) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }

  getObjectFromJson(stringArray) {
    let result = "";
    if (stringArray != null && stringArray !== "") {
      result = JSON.parse(stringArray);
    }
    return result;
  }

  getConstants() {
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
      },
      (error) => {
        //  swal.fire({   type: 'error',   title: 'Error',   text: error, });
      }
    );

    this.configurationService.spoolBanks().subscribe(
      (response) => {
        this.banksArray = [];
        response.body.forEach((element) => {
          this.banksArray.push({
            id: element.bankName,
            text: element.bankName,
          });
        });
      },
      (error) => {
        // swal.fire({   type: 'error',   title: 'Error',   text: error, });
        // swal.fire('Error', error.error, 'error');
      }
    );
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentuser = user.body;
          this.currentuserid = this.currentuser.userId;
          this.currentuserbranchid = this.currentuser.branchId;
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  printThisDocument(content, reporttype) {
    const host = window.location.host;

    // tslint:disable-next-line:one-variable-per-declaration
    let printContents = null,
      popupWin = null,
      title = null,
      data = null;
    switch (content) {
      case content:
        printContents = document.getElementById(content).innerHTML;
        title = "Remita Mandate";
        break;
      default:
        swal.fire({
          type: "error",
          title: "Error",
          text: "Print Content seems to be empty",
        });
        break;
    }
    popupWin = window.open("", "_blank", "top=0,left=0,height=100%,width=auto");
    popupWin.document.open();
    popupWin.document.write(`
            <html>
              <head>
                <title>${title}</title>
                <link rel="stylesheet" href="http://${host}/assets/css/bootstrap.min.css" type="text/css"/>
                <style>
                //........Customized style.......
                @page { margin: 0 }
                body { margin: 0 }
                .sheet {
                  margin: 0;
                  overflow: hidden;
                  position: relative;
                  box-sizing: border-box;
                  page-break-after: always;
                }

                /** Paper sizes **/
                body.A3               .sheet { width: 297mm; height: 419mm }
                body.A3.landscape     .sheet { width: 420mm; height: 296mm }
                body.A4               .sheet { width: 210mm; height: 296mm }
                body.A4.landscape     .sheet { width: 297mm; height: 209mm }
                body.A5               .sheet { width: 148mm; height: 209mm }
                body.A5.landscape     .sheet { width: 210mm; height: 147mm }
                body.letter           .sheet { width: 216mm; height: 279mm }
                body.letter.landscape .sheet { width: 280mm; height: 215mm }
                body.legal            .sheet { width: 216mm; height: 356mm }
                body.legal.landscape  .sheet { width: 357mm; height: 215mm }

                /** Padding area **/
                .sheet.padding-10mm { padding: 10mm }
                .sheet.padding-15mm { padding: 15mm }
                .sheet.padding-20mm { padding: 20mm }
                .sheet.padding-25mm { padding: 25mm }

                /** For screen preview **/
                @media screen {
                  body { background: #e0e0e0 }
                  .sheet {
                    background: white;
                    box-shadow: 0 .5mm 2mm rgba(0,0,0,.3);
                    margin: 5mm auto;
                  }
                }

                /** Fix for Chrome issue #273306 **/
                @media print {
                          body.A3.landscape { width: 420mm }
                  body.A3, body.A4.landscape { width: 297mm }
                  body.A4, body.A5.landscape { width: 210mm }
                  body.A5                    { width: 148mm }
                  body.letter, body.legal    { width: 216mm }
                  body.letter.landscape      { width: 280mm }
                  body.legal.landscape       { width: 357mm }
                }
                nav, aside, footer, button {
                  display: none !important;
                  }

                  // table,  th {
                  //   // border: 1px solid #eee;
                  //  //  width: 100%;
                  //   // text-align: center;
                  //    padding: 5px;
                  //   font-size: ;

                  // }

                  .clay {
                    width: 50%;
                  }

                  .dt-card__title {
                    margin: 0;
                    margin-top: 4px;
                    font-size: 8px;
                    color: #262626
                }



                  .modal-header {
                    padding: 10px;
                  }

                  .table {
                    width: 100%;
                    margin-bottom: 0.4rem;
                    font-size:8px

                }


                .table th {
                      padding: 0.2rem;
                    vertical-align: top;
                    border-bottom:1pt solid black;
                    border-top:1pt solid black;

                    border-collapse: collapse;
                    border-spacing: 0;

                }

                .table td {
                  padding: 0.5rem;
                  vertical-align: top;
                  border-bottom-width: 1px solid #e8e8e8
              }



                  .text-center {
                    text-align: center;
                  }

                  .text-left {
                    text-align: left;
                  }

                  .text-right {
                    text-align: right;
                  }
                </style>
              </head>
          <body onload="window.print();window.close();">${printContents}</body>
            </html>`);
    popupWin.document.close();
  }

  mailDocument(type, content) {
    this.requestLoader = true;
    const host = window.location.host;

    // tslint:disable-next-line:prefer-const
    // tslint:disable-next-line:one-variable-per-declaration
    let printContents = null,
      popupWin = null,
      title = null,
      data = null;
    switch (content) {
      case content:
        printContents = document.getElementById(content).innerHTML;
        title = "Remita Mandate";
        break;
      default:
        swal.fire({
          type: "error",
          title: "Error",
          text: "Print Content seems to be empty",
        });
        break;
    }

    const mail = `
            <html>
              <head>
                <title>${title}</title>
                <link rel="stylesheet" href="http://${host}/assets/css/bootstrap.min.css" type="text/css"/>
                <style>
                //........Customized style.......
                @page { margin: 0 }
                body { margin: 0 }
                .sheet {
                  margin: 0;
                  overflow: hidden;
                  position: relative;
                  box-sizing: border-box;
                  page-break-after: always;
                }

                /** Paper sizes **/
                body.A3               .sheet { width: 297mm; height: 419mm }
                body.A3.landscape     .sheet { width: 420mm; height: 296mm }
                body.A4               .sheet { width: 210mm; height: 296mm }
                body.A4.landscape     .sheet { width: 297mm; height: 209mm }
                body.A5               .sheet { width: 148mm; height: 209mm }
                body.A5.landscape     .sheet { width: 210mm; height: 147mm }
                body.letter           .sheet { width: 216mm; height: 279mm }
                body.letter.landscape .sheet { width: 280mm; height: 215mm }
                body.legal            .sheet { width: 216mm; height: 356mm }
                body.legal.landscape  .sheet { width: 357mm; height: 215mm }

                /** Padding area **/
                .sheet.padding-10mm { padding: 10mm }
                .sheet.padding-15mm { padding: 15mm }
                .sheet.padding-20mm { padding: 20mm }
                .sheet.padding-25mm { padding: 25mm }

                /** For screen preview **/
                @media screen {
                  body { background: #e0e0e0 }
                  .sheet {
                    background: white;
                    box-shadow: 0 .5mm 2mm rgba(0,0,0,.3);
                    margin: 5mm auto;
                  }
                }

                /** Fix for Chrome issue #273306 **/
                @media print {
                          body.A3.landscape { width: 420mm }
                  body.A3, body.A4.landscape { width: 297mm }
                  body.A4, body.A5.landscape { width: 210mm }
                  body.A5                    { width: 148mm }
                  body.letter, body.legal    { width: 216mm }
                  body.letter.landscape      { width: 280mm }
                  body.legal.landscape       { width: 357mm }
                }
                nav, aside, footer, button {
                  display: none !important;
                  }

                  .clay {
                    width: 50%;
                  }

                  .dt-card__title {
                    margin: 0;
                    margin-top: 4px;
                    font-size: 8px;
                    color: #262626
                }
                  .modal-header {
                    padding: 10px;
                  }

                  .table {
                    width: 100%;
                    margin-bottom: 0.4rem;
                    font-size:8px

                }
                .table th {
                      padding: 0.2rem;
                    vertical-align: top;
                    border-bottom:1pt solid black;
                    border-top:1pt solid black;

                    border-collapse: collapse;
                    border-spacing: 0;

                }

                .table td {
                  padding: 0.5rem;
                  vertical-align: top;
                  border-bottom-width: 1px solid #e8e8e8
              }



                  .text-center {
                    text-align: center;
                  }

                  .text-left {
                    text-align: left;
                  }

                  .text-right {
                    text-align: right;
                  }
                </style>
              </head>
          <body onload="window.print();window.close();">${printContents}</body>
            </html>`;

    const appOwner = this.ownerInformation;
    const user = this.currentuser;
    const mailData = {
      EmailSubject: this.ownerInformation.appOwnerName + ": Remita Mandate",
      AppOwnerId: appOwner.appOwnerId,
      FromUserId: user.userId,
      PersonId: this.loaninformation.personId,
      Message: mail,
      ToUserId: 0,
    };
    this.loanoperationService.sendMail(mailData).subscribe(
      (next) => {
        swal.fire({ title: "Successful", type: "success", text: "Mailed" });
        this.requestLoader = false;
      },
      (error) => {
        // swal.fire({   type: 'error',   title: 'Error',   text: error, });
        //swal.fire('Error', error.error, 'error');
        this.requestLoader = false;
      }
    );
  }

  resendCardAuthEmail(loanId: any): void {
    this.sendingMail = true;

    this.loanoperationService
      .sendCardAuthEmail(loanId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        () => {
          this.toast.fire({
            type: "success",
            title: "Card authorization mail sent",
          });
          this.sendingMail = false;
        },
        (err) => {
          this.sendingMail = false;
        }
      );
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Application code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  confirmWacsDisbursementAccount() {
    this.confirmingDisbAcc = true;
    this.wacsService.confirmWacsDisbursementAccount(this.loaninformation?.loanId).pipe(takeUntil(this.unsubscriber$)).subscribe({
      next:(res) => {
        this.wacsDisbursementConfirmation = res.body.data;
        this.toast.fire({
          type:"success",
          title:"Account Details Retrieved",
          text:"If the details below meet the requirements then click on the action button on the bottom right to verify the account"
        })
        this.confirmingDisbAcc = false
      },
      error:() => {
      this.confirmingDisbAcc = false;
      }
    })
  }
}
