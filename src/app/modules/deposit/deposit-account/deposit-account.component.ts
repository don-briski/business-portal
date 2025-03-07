import { Component, OnDestroy, OnInit } from '@angular/core';
import swal from 'sweetalert2';
import { DepositAccountCustomerType, DepositAccountSource, DepositAccountsRequestModel, DepositAccountTempDetailsStatus, DepositAccountTransactionRequestModel, DepositAccountTransactionType, DepositApplicationsRequestModel, DepositDebitFrequency, DepositProductCategory, DepositProductType, NewDepositTransactionType } from '../models/deposit-account.model';
import { AuthService } from 'src/app/service/auth.service';
import { DepositService } from 'src/app/service/deposit.service';
import { DepositAccountService } from 'src/app/service/depositaccount.service'
import { Router } from '@angular/router';
import { UserService } from 'src/app/service/user.service';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { CustomerService } from 'src/app/service/customer.service';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-deposit-account',
  templateUrl: './deposit-account.component.html',
  styleUrls: ['./deposit-account.component.scss']
})
export class DepositAccountComponent implements OnInit, OnDestroy {


  public CreateDepositAccountForm: UntypedFormGroup;
  public DepositApplicationStatusForm: UntypedFormGroup;
  public EditDepositAccountApplicationForm: UntypedFormGroup;
  public DepositTransactionForm: UntypedFormGroup;
  public DepositAccountFeeForm: UntypedFormGroup;
  public customerSearchForm: UntypedFormGroup;

  depositAccountCustomerTypes: any[] = [
    DepositAccountCustomerType.Group,
    DepositAccountCustomerType.Person
  ];
  depositAccountSources: any[] = [
    DepositAccountSource.Card
  ];
  depositAccountDebitFrequencies: any[] = [
    DepositDebitFrequency.Daily, DepositDebitFrequency.Monthly, DepositDebitFrequency.Weekly
  ];
  depositAccountTempDetailsStatuses: any[] = [
    DepositAccountTempDetailsStatus.Approved,
    DepositAccountTempDetailsStatus.Created,
    DepositAccountTempDetailsStatus.Redraft,
    DepositAccountTempDetailsStatus.Rejected,
    DepositAccountTempDetailsStatus.Withdrawn
  ];
  newDepositAccountTransactionTypes: any[] = [
    NewDepositTransactionType.Deposit,
    NewDepositTransactionType.Withdrawal
  ];
  depositAccountTransactionTypes: any[] = [
    DepositAccountTransactionType.Deposit,
    DepositAccountTransactionType.Fee,
    DepositAccountTransactionType.InterestApplied,
    DepositAccountTransactionType.Transfer,
    DepositAccountTransactionType.Withdrawal
  ];

  depositAccountCategories: any[] = [
    DepositProductCategory.BusinessDeposit,
    DepositProductCategory.PersonalDeposit
  ];

  depositProductTypes: any[] = [
    DepositProductType.FixedDeposit,
    DepositProductType.SavingsAccount,
    DepositProductType.SavingsPlan,
  ];

  depositProductsDict = {};
  depositProductsForSelect: any[] = [];

  depositAccounts: any[]
  depositAccountFetchModel: DepositAccountsRequestModel = {
    pageNumber: 1,
    pageSize: 10,
    approvedByUserId: null,
    branchId: null,
    depositProductId: null,
    status: null
  };
  depositAccountPagination = {
    pageNumber: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };

  depositAccountApplications: any[];
  depositAccountApplicationFetchModel: DepositApplicationsRequestModel = {
    pageNumber: 1,
    pageSize: 10,
    createdByUserId: null,
    depositProductId: null,
    customerType: null,//DepositAccountCustomerType,
    status: null, //DepositAccountTempDetailsStatus,
    depositAccountCategory: null, //DepositProductCategory,
    depositProductType: null, // DepositProductType
  };
  depositApplicationPagination = {
    pageNumber: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };


  depositAccountTransactions: any[];
  depositAccountTransactionFetchModel: DepositAccountTransactionRequestModel = {
    pageNumber: 1,
    pageSize: 10,
    depositAccountId: null,
    transactionType: null,
    startDate: null,
    endDate: null
  };
  transRawStartDate: string = null;
  transRawEndDate: string = null;
  depositTransactionPagination = {
    pageNumber: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };



