import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  TemplateRef,
} from "@angular/core";
import {
  UntypedFormGroup,
  UntypedFormControl,
  UntypedFormBuilder,
  Validators,
  FormArray,
  FormGroup,
  FormControl,
} from "@angular/forms";
import swal from "sweetalert2";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Configuration } from "../../../model/configuration";
import { LoanoperationsService } from "../../../service/loanoperations.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { Observable, of } from "rxjs";
import { map, mergeMap, pluck, takeUntil, tap } from "rxjs/operators";
import { TypeaheadMatch } from "ngx-bootstrap";
import { AngularCsv } from "angular7-csv/dist/Angular-csv";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { Papa } from "ngx-papaparse";
import "datatables.net";
import "datatables.net-bs4";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import * as moment from "moment";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { CustomDropDown, PillFilter } from "src/app/model/CustomDropdown";
import { LoanPayment, SearchedLoanData } from "../loan.types";
import { SharedService } from "src/app/service/shared.service";
import * as saveAs from "file-saver";
import { nonZero } from "src/app/util/validators/validators";
import { SearchParams } from "../../shared/shared.types";
import { processCSVData } from "../../shared/helpers/generic.helpers";

@Component({
  selector: "app-payments-page",
  templateUrl: "./payments-page.component.html",
  styleUrls: ["./payments-page.component.scss"],
})
export class PaymentsPageComponent implements OnInit, OnDestroy {
  public AddPaymentForm: UntypedFormGroup;
  public ViewPaymentForm: UntypedFormGroup;
  public AddBulkUploadForm: UntypedFormGroup;
  searchForm: UntypedFormGroup;
  EmployerSearch: UntypedFormGroup;
  payments: Configuration[];
  repaymentsdue: Configuration[];
  public loggedInUser: any;
  pagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  pagination2 = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  getParams = {
    view: null,
  };

  dataTables = {
    budgetTable: null,
    csvDisplayTable: {
      table: null,
      headers: null,
      data: null,
    },
  };

  currentview: any;
  requestLoader: boolean;
  searchrequestLoader: boolean;
  gettingLoans = false;
  loader = false;
  isReadOnly = false;

  selectedPaymentType: any;
  selectedPaymentTypeArray: any;
  selectedBranchID: any;
  selectedBranchName: any;

  currentuser: any;
  currentuserid: any;
  ownerInformation: any;
  currentdate: any;
  currentuserbranchid: any;

  dataSource: Observable<any>;
  dataSource2: Observable<any>;
  typeaheadLoading: boolean;
  typeaheadNoResults: boolean;
  statesComplex: any[] = [];
  employersComplex: any[] = [];
  searchedLoanResult: (SearchedLoanData & {
    combinedLoanInfo: string;
  })[];
  employersearchResult: any[] = [];

  branchArray: any[] = [];
  paymentlines: any;
  bulkpaymentlines: any;

  selectedLoan: any;
  asyncSelected: any;
  asyncSelected2: any;
  selectedEntryType: any;
  paymentActivities: any;
  viewDetails = false;

  paymentInfo: any;
  reportInputDateType: any;

  loantypesArray: any[] = [];
  employersArray: any[] = [];
  branchesAccessibleArray: any[] = [];

  StartDate: any;
  EndDate: any;
  DefaultStartDate: any;
  DefaultEndDate: any;
  CurrentDate: any;

  files: any;

  SpoolType: any;

  forms = {
    creating: false,
    configuring: false,
    configureValidated: false,
  };

  errors = {
    csvInvalidDate: false,
    csvInvalidDateString: null,
    csvInvalidNumber: false,
    csvInvalidNumberString: null,
    csvInvalidPaymentMethod: false,
    csvInvalidPaymentMethodString: null,
    csvInvalidPaymentType: false,
    csvInvalidPaymentTypeString: null,
    noFile: false,
  };
  isSubscribedToFinModule = false;

  public paymentMethodArray: Array<string> = ["Cash", "Cheque"];
  public transactionTypeArray: Array<string> = [
    "Repayment",
    "Refund",
    "Reversal",
    "Settlement",
  ];
  public filterTypeArray: Array<string> = [
    "Filter result as at a date",
    "Filter result by date range",
  ];

  selectedFilter: any;
  selectedLoanTypes = new Array();
  selectedEmployers = new Array();
  selectedBranches = new Array();

  selectedEmployerId: any;
  selectedEmployer: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  accounts: CustomDropDown[] = [];
  appOwner: any;
  filteredBranches: PillFilter[] = [];
  filteredLoanTypes: PillFilter[] = [];
  copy_hover = false;
  toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  selectedSearchCol: string;
  searchByCol: string[] = [];
  selectedTransactionType: string;
  currentTab: string;
  paymentTemplateRef: TemplateRef<any>;

  constructor(
    private loanOperationService: LoanoperationsService,
    public authService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private userService: UserService,
    private configurationService: ConfigurationService,
    private route: ActivatedRoute,
    private papa: Papa,
    private fb: UntypedFormBuilder,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private sharedService: SharedService
  ) {
    this.dataSource = Observable.create((observer: any) => {
      // Runs on every search
      this.searchrequestLoader = true;
      observer.next(this.AddPaymentForm.controls["SearchParam"].value);
      this.statesComplex = [];
      const searchLoanParams = {
        filter: "Active",
        keyword: this.AddPaymentForm.controls["SearchParam"].value,
        selectedSearchColumn: this.selectedSearchCol,
      };
      this.loanOperationService
        .spoolLoansbySearch(searchLoanParams)
        .pipe(
          pluck("body", "items"),
          map((loans) =>
            loans.map((loan) => ({
              ...loan,
              combinedLoanInfo: `${loan?.loanCode} : ${loan?.customer} - ${loan?.totalRepaymentOutstanding}`,
            }))
          ),
          takeUntil(this.unsubscriber$)
        )
        .subscribe((res) => {
          this.statesComplex = res;
          this.searchrequestLoader = false;
        });
    }).pipe(mergeMap((token: string) => this.getStatesAsObservable(token)));

    this.dataSource2 = Observable.create((observer: any) => {
      // Runs on every search
      observer.next(this.searchForm.controls["EmployerSearch"].value);
      this.employersComplex = [];
      this.loanOperationService
        .spoolEmployersbyName(this.searchForm.controls["EmployerSearch"].value)
        .subscribe((res) => {
          this.employersComplex = res.body;
        });
    }).pipe(
      mergeMap((token: string) => this.getStatesAsObservableForEmployers(token))
    );
  }

