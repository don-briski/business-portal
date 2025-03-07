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
  selector: 'app-recoverymeasure-page',
  templateUrl: './recoverymeasure-page.component.html',
  styleUrls: ['./recoverymeasure-page.component.scss']
})
export class RecoverymeasurePageComponent implements OnInit {

  public AddRecoveryMeasureForm: UntypedFormGroup;
  public EditRecoveryMeasureForm: UntypedFormGroup;
  public ViewRecoveryMeasureForm: UntypedFormGroup;
  currentuser: any;
  currentuserid: any;
  currentuserbranchid: any;
  public loggedInUser: any;
  recoverymeasures: Configuration[];
  pagination = {
    pageNum : 1,
    pageSize: 25,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: []
  };

  currentview: any;
  requestLoader: boolean;
  loader = false;
  dataTable: any;

  lines: any;
  editLines: any;
  globalCounter: any;
  editglobalCounter: any;



  constructor(
    private configurationService: ConfigurationService,
    public authService: AuthService,
    private userService: UserService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  ngOnInit() {
    this.loggedInUser = this.authService.decodeToken();


    this.getUserPromise().then(next => {

        this.currentview = 1;
        this.globalCounter = 0;
        this.editglobalCounter = 0;
        this.requestLoader = true;
        this.addRecoveryMeasureFormInit();

        this.switchviews(this.currentview);

      }).catch(err => {
        // swal.fire('Error', 'User not Loaded');
        // if (this.httpFailureError) { swal.fire('Error', 'User not Loaded', 'error'); }
    });


  }

  switchviews(view) {

    if (view === 1) {
      this.currentview = 1;
      this.getRecoveryMeasures();
    }


  }

  getRecoveryMeasures(pageNum = this.pagination.pageNum, filter = null) {
    this.recoverymeasures = [];


                  // paginated section
    this.pagination.pageNum = pageNum;
    if ( pageNum < 1) {
                    this.pagination.pageNum = 1;
                  }
    if ( pageNum > this.pagination.maxPage) {
                    this.pagination.pageNum = this.pagination.maxPage || 1;
                  }

    const paginationmodel = {
                    BranchId: this.currentuserbranchid,
                    pageNumber: this.pagination.pageNum,
                    pageSize: this.pagination.pageSize,
                    filter: this.pagination.searchTerm
                  };

    this.configurationService.spoolRecoveryMeasures(paginationmodel).subscribe((response) => {



    this.recoverymeasures = response.body.value.data;


    this.pagination.maxPage = response.body.value.pages;
    this.pagination.totalRecords = response.body.value.totalRecords;
    this.pagination.count = this.recoverymeasures.length;
    this.pagination.jumpArray = Array(this.pagination.maxPage);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                      this.pagination.jumpArray[i] = i + 1;
                    }

    this.chRef.detectChanges();
    const table: any = $('#industriestable');
    this.dataTable = table.DataTable({
                      aaSorting: [],
                      paging: false,
                      searching: false,
                      bInfo: false,
                      order: []  }  );

    this.requestLoader = false;
      }, error => {
        // swal.fire({   type: 'error',   title: 'Error',   text: error, });
       swal.fire('Error', error.error, 'error');
      });

  }


