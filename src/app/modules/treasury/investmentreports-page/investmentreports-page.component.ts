import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as $ from "jquery";
import { Validators, FormBuilder } from "@angular/forms";
import { ReportService } from "../../../service/report.service";
import Swal from "sweetalert2";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { TypeaheadMatch } from "ngx-bootstrap";
import { AngularCsv } from "angular7-csv/dist/Angular-csv";
import { ConfigurationService } from "../../../service/configuration.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { CustomDropDown, PillFilters } from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";
import {
  GetInvestmentReportReqBody,
  InvestmentReportNameEnum,
  STPInterestAccruedReport,
  STPLiquidationReport,
  ShortTermInvestmentReport,
} from "../types/investment.type";
import { AppOwnerInformation, Pagination } from "../../shared/shared.types";
@Component({
  selector: "app-investmentreports-page",
  templateUrl: "./investmentreports-page.component.html",
  styleUrls: ["./investmentreports-page.component.scss"],
})
export class InvestmentReportsPageComponent implements OnInit {
  reportName: InvestmentReportNameEnum;
  userInfo: any;
  today: number = Date.now();
  loader = false;
  activityList: any[];
  investmentReportList: any[];
  investmentLiquidationReportList: any[];
  reportInputDateType: any;
  openReportAside = false;
  requestLoader: boolean;
  ownerInformation: any;
  reportOutputFormatCheck = false;
  paginated = false;
  startDate: any;
  endDate: any;
  reportinvolvesCalculation = false;
  showBranch = false;
  selectedBranchIds: number[] = [];

  paymentsList = [];
  asyncSelected: any;
  typeaheadLoading: boolean;

  searchrequestLoader: boolean;

