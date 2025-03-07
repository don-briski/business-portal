import { Component, OnInit, Output, EventEmitter, Input, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../../service/user.service';
import { AuthService } from '../../../service/auth.service';
import { UntypedFormGroup, UntypedFormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ConfigurationService } from '../../../service/configuration.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { TokenRefreshErrorHandler } from '../../../service/TokenRefreshErrorHandler';
import * as moment from 'moment';
import { formatDate } from '@angular/common';
import { FinancialInstitutionService } from 'src/app/service/financialinstitution.service';
import { Subject } from 'rxjs';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-financial-institution',
  templateUrl: './financialinstitution.component.html',
  // styleUrls: ['./short-term-placement.component.scss']
})
export class FinancialInstitutionComponent implements OnInit {
  public user: any;
  public AddFinancialInstitutionForm: UntypedFormGroup;
  public EditFinancialInstitutionForm: UntypedFormGroup;

  public financialInstitutions: [];

  public isSaving: boolean = false;
  public isLoading: boolean = false;

  public pagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: []
  };


  public selectedShortTermPlacementId = null;
  totalRecords = 0;
  filterNum = 10;
  totalPaginate = [];
  activePage = 1;
  public searchTerm = '';
  public numTerm = 10;
  public skip = 0;

  tabLoader = false;

  StartDateNotification = '';
  loggedInUser: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();


  constructor(
    private modalService: NgbModal,
    private userService: UserService,
    private authService: AuthService,
    private finService: FinancialInstitutionService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router,
    private colorThemeService: ColorThemeService
  ) { }

  ngOnInit() {

    this.loadTheme()
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl('/account/login');
      Swal.fire('Error', 'Please log in', 'error');
    }
    this.tokenRefreshError.tokenNeedsRefresh.subscribe(
      (res) => {
        if (!res) {
          // this.httpFailureError = true;
        }
      }
    );

    this.fetchUserInfo();
    this.getFinancialInstitutions();
  }


  private loadTheme() {
    this.colorThemeService.getTheme().pipe(takeUntil(this.unsubscriber$)).subscribe((res: ColorThemeInterface) => {
      this.currentTheme = res;
    });
  }
  fetchUserInfo() {
    this.userService.getUserInfo(this.authService.decodeToken().nameid).subscribe(
      response => {
        this.user = response.body;
      },
      err => {
      },
    );
  }

  openAddFinancialInstitutionForm(templateRef) {
    this.AddFinancialInstitutionForm = new UntypedFormGroup({
      Name: new UntypedFormControl('', [Validators.required]),
      Address: new UntypedFormControl('')
    });
    this.openModal(templateRef);
  }

  openEditFinancialInstitutionForm(id, templateRef) {
    this.tabLoader = true;
    this.finService.getById(id).subscribe(res => {
      this.tabLoader = false;
      const institution = res.body;
      this.EditFinancialInstitutionForm = new UntypedFormGroup({
        FinancialInstitutionId: new UntypedFormControl(institution.financialInstitutionId, [Validators.required]),
        Name: new UntypedFormControl(institution.name, [Validators.required]),
        Address: new UntypedFormControl(institution.address)
      });
      this.openModal(templateRef);
    }
      , err => {
        this.tabLoader = false;
      });
  }

  getFinancialInstitutions(pageNum = this.pagination.pageNum, filter = null) {
    this.financialInstitutions = [];
    this.isLoading = true;

    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    const paginationmodel = {
      pageNum: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
      search: this.pagination.searchTerm
    };

    this.finService.getPaginated(paginationmodel).subscribe((response) => {
      this.financialInstitutions = response.body.data;

      this.pagination.maxPage = response.body.pages;
      this.pagination.totalRecords = response.body.totalRecords;
      this.pagination.count = this.financialInstitutions.length;
      this.pagination.jumpArray = Array(this.pagination.maxPage);
      for (let i = 0; i < this.pagination.jumpArray.length; i++) {
        this.pagination.jumpArray[i] = i + 1;
      }

      this.isLoading = false;
    }, error => {
      this.isLoading = false;
    });
  }

  getFinancialInstitutionsPaginatedSearch(filter, pageSize, pageNumber) {
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) { this.getFinancialInstitutions(pageNumber, filter); return; }
    filter = filter.trim();
    this.pagination.searchTerm = (filter === '') ? null : filter;
    this.getFinancialInstitutions(pageNumber, filter);
  }


  saveFinancialInstitution() {
    if (this.AddFinancialInstitutionForm.valid) {
      this.isSaving = true;
      this.finService.create(this.AddFinancialInstitutionForm.value)
        .subscribe(res => {
          this.isSaving = false;
          this.getFinancialInstitutions();
          Swal.fire('Success', "Financial Institution created", 'success');
          this.closeModal();
        }, err => {
          this.isSaving = false;
        });
    }
  }

  saveEditFinancialInstitution() {
    if (this.EditFinancialInstitutionForm.valid) {
      this.isSaving = true;
      this.finService.update(this.EditFinancialInstitutionForm.value)
        .subscribe(res => {
          this.isSaving = false;
          this.getFinancialInstitutions();
          Swal.fire('Success', "Financial Institution updated", 'success');
          this.closeModal();
        }, err => {
          this.isSaving = false;
        });
    }
  }



  openModal(content) {
    this.modalService.open(content, { backdrop: 'static', size: 'lg', centered: true });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  paginatedJumpModal() {
    $('.pagination-menu').toggle();
  }

}
