import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import {
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
} from "@angular/forms";
import swal from "sweetalert2";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Configuration } from "../../../model/configuration";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import {
  GetDataQueryParams,
  Pagination,
  SearchParams,
  TableConfig,
  TableData,
  TableHeader,
} from "../../shared/shared.types";
import { LoanApprovalWorkflow } from "../../loan-section/loan.types";
import GrowthBookFeatureTags from "src/app/model/growthbook-features";
import { GrowthbookService } from "src/app/service/growthbook.service";

@Component({
  selector: "app-loantypesotherparameters-page",
  templateUrl: "./loantypesotherparameters-page.component.html",
  styleUrls: ["./loantypesotherparameters-page.component.scss"],
})
export class LoantypesotherparametersPageComponent implements OnInit {
  public AddFeeForm: UntypedFormGroup;
  public EditFeeForm: UntypedFormGroup;
  public ViewFeeForm: UntypedFormGroup;
  fees: Configuration[];

  public AddThresholdForm: UntypedFormGroup;
  public EditThresholdForm: UntypedFormGroup;
  public ViewThresholdForm: UntypedFormGroup;
  thresholdparameters: Configuration[];

  public AddLoanOfferForm: UntypedFormGroup;
  public EditLoanOfferForm: UntypedFormGroup;
  public ViewLoanOfferForm: UntypedFormGroup;
  public loanTypesDict: any;
  public loanTypesForSelect: any[];
  public loanOffers: any[];
  public selectedLoanTypeId: any;
  public selectedLoanType: any;

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

  currentView = 1;
  requestLoader: boolean;
  loader = false;
  // dataTable: any;
  selectedFeeType: any;
  selectedFeeTypeArray: any;
  selectedThresholdType: any;
  selectedThresholdTypeArray: any;

  currentuser: any;
  currentuserid: any;
  ownerInformation: any;
  currentdate: any;
  currentuserbranchid: any;
  isEditing = false;

  public thresholdTypeArray: Array<string> = ["SettlementThresholdForPeriod"];
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();

