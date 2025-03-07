import { Component, OnDestroy, OnInit } from "@angular/core";
import swal from "sweetalert2";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { AuthService } from "src/app/service/auth.service";
import { map, pluck, takeUntil } from "rxjs/operators";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ConfigurationService } from "src/app/service/configuration.service";
import { Filter } from "src/app/model/filter";
import { UserService } from "src/app/service/user.service";
import {
  AppOwnerInformation,
  ListItem,
  User,
} from "src/app/modules/shared/shared.types";
import { QuickLoanService } from "src/app/service/quick-loan.service";
import { Router } from "@angular/router";
import { SharedService } from "src/app/service/shared.service";

type Loan = {
  validatedName: string;
  phoneNumber: string;
  loanCode: string;
  loanId: number;
  loanStatus: string;
  dateDisbursed: string;
};

type Callback = {
  id: number;
  phoneNumber: string;
  validatedName: string;
  dateRequested: string;
  stage: string;
  callbackStatus: string;
  bvn?: string;
  accNumber?: string;
  bank?: string;
  notes: [
    {
      personName: string;
      note: string;
      dateAdded: string;
    }
  ];
};

type Note = {
  status: string;
  note: string;
  callBackLogId: number;
};

@Component({
  selector: "lnd-quick-loan-applications",
  templateUrl: "./quick-loan-applications.component.html",
  styleUrls: ["./quick-loan-applications.component.scss"],
})
export class QuickLoanApplicationsComponent implements OnInit, OnDestroy {
  applications: any[];
  public loggedInUser: any;
  currentView: string = "Applications";
  requestLoader: boolean;
  ownerInformation: AppOwnerInformation;
  currentUser: User;
  currentUserId: number;
  currentUserBranchId: number;
  loader = false;

