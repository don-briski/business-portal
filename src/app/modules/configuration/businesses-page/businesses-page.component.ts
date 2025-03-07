import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Configuration } from '../../../model/configuration';
import { ConfigurationService } from '../../../service/configuration.service';
import { AuthService } from '../../../service/auth.service';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { UserService } from '../../../service/user.service';
import swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TokenRefreshErrorHandler } from 'src/app/service/TokenRefreshErrorHandler';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { Subject } from 'rxjs';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
declare let $: any;

@Component({
  selector: 'app-businesses-page',
  templateUrl: './businesses-page.component.html',
  styleUrls: ['./businesses-page.component.scss']
})
export class BusinessesPageComponent implements OnInit {



  public AddEmployerForm: UntypedFormGroup;
  public EditEmployerForm: UntypedFormGroup;
  public AddLendingInstitutionForm: UntypedFormGroup;
  public EditLendingInstitutionForm: UntypedFormGroup

  public AddEmploymentIndustryForm: UntypedFormGroup;
  public EditEmploymentIndustryForm: UntypedFormGroup;

  employmentIndustries: Configuration[];
  employers: Configuration[];
  lendingInstitutions: Configuration[];
  dataTable: any;
  dataTable2: any;

  pagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: []
  };

  pagination2 = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: []
  };

  pagination3 = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: []
  };

  currentuser: any;
  currentuserid: any;
  currentuserbranchid: any;
  currentview: any;

  requestLoader: boolean;
  employmentIndustriesSelect: Configuration[];
  employmentIndustriesArray: any[] = [];

  selectedIndustryID: any;
  selectedIndustryArray: any;
  public loggedInUser: any;




  selectedBankID: any;
  selectedBankName: any;
  banksArray: any[] = [];
  selectedBankArray: any;



  loader = false;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();


  constructor(
    private configurationService: ConfigurationService,
    public authService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private userService: UserService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router,
    private colorThemeService: ColorThemeService
  ) { }

  ngOnInit() {
    this.loadTheme()
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl('/account/login');
      swal.fire('Error', 'Please log in', 'error');
    }
    this.tokenRefreshError.tokenNeedsRefresh.subscribe(
      (res) => {
        if (!res) {
          // this.httpFailureError = true;
        }
      }
    );
    this.getUserPromise().then(next => {
      $(document).ready(() => {
        $.getScript('assets/js/script.js');
      });
      this.currentview = 1;


      this.currentview = 1;
      this.requestLoader = true;
      this.addEmployerFormInit();
      this.addEmploymentIndustryFormInit();
      this.addLendingInstitutionFormInit();
      this.getConstants();
      this.switchviews(this.currentview);

    }).catch(err => {

      // if (this.httpFailureError) { \\ swal.fire('Error', 'User not Loaded', 'error'); }

    });




  }

  private loadTheme() {
    this.colorThemeService.getTheme().pipe(takeUntil(this.unsubscriber$)).subscribe((res: ColorThemeInterface) => {
      this.currentTheme = res;
    });
  }


  switchviews(view) {

    if (view === 1) {
      this.getEmployers();
      this.getEmploymentIndustriesMin();
      this.currentview = 1;
    } else if (view === 2) {
      this.getEmploymentIndustries();
      this.getEmploymentIndustriesMin();
      this.currentview = 2;
    } else if (view === 3) {
      this.getLendingInstitutions();
      this.currentview = 3;
    }

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

  openModal(content) {

    this.AddLendingInstitutionForm.reset();

    if (content === 'addEmployerModal') {
      this.getEmploymentIndustriesMin();
    } else {

    }

    this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-basic-title' });
  }

  closeModal() {
    this.modalService.dismissAll();
  }


  addEmployerFormInit() {


    this.AddEmployerForm = new UntypedFormGroup({
      EmployerName: new UntypedFormControl('', [Validators.required]),
      EmployerPayDate: new UntypedFormControl('', [Validators.required]),
      UserId: new UntypedFormControl(''),
      EmployerAddress: new UntypedFormControl('', []),
      EmploymentIndustryId: new UntypedFormControl(''),
      Status: new UntypedFormControl(''),
    });
  }

  addEmploymentIndustryFormInit() {
    this.AddEmploymentIndustryForm = new UntypedFormGroup({
      EmploymentIndustryName: new UntypedFormControl('', [Validators.required]),
      UserId: new UntypedFormControl(''),
    });
  }

  addLendingInstitutionFormInit() {
    this.AddLendingInstitutionForm = new UntypedFormGroup({
      LendingInstitutionName: new UntypedFormControl('', [Validators.required]),
      PhoneNumber: new UntypedFormControl('', [Validators.required]),
      Email: new UntypedFormControl('', [Validators.required]),
      Status: new UntypedFormControl('', Validators.required),
      BankId: new UntypedFormControl(''),
      BankName: new UntypedFormControl(''),
      AccountNumber: new UntypedFormControl('', [Validators.minLength(10),Validators.maxLength(10),Validators.required]),
      AccountName: new UntypedFormControl('', [Validators.required]),
      BankDetails: new UntypedFormControl(''),
      UserId: new UntypedFormControl('')
    });
  }

  openEditModal(content, data, type) {

    if (type === '2') {

      this.EditEmploymentIndustryForm = new UntypedFormGroup({
        EmploymentIndustryId: new UntypedFormControl(data.employmentIndustryId, [Validators.required]),
        EmploymentIndustryName: new UntypedFormControl(data.employmentIndustryName, [Validators.required]),
        UserId: new UntypedFormControl(data.createdBy, []),
        Status: new UntypedFormControl(data.status, [Validators.required])

      });

    } else if (type === '3') {

      this.EditLendingInstitutionForm = new UntypedFormGroup({
        LendingInstitutionId: new UntypedFormControl(data.lendingInstitutionId),
        LendingInstitutionName: new UntypedFormControl(data.lendingInstitutionName, [Validators.required]),
        PhoneNumber: new UntypedFormControl(data.phoneNumber, [Validators.required]),
        Email: new UntypedFormControl(data.email, [Validators.required]),
        UserId: new UntypedFormControl(this.currentuserid),
        Status: new UntypedFormControl(data.status),
        BankId: new UntypedFormControl(data.bankDetails.bankId),
        BankName: new UntypedFormControl(data.bankDetails.bankName),
        AccountNumber: new UntypedFormControl(data.bankDetails.accountNumber),
        AccountName: new UntypedFormControl(data.bankDetails.accountName),
        BankDetails: new UntypedFormControl(data.bankDetails),

      });

      this.selectedBankArray = [{ id: data.bankDetails.bankId, text: data.bankDetails.bankName }];
      this.selectedBankID = data.bankDetails.bankId;
      this.selectedBankName = data.bankDetails.bankName;

    } else {
      this.getEmploymentIndustriesMin();

      this.EditEmployerForm = new UntypedFormGroup({
        EmployerId: new UntypedFormControl(data.employerId, [Validators.required]),
        EmploymentIndustryId: new UntypedFormControl(''),
        EmployerName: new UntypedFormControl(data.employerName, [Validators.required]),
        EmployerPayDate: new UntypedFormControl(data.employerPayDate, [Validators.required]),
        EmployerAddress: new UntypedFormControl(data.employerAddress, []),
        UserId: new UntypedFormControl(data.createdBy, []),
        Status: new UntypedFormControl(data.status, [Validators.required])

      });

      this.selectedIndustryArray = [{ id: data.employmentIndustryId, text: data.employmentIndustry.employmentIndustryName }];
      this.selectedIndustryID = data.employmentIndustryId;
    }
    this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-basic-title' });

  }

  submitEditEmploymentIndustryForm(val: any) {
    if (this.EditEmploymentIndustryForm.valid) {
      this.loader = true;
      this.EditEmploymentIndustryForm.controls['UserId'].patchValue(this.currentuserid);
      this.configurationService.EditEmploymentIndustry(this.EditEmploymentIndustryForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: ' Industry has been updated', title: 'Successful' });
          this.modalService.dismissAll();
          //   this.dataTable.destroy();
          this.switchviews(2);
          this.loader = false;
        },
        (err) => {
          this.loader = false;

        });

    }
  }

  submitEditEmployerForm() {
    if (this.EditEmployerForm.valid) {
      this.loader = true;
      this.EditEmployerForm.controls['UserId'].patchValue(this.currentuserid);
      this.EditEmployerForm.controls['EmploymentIndustryId'].patchValue(this.selectedIndustryID);
      this.configurationService.EditEmployer(this.EditEmployerForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Employer has been updated', title: 'Successful' });
          this.modalService.dismissAll();
          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;

        }
      );

    }
  }

  submitEmploymentIndustryForm(val: any) {
    if (this.AddEmploymentIndustryForm.valid) {

      this.loader = true;
      this.AddEmploymentIndustryForm.controls['UserId'].patchValue(this.currentuserid);
      this.configurationService.createEmploymentIndustry(this.AddEmploymentIndustryForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'The Industry has been added', title: 'Successful' });
          this.modalService.dismissAll();
          this.AddEmploymentIndustryForm.reset();
          if (this.dataTable) {
            this.dataTable.destroy();
          }
          this.switchviews(2);
          this.loader = false;
        },
        (err) => {
          this.loader = false;

        }
      );

    }
  }

  submitEmployerForm(val: any) {
    if (this.AddEmployerForm.valid) {

      this.loader = true;
      this.AddEmployerForm.controls['UserId'].patchValue(this.currentuserid);
      this.AddEmployerForm.controls['EmploymentIndustryId'].patchValue(this.selectedIndustryID);
      this.configurationService.createEmployer(this.AddEmployerForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Employer has been added', title: 'Successful' });
          this.modalService.dismissAll();
          this.AddEmployerForm.reset();
          if (this.dataTable2) {
            this.dataTable2.destroy();
          }
          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;

        }
      );

    }
  }

  submitLendingInstitutionForm() {
    if (this.AddLendingInstitutionForm.valid) {

      this.loader = true;

      const model = {
        BankId: this.selectedBankID,
        BankName: this.selectedBankName,
        AccountName: this.AddLendingInstitutionForm.controls['AccountName'].value,
        AccountNumber: this.AddLendingInstitutionForm.controls['AccountNumber'].value
      };
      this.AddLendingInstitutionForm.controls['BankDetails'].patchValue(model);
      this.AddLendingInstitutionForm.controls['UserId'].patchValue(this.currentuserid);
      this.configurationService.createLendingInstitution(this.AddLendingInstitutionForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Lending Instution has been added', title: 'Successful' });
          this.modalService.dismissAll();
          this.AddLendingInstitutionForm.reset();

          this.switchviews(3);
          this.loader = false;
        },
        (err) => {
          this.loader = false;

        }
      );

    }
  }


  submitEditLendingInstitutionForm(val: any) {
    if (this.EditLendingInstitutionForm.valid) {
      this.loader = true;
      const model = {
        BankId: this.selectedBankID,
        BankName: this.selectedBankName,
        AccountName: this.EditLendingInstitutionForm.controls['AccountName'].value,
        AccountNumber: this.EditLendingInstitutionForm.controls['AccountNumber'].value
      };
      this.EditLendingInstitutionForm.controls['BankDetails'].patchValue(model);
      this.EditLendingInstitutionForm.controls['UserId'].patchValue(this.currentuserid);;
      this.configurationService.EditLendingInstitution(this.EditLendingInstitutionForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Lending Institution has been updated', title: 'Successful' });
          this.modalService.dismissAll();
          this.switchviews(3);
          this.loader = false;
        },
        (err) => {
          this.loader = false;

        }
      );

    }
  }


  getEmploymentIndustries(pageNum = this.pagination.pageNum, filter = null) {
    this.employmentIndustries = [];
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
      pageNumber: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
      filter: this.pagination.searchTerm
    };

    this.configurationService.spoolEmploymentIndustries(paginationmodel).subscribe((response) => {



      this.employmentIndustries = response.body.value.data;


      this.pagination.maxPage = response.body.value.pages;
      this.pagination.totalRecords = response.body.value.totalRecords;
      this.pagination.count = this.employmentIndustries.length;
      this.pagination.jumpArray = Array(this.pagination.maxPage);
      for (let i = 0; i < this.pagination.jumpArray.length; i++) {
        this.pagination.jumpArray[i] = i + 1;
      }

      // this.chRef.detectChanges();

      this.requestLoader = false;

    }, error => {
      this.requestLoader = true;


    }
    );


  }

  getEmployers(pageNum = this.pagination2.pageNum, filter = null) {
    this.employers = [];
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
      filter: this.pagination2.searchTerm
    };

    this.configurationService.spoolEmployers(paginationmodel).subscribe((response) => {

      this.employers = response.body.value.data;


      this.pagination2.maxPage = response.body.value.pages;
      this.pagination2.totalRecords = response.body.value.totalRecords;
      this.pagination2.count = this.employers.length;
      this.pagination2.jumpArray = Array(this.pagination2.maxPage);
      for (let i = 0; i < this.pagination2.jumpArray.length; i++) {
        this.pagination2.jumpArray[i] = i + 1;
      }

      //   this.chRef.detectChanges();


      this.requestLoader = false;
    }, error => {
      this.requestLoader = true;


    }
    );


  }

  getLendingInstitutions(pageNum = this.pagination3.pageNum, filter = null) {
    this.lendingInstitutions = [];
    this.requestLoader = true;


    // paginated section
    this.pagination3.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination3.pageNum = 1;
    }
    if (pageNum > this.pagination3.maxPage) {
      this.pagination3.pageNum = this.pagination3.maxPage || 1;
    }

    const paginationmodel = {
      pageNumber: this.pagination3.pageNum,
      pageSize: this.pagination3.pageSize,
      filter: this.pagination3.searchTerm
    };

    this.configurationService.spoolLendingInstitutions(paginationmodel).subscribe((response) => {

      this.lendingInstitutions = response.body.value.data;


      this.pagination3.maxPage = response.body.value.pages;
      this.pagination3.totalRecords = response.body.value.totalRecords;
      this.pagination3.count = this.lendingInstitutions.length;
      this.pagination3.jumpArray = Array(this.pagination3.maxPage);
      for (let i = 0; i < this.pagination3.jumpArray.length; i++) {
        this.pagination3.jumpArray[i] = i + 1;
      }

      this.requestLoader = false;
    }, error => {
      this.requestLoader = true;


    }
    );


  }

  getConstants() {
    this.configurationService.spoolBanks().subscribe((response) => {
      this.banksArray = [];
      response.body.forEach(element => {
        this.banksArray.push({ id: element.bankId, text: element.bankName });
      });

      this.requestLoader = false;

    }, error => {


    }
    );


  }

  getEmploymentIndustriesMin() {
    this.configurationService.spoolEmploymentIndustriesforSelect().subscribe((response) => {
      this.employmentIndustriesArray = [];
      response.body.forEach(element => {
        this.employmentIndustriesArray.push({ id: element.employmentIndustryId, text: element.employmentIndustryName });
      });

      this.requestLoader = false;

    }, error => {


    }
    );


  }

  selected(type, value) {
    if (type === 'Industry') {
      this.selectedIndustryID = value.id;
    } else if (type === 'Bank') {
      this.selectedBankID = value.id;
      this.selectedBankName = value.text;
    }

  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    //  this.dataTable.destroy();
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) { this.getEmploymentIndustries(pageNumber, filter); return; }
    filter = filter.trim();
    this.pagination.searchTerm = (filter === '') ? null : filter;
    this.getEmploymentIndustries(pageNumber, filter);
  }

  getItemsPaginatedSearch2(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    //   this.dataTable2.destroy();
    // tslint:disable-next-line:radix
    this.pagination2.pageSize = parseInt(pageSize);
    if (filter == null) { this.getEmployers(pageNumber, filter); return; }
    filter = filter.trim();
    this.pagination2.searchTerm = (filter === '') ? null : filter;
    this.getEmployers(pageNumber, filter);
  }

  getItemsPaginatedSearch3(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    this.pagination3.pageSize = parseInt(pageSize);
    if (filter == null) { this.getLendingInstitutions(pageNumber, filter); return; }
    filter = filter.trim();
    this.pagination3.searchTerm = (filter === '') ? null : filter;
    this.getLendingInstitutions(pageNumber, filter);
  }








}