  loader: boolean = false;
  loggedInUser: any = null;
  requestLoader: boolean = false;
  depositAccountRequestLoader: boolean = false;
  depositApplicationsRequestLoader: boolean = false;
  transactionsRequestLoader: boolean = false;
  currentuser: any;
  currentuserid: any;
  currentuserbranchid: any;
  currentview: string;
  views: any = {
    accounts: "ACCOUNTS",
    applications: "APPLICATIONS",
    transactions: "TRANSACTIONS"
  };
  depositAccountApplication: any;
  depositAccount: any;
  unsubscriber$ = new Subject<void>();
  loading: boolean;
  customerSearchResults: any[] = [];
  constructor(
    private authService: AuthService,
    private depositService: DepositService,
    private depositAccountService: DepositAccountService,
    private modalService: NgbModal,
    private router: Router,
    private userService: UserService,
    private fb: UntypedFormBuilder,
    private customerService: CustomerService
  ) { }

  ngOnInit(): void {
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl('/account/login');
      swal.fire('Error', 'Please log in', 'error');
    }

    this.getUserPromise().then(next => {
      $(document).ready(() => {
        $.getScript('assets/js/script.js');
      });
      this.currentview = this.views.applications;
      this.switchViews(this.currentview);
    }).catch(err => {
    });