  ngOnInit() {
    this.getSearchColsForLoans();
    this.removePill();
    this._getAppOwnerDetails();
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

    this.getUserPromise()
      .then(() => {
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        this.currentview = 2;
        this.repaymentsdue = [];

        this.AddPaymentFormInit();
        this.AddBulkUploadFormInit();
        this.selectedLoan = "";
        this.viewDetails = false;

        this.route.paramMap.subscribe((params: ParamMap) => {
          this.getParams.view = params.get("view");
        });

        if (this.getParams.view === "paymentsrecorded") {
          this.currentview = 1;
        } else if (this.getParams.view === "repaymentsdue") {
          this.currentview = 2;
        }

        this.searchFormInit();

        const date = new Date();
        this.DefaultStartDate = this.formatDate(
          new Date(date.getFullYear(), date.getMonth(), 1)
        );
        this.DefaultEndDate = this.formatDate(
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );
        this.CurrentDate = this.formatDate(date);

        this.switchviews(this.currentview);
      })
      .catch((err) => {});

    // For deep linking
    this.getSinglePayment();
  }

  private getSearchColsForLoans() {
    this.loanOperationService
      .spoolLoansbySearch({
        selectedSearchColumn: "Loan Code",
        filter: "All",
        keyword: "test",
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.searchByCol = res.body.searchColumns;
      });
  }