  branchesAccessibleArray: any[] = [];
  investmentMaturityReportList: any[];
  investmentInterestReportList: any[];
  investmentActivityReportList: any[];
  stpInvestmentReportList: ShortTermInvestmentReport[] = [];
  stpInvestmentMaturityReportList: ShortTermInvestmentReport[] = [];
  stpInvestmentLiquidationReportList: STPLiquidationReport[] = [];
  stpInterestAccruedReportList: STPInterestAccruedReport[] = [];
  public resultOutputTypeArray: Array<string> = ["Grouped", "Breakdown"];
  selectedOutputType: any;
  loggedInUser: any;
  pagination = {
    pageNum: 1,
    pageSize: 500,
    maxPage: 0,
    searchTerm: "",
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };
  pagination2: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 500,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  usePagination2 = false;
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  desiredRows: any[] = [500, 1000, 1500, 2000, 2500, 3000, 5000, 8000, 20000];
  statuses: CustomDropDown[] = [
    { id: "All", text: "All" },
    { id: "Approved", text: "Approved" },
    { id: "Terminated", text: "Terminated" },
  ];
  investmentReportNameEnum = InvestmentReportNameEnum;
  appOwner: AppOwnerInformation;
  searchForm = this.fb.group({
    startDate: [""],
    endDate: [""],
    pageNumber: [0],
    pageSize: [0],
    filter: [""],
    branchesList: [""],
    statusType: [""],
    type: [""],
    tenantId: [""],
  });
  currencySymbol: string;
  startDateRequired = false;
  endDateRequired = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private modalService: NgbModal,
    private reportService: ReportService,
    private configurationService: ConfigurationService,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.getCurrencySymbol();
    this.removePill();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();

    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }

    this.getUserInfo();
    this.getAppOwnerInfo();
    // For deep linking via finance reports
    this.getReportForViewFromQuery();
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configurationService.currencySymbol;
    if (!this.currencySymbol) {
      this.configurationService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  getAppOwnerInfo() {
    this.configurationService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.appOwner = res.body;
      });
  }

  removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters) => {
        if (selectedFilters.action === "remove") {
          selectedFilters.filters.forEach((selectedFilter) => {
            if (selectedFilter.length === 0) {
              this.searchForm.get("statusType").reset("");
              this.filterReport(this.pagination.pageNum, null, false);
            }
          });
        }
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

  getReportForViewFromQuery() {
    const viewReport = this.route.snapshot.queryParams["interestAccruedReport"];
    if (viewReport) {
      this.toggleAside(InvestmentReportNameEnum.InterestAccruedReport);
    }
  }

  filtermodal() {
    this.resetReportAsideContent();
    $(".generate-menu").toggle();
  }

  getConstants() {
    this.requestLoader = true;
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
        this.requestLoader = false;
      },
      () => {
        this.requestLoader = false;
      }
    );

    this.requestLoader = false;
  }

  loadDropdown() {
    const datamodel = { filter: "", UserId: this.loggedInUser.nameid };
    this.configurationService.spoolAccessibleBranches(datamodel).subscribe(
      (response) => {
        this.branchesAccessibleArray = [];
        response.body.forEach((element) => {
          this.branchesAccessibleArray.push({
            id: element.branchId,
            text: element.branchName,
          });
        });
        this.requestLoader = false;
      },
      (error) => {
        //Swal.fire('Error', error.error, 'error');
      }
    );
  }

  getUserInfo() {
    this.userService.getUserInfo(this.loggedInUser.nameid).subscribe((res) => {
      this.userInfo = res.body;
      $(document).ready(() => {
        $.getScript("assets/js/script.js");
      });
      this.loadDropdown();
    });
  }

  toggleAside(reportName: InvestmentReportNameEnum) {
    this.paginated = true;
    this.reportOutputFormatCheck = false;
    this.showBranch = false;
    this.reportinvolvesCalculation = false;
    this.startDateRequired = false;
    this.endDateRequired = false;
    this.setStartDateValidation(true);
    this.setEndDateValidation(true);

    this.reportName = reportName;
    this.resetReportAsideContent();

    switch (reportName) {
      case InvestmentReportNameEnum.ShortTermInvestmentReport:
      case InvestmentReportNameEnum.ShortTermInvestmentMaturityReport:
      case InvestmentReportNameEnum.ShortTermInvestmentLiquidationReport:
      case InvestmentReportNameEnum.ShortTermInvestmentInterestAccruedReport:
        this.reportInputDateType = 1;
        this.setEndDateValidation();
        break;
      case InvestmentReportNameEnum.InvestmentReport:
      case InvestmentReportNameEnum.InvestmentLiquidationReport:
      case InvestmentReportNameEnum.InvestmentMaturityReport:
      case InvestmentReportNameEnum.InterestAccruedReport:
      case InvestmentReportNameEnum.ActivityReport:
        this.startDateRequired = true;
        this.endDateRequired = true;
        this.setStartDateValidation();
        this.setEndDateValidation();
      default:
        this.reportInputDateType = 2; /*start date and end date */
    }

    this.openReportAside = true;
  }

  setStartDateValidation(reset = false) {
    reset
      ? this.searchForm.get("startDate").clearValidators()
      : this.searchForm.get("startDate").setValidators(Validators.required);
    this.searchForm.get("startDate").updateValueAndValidity();
  }

  setEndDateValidation(reset = false) {
    reset
      ? this.searchForm.get("endDate").clearValidators()
      : this.searchForm.get("endDate").setValidators(Validators.required);
    this.searchForm.get("endDate").updateValueAndValidity();
  }

  openModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  closeAside() {
    this.searchForm.reset({
      startDate: null,
      endDate: null,
    });
    this.setEndDateValidation(true);
    this.openReportAside = false;
  }

  resetReportAsideContent() {
    this.activityList = [];
    this.investmentReportList = [];
    this.investmentLiquidationReportList = [];
    this.investmentMaturityReportList = [];
    this.investmentInterestReportList = [];
    this.investmentActivityReportList = [];
    this.stpInvestmentReportList = [];
    this.stpInvestmentMaturityReportList = [];
    this.stpInvestmentLiquidationReportList = [];
    this.stpInterestAccruedReportList = [];
    this.pagination.totalRecords = 0;
    this.pagination2 = {
      hasNextPage: false,
      hasPreviousPage: false,
      pageNumber: 1,
      pageSize: 500,
      totalCount: 0,
      totalPages: 0,
      count: 0,
      jumpArray: [],
    };
  }

  filterReport(
    pageNum = this.pagination.pageNum,
    filter = null,
    filterModal = true
  ) {
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    if (this.searchForm.valid) {
      this.searchForm.controls["type"].patchValue(this.selectedOutputType);
      this.searchForm.controls["branchesList"].patchValue(
        this.selectedBranchIds.length > 0
          ? JSON.stringify(this.selectedBranchIds)
          : ""
      );
      this.searchForm.get("tenantId").setValue(this.appOwner.appOwnerKey);

      if (this.paginated === true) {
        this.searchForm.controls["pageNumber"].patchValue(
          this.pagination.pageNum
        );
        this.searchForm.controls["pageSize"].patchValue(
          this.pagination.pageSize
        );
        this.searchForm.controls["filter"].patchValue(
          this.pagination.searchTerm
        );
      }

      const formData = this.searchForm.value as GetInvestmentReportReqBody;
      this.usePagination2 = false;
      this.loader = true;
      this.getConstants();
      if (this.reportName === InvestmentReportNameEnum.InvestmentReport) {
        this.investmentReportList = [];
        this.reportService
          .fetchInvestmentReport(this.searchForm.value)
          .subscribe(
            (res) => {
              if (this.searchForm.get("statusType").value !== "") {
                const selectedFilters: PillFilters = {
                  filters: [
                    [
                      {
                        id: this.searchForm.get("statusType").value,
                        text: this.searchForm.get("statusType").value,
                      },
                    ],
                  ],
                  headers: ["Status"],
                  action: "add",
                };
                this.sharedService.selectedFilters$.next(selectedFilters);
              }

              this.loader = false;
              this.investmentReportList = res.body.value.data;

              if (this.paginated === true) {
                this.pagination.maxPage = res.body.value.pages;
                this.pagination.totalRecords = res.body.value.totalRecords;
                this.pagination.count = this.paymentsList.length;
                this.pagination.jumpArray = Array(this.pagination.maxPage);
                for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                  this.pagination.jumpArray[i] = i + 1;
                }
              }
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (
        this.reportName === InvestmentReportNameEnum.InvestmentLiquidationReport
      ) {
        this.investmentLiquidationReportList = [];
        this.reportService
          .fetchInvestmentLiquidationReport(this.searchForm.value)
          .subscribe(
            (res) => {
              this.loader = false;
              this.investmentLiquidationReportList = res.body.value.data;

              if (this.paginated === true) {
                this.pagination.maxPage = res.body.value.pages;
                this.pagination.totalRecords = res.body.value.totalRecords;
                this.pagination.count = this.paymentsList.length;
                this.pagination.jumpArray = Array(this.pagination.maxPage);
                for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                  this.pagination.jumpArray[i] = i + 1;
                }
              }
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (
        this.reportName === InvestmentReportNameEnum.InvestmentMaturityReport
      ) {
        this.investmentMaturityReportList = [];
        this.reportService
          .fetchInvestmentMaturityReport(this.searchForm.value)
          .subscribe(
            (res) => {
              this.loader = false;
              this.investmentMaturityReportList = res.body.value.data;

              if (this.paginated === true) {
                this.pagination.maxPage = res.body.value.pages;
                this.pagination.totalRecords = res.body.value.totalRecords;
                this.pagination.count = this.paymentsList.length;
                this.pagination.jumpArray = Array(this.pagination.maxPage);
                for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                  this.pagination.jumpArray[i] = i + 1;
                }
              }
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (
        this.reportName === InvestmentReportNameEnum.InterestAccruedReport
      ) {
        this.investmentInterestReportList = [];
        this.reportService
          .fetchInvestmentInterestReport(this.searchForm.value)
          .subscribe(
            (res) => {
              this.loader = false;
              this.investmentInterestReportList = res.body.value.data;

              if (this.paginated === true) {
                this.pagination.maxPage = res.body.value.pages;
                this.pagination.totalRecords = res.body.value.totalRecords;
                this.pagination.count = this.paymentsList.length;
                this.pagination.jumpArray = Array(this.pagination.maxPage);
                for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                  this.pagination.jumpArray[i] = i + 1;
                }
              }
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (this.reportName === InvestmentReportNameEnum.ActivityReport) {
        this.investmentActivityReportList = [];
        this.reportService
          .fetchInvestmentActivityReport(this.searchForm.value)
          .subscribe(
            (res) => {
              this.loader = false;
              //  this.paymentsList = res.body;
              this.investmentActivityReportList = res.body.data.items;

              if (this.paginated === true) {
                this.pagination.maxPage = res.body.totalPages;
                this.pagination.totalRecords = res.body.totalCount;
                this.pagination.count = this.paymentsList.length;
                this.pagination.jumpArray = Array(this.pagination.maxPage);
                for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                  this.pagination.jumpArray[i] = i + 1;
                }
              }
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (
        this.reportName === InvestmentReportNameEnum.ShortTermInvestmentReport
      ) {
        this.stpInvestmentReportList = [];
        this.usePagination2 = true;
        this.reportService.fetchShortTermInvestmentReport(formData).subscribe(
          (res) => {
            this.loader = false;
            this.stpInvestmentReportList = res.body?.items;
            this.setPagination2(res.body);
          },
          (err) => {
            this.loader = false;
          }
        );
      } else if (
        this.reportName ===
        InvestmentReportNameEnum.ShortTermInvestmentMaturityReport
      ) {
        this.stpInvestmentMaturityReportList = [];
        this.usePagination2 = true;
        this.reportService
          .fetchShortTermInvestmentMaturityReport(formData)
          .subscribe(
            (res) => {
              this.loader = false;
              this.stpInvestmentMaturityReportList = res.body?.items;
              this.setPagination2(res.body);
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (
        this.reportName ===
        InvestmentReportNameEnum.ShortTermInvestmentLiquidationReport
      ) {
        this.stpInvestmentLiquidationReportList = [];
        this.usePagination2 = true;
        this.reportService
          .fetchShortTermInvestmentLiquidationReport(formData)
          .subscribe(
            (res) => {
              this.loader = false;
              this.stpInvestmentLiquidationReportList = res.body?.items;
              this.setPagination2(res.body);
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (
        this.reportName ===
        InvestmentReportNameEnum.ShortTermInvestmentInterestAccruedReport
      ) {
        this.usePagination2 = true;
        this.reportService.fetchSTPInterestAccruedReport(formData).subscribe(
          (res) => {
            this.loader = false;
            this.stpInterestAccruedReportList = res.body?.items;
            this.setPagination2(res.body);
          },
          (err) => {
            this.loader = false;
          }
        );
      }

      if (filterModal) {
        this.filtermodal();
      }
    }
  }

  setPagination2(res: any): void {
    this.pagination2 = res;
    this.pagination2.count = res.items.length;

    this.pagination2.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination2.jumpArray.push(i);
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  getShortTermPlacementReportList() {
    if (
      this.reportName === InvestmentReportNameEnum.ShortTermInvestmentReport
    ) {
      return this.stpInvestmentReportList;
    } else if (
      this.reportName ===
      InvestmentReportNameEnum.ShortTermInvestmentMaturityReport
    ) {
      return this.stpInvestmentMaturityReportList;
    } else if (
      this.reportName ===
      InvestmentReportNameEnum.ShortTermInvestmentLiquidationReport
    ) {
      return this.stpInvestmentLiquidationReportList;
    } else if (
      this.reportName ===
      InvestmentReportNameEnum.ShortTermInvestmentInterestAccruedReport
    ) {
      return this.stpInterestAccruedReportList;
    }
  }

  getTotalSection(type, arrayinput, expectedResult) {
    let total = 0;

    if (type === "interestIncomeForPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].interestIncomeForPeriod);
        }
      }
    } else if (type === "interestIncomeTillPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].interestIncomeTillPeriod);
        }
      }
    } else if (type === "settlementAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].settlementAmount);
        }
      }
    } else if (type === "totalRepayed") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].totalRepayed);
        }
      }
    } else if (type === "feesBreakdown") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].feesCharged);
        }
      }
    } else if (type === "feesGrouped") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].totalFeesCharged);
        }
      }
    } else if (type === "feesGroupedLoanCount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].loanCount);
        }
      }
    } else if (type === "paymentAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].paymentAmount);
        }
      }
    } else if (type == "loanAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].loanAmount);
        }
      }
    } else if (type == "repaymentsDue") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].repaymentsDue);
        }
      }
    } else if (type == "repaymentsMade") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].repaymentsMade);
        }
      }
    } else if (type == "expectedAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].expectedAmountInPeriod);
        }
      }
    } else if (type == "expectedPrincipalPortionAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].expectedPrincipalPortionAmount);
        }
      }
    } else if (type == "expectedInterestPortionAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].expectedInterestPortionAmount);
        }
      }
    } else if (type == "reconciledRepaymentsMadeInPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].reconciledRepaymentsMadeInPeriod);
        }
      }
    } else if (type == "scheduleRepaymentsDueInPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].scheduleRepaymentsDueInPeriod);
        }
      }
    } else if (type == "totalRepaymentsMadeTillPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].totalRepaymentsMadeTillPeriod);
        }
      }
    } else if (type == "totalAccumRepaymentsDueTillPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].totalAccumRepaymentsDueTillPeriod);
        }
      }
    }

    if (expectedResult === "formatted") {
      return total.toLocaleString(undefined, { minimumFractionDigits: 2 });
    } else {
      return total;
    }
  }

  selected(type, data, index) {
    if (type === "OutputType") {
      this.selectedOutputType = data.id;
    } else if (type === "AccessibleBranch") {
      this.selectedBranchIds.push(data.id);
    } else if (type === "rowSize") {
      this.pagination.pageSize = +data?.id;
    } else if (type === "statusType") {
      let status = "";
      data.id === "All" ? (status = "") : (status = data?.id);
      this.searchForm.get("statusType").setValue(status);
    }
  }

  removed(type, data) {
    if (type === "Branch") {
      // this.selectedBranchID.splice(this.selectedRejectionReasonsIDs.indexOf(data.id), 1);
    } else if (type === "AccessibleBranch") {
      this.selectedBranchIds.splice(this.selectedBranchIds.indexOf(data), 1);
    }
  }

  exportLog(data: any[]) {
    if (this.reportName === InvestmentReportNameEnum.InvestmentReport) {
      const exportAble = [];
      const options = {
        headers: [
          "Code",
          "Investor",
          "Amount",
          "Tenor",
          "Start Date",
          "Maturity Date",
          "Interest Rate",
          "Gross Interest",
          "WHT",
          "Net Interest",
          "Investment Type",
          "Status",
          "Period",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          Code: key?.investmentCode || "",
          Investor: key.investorName,
          Amount: key.initialDeposit,
          Tenor: key.tenor,
          "Start Date": key.investmentStartDate,
          "Maturity Date": key?.maturityDate || "",
          "Interest Rate": key.investmentRate,
          "Gross Interest": key.grossInterestRate,
          WHT: key.withHoldingTax,
          "Net Interest": key.netInterestRate,
          "Investment Type": key.investmentType,
          Status: key.status,
          Period: key.period,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      new AngularCsv(exportAble, "Investment Report", options);
    } else if (
      this.reportName === InvestmentReportNameEnum.InvestmentLiquidationReport
    ) {
      const exportAble = [];
      const options = {
        headers: [
          "Code",
          "Investor",
          "Principal",
          "Liquidated Amount",
          "Penal Charge",
          "Liquidation Date",
          "Start Date",
          "Maturity Date",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          Code: key.investmentCode,
          Investor: key.investorName,
          Principal: key.initialDeposit,
          "Liquidated Amount": key.liquidatedAmount,
          "Penal Charge": key.penalCharge,
          "Liquidation Date": key.liquidationDate,
          "Start Date": key.investmentStartDate,
          "Maturity Date": key.maturityDate,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      new AngularCsv(
        exportAble,
        InvestmentReportNameEnum.InvestmentLiquidationReport,
        options
      );
    } else if (
      this.reportName === InvestmentReportNameEnum.InvestmentMaturityReport
    ) {
      const exportAble = [];
      const options = {
        headers: [
          "Code",
          "Investor",
          "Amount",
          "Tenor",
          "Start Date",
          "Maturity Date",
          "Gross Interest",
          "WHT",
          "Net Interest",
          "Investment Type",
          "Status",
          "Period",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          Code: key.investmentCode,
          Investor: key.investorName,
          Amount: key.initialDeposit,
          Tenor: key.tenor,
          "Start Date": key.investmentStartDate,
          "Maturity Date": key.maturityDate,
          "Gross Interest": key.grossInterestRate,
          WHT: key.withHoldingTax,
          "Net Interest": key.netInterestRate,
          "Investment Type": key.investmentType,
          Status: key.status,
          Period: key.period,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      new AngularCsv(
        exportAble,
        InvestmentReportNameEnum.InvestmentMaturityReport,
        options
      );
    } else if (
      this.reportName === InvestmentReportNameEnum.InterestAccruedReport
    ) {
      const exportAble = [];
      const options = {
        headers: [
          "Code",
          "Investor",
          "Amount",
          "Tenor",
          "Start Date",
          "Maturity Date",
          "Gross Interest",
          "WHT",
          "Net Interest",
          "Investment Type",
          "Status",
          "Period",
          "Current Interest Accrued",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          Code: key.investmentCode,
          Investor: key.investorName,
          Amount: key.initialDeposit,
          Tenor: key.tenor,
          "Start Date": key.investmentStartDate,
          "Maturity Date": key.maturityDate,
          "Gross Interest": key.grossInterestRate,
          WHT: key.withHoldingTax,
          "Net Interest": key.netInterestRate,
          "Investment Type": key.investmentType,
          Status: key.status,
          Period: key.period,
          "Current Interest Accrued": key.currentAccruedAmount,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      new AngularCsv(
        exportAble,
        InvestmentReportNameEnum.InterestAccruedReport,
        options
      );
    } else if (this.reportName === InvestmentReportNameEnum.ActivityReport) {
      const exportAble = [];
      const options = {
        headers: ["Description", "Date"],
      };
      data.forEach((key) => {
        exportAble.push({
          Description: key.activityDescription,
          Date: key.activityDate,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      new AngularCsv(
        exportAble,
        InvestmentReportNameEnum.ActivityReport,
        options
      );
    } else if (
      this.reportName === InvestmentReportNameEnum.ShortTermInvestmentReport ||
      this.reportName ===
        InvestmentReportNameEnum.ShortTermInvestmentMaturityReport
    ) {
      const rData: ShortTermInvestmentReport[] = data;
      const exportAble = [];
      const options = {
        headers: [
          "Code",
          "Principal",
          "Tenor",
          "Interest Accrued",
          "Start Date",
          "Maturity Date",
          "Created At",
          "Days Till Maturity",
          "Placement Type",
          "WHT",
          "Status",
        ],
      };
      rData.forEach((item) => {
        exportAble.push({
          Code: item.shortTermPlacementCode,
          Principal: item.principal,
          Tenor: item.tenor,
          "Interest Accrued": item.interestAccrued,
          "Start Date": item.startDate,
          "Maturity Date": item.maturityDate,
          "Created At": item.createdAt,
          "Days Till Maturity": item.daysTillMaturity,
          "Placement Type": item.placementType,
          WHT: item.whtRate || "-",
          Status: item.status,
        });
      });

      new AngularCsv(
        exportAble,
        this.reportName === InvestmentReportNameEnum.ShortTermInvestmentReport
          ? InvestmentReportNameEnum.ShortTermInvestmentReport
          : InvestmentReportNameEnum.ShortTermInvestmentMaturityReport,
        options
      );
    } else if (
      this.reportName ===
      InvestmentReportNameEnum.ShortTermInvestmentLiquidationReport
    ) {
      const rData: STPLiquidationReport[] = data;
      const exportAble = [];
      const options = {
        headers: [
          "Code",
          "Principal",
          "Tenor",
          "Interest Accrued",
          "Start Date",
          "Maturity Date",
          "Created At",
          "Days Till Maturity",
          "Placement Type",
          "WHT",
          "Penal Charge",
          "Liquidation Date",
          "Liquidation Amount",
          "Status",
        ],
      };
      rData.forEach((item) => {
        exportAble.push({
          Code: item.shortTermPlacementCode,
          Principal: item.principal,
          Tenor: item.tenor,
          "Interest Accrued": item.interestAccrued,
          "Start Date": item.startDate,
          "Maturity Date": item.maturityDate,
          "Created At": item.createdAt,
          "Days Till Maturity": item.daysTillMaturity,
          "Placement Type": item.placementType,
          WHT: item.whtRate || "-",
          "Penal Charge": item.penalCharge,
          "Liquidation Date": item.liquidationDate,
          "Liquidation Amount": item.liquidationAmount,
          Status: item.status,
        });
      });

      new AngularCsv(
        exportAble,
        InvestmentReportNameEnum.ShortTermInvestmentLiquidationReport,
        options
      );
    } else if (
      this.reportName ===
      InvestmentReportNameEnum.ShortTermInvestmentInterestAccruedReport
    ) {
      const rData: STPInterestAccruedReport[] = data;
      const exportAble = [];
      const options = {
        headers: [
          "Code",
          "Principal",
          "Tenor",
          "Interst",
          "Interest Accrued",
          "Start Date",
          "Maturity Date",
          "Created At",
          "Days Till Maturity",
          "Placement Type",
          "WHT",
          "Status",
        ],
      };
      rData.forEach((item) => {
        exportAble.push({
          Code: item.shortTermPlacementCode,
          Principal: item.principal,
          Tenor: item.tenor,
          Interest: item.interest,
          "Interest Accrued": item.interestAccrued,
          "Start Date": item.startDate,
          "Maturity Date": item.maturityDate,
          "Created At": item.createdAt,
          "Days Till Maturity": item.daysTillMaturity,
          "Placement Type": item.placementType,
          WHT: item.whtRate || "-",
          Status: item.status,
        });
      });

      new AngularCsv(
        exportAble,
        InvestmentReportNameEnum.ShortTermInvestmentInterestAccruedReport,
        options
      );
    }
  }

  typeaheadOnSelect(e: TypeaheadMatch): void {
    this.asyncSelected = e;
  }

  changeTypeaheadLoading(e: boolean): void {
    this.typeaheadLoading = e;
  }

  clearInput(type) {
    if (type === 1) {
      this.asyncSelected = "";
    } else if (type === 2) {
    }
  }

  pushtoSelectedLoan(row, type) {
    // tslint:disable-next-line:no-unused-expression
    this.asyncSelected = row;
  }

  printReport(referenceId) {
    const host = window.location.host;

    const printContents = document.getElementById(referenceId).innerHTML;
    let popupWin = null;
    if (printContents != null) {
      popupWin = window.open(
        "",
        "_blank",
        "top=0,left=0,height=100%,width=auto"
      );
      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>${this.reportName}</title>
            <link rel="stylesheet" href="http://${host}/assets/css/bootstrap.min.css" type="text/css"/>
           <br/>
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

            @media print {
           
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
              .col-sm-1, .col-sm-2, .col-sm-3, .col-sm-4, .col-sm-5,
              .col-sm-6, .col-sm-7, .col-sm-8, .col-sm-9, .col-sm-10, .col-sm-11, .col-sm-12 {
                float: left;
              }
              .col-sm-12 {
                width: 100%;
              }
              .col-sm-11 {
                width: 91.66666667%;
              }
              .col-sm-10 {
                width: 83.33333333%;
              }
              .col-sm-9 {
                width: 75%;
              }
              .col-sm-8 {
                width: 66.66666667%;
              }
              .col-sm-7 {
                width: 58.33333333%;
              }
              .col-sm-6 {
                width: 50%;
              }
              .col-sm-5 {
                width: 41.66666667%;
              }
              .col-sm-4 {
                width: 33.33333333%;
              }
              .col-sm-3 {
                width: 25%;
              }
              .col-sm-2 {
                width: 16.66666667%;
              }
              .col-sm-1 {
                width: 8.33333333%;
              }
              .col-sm-pull-12 {
                right: 100%;
              }
              .col-sm-pull-11 {
                right: 91.66666667%;
              }
              .col-sm-pull-10 {
                right: 83.33333333%;
              }
              .col-sm-pull-9 {
                right: 75%;
              }
              .col-sm-pull-8 {
                right: 66.66666667%;
              }
              .col-sm-pull-7 {
                right: 58.33333333%;
              }
              .col-sm-pull-6 {
                right: 50%;
              }
              .col-sm-pull-5 {
                right: 41.66666667%;
              }
              .col-sm-pull-4 {
                right: 33.33333333%;
              }
              .col-sm-pull-3 {
                right: 25%;
              }
              .col-sm-pull-2 {
                right: 16.66666667%;
              }
              .col-sm-pull-1 {
                right: 8.33333333%;
              }
              .col-sm-pull-0 {
                right: auto;
              }
              .col-sm-push-12 {
                left: 100%;
              }
              .col-sm-push-11 {
                left: 91.66666667%;
              }
              .col-sm-push-10 {
                left: 83.33333333%;
              }
              .col-sm-push-9 {
                left: 75%;
              }
              .col-sm-push-8 {
                left: 66.66666667%;
              }
              .col-sm-push-7 {
                left: 58.33333333%;
              }
              .col-sm-push-6 {
                left: 50%;
              }
              .col-sm-push-5 {
                left: 41.66666667%;
              }
              .col-sm-push-4 {
                left: 33.33333333%;
              }
              .col-sm-push-3 {
                left: 25%;
              }
              .col-sm-push-2 {
                left: 16.66666667%;
              }
              .col-sm-push-1 {
                left: 8.33333333%;
              }
              .col-sm-push-0 {
                left: auto;
              }
              .col-sm-offset-12 {
                margin-left: 100%;
              }
              .col-sm-offset-11 {
                margin-left: 91.66666667%;
              }
              .col-sm-offset-10 {
                margin-left: 83.33333333%;
              }
              .col-sm-offset-9 {
                margin-left: 75%;
              }
              .col-sm-offset-8 {
                margin-left: 66.66666667%;
              }
              .col-sm-offset-7 {
                margin-left: 58.33333333%;
              }
              .col-sm-offset-6 {
                margin-left: 50%;
              }
              .col-sm-offset-5 {
                margin-left: 41.66666667%;
              }
              .col-sm-offset-4 {
                margin-left: 33.33333333%;
              }
              .col-sm-offset-3 {
                margin-left: 25%;
              }
              .col-sm-offset-2 {
                margin-left: 16.66666667%;
              }
              .col-sm-offset-1 {
                margin-left: 8.33333333%;
              }
              .col-sm-offset-0 {
                margin-left: 0%;
              }
              .visible-xs {
                display: none !important;
              }
              .hidden-xs {
                display: block !important;
              }
              table.hidden-xs {
                display: table;
              }
              tr.hidden-xs {
                display: table-row !important;
              }
              th.hidden-xs,
              td.hidden-xs {
                display: table-cell !important;
              }
              .hidden-xs.hidden-print {
                display: none !important;
              }
              .hidden-sm {
                display: none !important;
              }
              .visible-sm {
                display: block !important;
              }
              table.visible-sm {
                display: table;
              }
              tr.visible-sm {
                display: table-row !important;
              }
              th.visible-sm,
              td.visible-sm {
                display: table-cell !important;
              }
              table,  th {
                  border: 1px solid #eee;
                  width: 100%;
                  text-align: left;
                  padding: 3px;
                  font-size: 7px !important;
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
                  font-size: 7px
                }
              .table th {
                padding: 3px;
                vertical-align: top;
                border-bottom:1pt solid black;
                border-top:1pt solid black;
                border-collapse: collapse;
                border-spacing: 0;
              }
              .table td {
                padding: 3px;
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

              .logo-container {
                margin-bottom: 1rem !important;
              }
            
              .logo {
                  max-width: 100px !important; 
                  max-height: 100px !important;
                  width: auto !important;
                  height: auto !important;
                  object-fit: contain !important;
              }
              
              .report-info {
                  margin: 0.8rem 0;
                  
                  h5 {
                      font-size: 12px;
                      margin-bottom: 0.5rem;
                      font-weight: 500;
                  }
              }
            }
            nav, aside, footer, button {
              display: none !important;
            }
            </style>
          </head>
      <body onload="window.print();window.close();">${printContents}</body>
        </html>`);
      popupWin.document.close();
    }
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    if (this.endDate !== "" && this.endDate != null) {
      this.loader = true;
      // tslint:disable-next-line:radix
      this.pagination.pageSize = parseInt(pageSize);
      if (filter == null) {
        this.filterReport(pageNumber, filter);
        return;
      }
      filter = filter.trim();
      this.pagination.searchTerm = filter === "" ? null : filter;
      this.filterReport(pageNumber, filter);
    }
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }
}