  gettingApprovalWorkflows = false;
  approvalWorkflows: LoanApprovalWorkflow[] = [];
  tableConfig: TableConfig = {
    searchPlaceholder: "Name",
    uniqueIdPropLink: "name",
    striped: true,
  };
  tableHeaders: TableHeader[] = [
    { name: "Name" },
    { name: "Approval Levels" },
    { name: "Assigned Loan Types" },
    { name: "Created Date" },
    { name: "Action" },
  ];
  filterStatuses: CustomDropDown[] = [
    { id: "Active", text: "Active" },
    { id: "Inactive", text: "Inactive" },
  ];
  tableData: TableData[] = [];
  approvalWorkflowsPagination: Pagination = {
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
  selectedSearchColumn: string;
  keyword: string;
  growthBookFeatureTags = GrowthBookFeatureTags;

  constructor(
    private configurationService: ConfigurationService,
    private authService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService,
    private growthbookService: GrowthbookService
  ) {}

  ngOnInit() {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }

    this.getUserPromise()
      .then((next) => {
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        this.addFeeFormInit();
        this.addThresholdFormInit();
        this.AddLoanOfferFormInit();
        this.getLoanTypesForUssdLoanOffers();
        this.switchView(this.currentView);
      })
      .catch((err) => {
        // swal.fire('Error', 'User not Loaded');
        // if (this.httpFailureError) { swal.fire('Error', 'User not Loaded.', 'error'); }
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

  switchView(view: number) {
    const tabId = this.route.snapshot.queryParams["tab"];
    if (tabId) {
      view = +tabId;
    }

    if (view === 1) {
      this.currentView = 1;
      this.getFees();
    } else if (view === 2) {
      this.currentView = 2;
      this.getThresholdParameters();
    } else if (view === 3) {
      this.currentView = 3;
      this.getLoanTypesForUssdLoanOffers();
      this.getLoanOffers();
    } else if (view === 4) {
      this.currentView = view;
      this.getLoanApprovalWorkflows();
    }
  }

  getFees(pageNum = this.pagination.pageNum, filter = null) {
    this.fees = [];
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
      BranchId: this.currentuserbranchid,
      pageNumber: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
      filter: this.pagination.searchTerm,
    };

    this.configurationService.spoolFees(paginationmodel).subscribe(
      (response) => {
        this.fees = response.body.value.data;

        this.pagination.maxPage = response.body.value.pages;
        this.pagination.totalRecords = response.body.value.totalRecords;
        this.pagination.count = this.fees.length;
        this.pagination.jumpArray = Array(this.pagination.maxPage);
        for (let i = 0; i < this.pagination.jumpArray.length; i++) {
          this.pagination.jumpArray[i] = i + 1;
        }

        this.chRef.detectChanges();

        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = true;
        // swal.fire({   type: 'error',   title: 'Error',   text: error, });
      }
    );
  }

  getThresholdParameters(pageNum = this.pagination2.pageNum, filter = null) {
    this.thresholdparameters = [];
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
      BranchId: this.currentuserbranchid,
      pageNumber: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
      filter: this.pagination.searchTerm,
    };

    this.configurationService
      .spoolThresholdParameters(paginationmodel)
      .subscribe(
        (response) => {
          this.thresholdparameters = response.body.value.data;

          this.pagination2.maxPage = response.body.value.pages;
          this.pagination2.totalRecords = response.body.value.totalRecords;
          this.pagination2.count = this.thresholdparameters.length;
          this.pagination2.jumpArray = Array(this.pagination2.maxPage);
          for (let i = 0; i < this.pagination2.jumpArray.length; i++) {
            this.pagination2.jumpArray[i] = i + 1;
          }

          this.chRef.detectChanges();

          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = true;
          // swal.fire({   type: 'error',   title: 'Error',   text: error, });
        }
      );
  }

  openModal(content, size?: string) {
    this.modalService.open(content, {
      size,
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
    if (this.isEditing === true) {
      this.isEditing = false;
    }
  }

  addFeeFormInit() {
    this.AddFeeForm = new UntypedFormGroup({
      FeeName: new UntypedFormControl("", [Validators.required]),
      FeeDescription: new UntypedFormControl(""),
      UserId: new UntypedFormControl(""),
      BranchId: new UntypedFormControl(""),
      Status: new UntypedFormControl(""),
    });
  }

  addThresholdFormInit() {
    this.AddThresholdForm = new UntypedFormGroup({
      ThresholdParameterName: new UntypedFormControl("", Validators.required),
      ThresholdParameterType: new UntypedFormControl("", Validators.required),
      ThresholdParameterValue: new UntypedFormControl("", Validators.required),
      ThresholdParameterDescription: new UntypedFormControl(""),
      UserId: new UntypedFormControl(""),
      BranchId: new UntypedFormControl(""),
      Status: new UntypedFormControl(""),
    });
  }

  openEditModal(type, content, data) {
    if (type === "Fee") {
      this.EditFeeForm = new UntypedFormGroup({
        FeeId: new UntypedFormControl(data.feeId, [Validators.required]),
        FeeName: new UntypedFormControl(data.feeName, [Validators.required]),
        FeeDescription: new UntypedFormControl(data.feeDescription, [
          Validators.required,
        ]),
        UserId: new UntypedFormControl(data.UserId),
        BranchId: new UntypedFormControl(data.BranchId),
        Status: new UntypedFormControl(data.status, [Validators.required]),
      });

      this.selectedFeeTypeArray = [{ id: data.feeType, text: data.feeType }];
      this.selectedFeeType = data.feeType;
    } else if (type === "Threshold") {
      this.EditThresholdForm = new UntypedFormGroup({
        ThresholdParameterId: new UntypedFormControl(
          data.thresholdParameterId,
          Validators.required
        ),
        ThresholdParameterName: new UntypedFormControl(
          data.thresholdParameterName,
          Validators.required
        ),
        ThresholdParameterType: new UntypedFormControl(
          data.thresholdParameterType,
          Validators.required
        ),
        ThresholdParameterValue: new UntypedFormControl(
          data.thresholdParameterValue,
          Validators.required
        ),
        ThresholdParameterDescription: new UntypedFormControl(
          data.thresholdParameterDescription
        ),
        UserId: new UntypedFormControl(data.UserId),
        BranchId: new UntypedFormControl(data.BranchId),
        Status: new UntypedFormControl(data.status, Validators.required),
      });

      this.selectedThresholdTypeArray = [
        { id: data.thresholdParameterType, text: data.thresholdParameterType },
      ];
      this.selectedThresholdType = data.thresholdParameterType;
    } else if (type === "LoanOffer") {
      this.EditLoanOfferForm = new UntypedFormGroup({
        Name: new UntypedFormControl(data.name, [Validators.required]),
        LoanOfferId: new UntypedFormControl(data.loanOfferId, [
          Validators.required,
        ]),
        LoanAmount: new UntypedFormControl(data.loanAmount, [
          Validators.required,
        ]),
        LoanTypeId: new UntypedFormControl(data.loanTypeId, [
          Validators.required,
        ]),
        Default: new UntypedFormControl(data.default),
      });

      this.selectedLoanTypeId = data.loanTypeId;
      this.selectedLoanType = this.loanTypesDict[data.loanTypeId];
      this.EditLoanOfferForm.controls["LoanTypeId"].patchValue(
        this.selectedLoanTypeId
      );
      this.modalService.open(content, {
        size: "lg",
        centered: true,
        ariaLabelledBy: "modal-basic-title",
      });
      return;
    }

    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  openViewModal(type, content, data, element?: HTMLElement) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (!this.isEditing && element?.className.split(" ")[index] !== "show") {
        if (type === "Fee") {
          this.ViewFeeForm = new UntypedFormGroup({
            FeeId: new UntypedFormControl(data.feeID),
            FeeName: new UntypedFormControl(data.feeName),
            FeeDescription: new UntypedFormControl(data.feeDescription),
            Status: new UntypedFormControl(data.status, [Validators.required]),
          });
        } else if (type === "Threshold") {
          this.ViewThresholdForm = new UntypedFormGroup({
            ThresholdParameterId: new UntypedFormControl(
              data.thresholdParameterId,
              [Validators.required]
            ),
            ThresholdParameterName: new UntypedFormControl(
              data.thresholdParameterName,
              [Validators.required]
            ),
            ThresholdParameterType: new UntypedFormControl(
              data.thresholdParameterType
            ),
            ThresholdParameterValue: new UntypedFormControl(
              data.thresholdParameterValue
            ),
            ThresholdParameterDescription: new UntypedFormControl(
              data.thresholdParameterDescription
            ),
            Status: new UntypedFormControl(data.status, [Validators.required]),
          });
        } else if (type === "LoanOffer") {
          this.ViewLoanOfferForm = new UntypedFormGroup({
            Name: new UntypedFormControl(data.name, [Validators.required]),
            LoanAmount: new UntypedFormControl(data.loanAmount, [
              Validators.required,
            ]),
            LoanTypeId: new UntypedFormControl(data.loanTypeId, [
              Validators.required,
            ]),
            Default: new UntypedFormControl(data.default, [
              Validators.required,
            ]),
          });
          this.selectedLoanTypeId = data.loanTypeId;
          this.selectedLoanType = this.loanTypesDict[data.loanTypeId];
          this.ViewLoanOfferForm.controls["LoanTypeId"].patchValue(
            this.selectedLoanTypeId
          );
        }

        this.modalService.open(content, {
          size: "lg",
          centered: true,
          ariaLabelledBy: "modal-basic-title",
        });
      }
    });
  }

  submitEditFeeForm(val: any) {
    if (this.EditFeeForm.valid) {
      this.loader = true;

      this.EditFeeForm.controls["UserId"].patchValue(this.currentuserid);
      this.EditFeeForm.controls["BranchId"].patchValue(
        this.currentuserbranchid
      );
      this.configurationService.EditFee(this.EditFeeForm.value).subscribe(
        (res) => {
          swal.fire({
            type: "success",
            text: "Update Successful",
            title: "Success",
          });
          this.modalService.dismissAll();
          this.switchView(1);
          this.loader = false;
          this.isEditing = false;
        },
        (err) => {
          this.loader = false;
          // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
        }
      );
    }
  }

  submitEditThresholdForm(val: any) {
    if (this.EditThresholdForm.valid) {
      this.loader = true;

      this.EditThresholdForm.controls["UserId"].patchValue(this.currentuserid);
      this.EditThresholdForm.controls["BranchId"].patchValue(
        this.currentuserbranchid
      );
      this.EditThresholdForm.controls["ThresholdParameterType"].patchValue(
        this.selectedThresholdType
      );
      this.configurationService
        .EditThreshold(this.EditThresholdForm.value)
        .subscribe(
          (res) => {
            // tslint:disable-next-line:max-line-length
            swal.fire({
              type: "success",
              text:
                "Threshold Parameter: " +
                res.body?.thresholdParameterName +
                " has been updated",
              title: "Successful",
            });
            this.modalService.dismissAll();
            this.selectedThresholdType = "";
            this.switchView(2);
            this.loader = false;
            this.isEditing = false;
          },
          (err) => {
            this.loader = false;
            // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
          }
        );
    }
  }

  submitFeeForm(val: any) {
    if (this.AddFeeForm.valid) {
      this.loader = true;

      this.AddFeeForm.controls["UserId"].patchValue(this.currentuserid);
      this.AddFeeForm.controls["BranchId"].patchValue(this.currentuserbranchid);
      this.configurationService.createFee(this.AddFeeForm.value).subscribe(
        (res) => {
          swal.fire({
            type: "success",
            text: "Fee has been added",
            title: "Successful",
          });
          this.modalService.dismissAll();
          this.AddFeeForm.reset();

          this.switchView(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;
          // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
        }
      );
    }
  }

  submitThresholdForm(val: any) {
    if (this.AddThresholdForm.valid) {
      this.loader = true;

      this.AddThresholdForm.controls["UserId"].patchValue(this.currentuserid);
      this.AddThresholdForm.controls["BranchId"].patchValue(
        this.currentuserbranchid
      );
      this.AddThresholdForm.controls["ThresholdParameterType"].patchValue(
        this.selectedThresholdType
      );
      this.configurationService
        .createThresholdParameter(this.AddThresholdForm.value)
        .subscribe(
          (res) => {
            swal.fire({
              type: "success",
              text: "Threshold Parameter has been added",
              title: "Successful",
            });
            this.modalService.dismissAll();
            this.AddThresholdForm.reset();
            this.selectedThresholdType = "";
            this.switchView(2);
            this.loader = false;
          },
          (err) => {
            this.loader = false;
            // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
          }
        );
    }
  }

  selected(type: string, value: CustomDropDown) {
    if (type === "Threshold") {
      this.selectedThresholdType = value.text;
      if (this.isEditing) {
        this.EditThresholdForm.get("ThresholdParameterType").setValue(
          value.text
        );
      } else {
        this.AddThresholdForm.get("ThresholdParameterType").setValue(
          value.text
        );
      }
    } else {
      this.selectedFeeType = value.text;
    }
  }

  onRemoved() {
    if (this.isEditing) {
      this.EditThresholdForm.get("ThresholdParameterType").setValue("");
    } else {
      this.AddThresholdForm.get("ThresholdParameterType").setValue("");
    }
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getFees(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination.searchTerm = filter === "" ? null : filter;
    this.getFees(pageNumber, filter);
  }

  getItemsPaginatedSearch2(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    // tslint:disable-next-line:radix
    this.pagination2.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getThresholdParameters(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination2.searchTerm = filter === "" ? null : filter;
    this.getThresholdParameters(pageNumber, filter);
  }

  getItemsPaginatedSearchLoanOffer(filter, pageSize, pageNumber) {
    this.requestLoader = true;

    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getLoanOffers(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination.searchTerm = filter === "" ? null : filter;
    this.getLoanOffers(pageNumber, filter);
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

  getLoanOffers(pageNum = this.pagination.pageNum, filter = null) {
    this.loanOffers = [];
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
      BranchId: this.currentuserbranchid,
      pageNumber: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
      filter: this.pagination.searchTerm,
    };

    this.configurationService.spoolLoanOffers(paginationmodel).subscribe(
      (response) => {
        this.loanOffers = response.body.data;
        this.pagination.maxPage = response.body.pages;
        this.pagination.totalRecords = response.body.totalRecords;
        this.pagination.count = this.loanOffers.length;
        this.pagination.jumpArray = Array(this.pagination.maxPage);
        for (let i = 0; i < this.pagination.jumpArray.length; i++) {
          this.pagination.jumpArray[i] = i + 1;
        }

        this.chRef.detectChanges();
        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = true;
      }
    );
  }

  AddLoanOfferFormInit() {
    this.AddLoanOfferForm = new UntypedFormGroup({
      Name: new UntypedFormControl("", [Validators.required]),
      LoanAmount: new UntypedFormControl("", [Validators.required]),
      LoanTypeId: new UntypedFormControl("", [Validators.required]),
    });
  }

  getLoanTypesForUssdLoanOffers() {
    this.loanTypesDict = {};
    this.loanTypesForSelect = [];
    this.configurationService.spoolLoanTypesForUssdLoanOffers().subscribe(
      (res) => {
        let data = res.body;

        this.loanTypesForSelect = data.map((x) => {
          return { id: x.loanTypeId, text: x.loanName };
        });

        this.loanTypesDict = {};
        data.forEach((element) => {
          this.loanTypesDict[element.loanTypeId] = element;
        });
      },
      (err) => {}
    );
  }

  submitLoanOfferForm(val: any) {
    if (this.AddLoanOfferForm.valid) {
      if (this.showAddFormLoanAmountError()) {
        swal.fire({
          type: "error",
          text: "Amount out of boundaries set for loan type",
          title: "Error",
        });
        return;
      }
      this.loader = true;

      this.configurationService
        .addLoanOffer(this.AddLoanOfferForm.value)
        .subscribe(
          (res) => {
            swal.fire({
              type: "success",
              text: "Loan Offer has been added",
              title: "Successful",
            });
            this.modalService.dismissAll();
            this.AddLoanOfferForm.reset();
            this.selectedLoanTypeId = null;
            this.selectedLoanType = null;
            this.switchView(3);
            this.loader = false;
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  submitEditLoanOfferForm(val: any) {
    if (this.EditLoanOfferForm.valid) {
      if (this.showEditFormLoanAmountError()) {
        swal.fire({
          type: "error",
          text: "Amount Exceeds Boundaries of loan type",
          title: "Error",
        });
        return;
      }
      this.loader = true;
      this.configurationService
        .editLoanOffer(this.EditLoanOfferForm.value)
        .subscribe(
          (res) => {
            swal.fire({
              type: "success",
              text: "Loan Offer has been updated",
              title: "Successful",
            });
            this.modalService.dismissAll();
            this.EditLoanOfferForm.reset();
            this.selectedLoanTypeId = null;
            this.selectedLoanType = null;
            this.switchView(3);
            this.loader = false;
            this.isEditing = false;
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  onSelectAddLoanType(data) {
    this.selectedLoanTypeId = data.id;
    this.selectedLoanType = this.loanTypesDict[this.selectedLoanTypeId];
    this.AddLoanOfferForm.controls["LoanTypeId"].patchValue(
      this.selectedLoanTypeId
    );
  }

  onSelectEditLoanType(data) {
    this.selectedLoanTypeId = data.id;
    this.selectedLoanType = this.loanTypesDict[this.selectedLoanTypeId];
    this.EditLoanOfferForm.controls["LoanTypeId"].patchValue(
      this.selectedLoanTypeId
    );
  }

  showAddFormLoanAmountError() {
    if (this.selectedLoanType != null) {
      let val = this.AddLoanOfferForm.value.LoanAmount;
      let minamount = this.selectedLoanType.minAmount;
      let maxamount = this.selectedLoanType.maxAmount;
      return minamount > val || maxamount < val;
    } else {
      return false;
    }
  }

  showEditFormLoanAmountError() {
    if (this.selectedLoanType != null) {
      let val = this.EditLoanOfferForm.value.LoanAmount;
      let minamount = this.selectedLoanType.minAmount;
      let maxamount = this.selectedLoanType.maxAmount;
      return minamount > val || maxamount < val;
    } else {
      return false;
    }
  }

  getLoanApprovalWorkflows() {
    this.gettingApprovalWorkflows = true;

    const data: GetDataQueryParams = {
      pageNumber: this.approvalWorkflowsPagination.pageNumber,
      pageSize: this.approvalWorkflowsPagination.pageSize,
    };

    if (this.keyword) {
      data.keyword = this.keyword;
    }
    if (this.selectedSearchColumn) {
      data.selectedSearchColumn = this.selectedSearchColumn;
    }

    this.configurationService
      .getLoanApprovalWorkflows(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.approvalWorkflows = res.body?.items;
          this.setTableData();
          this.setPagination(res.body);
          this.gettingApprovalWorkflows = false;
        },
        error: () => {
          this.gettingApprovalWorkflows = false;
        },
      });
  }

  setTableData() {
    this.tableData = this.approvalWorkflows.map((appr) => ({
      name: { tdValue: appr.name },
      approvalLevels: {
        tdValue: appr.approvalLevelsCount,
        alignment: "center",
      },
      assignedLoanTypes: {
        tdValue: appr.assignedLoanTypes.length,
        alignment: "center",
      },
      createdAt: { tdValue: appr.createdAt, type: "date", alignment: "center" },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(appr.id),
      },
    }));
  }

  getActionConfig(id: number) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () =>
          this.router.navigateByUrl(
            `/configurations/parameterssetup/loan-approval-workflows/${id}`
          ),
      },
      {
        showBtn: true,
        iconClass: "icon-edit",
        btnText: "Manage",
        funcRef: () =>
          this.router.navigateByUrl(
            `/configurations/parameterssetup/loan-approval-workflows/edit/${id}`
          ),
      },
    ];
  }

  setPagination(res: any): void {
    this.approvalWorkflowsPagination = res;
    this.approvalWorkflowsPagination.count = res.items.length;

    this.approvalWorkflowsPagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.approvalWorkflowsPagination.jumpArray.push(i);
    }
  }

  onPaginationChange(data: { pageSize: number; pageNumber: number }) {
    this.approvalWorkflowsPagination.pageNumber = data.pageNumber;
    this.approvalWorkflowsPagination.pageSize = data.pageSize;
    this.getLoanApprovalWorkflows();
  }

  onSearchParams(data: SearchParams) {
    this.keyword = data.keyword;
    this.selectedSearchColumn = data.selectedSearchColumn;
    this.getLoanApprovalWorkflows();
  }

  isFeatureEnabled(feature: GrowthBookFeatureTags): boolean {
    switch (feature) {
      case GrowthBookFeatureTags.LoanApprovalWorkflow: {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.LoanApprovalWorkflow
        );
      }
    }
  }
}