  onTabChange(tab: string) {
    this.currentTab = tab;
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters) => {
        if (selectedFilters.action === "remove") {
          this.filteredBranches = [];
          this.selectedBranches = [];
          this.filteredLoanTypes = [];
          this.selectedLoanTypes = [];
          selectedFilters.filters.forEach((selectedFilter) => {
            selectedFilter.forEach((filter) => {
              if (filter.type === "branch") {
                this.filteredBranches.push(filter);
                this.selectedBranches.push(filter.id);
              }
              if (filter.type === "loan") {
                this.filteredLoanTypes.push(filter);
                this.selectedLoanTypes.push(filter.id);
              }
            });
          });
          this.getRepaymentsDue();
        }
      });
  }
  private _getAppOwnerDetails() {
    this.configurationService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.appOwner = res.body;
        const paymentAccounts: any[] = res.body.financePaymentAccounts;
        this.accounts = paymentAccounts.map((account) => ({
          id: account.accountId,
          text: account.name,
        }));
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

  filtermodal() {
    $(".generate-menu").toggle();
  }

  popupmodal() {
    $(".popped-menu").toggle();
  }

  searchFormInit() {
    if (this.reportInputDateType === 1) {
      this.searchForm = new UntypedFormGroup({
        StartDate: new UntypedFormControl("", []),
        EndDate: new UntypedFormControl("", []),
        Branches: new UntypedFormControl(""),
        EmployerSearch: new UntypedFormControl(""),
      });
    } else {
      this.searchForm = new UntypedFormGroup({
        EndDate: new UntypedFormControl("", []),
        StartDate: new UntypedFormControl("", []),
        Branches: new UntypedFormControl(""),
        EmployerSearch: new UntypedFormControl(""),
      });
    }
  }

  getSinglePayment() {
    const id = this.route.snapshot.queryParams["loanPaymentId"];
    if (id) {
      this.loanOperationService
        .getPaymentById(id)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.onViewPaymentDetails(res.body);
          },
        });
    }
  }

  getConstants() {
    // this.requestLoader = true;
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
        // this.requestLoader = false;
      },
      (error) => {
        // this.requestLoader = false;
        // swal.fire('Error', error.error, 'error');
      }
    );

    const datamodel = { filter: "", UserId: this.currentuserid };

    this.configurationService.spoolBranches(datamodel).subscribe(
      (response) => {
        this.branchArray = [];
        response.body.forEach((element) => {
          this.branchArray.push({
            id: element.branchId,
            text: element.branchName,
          });
        });
        //    this.requestLoader = false;
      },
      (error) => {
        //   this.requestLoader = false;
        //  swal.fire({   type: 'error',   title: 'Error',   text: error, });
        // swal.fire('Error', error.error, 'error');
      }
    );

    this.configurationService.spoolAccessibleLoanTypes(datamodel).subscribe(
      (response) => {
        this.loantypesArray = [];
        response.body.forEach((element) => {
          this.loantypesArray.push({
            id: element.loanTypeId,
            text: element.loanName,
          });
        });
        //  this.requestLoader = false;
      },
      (error) => {
        //  this.requestLoader = false;
        // swal.fire('Error', error.error, 'error');
      }
    );

    this.configurationService.spoolAccessibleBranches(datamodel).subscribe(
      (response) => {
        this.branchesAccessibleArray = [];
        response.body.forEach((element) => {
          this.branchesAccessibleArray.push({
            id: element.branchId,
            text: element.branchName,
          });
        });
        //  this.requestLoader = false;
      },
      (error) => {
        //  this.requestLoader = false;
        // swal.fire('Error', error.error, 'error');
      }
    );
  }

  getSettlementAmount(endDate: string, loanId: number, index: number) {
    this.requestLoader = true;
    const data = {
      endDate,
      loanId,
      SpoolReason: "settlementamountcheck",
    };

    this.loanOperationService.getSettlementAmount(data).subscribe(
      (response) => {
        this.paymentLineControls()
          .at(index)
          .get("PaymentAmount")
          .setValue(response.body.settlementAmount);

        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = false;
        // swal.fire('Error', error.error, 'error');
      }
    );
  }

  switchviews(view) {
    if (view === 1) {
      this.currentview = 1;
      this.getPayments();
      this.getConstants();
    } else if (view === 2) {
      this.currentview = 2;
      this.getConstants();
    }
  }

  onViewPaymentDetails(paymentInfo: LoanPayment) {
    if (!this.copy_hover) {
      this.paymentActivities = [];

      this.paymentInfo = paymentInfo;
      this.viewDetails = true;
    }
  }
  AddBulkUploadFormInit() {
    this.AddBulkUploadForm = this.fb.group({
      UserId: new UntypedFormControl(""),
      BranchId: new UntypedFormControl(""),
      files: [null],
      PaymentLines: new UntypedFormControl(""),
      PaymentSource: new UntypedFormControl(""),
    });
  }

  AddPaymentFormInit() {
    // tslint:disable-next-line:max-line-length
    this.paymentlines = [
      {
        LoanId: null,
        PersonId: null,
        PaymentType: null,
        PaymentMode: null,
        LoanCode: null,
        CustomerName: null,
        PaymentDate: null,
        AmountDue: null,
        PaymentAmount: null,
        FinanceAccountId: null,
      },
    ];

    this.AddPaymentForm = this.fb.group({
      SearchParam: new UntypedFormControl("", [
        Validators.required,
        Validators.pattern(/^\S.*$/),
      ]),
      UserId: new UntypedFormControl(""),
      BranchId: new UntypedFormControl(""),
      PaymentLines: new UntypedFormControl(""),
      lines: new FormArray([]),
      PaymentSource: new UntypedFormControl(""),
      files: [null],
    });
  }

  private paymentLineControls(): FormArray {
    return this.AddPaymentForm.get("lines") as FormArray;
  }

  addPaymentLine() {
    const payment = new FormGroup({
      LoanId: new FormControl(this.selectedLoan.loanId, Validators.required),
      PersonId: new FormControl(
        this.selectedLoan.personId,
        Validators.required
      ),
      LoanCode: new FormControl(
        this.selectedLoan.loanCode,
        Validators.required
      ),
      CustomerName: new FormControl(
        this.selectedLoan.customer,
        Validators.required
      ),
      PaymentType: new FormControl(null, Validators.required),
      PaymentMode: new FormControl(null, Validators.required),
      FinanceAccountId: new FormControl(null),
      PaymentDate: new FormControl(null, Validators.required),
      PeriodicRepaymentAmount: new FormControl(
        this.selectedLoan.periodicRepaymentAmount,
        Validators.required
      ),
      AmountDue: new FormControl(
        this.selectedLoan.totalRepaymentOutstanding,
        Validators.required
      ),
      PaymentAmount: new FormControl(0, [
        Validators.required, 
      ]),
      paymentAmtReadOnly: new FormControl(false),
      narration: new FormControl("", Validators.maxLength(120)),
    });

    if (this.appOwner.financeInteractionData.paymentIsActive) {
      payment.get("FinanceAccountId").setValidators(Validators.required);
    }

    const paymentTypeControl = payment.get('PaymentType');
    const paymentAmountControl = payment.get('PaymentAmount');

    paymentTypeControl.valueChanges.pipe(takeUntil(this.unsubscriber$))
    .subscribe((paymentTypeArray) => {
      if (Array.isArray(paymentTypeArray) && paymentTypeArray.includes('Settlement')) {
        paymentAmountControl.clearValidators();
        paymentAmountControl.setValidators([Validators.required]); 
      } else {
        paymentAmountControl.setValidators([Validators.required, nonZero.bind(this)]);
      }
      paymentAmountControl.updateValueAndValidity(); 
    });
    
    this.paymentLineControls().push(payment);
  }

  onRemovePaymentLine(index: number) {
    this.paymentLineControls().removeAt(index);
  }

  trimWhitespace(control: string) {
    this.AddPaymentForm.get(control).setValue(
      this.AddPaymentForm.value[control].trim()
    );
  }

  openModal(content) {
    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "loantypes-class",
    });

    this.paymentlines.splice(0, 1);
    this.dataTables.csvDisplayTable.data = null;
    this.clearErrors();
  }

  openPaymentModal(
    content: TemplateRef<any>,
    size: "md" | "lg" = "md",
    windowClass = ""
  ) {
    this.paymentTemplateRef = content;

    this.modalService.open(content, {
      size,
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass,
    });
    this.paymentlines.splice(0, 1);
    this.dataTables.csvDisplayTable.data = null;
    this.clearErrors();
  }

  closeModal() {
    this.searchedLoanResult = null;
    this.paymentLineControls().clear();
    this.AddPaymentForm.reset();
    this.modalService.dismissAll();
  }

  getTotalSection(type, arrayinput, expectedResult) {
    let total = 0;

    if (type === "payments") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].PaymentAmount);
        }
      }
    }

    if (expectedResult === "formatted") {
      return total.toLocaleString(undefined, { minimumFractionDigits: 2 });
    } else {
      return total;
    }
  }

  getPayments(pageNum = this.pagination.pageNum) {
    this.payments = [];
    this.requestLoader = true;

    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    const paginationmodel = {
      BranchId: 1,
      pageNumber: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
      filter: this.pagination.searchTerm,
    };

    this.loanOperationService.spoolPayments(paginationmodel).subscribe(
      (response) => {
        this.payments = response.body.value.data;

        this.pagination.maxPage = response.body.value.pages;
        this.pagination.totalRecords = response.body.value.totalRecords;
        this.pagination.count = this.payments.length;
        this.pagination.jumpArray = Array(this.pagination.maxPage);
        for (let i = 0; i < this.pagination.jumpArray.length; i++) {
          this.pagination.jumpArray[i] = i + 1;
        }

        this.chRef.detectChanges();

        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = false;
      }
    );
  }

  toggleSelectAll(type: string) {
    if (type === "branches") {
      this.selectedBranches = this.branchesAccessibleArray.map(
        (branch) => branch.id
      );
      this.filteredBranches = this.branchesAccessibleArray.map((branch) => ({
        id: branch.id,
        text: branch.text,
        type: "branch",
      }));
    } else {
      this.selectedLoanTypes = this.loantypesArray.map((loan) => loan.id);
      this.filteredLoanTypes = this.loantypesArray.map((loan) => ({
        id: loan.id,
        text: loan.text,
        type: "loan",
      }));
    }
  }

  deSelectAll(type: string) {
    if (type === "branches") {
      this.selectedBranches = [];
      this.filteredBranches = [];
    } else {
      this.selectedLoanTypes = [];
      this.filteredLoanTypes = [];
    }
  }

  getRepaymentsDue(pageNum = this.pagination2.pageNum) {
    this.repaymentsdue = [];
    this.requestLoader = true;

    // paginated section
    this.pagination2.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination2.pageNum = 1;
    }
    if (pageNum > this.pagination2.maxPage) {
      this.pagination2.pageNum = this.pagination2.maxPage || 1;
    }

    const paginationmodel = {
      pageNumber: this.pagination2.pageNum,
      pageSize: this.pagination2.pageSize,
      filter: this.pagination2.searchTerm,
      LoanTypes:
        this.selectedLoanTypes.length > 0
          ? JSON.stringify(this.selectedLoanTypes)
          : "",
      Branches:
        this.selectedBranches.length > 0
          ? JSON.stringify(this.selectedBranches)
          : "",
      Employer: this.selectedEmployerId,
      StartDate: this.StartDate == null ? "" : this.StartDate,
      EndDate: this.EndDate == null ? this.DefaultEndDate : this.EndDate,
      SpoolType: this.SpoolType,
    };

    this.loanOperationService.spoolRepaymentsDue(paginationmodel).subscribe(
      (response) => {
        this.sharedService.selectedFilters$.next({
          filters: [this.filteredBranches, this.filteredLoanTypes],
          action: "add",
          headers: ["Branches", "Loan Types"],
        });
        this.repaymentsdue = response.body.value.data;
        this.requestLoader = false;

        this.pagination2.maxPage = response.body.value.pages;
        this.pagination2.totalRecords = response.body.value.totalRecords;
        this.pagination2.count = this.repaymentsdue.length;
        this.pagination2.jumpArray = Array(this.pagination2.maxPage);
        for (let i = 0; i < this.pagination2.jumpArray.length; i++) {
          this.pagination2.jumpArray[i] = i + 1;
        }
      },
      (error) => {
        this.requestLoader = false;
      }
    );
  }

  filterReport() {
    if (this.searchForm.valid) {
      this.filtermodal();
      this.getRepaymentsDue();
    }
  }

  typeCheck(response, type) {
    if (type === "2") {
      this.selectedEntryType = response;
      const message = "You are about to Register Bulk Uploaded Payment(s)";
      this.submitBulkPaymentForm(message);
    } else {
      this.selectedEntryType = response;
    }
  }

  submitRequest(type, loanid) {
    this.requestLoader = true;

    this.loanOperationService.getActivities(type, loanid).subscribe(
      (res) => {
        this.requestLoader = false;
        this.paymentActivities = res.body;
      },
      (err) => {
        this.requestLoader = false;
      }
    );
  }

  submitPaymentForm(value) {
    const { lines } = this.AddPaymentForm.value;
    let totalPayment = 0;
    const paymentLines = [];
    lines.forEach((line) => {
      totalPayment += line.PaymentAmount;

      const lineData = {
        ...line,
        PaymentMode: line.PaymentMode[0],
        PaymentType: line.PaymentType[0],
      };

      if (this.appOwner.financeInteractionData.paymentIsActive) {
        lineData["FinanceAccountId"] = line.FinanceAccountId[0].id;
      }

      paymentLines.push(lineData);
    });

    const totalPaymentFmt = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(totalPayment);
    let message = `You are about to Register Payment of ${totalPaymentFmt}`;

    if (this.AddPaymentForm.valid) {
      swal
        .fire({
          type: "info",
          text: message,
          title: "Confirmation",
          confirmButtonText: "Proceed",
          confirmButtonColor: "#558E90",
          showCancelButton: true,
          cancelButtonColor: "#B85353",
          cancelButtonText: "Abort",
        })
        .then((result) => {
          if (result.value) {
            this.loader = true;
            if (this.selectedEntryType === "manual") {
              this.AddPaymentForm.controls["PaymentLines"].patchValue(
                JSON.stringify(paymentLines)
              );
              this.AddPaymentForm.controls["BranchId"].patchValue(
                this.currentuserbranchid
              );
              this.AddPaymentForm.controls["UserId"].patchValue(
                this.currentuserid
              );
              this.AddPaymentForm.controls["PaymentSource"].patchValue(
                this.selectedEntryType
              );

              this.loanOperationService
                .createPaymentRecord(this.AddPaymentForm.value)
                .subscribe(
                  (res) => {
                    swal.fire({
                      type: "success",
                      text: res.body.value.feedbackmessage,
                      title: "Successful",
                    });
                    (this.AddPaymentForm.get("lines") as FormArray).clear();
                    this.AddPaymentForm.reset();
                    this.selectedLoan = "";
                    this.asyncSelected = "";
                    this.paymentlines = [];
                    this.searchedLoanResult = null;
                    this.switchviews(1);
                    this.loader = false;
                    this.modalService.dismissAll();
                  },
                  (err) => {
                    this.loader = false;
                  }
                );
            } else if (this.selectedEntryType === "Bulk") {
              if (this.files !== null) {
                this.forms.configuring = true;
                this.AddPaymentForm.controls["files"].patchValue(this.files);

                this.AddPaymentForm.controls["BranchId"].patchValue(
                  this.currentuserbranchid
                );
                this.AddPaymentForm.controls["UserId"].patchValue(
                  this.currentuserid
                );
                this.AddPaymentForm.controls["PaymentSource"].patchValue(
                  this.selectedEntryType
                );

                const model = this.AddPaymentForm.value;

                this.loanOperationService.createPaymentRecord(model).subscribe(
                  (res) => {
                    swal.fire({
                      type: "success",
                      text: res.body.value.feedbackmessage,
                      title: "Successful",
                    });
                    this.modalService.dismissAll();
                    this.AddPaymentForm.reset();
                    this.selectedLoan = "";
                    this.asyncSelected = "";
                    this.paymentlines = [];
                    this.switchviews(1);
                    this.loader = false;
                  },
                  (err) => {
                    this.loader = false;
                  }
                );
              }
            }
          }
        });
    }
  }

  submitBulkPaymentForm(message) {
    // tslint:disable-next-line:max-line-length
    swal
      .fire({
        type: "info",
        text: message,
        title: "Confirmation",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Abort",
      })
      .then((result) => {
        if (result.value) {
          this.loader = true;

          if (this.selectedEntryType === "Bulk") {
            if (this.files !== null) {
              this.forms.configuring = true;
              this.AddPaymentForm.controls["files"].patchValue(this.files);

              this.AddPaymentForm.controls["BranchId"].patchValue(
                this.currentuserbranchid
              );
              this.AddPaymentForm.controls["UserId"].patchValue(
                this.currentuserid
              );
              this.AddPaymentForm.controls["PaymentSource"].patchValue(
                this.selectedEntryType
              );

              let model = this.AddPaymentForm.value;

              this.loanOperationService
                .createBulkPaymentRecord(model)
                .subscribe(
                  (res) => {
                    swal.fire({
                      type: "success",
                      text: res.body.value.feedbackmessage,
                      title: "Successful",
                    });
                    this.modalService.dismissAll();
                    this.AddPaymentForm.reset();
                    this.selectedLoan = "";
                    this.asyncSelected = "";
                    this.paymentlines = [];
                    this.switchviews(1);
                    this.loader = false;
                    this.forms.configureValidated = false;
                    this.forms.configuring = false;
                  },
                  (err) => {
                    this.loader = false;
                    this.forms.configureValidated = false;
                    this.forms.configuring = false;
                  }
                );
            }
          }
        }
      });
  }

  onSelectTransactionType(value: CustomDropDown, index: number) {
    this.selectedTransactionType = value.id as string;

    const line = this.paymentLineControls().at(index);
    if (value.id === "Settlement") {
      const paymentDate = line.get("PaymentDate").value;
      const loanId = line.get("LoanId").value;

      if (paymentDate) {
        this.getSettlementAmount(paymentDate, loanId, index);
        this.isReadOnly = true;
        line.get("paymentAmtReadOnly").setValue(true);
      }
    } else {
      line.get("paymentAmtReadOnly").setValue(false);
      line.get("PaymentAmount").setValue(0);
    }
  }

  onPaymentDateChange(value: string, index: number) {
    const line = this.paymentLineControls().at(index);
    if (
      line?.value?.PaymentType &&
      line?.value?.PaymentType[0] === "Settlement"
    ) {
      const loanId = line.get("LoanId").value;

      this.getSettlementAmount(value, loanId, index);
      line.get("paymentAmtReadOnly").setValue(true);
    }
  }

  onDropownInputValueChange() {
    this.searchedLoanResult = null;
  }

  selected(type, data, index) {
    if (type === "Branch") {
      this.selectedBranchID = data.id;
      this.selectedBranchName = data.text;
    } else if (type === "TransactionType") {
      this.paymentlines[index].PaymentType = data.id;
      this.isReadOnly = false;
      if (data.id === "Settlement") {
        this.isReadOnly = true;
      }

      if (
        this.paymentlines[index].PaymentDate !== null &&
        this.paymentlines[index].PaymentType === "Settlement"
      ) {
        this.getSettlementAmount(
          this.paymentlines[index].PaymentDate,
          this.paymentlines[index].LoanId,
          index
        );
      }
    } else if (type === "PaymentMode") {
      this.paymentlines[index].PaymentMode = data.id;
    } else if (type === "FinanceAccountId") {
      this.paymentlines[index].FinanceAccountId = data.id;
    } else if (type === "Filter") {
      this.selectedFilter = data.id;
      this.reportInputDateType =
        this.selectedFilter === "Filter result as at a date" ? 1 : 2;
      this.SpoolType =
        this.selectedFilter === "Filter result as at a date"
          ? "sinceinception"
          : "byrange";
    } else if (type === "LoanTypes") {
      this.selectedLoanTypes.push(data.id);
      this.filteredLoanTypes.push({ ...data, type: "loan" });
    } else if (type === "AccessibleBranch") {
      this.selectedBranches.push(data.id);
      this.filteredBranches.push({ ...data, type: "branch" });
    }
  }

  removed(type, data, index?: number) {
    if (type === "Branch") {
    } else if (type === "LoanTypes") {
      this.selectedLoanTypes.splice(this.selectedLoanTypes.indexOf(data), 1);
      this.filteredLoanTypes = this.filteredLoanTypes.filter(
        (loan) => loan.id === data.id
      );
    } else if (type === "AccessibleBranch") {
      this.selectedBranches.splice(this.selectedBranches.indexOf(data), 1);
      this.filteredBranches = this.filteredBranches.filter(
        (branch) => branch.id === data.id
      );
    } else if (type === "FinanceAccountId") {
      this.paymentlines[index].FinanceAccountId = null;
    }
  }

  // tslint:disable-next-line:variable-name
  ngIsNaN(any) {
    return isNaN(any);
  }

  handleFileInput(filelist, single = false) {
    const output = [];
    if (single) {
      output.push(filelist.item(0));
    } else {
      for (const file of filelist) {
        output.push(file);
      }
    }
    this.forms.configureValidated = false;
    this.files = output;
  }
  clearFileHandler() {
    this.files = null;
    this.forms.configureValidated = false;
  }

  generateCsvTemplate(type) {
    if (type === "template") {
      const header = [
        "LoanCode",
        "Customer",
        "EmploymentCode",
        "PaymentDate",
        "PaymentType",
        "PaymentMethod",
        "PaymentAmount",
        "Narration",
        "FinanceAccountId",
      ];
      const csvName = this.DefaultStartDate + "_BulkPaymentTemplate";
      const csvData = [];

      csvData.push({
        LoanCode: "LN000001",
        Customer: "Lenda Name",
        Employment: "000212",
        PaymentDate: moment(this.CurrentDate, "YYYY/MM/DD").format(
          "DD/MM/YYYY"
        ),
        PaymentType: "Repayment",
        PaymentMethod: "Cash",
        PaymentAmount: 0.0,
        Narration: "",
        FinanceAccountId: "",
      });

      const csvArray = this.processCSVData(csvData, header);
      var blob = new Blob([csvArray], { type: "text/csv" });
      saveAs(blob, csvName);
    } else if (type === "limitedfilteredresult") {
      const headers = [
        "LoanCode",
        "BranchName",
        "Customer",
        "Product",
        "EmployerName",
        "EmploymentCode",
        "PaymentDate",
        "PaymentType",
        "PaymentMethod",
        "PaymentAmount",
      ];
      const csvName =
        this.SpoolType === "sinceinception"
          ? "As at_" + this.EndDate + "_BulkPaymentTemplate"
          : this.StartDate + "_to_" + this.EndDate + "_BulkPaymentTemplate";
      const csvData = [];

      this.repaymentsdue.forEach((line) => {
        csvData.push({
          LoanCode: line.loanCode,
          BranchName: line.branchName,
          Customer: line.customer,
          Product: line.loanType,
          EmployerName: line.employerName,
          EmploymentCode: line.employmentCode,

          PaymentDate: "" /*this.CurrentDate */,
          PaymentType: "Repayment",
          PaymentMethod: "Cash",
          PaymentAmount: line.totalRepaymentOutstanding,
        });
      });
      const csvArray = this.processCSVData(csvData, headers);
      var blob = new Blob([csvArray], { type: "text/csv" });
      saveAs(blob, csvName);
    } else if (type === "filteredresult") {
      this.requestLoader = true;

      const paginationmodel = {
        pageNumber: this.pagination2.pageNum,
        pageSize: this.pagination2.pageSize,
        filter: this.pagination2.searchTerm,
        LoanTypes: JSON.stringify(this.selectedLoanTypes),
        Branches: JSON.stringify(this.selectedBranches),
        Employer: this.selectedEmployerId,
        StartDate:
          this.StartDate == null ? this.DefaultStartDate : this.StartDate,
        EndDate: this.EndDate == null ? this.DefaultEndDate : this.EndDate,
        ResultExpected: "All",
      };

      this.loanOperationService.spoolRepaymentsDue(paginationmodel).subscribe(
        (response) => {
          const downloaddata = response.body.value.data;
          const options = {
            headers: [
              "LoanCode",
              "BranchName",
              "Customer",
              "Product",
              "EmployerName",
              "EmploymentCode",
              "PaymentDate",
              "PaymentType",
              "PaymentMethod",
              "PaymentAmount",
            ],
          };
          // tslint:disable-next-line:max-line-length
          const csvName =
            this.SpoolType === "sinceinception"
              ? "As at_" + this.EndDate + "_BulkPaymentTemplate"
              : this.StartDate + "_to_" + this.EndDate + "_BulkPaymentTemplate";
          const csvData = [];

          downloaddata.forEach((line) => {
            csvData.push({
              LoanCode: line.loanCode,
              BranchName: line.branchName,
              Customer: line.customer,
              Product: line.loanType,
              EmployerName: line.employerName,
              EmploymentCode: line.employmentCode,
              PaymentDate: "" /*this.CurrentDate */,
              PaymentType: "Repayment",
              PaymentMethod: "Cash",
              PaymentAmount: line.totalRepaymentOutstanding,
            });
          });
          this.requestLoader = false;
          return new AngularCsv(csvData, csvName, options);
        },
        (error) => {
          this.requestLoader = false;
        }
      );
    } else if (type === "financeAccounts") {
      const headers = ["Account Id", "Account Name"];
      const csvName = "Finance Accounts";

      const csvData = this.accounts.map((account) => ({
        "Account Id": account.id,
        "Account Name": account.text,
      }));
      const processedCSVData = processCSVData(headers, csvData);
      var blob = new Blob([processedCSVData], { type: "text/csv" });
      saveAs(blob, csvName);
    }
  }

  validateSheet() {
    if (this.files !== null && this.files !== undefined) {
      this.forms.configureValidated = false;
      this.dataTables.csvDisplayTable.data = null;
      this.clearErrors();
      const that = this;

      this.papa.parse(this.files[0], {
        complete(results) {
          const dict = that.csvToDictionary(results);
          const legalNumber = that.validateNumbers(dict);
          const dateCheck = that.validateDate(dict);
          const paymentTypeCheck = that.validatePaymentType(dict);
          const paymentMethodCheck = that.validatePaymentMethod(dict);

          that.errors.csvInvalidNumber = !legalNumber;
          that.errors.csvInvalidDate = !dateCheck;
          that.errors.csvInvalidPaymentType = !paymentTypeCheck;
          that.errors.csvInvalidPaymentMethod = !paymentMethodCheck;

          if (
            legalNumber &&
            dateCheck &&
            paymentTypeCheck &&
            paymentMethodCheck
          ) {
            that.forms.configureValidated = true;
            this.bulkpaymentlines = dict;

            // tslint:disable-next-line:variable-name
            const push_lines = [];

            this.bulkpaymentlines.forEach((line) => {
              // tslint:disable-next-line:max-line-length
              push_lines.push({
                LoanCode: line.LoanCode,
                PaymentType: line.PaymentType,
                PaymentMode: line.PaymentMethod,
                FinanceAccountId: +line.FinanceAccountId,
                PaymentDate: moment(line.PaymentDate, "DD/MM/YYYY").format(
                  "YYYY-MM-DD"
                ),
                PaymentAmount: parseFloat(line.PaymentAmount),
                Narration: line.Narration,
              });
            });

            that.AddPaymentForm.controls["PaymentLines"].patchValue(
              JSON.stringify(push_lines)
            );

            const headers = Object.keys(dict[0]).map((h) => {
              if (dict[0].hasOwnProperty(h)) {
                return h;
              }
            });

            if (that.dataTables.csvDisplayTable.table != null) {
              that.dataTables.csvDisplayTable.table.destroy();
            }
            that.dataTables.csvDisplayTable.headers = headers;
            that.dataTables.csvDisplayTable.data = dict;
            that.chRef.detectChanges();
            that.dataTables.csvDisplayTable.table =
              $("#csvDisplayTable").DataTable();
          }
        },
      });
    } else {
      swal.fire(
        "info",
        "No Payment File Selected...Please select one and click the validate button again"
      );
    }
  }

  clearErrors() {
    for (const key in this.errors) {
      if (this.errors.hasOwnProperty(key)) {
        this.errors[key] = false;
      }
    }
  }

  csvToDictionary(csvData) {
    const csv = csvData.data;
    const length = csv.length;
    const headers = csv[0];

    const result = [];

    for (let i = 1; i < length; i++) {
      const line = {};
      if (csv[i].length === headers.length) {
        for (let j = 0; j < headers.length; j++) {
          line[headers[j]] = csv[i][j];
        }
      } else {
        if (i + 1 === length) {
          break;
        }
        swal.fire("error", '"Error in Sheet around line' + (i + 1));
        break;
      }
      result.push(line);
    }
    return result;
  }

  cleanNumbers(dataArray) {
    this.errors.csvInvalidNumberString = [];
    const forbid = {
      LoanCode: 0,
      BranchName: 0,
      Customer: 0,
      Product: 0,
      EmployerName: 0,
      EmploymentCode: 0,
      PaymentDate: 0,
      PaymentType: 0,
      PaymentMethod: 0,
    };
    for (const dat of dataArray) {
      let clone = this.clone(dat);
      clone = Object.assign(clone, forbid);
      for (const key in clone) {
        if (clone.hasOwnProperty(key)) {
          if (isNaN(clone[key])) {
            dat[key] = this.cleanCurrency(dat[key]);
          }
        }
      }
    }
  }

  validateNumbers(dataArray): boolean {
    let result = true;
    this.errors.csvInvalidNumberString = [];
    const forbid = {
      LoanCode: 0,
      BranchName: 0,
      Customer: 0,
      Product: 0,
      EmployerName: 0,
      EmploymentCode: 0,
      PaymentDate: 0,
      PaymentType: 0,
      PaymentMethod: 0,
      Narration: 0,
      FinanceAccountId: 0,
    };
    let i = 1;
    for (const dat of dataArray) {
      let clone = this.clone(dat);
      clone = Object.assign(clone, forbid);
      for (const key in clone) {
        if (clone.hasOwnProperty(key)) {
          if (isNaN(clone[key])) {
            this.errors.csvInvalidNumberString.push(
              `Invalid amount figure '${
                clone[key]
              }' under column '${key}' in line ${i + 1}.`
            );
            result = false;
          }
        }
      }

      i++;
    }
    return result;
  }

  validateDate(dataArray) {
    let result = true;
    this.errors.csvInvalidDateString = [];
    const forbid = {
      LoanCode: 0,
      BranchName: 0,
      Customer: 0,
      Product: 0,
      EmployerName: 0,
      EmploymentCode: 0,
      PaymentType: 0,
      PaymentMethod: 0,
      PaymentAmount: 0,
      Narration: 0,
      FinanceAccountId: 0,
    };
    let i = 1;

    for (const dat of dataArray) {
      let clone = this.clone(dat);
      clone = Object.assign(clone, forbid);

      for (const key in clone) {
        if (clone.hasOwnProperty(key)) {
          const date = clone[key];
          const reqFormat = moment(date, "DD/MM/YYYY", true).isValid();
          if (!reqFormat && date !== 0) {
            this.errors.csvInvalidDateString.push(
              `Invalid date '${clone[key]}' under column '${key}' in line ${
                i + 1
              }. Enter valid Date format: (DD/MM/YYYY)`
            );
            result = false;
          }
        }
      }

      i++;
    }
    return result;
  }

  validatePaymentMethod(dataArray) {
    let result = true;
    this.errors.csvInvalidPaymentMethodString = [];
    const forbid = {
      LoanCode: "ignore",
      BranchName: "ignore",
      Customer: "ignore",
      Product: "ignore",
      EmployerName: "ignore",
      EmploymentCode: "ignore",
      PaymentDate: "ignore",
      PaymentType: "ignore",
      PaymentAmount: "ignore",
      Narration: "ignore",
      FinanceAccountId: "ignore",
    };
    let i = 1;

    for (const dat of dataArray) {
      let clone = this.clone(dat);
      clone = Object.assign(clone, forbid);

      for (const key in clone) {
        if (clone.hasOwnProperty(key)) {
          var input = clone[key].toString();
          if (this.paymentMethodNotValid(input) === true && input != "ignore") {
            // tslint:disable-next-line:max-line-length
            this.errors.csvInvalidPaymentMethodString.push(
              `Invalid PaymentMethod '${
                clone[key]
              }' under column '${key}' in line ${
                i + 1
              }. Enter valid PaymentMethod: Cash or Cheque`
            );
            result = false;
          }
        }
      }

      i++;
    }
    return result;
  }

  validatePaymentType(dataArray): boolean {
    let result = true;
    this.errors.csvInvalidPaymentTypeString = [];
    const forbid = {
      LoanCode: "ignore",
      BranchName: "ignore",
      Customer: "ignore",
      Product: "ignore",
      EmployerName: "ignore",
      EmploymentCode: "ignore",
      PaymentDate: "ignore",
      PaymentMethod: "ignore",
      PaymentAmount: "ignore",
      Narration: "ignore",
      FinanceAccountId: "ignore",
    };
    let i = 1;
    for (const dat of dataArray) {
      let clone = this.clone(dat);
      clone = Object.assign(clone, forbid);
      for (const key in clone) {
        if (clone.hasOwnProperty(key)) {
          var input = clone[key].toString();
          if (this.isNotPaymentType(input) === true && input != "ignore") {
            this.errors.csvInvalidPaymentTypeString.push(
              `Invalid PaymentType '${
                clone[key]
              }' under column '${key}' in line ${
                i + 1
              }. Enter valid PaymentType: Repayment, Refund or Reversal.`
            );
            result = false;
          }
        }
      }

      i++;
    }
    return result;
  }

  isNotPaymentType(input) {
    if (input === "Repayment" || input === "Refund" || input === "Reversal") {
      return false;
    } else {
      return true;
    }
  }

  cleanCurrency(currencyString) {
    if (currencyString) {
      return Number(currencyString.toString().replace(/[^0-9.]/g, ""));
    }
    return 0;
  }

  paymentMethodNotValid(pmData) {
    if (pmData === "Cash" || pmData === "Cheque") {
      return false;
    } else {
      return true;
    }
  }

  clone(obj): any {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getPayments(pageNumber);
      return;
    }
    filter = filter.trim();
    this.pagination.searchTerm = filter === "" ? null : filter;
    this.getPayments(pageNumber);
  }

  getItemsPaginatedSearch2(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    // tslint:disable-next-line:radix
    this.pagination2.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getRepaymentsDue(pageNumber);
      return;
    }
    filter = filter.trim();
    this.pagination2.searchTerm = filter === "" ? null : filter;
    this.getRepaymentsDue(pageNumber);
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentuser = user.body;
          this.currentuserid = this.currentuser.userId;
          this.currentuserbranchid = this.currentuser.branchId;
          this.isSubscribedToFinModule = this.subscribedToFinanceModule(user.body?.isSubscriptionActive,user.body?.isModular,user.body?.modules)
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  private subscribedToFinanceModule(
    isAppSubscriptionActive,
    appIsModular,
    modules
  ) {
    return (
      (appIsModular &&
        !!modules?.find(
          (m) => m.moduleName.toLowerCase() == "finance" && m.isActive == true
        )) ||
      (!appIsModular && isAppSubscriptionActive)
    );
  }

  getStatesAsObservable(token: string): Observable<any> {
    const query = new RegExp(token, "i");
    return of(
      this.statesComplex.filter((state: any) => {
        return query.test(state.combinedLoanInfo);
      })
    );
  }

  getStatesAsObservableForEmployers(token: string): Observable<any> {
    const query = new RegExp(token, "i");
    return of(
      this.employersComplex.filter((state: any) => {
        return query.test(state.employerName);
      })
    );
  }

  PayNow(content, loanrow) {
    this.paymentlines = [];
    this.selectedLoan = loanrow;
    this.addPaymentRow("single");

    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "loantypes-class",
    });
    this.clearErrors();
  }

  addPaymentRow(type) {
    if (this.selectedLoan === "") {
      this.loader = false;
      this.requestLoader = false;
      swal.fire({
        type: "info",
        title: "Empty Search Box",
        text: "Please select the loan you want to register a payment for and try again",
      });
    } else {
      if (type === "single") {
        this.paymentlines.push({
          LoanId: this.selectedLoan.loanId,
          PersonId: this.selectedLoan.personId,
          LoanCode: this.selectedLoan.loanCode,
          CustomerName: this.selectedLoan.customer,
          PaymentType: null,
          PaymentMode: null,
          FinanceAccountId: null,
          PaymentDate: null,
          PeriodicRepaymentAmount: this.selectedLoan.periodicRepaymentAmount,
          AmountDue: this.selectedLoan.totalRepaymentOutstanding,
          PaymentAmount: this.selectedLoan.periodRepaymentOutstanding,
        });
      } else {
        this.addPaymentLine();
      }
    }
  }

  addToSelectedLoans(row, type, searchType: string) {
    if (this.paymentLineControls().length < 1) {
      this.modalService.dismissAll();
      this.openPaymentModal(
        this.paymentTemplateRef,
        "lg",
        "loan-payment-modal"
      );
    }

    if (searchType == "loan") {
      this.selectedLoan === "";
      this.selectedLoan = row;
      this.addPaymentRow(type);
    } else if (searchType == "employer") {
      this.selectedEmployer = row.employerName;
      this.selectedEmployerId = row.employerId;

      this.closeModal();
    }
  }

  clearInput(type) {
    if (type === 1) {
      this.selectedLoan = "";
      this.asyncSelected = "";
    } else if (type === 2) {
      this.selectedEmployer = "";

      this.searchForm.controls["EmployerSearch"].setValue("");
      this.selectedEmployerId = 0;
    }
  }

  setDate($e, i) {
    this.paymentlines[i].PaymentDate = $e;
    if (this.paymentlines[i].PaymentType === "Settlement") {
      this.getSettlementAmount(
        this.paymentlines[i].PaymentDate,
        this.paymentlines[i].LoanId,
        i
      );
    }
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

  onLoanSearch(content: TemplateRef<any> | null, type: string) {
    if (type == "1") {
      if (
        this.AddPaymentForm.controls["SearchParam"].value.trim() !== "" &&
        this.AddPaymentForm.controls["SearchParam"].value != null
      ) {
        this.gettingLoans = true;
        const searchLoanParams = {
          filter: "All",
          keyword: this.AddPaymentForm.controls["SearchParam"].value,
          selectedSearchColumn: this.selectedSearchCol,
        };
        this.loanOperationService
          .spoolLoansbySearch(searchLoanParams)
          .pipe(
            tap((res) => (this.searchByCol = res.body.searchColumns)),
            pluck("body", "items"),
            map((loans) =>
              loans.map((loan) => ({
                ...loan,
                combinedLoanInfo: `${loan?.loanCode}: ${loan?.customer} - ${loan?.totalRepaymentOutstanding}`,
              }))
            ),
            takeUntil(this.unsubscriber$)
          )
          .subscribe(
            (res) => {
              this.searchedLoanResult = res;
              this.gettingLoans = false;
            },
            () => {
              this.gettingLoans = false;
            }
          );
      } else {
        // tslint:disable-next-line:max-line-length
        swal.fire({
          type: "info",
          title: "Empty Search Box",
          text: "Please enter loan code or customer name into the  search box and try again",
        });
        this.searchrequestLoader = false;
      }
    } else {
      if (
        this.searchForm.controls["EmployerSearch"].value !== "" &&
        this.searchForm.controls["EmployerSearch"].value != null
      ) {
        this.searchrequestLoader = true;

        this.loanOperationService
          .spoolEmployersbyName(
            this.searchForm.controls["EmployerSearch"].value
          )
          .subscribe(
            (res) => {
              this.employersearchResult = res.body;
              this.searchrequestLoader = false;

              // tslint:disable-next-line:max-line-length
              this.modalService.open(content, {
                centered: true,
                ariaLabelledBy: "modal-basic-title",
                windowClass: "custom-modal-style",
              });
            },
            (error) => {
              this.requestLoader = false;
            }
          );
      } else {
        // tslint:disable-next-line:max-line-length
        swal.fire({
          type: "info",
          title: "Empty Search Box",
          text: "Please enter the  search parameter and try again",
        });
        this.searchrequestLoader = false;
      }
    }
  }

  changeTypeaheadLoading(e: boolean): void {
    this.typeaheadLoading = e;
  }

  changeTypeaheadLoadingEmployers(e: boolean): void {
    this.typeaheadLoading = e;
  }

  typeaheadOnSelect(e: TypeaheadMatch): void {
    this.selectedLoan = e.item;
    this.asyncSelected = e;
  }

  typeaheadOnSelectEmployers(e: TypeaheadMatch): void {
    this.asyncSelected2 = e;
    this.selectedEmployer = e.item.employerId;
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Payment code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  protected processCSVData(csvData: any, header: string[]): any {
    const replacer = (key, value) => (value === null ? "" : value);
    let csv = csvData.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(",")
    );
    csv.unshift(header.join(","));
    let csvArray = csv.join("\r\n");

    return csvArray;
  }

  onSearchParams(data: SearchParams) {
    if (data.selectedSearchColumn && data.keyword) {
      this.selectedSearchCol = data.selectedSearchColumn;
      this.AddPaymentForm.get("SearchParam").setValue(data.keyword);
      this.onLoanSearch(null, "1");
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