  openModal(content) {
    this.modalService.open(content, {size: 'lg', centered: true, ariaLabelledBy: 'modal-basic-title'});
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  addRecoveryMeasureFormInit() {
    this.globalCounter = 0;

    this.lines = [{ number: (this.globalCounter + 1),  label: '' }];

    this.AddRecoveryMeasureForm = new UntypedFormGroup({
      RecoveryMeasureName: new UntypedFormControl('', [Validators.required]),
      RecoveryMeasureDescription: new UntypedFormControl(''),
      RecoveryMeasureProcess: new UntypedFormControl(''),
      UserId: new UntypedFormControl(''),
      Status: new UntypedFormControl(''),
    });
  }

  openEditModal(content, data) {

    this.editglobalCounter = 1;

    this.EditRecoveryMeasureForm = new UntypedFormGroup({
        RecoveryMeasureId: new UntypedFormControl(data.recoveryMeasureId, [Validators.required]),
        RecoveryMeasureName: new UntypedFormControl(data.recoveryMeasureName, [Validators.required]),
        RecoveryMeasureDescription: new UntypedFormControl(data.recoveryMeasureDescription, [Validators.required]),
        RecoveryMeasureProcess: new UntypedFormControl(''),
        UserId: new UntypedFormControl(data.UserId),
        BranchId: new UntypedFormControl(data.BranchId),
        Status: new UntypedFormControl(data.status, [Validators.required])

      });


    const incomingLines = JSON.parse(data.recoveryMeasureProcess);
    if (incomingLines.length < 1) {
        this.editLines = [{ number: 1,  label: '' }];
      } else {
        this.editLines = incomingLines;
      }

    incomingLines.forEach(element => {
        if (incomingLines.length < 1) {
          this.editglobalCounter = 1;
        } else {
          this.editglobalCounter = element.number;
        }

      });



    this.modalService.open(content, {centered: true, ariaLabelledBy: 'modal-basic-title'});

    }

  openViewModal(content, data) {

        this.ViewRecoveryMeasureForm = new UntypedFormGroup({
          RecoveryMeasureId: new UntypedFormControl(data.recoveryMeasureId),
          RecoveryMeasureName: new UntypedFormControl(data.recoveryMeasureName),
          RecoveryMeasureDescription: new UntypedFormControl(data.recoveryMeasureDescription),
          RecoveryMeasureProcess: new UntypedFormControl(''),
          Status: new UntypedFormControl(data.status, [Validators.required])

        });


        const incomingLines = JSON.parse(data.recoveryMeasureProcess);
        if (incomingLines.length < 1) {
          this.editLines = [{ number: 1,  label: '' }];
        } else {
          this.editLines = incomingLines;
        }

        this.modalService.open(content, {centered: true, ariaLabelledBy: 'modal-basic-title'});

      }

  submitEditRecoveryMeasureForm(val: any) {
    if (this.EditRecoveryMeasureForm.valid) {
      this.loader = true;

      // tslint:disable-next-line:variable-name
      const entry_lines = [];

      this.editLines.forEach((line, index) => {
        if (line.label !== '') {
          entry_lines.push(line);
        }

      });

      this.EditRecoveryMeasureForm.controls['RecoveryMeasureProcess'].patchValue(JSON.stringify(entry_lines));
      this.EditRecoveryMeasureForm.controls['UserId'].patchValue(this.currentuserid);
      this.configurationService.EditRecoveryMeasure(this.EditRecoveryMeasureForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Recovery Measure: ' + res.recoveryMeasureName + ' has been updated', title: 'Successful'});
          this.modalService.dismissAll();
          this.dataTable.destroy();
          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;
          // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
         swal.fire('Error', err.error, 'error');
        }
      );
    }
  }

  submitRecoveryMeasureForm(val: any) {
    if (this.AddRecoveryMeasureForm.valid) {

      this.loader = true;

      // tslint:disable-next-line:variable-name
      const entry_lines = [];
      this.lines.forEach((line, index) => {
        if (line.label !== '') {
          entry_lines.push(line);
        }
      });

      this.AddRecoveryMeasureForm.controls['RecoveryMeasureProcess'].patchValue(JSON.stringify(entry_lines));
      this.AddRecoveryMeasureForm.controls['UserId'].patchValue(this.currentuserid);
      this.configurationService.createRecoveryMeasure( this.AddRecoveryMeasureForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Recovery Measure has been added', title: 'Successful'});
          this.modalService.dismissAll();
          this.AddRecoveryMeasureForm.reset();
          this.lines = [{ number: 1,  label: '' }];

        //  if(this.dataTable){
          this.dataTable.destroy();
       //   }
          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;
          // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
         swal.fire('Error', err.error, 'error');
        }
      );
    }
  }



  addRow() {
    this.globalCounter = this.globalCounter + 1;

    this.lines.push({ number: this.globalCounter + 1,  label: ''});


  }

  removeRow(i) {
    this.lines.splice(i, 1);
    this.globalCounter = this.globalCounter - 1;
  }

  setLabel($e, i) {
    this.lines[i].label = $e;
  }

  addEditRow() {

    this.editLines.push({ number: this.editglobalCounter + 1,  label: ''});
    this.editglobalCounter = this.editglobalCounter + 1;


  }

  removeEditRow(i) {
    this.editLines.splice(i, 1);
  }

  setEditLabel($e, i) {
    this.editLines[i].label = $e;
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    this.dataTable.destroy();
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) { this.getRecoveryMeasures(pageNumber, filter); return; }
    filter = filter.trim();
    this.pagination.searchTerm = (filter === '') ? null : filter;
    this.getRecoveryMeasures(pageNumber, filter);
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
