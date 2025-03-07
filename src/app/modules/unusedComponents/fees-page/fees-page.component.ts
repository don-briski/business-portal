import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Configuration } from '../../../model/configuration';
import { ConfigurationService } from '../../../service/configuration.service';
import { AuthService } from '../../../service/auth.service';
import { UserService } from '../../../service/user.service';
import { TokenRefreshErrorHandler } from '../../../service/TokenRefreshErrorHandler';

@Component({
  selector: 'app-fees-page',
  templateUrl: './fees-page.component.html',
  styleUrls: ['./fees-page.component.scss']
})
export class FeesPageComponent implements OnInit {

  public AddFeeForm: UntypedFormGroup;
  public EditFeeForm: UntypedFormGroup;
  public ViewFeeForm: UntypedFormGroup;
  fees: Configuration[];
  public loggedInUser: any;
  pagination = {
    pageNum : 1,
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
  // dataTable: any;

  selectedFeeType: any;
  selectedFeeTypeArray: any;

  currentuser: any;
  currentuserid: any;
  ownerInformation: any;
  currentdate: any;
  currentuserbranchid: any;





  constructor(
    private configurationService: ConfigurationService,
    public authService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private userService: UserService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) { }

  ngOnInit() {
    this.loggedInUser = this.authService.decodeToken();



    this.getUserPromise().then(next => {

     this.currentview = 1;
     this.requestLoader = true;
     this.addFeeFormInit();


     this.switchviews(this.currentview);

        }).catch(err => {

            //  if (this.httpFailureError) { swal.fire('Error', 'User not Loaded', 'error'); }
            }
          );

  }

  switchviews(view) {

    if (view === 1) {
      this.currentview = 1;
      this.getFees();
    }


  }

  getFees(pageNum = this.pagination.pageNum, filter = null) {
    this.fees = [];
    this.requestLoader = true;


                  // paginated section
    this.pagination.pageNum = pageNum;
    if ( pageNum < 1) {
                    this.pagination.pageNum = 1;
                  }
    if ( pageNum > this.pagination.maxPage) {
                    this.pagination.pageNum = this.pagination.maxPage || 1;
                  }

    const paginationmodel = {
                    BranchId: 1,
                    pageNumber: this.pagination.pageNum,
                    pageSize: this.pagination.pageSize,
                    filter: this.pagination.searchTerm
                  };

    this.configurationService.spoolFees(paginationmodel).subscribe((response) => {



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
      }, error => {
        this.requestLoader = true;

           swal.fire('Error', error.error, 'error');
          }
        );


  }


  openModal(content) {
    this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-basic-title'});
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  addFeeFormInit() {

    this.AddFeeForm = new UntypedFormGroup({
      FeeName: new UntypedFormControl('', [Validators.required]),
      FeeDescription: new UntypedFormControl(''),
      UserId: new UntypedFormControl(''),
      BranchId: new UntypedFormControl(''),
      Status: new UntypedFormControl(''),
    });
  }

  openEditModal(content, data) {


      this.EditFeeForm = new UntypedFormGroup({
        FeeId: new UntypedFormControl(data.feeId, [Validators.required]),
        FeeName: new UntypedFormControl(data.feeName, [Validators.required]),
        FeeDescription: new UntypedFormControl(data.feeDescription, [Validators.required]),
        UserId: new UntypedFormControl(data.UserId),
        BranchId: new UntypedFormControl(data.BranchId),
        Status: new UntypedFormControl(data.status, [Validators.required])

      });

      this.selectedFeeTypeArray = [{id: data.feeType, text: data.feeType}];
      this.selectedFeeType = data.feeType;

      this.modalService.open(content, {centered: true, ariaLabelledBy: 'modal-basic-title'});

    }

  openViewModal(content, data) {

        this.ViewFeeForm = new UntypedFormGroup({
          FeeId: new UntypedFormControl(data.feeId),
          FeeName: new UntypedFormControl(data.feeName),
          FeeDescription: new UntypedFormControl(data.feeDescription),
          Status: new UntypedFormControl(data.status, [Validators.required])

        });


        this.modalService.open(content, {centered: true, ariaLabelledBy: 'modal-basic-title'});

      }

  submitEditFeeForm(val: any) {
    if (this.EditFeeForm.valid) {
      this.loader = true;

      this.EditFeeForm.controls['UserId'].patchValue(this.currentuserid);
      this.EditFeeForm.controls['BranchId'].patchValue(this.currentuserbranchid);
      this.configurationService.EditFee(this.EditFeeForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Fee has been updated', title: 'Successful'});
          this.modalService.dismissAll();
          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;

             swal.fire('Error', err.error, 'error');
            }
          );

    }
  }

  submitFeeForm(val: any) {
    if (this.AddFeeForm.valid) {

      this.loader = true;

      this.AddFeeForm.controls['UserId'].patchValue(this.currentuserid);
      this.AddFeeForm.controls['BranchId'].patchValue(this.currentuserbranchid);
      this.configurationService.createFee( this.AddFeeForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Fee has been added', title: 'Successful'});
          this.modalService.dismissAll();
          this.AddFeeForm.reset();

          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;

             swal.fire('Error', err.error, 'error');

        }
      );
    }
  }

  selected(value) {
    this.selectedFeeType = value.text;
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) { this.getFees(pageNumber, filter); return; }
    filter = filter.trim();
    this.pagination.searchTerm = (filter === '') ? null : filter;
    this.getFees(pageNumber, filter);
  }

  getUserPromise() {
    return new Promise( (resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(user => {
        this.currentuser = user.body;
        this.currentuserid =  this.currentuser.userId;
        this.currentuserbranchid = this.currentuser.branchId;
        resolve(user);
      }, err => {
        reject(err);
      });
    });
  }







}
