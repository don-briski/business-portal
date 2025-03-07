import { Component, OnInit, ChangeDetectorRef, ViewChild } from "@angular/core";
import {
  FormBuilder,
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
import { TokenRefreshErrorHandler } from "src/app/service/TokenRefreshErrorHandler";
import { Router } from "@angular/router";

@Component({
  selector: "app-loanoffers-page",
  templateUrl: "./loanoffers-page.component.html",
  styleUrls: ["./loanoffers-page.component.scss"],
})
export class LoanoffersPageComponent implements OnInit {
  // @ViewChild('editLoanTypeSelect', {static: false}) editLoanTypeSelect;
  // @ViewChild('editDefaultSelect', {static: false}) editDefaultSelect;

  public AddLoanOfferForm: UntypedFormGroup;
  public EditLoanOfferForm: UntypedFormGroup;
  public ViewLoanOfferForm: UntypedFormGroup;

  loanTypesDict: any;
  loanTypesForSelect: [];

  defaultSelect: any[] = [
    { id: true, text: "Yes" },
    { id: false, text: "No" },
  ];

  loanOffers: [];
  selectedLoanType: any;
  selectedLoanTypeId: any;

  currentuser: any;
  currentuserid: any;
  ownerInformation: any;
  currentdate: any;
  currentuserbranchid: any;

  pagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  currentview: any;
  requestLoader: boolean;
  loader = false;

  public loggedInUser: any;

  // public categoryApplicableFees : Array<string>;

  constructor(
    private configurationService: ConfigurationService,
    public authService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private userService: UserService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router
  ) {}

  ngOnInit() {
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
        this.currentview = 1;
        //    this.requestLoader = true;
        this.AddLoanOfferFormInit();
        this.switchviews(this.currentview);
        this.getLoanTypesForUssdLoanOffers();
      })
      .catch((err) => {});
  }

  switchviews(view) {
    if (view === 1) {
      this.currentview = 1;
      this.getLoanOffers();
      this.requestLoader = true;
      this.getConstants();
    } else if (view === 2) {
      this.currentview = 2;
    }
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

  openModal(content) {
    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "loantypes-class",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  AddLoanOfferFormInit() {
    this.AddLoanOfferForm = new UntypedFormGroup({
      // Name: new FormControl('', [Validators.required]),
      LoanAmount: new UntypedFormControl("", [Validators.required]),
      LoanTypeId: new UntypedFormControl("", [Validators.required]),
      Default: new UntypedFormControl(false, [Validators.required]),
    });
  }

  openViewModal(content, loanOffer) {
    this.ViewLoanOfferForm = new UntypedFormGroup({
      // Name: new FormControl('', [Validators.required]),
      LoanAmount: new UntypedFormControl(loanOffer.loanAmount, [Validators.required]),
      LoanTypeId: new UntypedFormControl(loanOffer.loanTypeId, [Validators.required]),
      Default: new UntypedFormControl(loanOffer.default, [Validators.required]),
    });
    this.selectedLoanTypeId = loanOffer.loanTypeId;
    this.selectedLoanType = this.loanTypesDict[loanOffer.loanTypeId];
    this.ViewLoanOfferForm.controls["LoanTypeId"].patchValue(
      this.selectedLoanTypeId
    );
    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  submitLoanOfferForm(val: any) {
    if (this.AddLoanOfferForm.valid) {
      if (this.showAddFormLoanAmountError()) {
        swal.fire({
          type: "error",
          text: "Amount Exceeds Boundaries of loan type",
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
            this.switchviews(1);
            this.loader = false;
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  openEditModal(content, loanOffer) {
    this.EditLoanOfferForm = new UntypedFormGroup({
      // Name: new FormControl(loanOffer.name, [Validators.required]),
      LoanOfferId: new UntypedFormControl(loanOffer.loanOfferId, [
        Validators.required,
      ]),
      LoanAmount: new UntypedFormControl(loanOffer.loanAmount, [Validators.required]),
      LoanTypeId: new UntypedFormControl(loanOffer.loanTypeId, [Validators.required]),
      Default: new UntypedFormControl(loanOffer.default, [Validators.required]),
    });

    this.selectedLoanTypeId = loanOffer.loanTypeId;
    this.selectedLoanType = this.loanTypesDict[loanOffer.loanTypeId];
    this.EditLoanOfferForm.controls["LoanTypeId"].patchValue(
      this.selectedLoanTypeId
    );

    // this.editLoanTypeSelect.select(loanOffer.loanTypeId);

    // if (loanOffer.default) {
    //   this.editDefaultSelect.select(true);
    // } else {
    //   this.editDefaultSelect.select(-1);
    // }

    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
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
            this.switchviews(1);
            this.loader = false;
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  getConstants() {
    this.requestLoader = false;
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
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

  onSelectAddLoanType(data) {
    this.selectedLoanTypeId = data.id;
    this.selectedLoanType = this.loanTypesDict[this.selectedLoanTypeId];
    this.AddLoanOfferForm.controls["LoanTypeId"].patchValue(
      this.selectedLoanTypeId
    );
  }

  onSelectAddDefault(data) {
    if (data.id == true) {
      this.AddLoanOfferForm.controls["Default"].patchValue(true);
    } else {
      this.AddLoanOfferForm.controls["Default"].patchValue(false);
    }
  }

  onSelectEditLoanType(data) {
    this.selectedLoanTypeId = data.id;
    this.selectedLoanType = this.loanTypesDict[this.selectedLoanTypeId];
    this.EditLoanOfferForm.controls["LoanTypeId"].patchValue(
      this.selectedLoanTypeId
    );
  }

  onSelectEditDefault(data) {
    this.EditLoanOfferForm.controls["Default"].patchValue(data.id);
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
}
