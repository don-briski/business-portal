import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { UntypedFormGroup, Validators, UntypedFormControl } from "@angular/forms";
import swal from "sweetalert2";
import { NgbModal, NgbModalConfig } from "@ng-bootstrap/ng-bootstrap";
import { Configuration } from "../../../model/configuration";
import { ConfigurationService } from "../../../service/configuration.service";
import { LoanoperationsService } from "../../../service/loanoperations.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { RealtimeService } from "../../../service/realtime.service";
import { SelectionModel } from "@angular/cdk/collections";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { map, takeUntil } from "rxjs/operators";
import { SharedService } from "src/app/service/shared.service";
import { PillFilters } from "src/app/model/CustomDropdown";
import { GetLoansInApplicationPoolOrDisbReq, LoanInApplicationPool } from "../../loan-section/loan.types";
import { Pagination } from "../../shared/shared.types";

enum PoolType {
  "ApplicationPool" = "applicationpool",
  "DisbursementPool" = "disbursementpool",
}
@Component({
  selector: "app-pool-page",
  templateUrl: "./pool-page.component.html",
  styleUrls: ["./pool-page.component.scss"],
})
export class PoolPageComponent implements OnInit {
  public AddClaimForm: UntypedFormGroup;
  public AddDisbursementClaimForm: UntypedFormGroup;

  // private baseUrl = environment.frontEndUrl;

  //filtering
  filterForm: UntypedFormGroup;
  filterFormData: any = {
    loantypesArray: [],
    branchesAccessibleArray: [],
    selectedBranchIds: [],
    selectedBranches: [],
    selectedLoanIds: [],
    selectedLoans: [],
  };

  currentuser: any;
  currentuserid: any;
  ownerInformation: any;
  currentdate: any;
  currentuserbranchid: any;
  testuserid: any;
  testuserbranchid: any;
  applications: LoanInApplicationPool[];
  disbursements: LoanInApplicationPool[];
  pagination:Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
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
  selectedAll: any;
  selection = new SelectionModel<LoanInApplicationPool>(true, []);
  disbSelection = new SelectionModel<LoanInApplicationPool>(true, []);

  currentview:PoolType = PoolType.ApplicationPool;
  poolType = PoolType;
  requestLoader: boolean;
  loader = false;
  // dataTable: any;
  // dataTable2: any;

  metricsdata: any;
  getParams = {
    view: null,
  };

  selectedApplicationsForClaimArray = new Array();
  selectedDisbursementsForClaimArray = new Array();

  claimedloansfromfeedback = new Array();
  public loggedInUser: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  // selectedFilters = [];
  currencySymbol: string;

  constructor(
    private configurationService: ConfigurationService,
    private loanoperationService: LoanoperationsService,
    public authService: AuthService,
    private userService: UserService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private realtimeService: RealtimeService,
    private sharedService: SharedService,
    config: NgbModalConfig,
    private colorThemeService: ColorThemeService
  ) {
    config.backdrop = "static";
    config.keyboard = false;
  }

  ngOnInit() {
    this.getCurrencySymbol();
    this.removePill();
    this.loadTheme();
    this.realTimeStuff();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }

    this.getUserPromise().then((next) => {
      $(document).ready(() => {
        $.getScript("assets/js/script.js");
      });
      this.getConstants();
      this.getToday();

      this.addClaimFormInit();
      this.addDisbursementClaimFormInit();

      this.route.paramMap.subscribe((params: ParamMap) => {
        this.getParams.view = params.get("view");
      });

      if (this.getParams.view) {
        this.currentview = this.getParams.view;
      }

      this.switchviews(this.currentview);
    });
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

  removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters) => {
        if (selectedFilters.action === "remove") {
          this.filterFormData.selectedBranchIds = [];
          this.filterFormData.selectedBranches = [];
          this.filterFormData.selectedLoans = [];
          this.filterFormData.selectedLoanIds = [];
          selectedFilters.filters.forEach((selectedFilter) => {
            selectedFilter.forEach((filter) => {
              if (filter.type === "branch") {
                this.filterFormData.selectedBranchIds.push(filter.id);
                this.filterFormData.selectedBranches.push(filter);
              }
              if (filter.type === "loan") {
                this.filterFormData.selectedLoanIds.push(filter.id);
                this.filterFormData.selectedLoans.push(filter);
              }
            });
          });
          this.currentview === PoolType.ApplicationPool
            ? this.filterLoans("applications")
            : this.filterLoans("disbursments");
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

  realTimeStuff() {
    this.realtimeService.NewApplication.subscribe((res) => {
      this.getApplicationPool();
    });
  }

  selectAll() {
    const numSelected = this.selection.selected.length;
    const numRows = this.applications.length;
    this.applications.forEach((row) => this.selection.select(row));
    return numSelected === numRows;
  }

  selectAllDisb() {
    const numSelected = this.disbSelection.selected.length;
    const numRows = this.disbursements.length;
    this.disbursements.forEach((row) => this.disbSelection.select(row));
    return numSelected === numRows;
  }

  clearSelection() {
    this.selectedApplicationsForClaimArray.length = 0;
    this.selection.clear();
  }
  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.selectAll()) {
      this.clearSelection();
    } else {
      this.selectedApplicationsForClaimArray = [];
      this.selection.selected.forEach((row) =>
        this.selectedApplicationsForClaimArray.push({
          id: row.loanId,
          amount: row.loanAmount,
          code: row.applicationCode,
          name: row.customerName,
        })
      );
    }
  }
  clearDisbSelection() {
    this.selectedDisbursementsForClaimArray.length = 0;
    this.disbSelection.clear();
  }
  masterDisbToggle() {
    if (this.selectAllDisb()) {
      this.clearDisbSelection()
    } else {
      this.selectedDisbursementsForClaimArray = [];
      this.disbSelection.selected.forEach((row) =>
          this.selectedDisbursementsForClaimArray.push({
            id: row.loanId,
            amount: row.loanAmount,
            code: row.applicationCode,
            name: row.customerName,
          })
        );
    }
  }

  switchviews(view:PoolType) {
    if (view === PoolType.ApplicationPool) {
      this.currentview = PoolType.ApplicationPool;
      this.getApplicationPool();
      this.requestLoader = true;
    } else if (view === PoolType.DisbursementPool) {
      this.currentview = PoolType.DisbursementPool;
      this.getDisbursementPool();
      this.requestLoader = true;
    }
  }

  openModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  addClaimFormInit() {
    this.AddClaimForm = new UntypedFormGroup({
      LoanIds: new UntypedFormControl(""),
      AssignerUserID: new UntypedFormControl(this.currentuserid),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
    });
  }

  addDisbursementClaimFormInit() {
    this.AddDisbursementClaimForm = new UntypedFormGroup({
      LoanIds: new UntypedFormControl(""),
      // AssignerUserID: new FormControl(this.currentuserid),
      UserId: new UntypedFormControl(this.currentuserid),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
    });
  }

  setFilters(filterParams) {
    if (filterParams) {
      const selectedFilters: PillFilters = {
        filters: [
          this.filterFormData.selectedBranches,
          this.filterFormData.selectedLoans,
        ],
        action: "add",
        headers: ["Branches", "Loans"],
      };

      this.sharedService.selectedFilters$.next(selectedFilters);
    }
  }

  onSearchParams(type:'applicationPool'|'disbursementPool',event){
    if (type === 'applicationPool') {
      this.getApplicationPool(this.pagination.pageNumber,null,null,event);
    } else {
      this.getDisbursementPool(this.pagination2.pageNum,null,null,event);
    }
  }

  setPagination(res): void {
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

  getApplicationPool(
    pageNum = this.pagination.pageNumber,
    filter = null,
    filterParams = null,
    searchParams = null
  ) {
    this.applications = [];
    this.requestLoader = true;

    let paginationModel:GetLoansInApplicationPoolOrDisbReq = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    }

    if (searchParams) {
      paginationModel = {...paginationModel,...searchParams};
    }

    if (filterParams) {
      paginationModel = {...paginationModel,...filterParams}
    }

    this.setFilters(filterParams);
    this.loanoperationService.getLoansInApplicationPool(paginationModel).pipe(takeUntil(this.unsubscriber$)).subscribe(
      (response) => {
        this.applications = response.body.items.map(pool => ({...pool,customerImageUrl:pool?.customerImageUrl || 'assets/images/male-default-profile.png'}));

        this.setPagination(response.body);
        this.requestLoader = false;
        this.loader = false;
      },
      () => {
        this.requestLoader = false;

      }
    );
  }

  getDisbursementPool(
    pageNum = this.pagination2.pageNum,
    filter = null,
    filterParams = null,
    searchParams = null
  ) {
    this.disbursements = [];
    this.requestLoader = true;

    let paginationModel:GetLoansInApplicationPoolOrDisbReq = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    }

    if (searchParams) {
      paginationModel = {...paginationModel,...searchParams};
    }

    if (filterParams) {
      paginationModel = {...paginationModel,...filterParams}
    }

    this.setFilters(filterParams);

    this.loanoperationService.getLoansInDisbPool(paginationModel).subscribe(
      (response) => {
        this.disbursements = response.body.items.map(pool => ({...pool,customerImageUrl:pool?.customerImageUrl || 'assets/images/male-default-profile.png'}));
        this.setPagination(response.body);

        this.requestLoader = false;
        this.loader = false;
      },
      () => {
        this.requestLoader = false;
      }
    );
  }

  isSelected(collection, id) {
    return collection.find((app) => app.id === id);
  }

  selectMultipleClaim(type, index, id, code, amount, name) {

    if (type === "applications") {
      const found = this.selectedApplicationsForClaimArray.some(
        (item) => item.id === id
      );

      const element = document.getElementById(
        `checkbox-${index}`
      ) as HTMLInputElement;
      if (element.checked) {
        this.selectedApplicationsForClaimArray.push({ id, code, amount, name });
      } else {
        this.selectedApplicationsForClaimArray =
          this.selectedApplicationsForClaimArray.filter(
            (application) => application.id !== id
          );
      }

      // tslint:disable-next-line:max-line-length
      // if (found) {    } else {  }
    } else if (type === "disbursements") {
      const found = this.selectedDisbursementsForClaimArray.some(
        (item) => item.id === id
      );

      const element = document.getElementById(
        `disbCheckbox-${index}`
      ) as HTMLInputElement;
      if (element.checked) {
        this.selectedDisbursementsForClaimArray.push({
          id,
          code,
          amount,
          name,
        });
      } else {
        this.selectedDisbursementsForClaimArray =
          this.selectedDisbursementsForClaimArray.filter(
            (disb) => disb.id !== id
          );
      }

      // tslint:disable-next-line:max-line-length
      // if (found) {   this.selectedDisbursementsForClaimArray.splice(this.selectedDisbursementsForClaimArray.indexOf(index), 1); } else { this.selectedDisbursementsForClaimArray.push({id, code, amount, name}); }
    }
  }

  selectClaim(content, type, index, id, code, amount, name) {

    this.selection.clear();
    this.disbSelection.clear();
    if (type === "applications") {
      this.selectedApplicationsForClaimArray = [];

      const found = this.selectedApplicationsForClaimArray.some(
        (item) => item.id === id
      );

      // tslint:disable-next-line:max-line-length
      if (found) {
        this.selectedApplicationsForClaimArray.splice(
          this.selectedApplicationsForClaimArray.indexOf(index),
          1
        );
      } else {
        this.selectedApplicationsForClaimArray.push({ id, code, amount, name });
      }

      this.modalService.open(content, {
        centered: true,
        ariaLabelledBy: "modal-basic-title",
      });
    } else if (type === "disbursements") {
      this.selectedDisbursementsForClaimArray = [];

      const found = this.selectedDisbursementsForClaimArray.some(
        (item) => item.id === id
      );

      // tslint:disable-next-line:max-line-length
      if (found) {
        this.selectedDisbursementsForClaimArray.splice(
          this.selectedDisbursementsForClaimArray.indexOf(index),
          1
        );
      } else {
        this.selectedDisbursementsForClaimArray.push({
          id,
          code,
          amount,
          name,
        });
      }

      this.modalService.open(content, {
        centered: true,
        ariaLabelledBy: "modal-basic-title",
      });
    }
  }

  getPoolCount() {
    this.loanoperationService
      .spoolPoolMetrics(this.currentuserbranchid, this.currentuserid)
      .subscribe(
        (response) => {
          this.metricsdata = response.body;
        },
        (error) => {
          // swal.fire({   type: 'error',   title: 'Error',   text: error, });
          //swal.fire('Error', error, 'error');
        }
      );
  }

  getConstants() {
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
      },
      (error) => {
        // swal.fire({   type: 'error',   title: 'Error',   text: error, });
        //swal.fire('Error', error, 'error');
      }
    );

    this.loanoperationService
      .spoolPoolMetrics(this.currentuserbranchid, this.currentuserid)
      .subscribe(
        (response) => {
          this.metricsdata = response.body;
        },
        (error) => {
          //  swal.fire({   type: 'error',   title: 'Error',   text: error, });
          //swal.fire('Error', error, 'error');
        }
      );
  }

  submitClaimForm(val: any, content) {
    if (this.AddClaimForm.valid) {
      this.loader = true;

      // tslint:disable-next-line:variable-name
      const entry_lines = [];
      this.selectedApplicationsForClaimArray.forEach((line, index) => {
        entry_lines.push({
          LoanId: line.id,
          LoanCode: line.code,
          UserId: this.currentuserid,
        });
      });

      if (entry_lines.length === 0) {
        // tslint:disable-next-line:max-line-length
        swal.fire({
          type: "info",
          title: "Empty Claim List",
          text: "Please select applications to claim and try again",
        });
      } else {
        this.AddClaimForm.controls["LoanIds"].patchValue(
          JSON.stringify(entry_lines)
        );
        this.AddClaimForm.controls["AssignerUserID"].patchValue(
          this.currentuserid
        );

        let payload;
        if (this.AddClaimForm.value.LoanIds) {
          const LoanIds = JSON.parse(this.AddClaimForm.value.LoanIds)
          payload = {loanIds:LoanIds.map(loanId => (loanId.LoanId))}
        }

        this.loanoperationService.claimLoans(payload,this.AddClaimForm.value?.TransactionPin).subscribe(
          (res) => {
            // tslint:disable-next-line:max-line-length
            swal
              .fire({
                type: "success",
                text: res.body?.data ,
                title: "Successful",
                showCancelButton: true,
                cancelButtonColor: "#B85353",
                cancelButtonText: "Claim another",
                confirmButtonText: "Review now",
                confirmButtonColor: "#558E90",
              })
              .then((result) => {
                if (result.value) {
                  this.claimedloansfromfeedback = [];
                  this.modalService.dismissAll();
                  this.router.navigate(["/loan/claimed-applications"]);
                } else {
                  this.AddClaimForm.reset();
                  this.loader = false;
                  this.selectedApplicationsForClaimArray = [];
                  this.clearSelection();
                  this.getConstants();
                  this.switchviews(PoolType.ApplicationPool);

                  this.modalService.dismissAll();
                }
              });
          },
          (error) => {
            this.loader = false;
            // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
            //swal.fire('Error', error.error, 'error');
          }
        );
      }
    }
  }

  submitDisbursementClaimForm(val: any, content) {
    if (this.AddDisbursementClaimForm.valid) {
      this.loader = true;

      // tslint:disable-next-line:variable-name
      const entry_lines = [];
      this.selectedDisbursementsForClaimArray.forEach((line, index) => {
        entry_lines.push({
          LoanId: line.id,
          LoanCode: line.code,
          UserId: this.currentuserid,
        });
      });

      if (entry_lines.length === 0) {
        swal.fire({
          type: "info",
          title: "Empty Claim List",
          text: "Please select applications to claim and try again",
        });
        this.loader = false;
      } else {
        this.AddDisbursementClaimForm.controls["LoanIds"].patchValue(
          JSON.stringify(entry_lines)
        );
        this.AddDisbursementClaimForm.controls["UserId"].patchValue(
          this.currentuserid
        );

        this.loanoperationService
          .createBatch(this.AddDisbursementClaimForm.value)
          .subscribe(
            (res) => {
              // tslint:disable-next-line:max-line-length
              swal
                .fire({
                  type: "success",
                  text: res.body.value.feedbackmessage,
                  title: "Successful",
                  showCancelButton: true,
                  cancelButtonColor: "#B85353",
                  cancelButtonText: "Claim another",
                  confirmButtonText: "View Batches",
                  confirmButtonColor: "#558E90",
                })
                .then((result) => {
                  if (result.value) {
                    this.claimedloansfromfeedback = [];
                    this.modalService.dismissAll();

                    this.router.navigate([
                      "/loan/disbursements/disbursementbatches",
                    ]);
                  } else {
                    this.AddDisbursementClaimForm.reset();
                    this.loader = false;
                    this.selectedDisbursementsForClaimArray = [];
                    this.clearDisbSelection();

                    this.getConstants();
                    this.switchviews(PoolType.DisbursementPool);

                    this.modalService.dismissAll();
                  }
                });
            },
            (error) => {
              this.loader = false;
              // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
              //swal.fire('Error', error, 'error');
            }
          );
      }
    }
  }

  closeModal() {
    this.clearSelection();
    this.clearDisbSelection();
    this.modalService.dismissAll();
  }
  showActions() {
    $(".help-button-wrapper").toggleClass("expanded");
  }

  getTotalSection(type, arrayinput) {
    let total = 0;

    if (type === "applications" || type === "disbursements") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].amount;
        }
      }
    }
    return total;
  }

  test() {}

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.clearSelection();
    this.requestLoader = true;
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getApplicationPool(pageNumber, filter, {
        branches: this.filterFormData.selectedBranchIds,
        loanProducts: this.filterFormData.selectedLoanIds,
      });
      return;
    }
    filter = filter.trim();
    this.pagination.keyword = filter === "" ? null : filter;
    this.getApplicationPool(pageNumber, filter, {
      branches: this.filterFormData.selectedBranchIds,
      loanProducts: this.filterFormData.selectedLoanIds,
    });
  }

  getItemsPaginatedSearch2(filter, pageSize, pageNumber) {
    this.clearDisbSelection();
    this.requestLoader = true;
    // tslint:disable-next-line:radix
    this.pagination2.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getDisbursementPool(pageNumber, filter, {
        branches: this.filterFormData.selectedBranchIds,
        loanProducts: this.filterFormData.selectedLoanIds,
      });
      return;
    }
    filter = filter.trim();
    this.pagination2.searchTerm = filter === "" ? null : filter;
    this.getDisbursementPool(pageNumber, filter, {
      branches: this.filterFormData.selectedBranchIds,
      loanProducts: this.filterFormData.selectedLoanIds,
    });
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  filterModalOpen() {
    //this.ResetReportAsideContent();

    $(".filter-menu").toggle();

    if (!this.filterForm) {
      this.filterFormInit();
    }
    this.loadFilterDropdownData();
  }

  filterFormInit() {
    this.filterForm = new UntypedFormGroup({
      // BranchId: new FormControl(this.userInfo.branchId, [Validators.required]),
      BranchesList: new UntypedFormControl(""),
      LoanTypeList: new UntypedFormControl(""),
    });
  }

  closeFilterModal() {
    $(".filter-menu").toggle();
  }

  loadFilterDropdownData() {
    const datamodel = { filter: "", UserId: this.loggedInUser.nameid };
    this.configurationService.spoolAccessibleBranches(datamodel).subscribe(
      (response) => {
        this.filterFormData.branchesAccessibleArray = response.body.map(
          (item) => {
            return { id: item.branchId, text: item.branchName };
          }
        );
        this.requestLoader = false;
      },
      (error) => {
        // swal.fire('Error', error.error, 'error');
      }
    );

    this.configurationService.spoolAccessibleLoanTypes(datamodel).subscribe(
      (response) => {
        this.filterFormData.loantypesArray = response.body.map((item) => {
          return { id: item.loanTypeId, text: item.loanName };
        });
      },
      (error) => {
        // swal.fire('Error', error.error, 'error');
      }
    );
  }

  filterLoans(tab, pageNum = this.pagination.pageNumber) {
    if (this.filterForm.valid) {
      this.loader = true;
      this.getConstants();

      if (tab === "applications") {
        this.getItemsPaginatedSearch(
          this.pagination.keyword,
          this.pagination.pageSize,
          1
        );
      } else if (tab === "disbursments") {
        this.getItemsPaginatedSearch2(
          this.pagination.keyword,
          this.pagination.pageSize,
          1
        );
      }
    }

    this.closeFilterModal();
  }

  selected(type, data, index) {
    if (type === "OutputType") {
      this.filterFormData.selectedOutputType = data.id;
    } else if (type === "AccessibleBranch") {
      if (this.filterFormData.selectedBranchIds.includes(data.id)) return;
      this.filterFormData.selectedBranchIds.push(data.id);
      this.filterFormData.selectedBranches.push({ ...data, type: "branch" });
    } else if (type === "LoanTypes") {
      if (this.filterFormData.selectedLoanIds.includes(data.id)) return;
      this.filterFormData.selectedLoanIds.push(data.id);
      this.filterFormData.selectedLoans.push({ ...data, type: "loan" });
    }
  }

  removed(type, data) {
    if (type === "Branch") {
      // this.selectedBranchID.splice(this.selectedRejectionReasonsIDs.indexOf(data.id), 1);
    } else if (type === "AccessibleBranch") {
      if (!this.filterFormData.selectedBranchIds.includes(data.id)) return;
      this.filterFormData.selectedBranchIds.splice(
        this.filterFormData.selectedBranchIds.indexOf(data),
        1
      );
    } else if (type === "LoanTypes") {
      if (!this.filterFormData.selectedLoanIds.includes(data.id)) return;
      this.filterFormData.selectedLoanIds.splice(
        this.filterFormData.selectedLoanIds.indexOf(data),
        1
      );
    }
  }

  // getUserInfo() {
  //   this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
  //     (res) => {

  //     },
  //     (error) => {
  //       // swal.fire({   type: 'error',   title: 'Error',   text: err, });
  //      swal.fire('Error', error.error, 'error');
  //     }
  //   );
  // }

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
        return diffDays + " day ago";
      } else {
        return diffDays + " days ago";
      }
    }
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
}
