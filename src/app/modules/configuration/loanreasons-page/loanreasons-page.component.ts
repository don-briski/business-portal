import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Configuration } from '../../../model/configuration';
import { ConfigurationService } from '../../../service/configuration.service';
import { AuthService } from '../../../service/auth.service';
import { UserService } from '../../../service/user.service';
import { TokenRefreshErrorHandler } from 'src/app/service/TokenRefreshErrorHandler';
import { Router } from '@angular/router';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedService } from 'src/app/service/shared.service';


@Component({
  selector: 'app-loanreasons-page',
  templateUrl: './loanreasons-page.component.html',
  styleUrls: ['./loanreasons-page.component.scss']
})
export class LoanreasonsPageComponent implements OnInit {

  public AddLoanReasonForm: UntypedFormGroup;
  public EditLoanReasonForm: UntypedFormGroup;
  public ViewLoanReasonForm: UntypedFormGroup;
  loanreasons: Configuration[];
  public loggedInUser: any;
  pagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: []
  };

  currentview: any;
  requestLoader: boolean;
  loader = false;

  selectedLoanReasonType: any;
  selectedLoanReasonTypeArray: any;

  currentuser: any;
  currentuserid: any;
  ownerInformation: any;
  currentdate: any;
  currentuserbranchid: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  copy_hover = false;
  toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  isEditing = false;

  constructor(
    private configurationService: ConfigurationService,
    public authService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private userService: UserService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private sharedService:SharedService
  ) { }

  ngOnInit() {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl('/account/login');
      swal.fire('Error', 'Please log in', 'error');
    }
    this.tokenRefreshError.tokenNeedsRefresh.subscribe(
      (res) => {
        if (!res) {
        }
      }
    );
    this.getUserPromise().then(next => {
      $(document).ready(() => {
        $.getScript('assets/js/script.js');
      });
      this.currentview = 1;
      this.requestLoader = true;
      this.addLoanReasonFormInit();


      this.switchviews(this.currentview);

    }).catch(err => {

      //  if (this.httpFailureError) { swal.fire('Error', 'User not Loaded.', 'error'); }

    });
  }


  private loadTheme() {
    this.colorThemeService.getTheme().pipe(takeUntil(this.unsubscriber$)).subscribe((res: ColorThemeInterface) => {
      this.currentTheme = res;
    });
  }


  switchviews(view) {

    if (view === 1) {
      this.currentview = 1;
      this.getLoanReasons();
    }


  }

  getLoanReasons(pageNum = this.pagination.pageNum, filter = null) {
    this.loanreasons = [];
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
      filter: this.pagination.searchTerm
    };

    this.configurationService.spoolLoanReasons(paginationmodel).subscribe((response) => {



      this.loanreasons = response.body.value.data;


      this.pagination.maxPage = response.body.value.pages;
      this.pagination.totalRecords = response.body.value.totalRecords;
      this.pagination.count = this.loanreasons.length;
      this.pagination.jumpArray = Array(this.pagination.maxPage);
      for (let i = 0; i < this.pagination.jumpArray.length; i++) {
        this.pagination.jumpArray[i] = i + 1;
      }

      this.chRef.detectChanges();

      this.requestLoader = false;
    }, error => {
      this.requestLoader = true;



    });

  }


  openModal(content) {
    this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-basic-title' });
  }

  closeModal() {
    this.modalService.dismissAll();
    if (this.isEditing) {
      this.isEditing = false;
    }
  }

  addLoanReasonFormInit() {

    this.AddLoanReasonForm = new UntypedFormGroup({
      LoanReasonCode: new UntypedFormControl('', [Validators.required]),
      LoanReasonName: new UntypedFormControl('', [Validators.required]),
      LoanReasonDescription: new UntypedFormControl(''),
      UserId: new UntypedFormControl(''),
      BranchId: new UntypedFormControl(''),
      Status: new UntypedFormControl(''),
    });
  }

  openEditModal(content, data) {


    this.EditLoanReasonForm = new UntypedFormGroup({
      LoanReasonId: new UntypedFormControl(data.loanReasonId, [Validators.required]),
      LoanReasonName: new UntypedFormControl(data.loanReasonName, [Validators.required]),
      LoanReasonCode: new UntypedFormControl(data.loanReasonCode, [Validators.required]),
      LoanReasonDescription: new UntypedFormControl(data.loanReasonDescription, [Validators.required]),
      UserId: new UntypedFormControl(data.userId),
      BranchId: new UntypedFormControl(data.branchId),
      Status: new UntypedFormControl(data.status, [Validators.required])

    });

    this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-basic-title' });

  }

  openViewModal(content, data,element?:HTMLElement) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (!this.isEditing && element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.ViewLoanReasonForm = new UntypedFormGroup({
          LoanReasonId: new UntypedFormControl(data.loanReasonId),
          LoanReasonName: new UntypedFormControl(data.loanReasonName),
          LoanReasonDescription: new UntypedFormControl(data.loanReasonDescription),
          LoanReasonCode: new UntypedFormControl(data.loanReasonCode),

          Status: new UntypedFormControl(data.status, [Validators.required])

        });


        this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-basic-title' });
      }
    });

  }

  submitEditLoanReasonForm(val: any) {
    if (this.EditLoanReasonForm.valid) {
      this.loader = true;

      this.EditLoanReasonForm.controls['UserId'].patchValue(this.currentuserid);
      this.EditLoanReasonForm.controls['BranchId'].patchValue(this.currentuserbranchid);
      this.configurationService.EditLoanReason(this.EditLoanReasonForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Update Successful', title: 'Success' });
          this.modalService.dismissAll();
          this.switchviews(1);
          this.loader = false;
          this.isEditing = false;
        },
        (err) => {
          this.loader = false;



        }
      );
    }
  }

  submitLoanReasonForm(val: any) {
    if (this.AddLoanReasonForm.valid) {

      this.loader = true;

      this.AddLoanReasonForm.controls['UserId'].patchValue(this.currentuserid);
      this.AddLoanReasonForm.controls['BranchId'].patchValue(this.currentuserbranchid);
      this.configurationService.createLoanReason(this.AddLoanReasonForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Loan Reason has been added', title: 'Successful' });
          this.modalService.dismissAll();
          this.AddLoanReasonForm.reset();

          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;



        }
      );
    }
  }

  selected(value) {
    this.selectedLoanReasonType = value.text;
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) { this.getLoanReasons(pageNumber, filter); return; }
    filter = filter.trim();
    this.pagination.searchTerm = (filter === '') ? null : filter;
    this.getLoanReasons(pageNumber, filter);
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(user => {
        this.currentuser = user.body;
        this.currentuserid = this.currentuser.userId;
        this.currentuserbranchid = this.currentuser.branchId;
        resolve(user);
      }, err => {
        reject(err);
      });
    });
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Loan Reason code copied to clipboard",type:'success',timer:3000})
    }
  }


}
