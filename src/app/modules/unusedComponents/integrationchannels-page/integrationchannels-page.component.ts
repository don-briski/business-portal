import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Configuration } from '../../../model/configuration';
import { ConfigurationService } from '../../../service/configuration.service';
import { AuthService } from '../../../service/auth.service';
import { TokenRefreshErrorHandler } from '../../../service/TokenRefreshErrorHandler';

@Component({
  selector: 'app-integrationchannels-page',
  templateUrl: './integrationchannels-page.component.html',
  styleUrls: ['./integrationchannels-page.component.scss']
})
export class IntegrationchannelsPageComponent implements OnInit {

  public AddEmployerForm: UntypedFormGroup;
  public EditEmployerForm: UntypedFormGroup;
  employers: Configuration[];
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

  constructor(
    private configurationService: ConfigurationService,
    public authService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) { }

  ngOnInit() {

    this.currentview = 1;
    this.requestLoader = true;
    this.switchviews(this.currentview);

  }

  switchviews(view) {

    if (view === 1) { this.currentview = 1; } else if (view === 2) { this.currentview = 2; }

  }

  openModal(content) {
    this.modalService.open(content, {centered: true, ariaLabelledBy: 'modal-basic-title'});
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  addEmployerFormInit() {


    this.AddEmployerForm = new UntypedFormGroup({
      EmployerName: new UntypedFormControl('', [Validators.required]),
      EmployerPayDate: new UntypedFormControl('', [Validators.required]),
      EmployerAddress: new UntypedFormControl('', []),
      EmploymentIndustryId: new UntypedFormControl(''),
      Status: new UntypedFormControl(''),
    });
  }

  openEditModal(content, data) {


      this.EditEmployerForm = new UntypedFormGroup({
        EmployerId: new UntypedFormControl(data.employerId, [Validators.required]),
        EmploymentIndustryId: new UntypedFormControl(''),
        EmployerName: new UntypedFormControl(data.employerName, [Validators.required]),
        EmployerPayDate: new UntypedFormControl(data.employerPayDate, [Validators.required]),
        EmployerAddress: new UntypedFormControl(data.employerAddress, []),
        Status: new UntypedFormControl(data.status, [Validators.required])

      });


      this.modalService.open(content, {centered: true, ariaLabelledBy: 'modal-basic-title'});

    }


  submitEditEmployerForm(val: any) {
    if (this.EditEmployerForm.valid) {
      this.loader = true;
   //   this.EditEmployerForm.controls['EmploymentIndustryId'].patchValue(this.selectedIndustryID);
      this.configurationService.EditEmployer(this.EditEmployerForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Employer: ' + res.EmployerName + ' has been updated', title: 'Successful'});
          this.modalService.dismissAll();
          this.dataTable.destroy();
          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;
          // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
          this.tokenRefreshError.tokenNeedsRefresh.subscribe(
            (res: boolean) => {
              if (!res) { swal.fire('Error', err.error, 'error'); }
            }
          );
        }
      );
    }
  }

  submitEmployerForm(val: any) {
    if (this.AddEmployerForm.valid) {

      this.loader = true;
    //  this.AddEmployerForm.controls['EmploymentIndustryId'].patchValue(this.selectedIndustryID);
      this.configurationService.createEmployer( this.AddEmployerForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Employer has been added', title: 'Successful'});
          this.modalService.dismissAll();
          this.AddEmployerForm.reset();
          if (this.dataTable) {
          this.dataTable.destroy();
          }
          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;
          // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
          this.tokenRefreshError.tokenNeedsRefresh.subscribe(
            (res: boolean) => {
              if (!res) { swal.fire('Error', err.error, 'error'); }
            }
          );
        }
      );
    }
  }


  getEmploymentIndustries(pageNum = this.pagination.pageNum, filter = null) {
    this.employers = [];


                  // paginated section
    this.pagination.pageNum = pageNum;
    if ( pageNum < 1) {
                    this.pagination.pageNum = 1;
                  }
    if ( pageNum > this.pagination.maxPage) {
                    this.pagination.pageNum = this.pagination.maxPage || 1;
                  }

    const paginationmodel = {
                    pageNumber: this.pagination.pageNum,
                    pageSize: this.pagination.pageSize,
                    filter: this.pagination.searchTerm
                  };

    this.configurationService.spoolEmploymentIndustries(paginationmodel).subscribe((response) => {



    this.employers = response.value.data;


    this.pagination.maxPage = response.value.pages;
    this.pagination.totalRecords = response.value.totalRecords;
    this.pagination.count = this.employers.length;
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
        this.tokenRefreshError.tokenNeedsRefresh.subscribe(
          (res: boolean) => {
            if (!res) { swal.fire('Error', error.error, 'error'); }
          }
        );
      });

  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    this.dataTable.destroy();
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) { this.getEmploymentIndustries(pageNumber, filter); return; }
    filter = filter.trim();
    this.pagination.searchTerm = (filter === '') ? null : filter;
    this.getEmploymentIndustries(pageNumber, filter);
  }







}