    this.customerSearchFormInit();
  }

  switchViews(view) {
    if (this.currentview == view.transactions) {this.currentview = view;return};
    this.currentview = view;
    switch (view) {
      case this.views.accounts:
        this.createDepositAccountFormInit();
        this.fetchDepositAccounts();
        this.getDepositProducts();
        break;
      case this.views.applications:
        this.fetchDepositAccountApplications();
        this.getDepositProducts();
        break;
      case this.views.transactions:
        this.fetchDepositTransactions(1);
        this.getDepositProducts();
        break;
      default:
        break;
    }
  }

  createDepositAccountFormInit() {
    this.CreateDepositAccountForm = new UntypedFormGroup({
      depositProductId: new UntypedFormControl('', [Validators.required]),
      depositAmount: new UntypedFormControl(0, [Validators.required]),
      branchId: new UntypedFormControl(this.currentuserbranchid, [Validators.required]),
      createdByUserId: new UntypedFormControl(this.currentuserid, [Validators.required]),
      personId: new UntypedFormControl(null),
      customerType: new UntypedFormControl(null, [Validators.required]),
      groupId: new UntypedFormControl(null),
      openingBalance: new UntypedFormControl(null),
      startDate: new UntypedFormControl(null),
      termLength: new UntypedFormControl(null),
      depositSource: new UntypedFormControl(null),
      debitFrequency: new UntypedFormControl(null, [Validators.required]),
      description: new UntypedFormControl(''),
      savingsGoalTarget: new UntypedFormControl(null),
      firstName: new UntypedFormControl(null),
      lastName: new UntypedFormControl(null),
      middleName: new UntypedFormControl(null),
      title: new UntypedFormControl(null),
      gender: new UntypedFormControl(null),
      phoneNumber: new UntypedFormControl(null),
      emailAddress: new UntypedFormControl(null),
      dateOfBirth: new UntypedFormControl(null),
      residentialAddress: new UntypedFormControl(null),
      maximumWithdrawalAmount: new UntypedFormControl(0, [Validators.required]),
      recommendedDepositAmount: new UntypedFormControl(0, [Validators.required]),
      interestRate: new UntypedFormControl(0, [Validators.required]),
    });
  }

  depositApplicationStatusFormInit(content, data) {
    this.DepositApplicationStatusForm = new UntypedFormGroup({
      tempDepositDetailsId: new UntypedFormControl(data.tempDepositDetailsId, [Validators.required]),
      transactionPin: new UntypedFormControl(null),
      userId: new UntypedFormControl(this.currentuserid),
      comment: new UntypedFormControl(data.comment),
      status: new UntypedFormControl(data.status, [Validators.required])
    });
    this.openModal(content);
  }

  depositTransactionFormInit(content, data) {
    this.DepositTransactionForm = new UntypedFormGroup({
      depositAccountId: new UntypedFormControl(data.depositAccountId, [Validators.required]),
      transactionType: new UntypedFormControl(null, [Validators.required]),
      amount: new UntypedFormControl(0, [Validators.required]),
      backDate: new UntypedFormControl(null, [Validators.required]),
      bookingDate: new UntypedFormControl(null, [Validators.required]),
      channelId: new UntypedFormControl(0, [Validators.required]),
      branchId: new UntypedFormControl(this.currentuserbranchid, [Validators.required]),
      comment: new UntypedFormControl(null),
      notes: new UntypedFormControl(null)
    });
    this.openModal(content);
  }

  depositAccountFeeFormInit(content, data) {
    this.DepositAccountFeeForm = new UntypedFormGroup({
      depositAccountId: new UntypedFormControl(data.depositAccountId, [Validators.required]),
      depositFeeId: new UntypedFormControl(null),
      amount: new UntypedFormControl(0, [Validators.required]),
      branchId: new UntypedFormControl(this.currentuserbranchid, [Validators.required]),
      comment: new UntypedFormControl(null),
    });

    this.openModal(content);
  }

  editDepositAccountApplicationFormInit(content, data) {
    this.EditDepositAccountApplicationForm = new UntypedFormGroup({
      tempDepositDetailsId: new UntypedFormControl(data.tempDepositDetailsId, [Validators.required]),
      maximumWithdrawalAmount: new UntypedFormControl(data.maximumWithdrawalAmount),
      recommendedDepositAmount: new UntypedFormControl(data.recommendedDepositAmount),
      interestRate: new UntypedFormControl(data.interestRate),
      savingsGoalTarget: new UntypedFormControl(data.savingsGoalTarget),
      description: new UntypedFormControl(data.description)
    });
    this.openModal(content);
  }

  submitCreateDepositAccountForm() {
    this.loader = true;
    this.depositAccountService.createDepositAccount(this.CreateDepositAccountForm.value).subscribe(
      (res) => {
        swal.fire({ type: 'success', text: 'Deposit Account Created', title: 'Successful' });
        this.modalService.dismissAll();
        this.createDepositAccountFormInit();
        this.loader = false;
      },
      (err) => {
        this.loader = false;
    });
  }

  submitDepositApplicationStatusForm() {
    this.loader = true;
    this.depositAccountService.setDepositAccountStatus(this.DepositApplicationStatusForm.value).subscribe(
      (res) => {
        swal.fire({ type: 'success', text: 'Application updated', title: 'Successful' });
        this.fetchDepositAccountApplications();
        this.modalService.dismissAll();
        this.loader = false;
      },
      (err) => {
        this.loader = false;
    });
  }

  submitDepositTransactionForm() {
    this.loader = true;
    this.depositAccountService.createDepositAccountTransaction(this.DepositTransactionForm.value).subscribe(
      (res) => {
        swal.fire({ type: 'success', text: 'Transaction Added', title: 'Successful' });
        this.fetchDepositAccounts();
        this.modalService.dismissAll();
        this.loader = false;
      },
      (err) => {
        this.loader = false;
    });
  }

  submitDepositAccountFeeForm() {
    this.loader = true;
    this.depositAccountService.createDepositAccountFee(this.DepositAccountFeeForm.value).subscribe(
      (res) => {
        swal.fire({ type: 'success', text: 'Fee Added', title: 'Successful' });
        this.fetchDepositAccounts();
        this.modalService.dismissAll();
        this.loader = false;
      },
      (err) => {
        this.loader = false;
    });
  }

  submitEditDepositAccountApplicationForm() {
    this.loader = true;
    this.depositAccountService.editDepositAccountApplication(this.EditDepositAccountApplicationForm.value).subscribe(
      (res) => {
        swal.fire({ type: 'success', text: 'Application edited', title: 'Successful' });
        this.fetchDepositAccountApplications();
        this.modalService.dismissAll();
        this.loader = false;
      },
      (err) => {
        this.loader = false;
    });
  }


  fetchDepositAccounts(pageNum = null) {
    this.depositAccountRequestLoader = true;
    this.depositAccounts = [];

    if (pageNum != null) {
      this.depositAccountPagination.pageNumber == pageNum;
      if (pageNum < 1) {
        this.depositAccountPagination.pageNumber = 1;
      }
      if (pageNum > this.depositAccountPagination.maxPage) {
        this.depositAccountPagination.pageNumber = this.depositAccountPagination.maxPage || 1;
      }
      this.depositAccountFetchModel.pageNumber = this.depositAccountPagination.pageNumber;
    }
    this.depositAccountFetchModel.pageSize = this.depositAccountPagination.pageSize;


    this.depositAccountService.getDepositAccounts(this.depositAccountFetchModel).subscribe((response) => {
      this.depositAccounts = response.body.data.items;

      this.depositAccountPagination.maxPage = response.body.data.totalPages;
      this.depositAccountPagination.hasNextPage = response.body.data.hasNextPage;
      this.depositAccountPagination.hasPreviousPage = response.body.data.hasPreviousPage;
      this.depositAccountPagination.totalRecords = response.body.totalCount;
      this.depositAccountPagination.count = this.depositAccounts.length;
      this.depositAccountPagination.jumpArray = Array(this.depositAccountPagination.maxPage);
      for (let i = 0; i < this.depositAccountPagination.jumpArray.length; i++) {
        this.depositAccountPagination.jumpArray[i] = i + 1;
      }


      this.depositAccountRequestLoader = false;
    }, error => {
      this.depositAccountRequestLoader = false;
    });
  }

  fetchDepositAccountApplications(pageNum = null) {
    this.depositApplicationsRequestLoader = true;
    this.depositAccountApplications = [];

    if (pageNum != null) {
      this.depositApplicationPagination.pageNumber == pageNum;
      if (pageNum < 1) {
        this.depositApplicationPagination.pageNumber = 1;
      }
      if (pageNum > this.depositApplicationPagination.maxPage) {
        this.depositApplicationPagination.pageNumber = this.depositApplicationPagination.maxPage || 1;
      }
      this.depositAccountFetchModel.pageNumber = this.depositApplicationPagination.pageNumber;
    }
    this.depositAccountFetchModel.pageSize = this.depositApplicationPagination.pageSize;

    this.depositAccountService.getDepositAccountApplications(this.depositAccountApplicationFetchModel).subscribe((response) => {
      this.depositAccountApplications = response.body.data.items;

      this.depositApplicationPagination.maxPage = response.body.data.totalPages;
      this.depositApplicationPagination.hasNextPage = response.body.data.hasNextPage;
      this.depositApplicationPagination.hasPreviousPage = response.body.data.hasPreviousPage;
      this.depositApplicationPagination.totalRecords = response.body.totalCount;
      this.depositApplicationPagination.count = this.depositAccountApplications.length;
      this.depositApplicationPagination.jumpArray = Array(this.depositApplicationPagination.maxPage);
      for (let i = 0; i < this.depositApplicationPagination.jumpArray.length; i++) {
        this.depositApplicationPagination.jumpArray[i] = i + 1;
      }
      this.depositApplicationsRequestLoader = false;
    }, error => {
      this.depositApplicationsRequestLoader = false;
    });
  }

  fetchDepositTransactions(pageNum = null) {
    this.transactionsRequestLoader = true;
    this.depositAccountTransactions = [];

    this.depositAccountTransactionFetchModel.startDate = this.formatDate(this.transRawStartDate);
    this.depositAccountTransactionFetchModel.endDate = this.formatDate(this.transRawEndDate);


    if (pageNum != null) {
      this.depositTransactionPagination.pageNumber == pageNum;
      if (pageNum < 1) {
        this.depositTransactionPagination.pageNumber = 1;
      }
      if (pageNum > this.depositTransactionPagination.maxPage) {
        this.depositTransactionPagination.pageNumber = this.depositTransactionPagination.maxPage || 1;
      }
      this.depositAccountTransactionFetchModel.pageNumber = this.depositTransactionPagination.pageNumber;
    }
    this.depositAccountTransactionFetchModel.pageSize = this.depositTransactionPagination.pageSize;

    this.depositAccountService.getDepositAccountTransactions(this.depositAccountTransactionFetchModel).subscribe((response) => {
      this.depositAccountTransactions = response.body.data.items;

      this.depositTransactionPagination.maxPage = response.body.data.totalPages;
      this.depositTransactionPagination.hasNextPage = response.body.data.hasNextPage;
      this.depositTransactionPagination.hasPreviousPage = response.body.data.hasPreviousPage;
      this.depositTransactionPagination.totalRecords = response.body.totalCount;
      this.depositTransactionPagination.count = this.depositAccountTransactions.length;
      this.depositTransactionPagination.jumpArray = Array(this.depositTransactionPagination.maxPage);
      for (let i = 0; i < this.depositTransactionPagination.jumpArray.length; i++) {
        this.depositTransactionPagination.jumpArray[i] = i + 1;
      }
      this.transactionsRequestLoader = false;
    }, error => {
      this.transactionsRequestLoader = false;
    });
  }

  viewDepositApplication(content, tempDepositDetailsId) {
    this.depositAccountApplication = null;
    this.requestLoader = true;
    this.openModal(content);
    this.depositAccountService.getDepositAccountApplicationById(tempDepositDetailsId).subscribe(
      res => {
        this.depositAccountApplication = res.body.data;
        this.requestLoader = false;
      }, err => {
        this.requestLoader = false;
    });
  }

  viewDepositAccount(content, depositAccountId) {
    this.depositAccount = null;
    this.requestLoader = true;
    this.openModal(content);
    this.depositAccountService.getDepositAccountById(depositAccountId).subscribe(
      res => {
        this.depositAccount = res.body.data;
        this.requestLoader = false;
      }, err => {
        this.requestLoader = false;
    });
  }

  viewTransactionsByDepositAccountId(depositAccountId) {
    this.depositAccountTransactionFetchModel.depositAccountId = depositAccountId;
    this.switchViews(this.views.transactions);
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

  getDepositProducts() {
    this.depositProductsDict = {};
    this.depositProductsForSelect = [];
    this.depositService.getAllDepositProduct({pageNumber:1, pageSize:100}).pipe(takeUntil(this.unsubscriber$)).subscribe(
      (res) => {
        let data = res?.data?.items;

        this.depositProductsForSelect = data?.map(x => {
          return { id: x.depositProductId, text: x.depositProductName }
        });

        this.depositProductsDict = {};
        data?.forEach(element => {
          this.depositProductsDict[element.loanTypeId] = element;
        });

      },
      (err) => {
      }
    );
  }

  getDepositAccountById(id) {
    this.depositAccountService.getDepositAccountById(id).subscribe( (res) => {
      let data = res.body;
      }, (err) => {}
      );
  }

  getDepositApplicationById(id) {
    this.depositAccountService.getDepositAccountApplicationById(id).subscribe( (res) => {
      let data = res.body;
      }, (err) => {}
      );
  }


  onSelectAddDepositProductId(data) {
    const selectedId = data.id;
    // const selectedProduct = this.depositProductsDict[selectedId];
    this.CreateDepositAccountForm.controls['depositProductId'].patchValue(selectedId);
  }

  openModal(content: any, size = 'lg') {
    this.modalService.open(content, { size, centered: true, ariaLabelledBy: 'modal-basic-title', windowClass: 'loantypes-class' });
  }
  closeModal() {
    this.modalService.dismissAll();
  }

  setAccountToCreate(value: string): void {
    this.depositAccountService.setAccountToCreate(value);
  }

  formatDate(data) {
    if (data == null || data == undefined || data.trim == "") {
      return null;
    }
    try {
      const date = new Date(data.toString());
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const yyyy = date.getFullYear();

      const MM = (m >= 10) ? m + '' : '0' + m;
      const dd = (d >= 10) ? d + '' : '0' + d;
      return yyyy + '-' + MM + '-' + dd;
    } catch (error) {
      return null;
    }
  }

  depositAccountpaginatedJumpModal() {
    $('.depositAccountpaginatedJumpModal').toggle();
  }
  depositApplicationpaginatedJumpModal() {
    $('.depositApplicationpaginatedJumpModal').toggle();
  }
  depositTransactionspaginatedJumpModal() {
    $('.depositTransactionspaginatedJumpModal').toggle();
  }

  customerSearchFormInit(): void {
    this.customerSearchForm = this.fb.group({
      parameter: new UntypedFormControl(null),
      searchType: new UntypedFormControl(null, [Validators.required])
    });

    this.switchCustomerSearchTab('Email');
  }

  switchCustomerSearchTab(searchType: number | string): void {
    this.customerSearchForm.reset();
    this.customerSearchForm.get('searchType').patchValue(searchType);
    this.customerSearchForm.get('parameter').clearValidators();
    if (searchType === 2) {
      this.customerSearchForm.get('parameter').setValidators([Validators.required, Validators.email]);
    } else {
      this.customerSearchForm.get('parameter').setValidators([Validators.required]);
    }
    this.customerSearchForm.updateValueAndValidity();
  }

  searchCustomer() {
    if (this.customerSearchForm.valid) {
      this.customerSearchResults = [];
      const data = this.customerSearchForm.value;
      this.loading = true;
      this.customerService.searchCustomer(data)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(res => {
          this.loading = false;
          this.customerSearchResults = res.body.item2;
        }, err => {
          this.loading = false;
        })
    }
  }

  selectCustomer(data: any) {
    this.closeModal();
    this.depositAccountService.accountToCreate$.pipe(take(1)).subscribe(res => {
      this.depositAccountService.setExistingCustomer(data);
      if (res === 'savings-plan') {
        this.router.navigateByUrl('/deposits/accounts/create-savings-plan');
      } else if (res === 'fixed-deposit') {
        this.router.navigateByUrl('/deposits/accounts/create-fixed-deposit-plan');
      }
    })

  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

}