  public toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer:3000
  });

  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    maxPage: Infinity,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
    searchTerm: "",
  };

  searchParam = "";
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();

  filterModel: Filter;
  loans: Loan[];
  callbacks: Callback[];
  statusArray = [];
  applicantsFilter = [
    { id: "RegistrationStarted", text: "Registration Started" },
    { id: "Registered", text: "Registered" },
    { id: "SecurityPinSet", text: "Security Pin Set" },
    { id: "ValidationStarted", text: "Validation Started" },
    { id: "ValidationFailed", text: "Validation Failed" },
    { id: "CallbackRequested", text: "Callback Requested" },
    { id: "Barred", text: "Barred" },
  ];
  isLoading = false;
  copy_hover = false;
  placeholder = "Phone number, BVN, Account Number";
  callback: Callback;
  listItems: ListItem[] = [];
  note: Note;
  nullPersonValue = "Unmatched";

  constructor(
    private colorThemeService: ColorThemeService,
    public authService: AuthService,
    private modalService: NgbModal,
    private configurationService: ConfigurationService,
    private userService: UserService,
    private qlpService: QuickLoanService,
    private router: Router,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.fromLoansPage();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();

    this.configurationService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
    this.getUserPromise()
      .then((next) => {
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        // this.spoolBranches();
      })
      .catch((err) => {});

    this.statusArray = [...this.applicantsFilter];
    this.getQLPApplications();
  }

  private fromLoansPage(){
    this.qlpService.successfulLoanId$.pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      if (res.fromLoans) {
        this.switchView('Loans')
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

  getQLPApplications(payload?) {
    this.isLoading = true;
    this.qlpService
      .getQLPApplicants({
        pageNumber: this.pagination?.pageNumber,
        pageSize: this.pagination?.pageSize,
        ...payload,
      })
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.applications = response.items;
          this.setPagination(response);
          this.isLoading = false;

          if (payload?.filter) {
            this.filterModel.setData({
              filters: [[{ id: payload.filter, text: payload.filter }]],
              filterTypes: ["status"],
              filterHeaders: ["Status"],
            });
          }
        },
        () => (this.isLoading = false)
      );
  }

  getQLPLoans(payload?) {
    this.isLoading = true;
    this.qlpService
      .getQLPLoans({
        pageNumber: this.pagination?.pageNumber,
        pageSize: this.pagination?.pageSize,
        ...payload,
      })
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.loans = response.items;
          this.setPagination(response);
          this.isLoading = false;

          if (payload?.filter) {
            this.filterModel.setData({
              filters: [[{ id: payload.filter, text: payload.filter }]],
              filterTypes: ["status"],
              filterHeaders: ["Status"],
            });
          }
        },
        () => (this.isLoading = false)
      );
  }

  getQLPCallbackLogs(payload?) {
    this.isLoading = true;
    this.qlpService
      .getQLPCallbackLogs({
        pageNumber: this.pagination?.pageNumber,
        pageSize: this.pagination?.pageSize,
        ...payload,
      })
      .pipe(
        pluck("body", "data"),
        map((response) => ({
          ...response,
          items: response.items.map((item) => ({
            ...item,
            validatedName:
              item?.validatedName === " " ? this.nullPersonValue : item?.validatedName,
            notes: item.notes.map((note) => ({
              ...note,
              personName: !note?.personName
                ? this.nullPersonValue
                : note?.personName,
            })),
          })),
        })),
        takeUntil(this.unsubscriber$)
      )
      .subscribe(
        (response) => {
          this.callbacks = response.items;
          this.setPagination(response);
          this.isLoading = false;

          if (payload?.filter) {
            this.filterModel.setData({
              filters: [[{ id: payload.filter, text: payload.filter }]],
              filterTypes: ["status"],
              filterHeaders: ["Status"],
            });
          }
        },
        () => (this.isLoading = false)
      );
  }

  viewLoan(loanId: number) {
    if (!this.copy_hover) {
      this.qlpService.successfulLoanId$.next({id:loanId,fromLoans:false});
      this.router.navigate(["loan/loans"]);
    }
  }

  viewCallback(callback: Callback) {
    if (!this.copy_hover) {
      this.callback = callback;

      this.listItems = [
        { label: "BVN", value: this.callback?.bvn, iconClass: "icon-editor" },
        {
          label: "Account Number",
          value: this.callback?.accNumber,
          iconClass: "icon-editor",
        },
        {
          label: "Bank",
          value: this.callback?.bank,
          iconClass: "icon-company",
        },
        {
          label: "Phone Number",
          value: this.callback?.phoneNumber,
          iconClass: "icon-phone",
        },
        {
          label: "Loan Stage",
          value: this.callback?.stage,
          iconClass: "icon-editor",
        },
      ];
      this.note = {
        ...this.note,
        callBackLogId: this.callback?.id,
        status: "Open",
      };
    }
  }

  private setPagination(res: any): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.maxPage = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.maxPage);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.switchView(this.currentView);
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  openModal(content) {
    this.modalService.open(content, { ariaLabelledBy: "modal-basic-title" });
  }

  switchView(view: string) {
    if (view === "Applications") {
      this.placeholder = "Phone number, BVN, Account Number";
      this.statusArray = [...this.applicantsFilter];
      this.getQLPApplications();
    }

    if (view === "Loans") {
      this.placeholder = "loan code, validated name";
      this.statusArray = [
        { id: "Disbursed", text: "Disbursed" },
        { id: "DisbursementRequestSent", text: "Disbursement Request Sent" },
        { id: "Paid", text: "Paid" },
      ];
      this.getQLPLoans();
    }

    if (view === "Callback") {
      this.placeholder = "validated name, phone number";
      this.statusArray = [
        { id: "Open", text: "Open" },
        { id: "Treated", text: "Treated" }
      ];
      this.getQLPCallbackLogs();
    }

    if (this.filterModel) {
      this.filterModel.clearData();
    }
    this.currentView = view;
  }

  triggerRequest(payload?:{keyword?:string,filter?:string,pageNumber?:string}) {
    switch (this.currentView) {
      case "Loans":
        this.getQLPLoans(payload);
        break;

      case "Callback":
        this.getQLPCallbackLogs(payload);
        break;

      default:
        this.getQLPApplications(payload);
        break;
    }
    $(".itemPaginatedJumpModal").toggle(false);
  }

  filterModalOpen(display?: boolean) {
    $(".filter-menu").toggle(display);
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentUser = user.body;
          this.currentUserId = this.currentUser.userId;
          this.currentUserBranchId = this.currentUser.branchId;
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  copyCode(text: string, type: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: `${type} copied to clipboard`,
        type: "success",
        timer: 3000,
      });
    }
  }

  setNoteValues(value: string, type: string) {
    if (type === "note") {
      this.note = { ...this.note, note: value };
    }

    if (type === "status") {
      const status = this.note?.status === "Open" ? "Treated" : "Open";
      this.note = { ...this.note, status };
    }
  }

  postNote() {
    this.isLoading = true;
    this.qlpService
      .setQLPCallbackNote(this.note)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        () => {
          this.isLoading = false;
          this.toast.fire({
            type: "success",
            title: "Noted added successfully",
          });
          this.callback = null;
          this.getQLPCallbackLogs();
        },
        () => (this.isLoading = false)
      );
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
