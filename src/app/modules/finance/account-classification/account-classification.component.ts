import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { UserService } from "src/app/service/user.service";
import Swal from "sweetalert2";
import { FinanceService } from "../service/finance.service";

@Component({
  selector: "lnd-account-classification",
  templateUrl: "./account-classification.component.html",
  styleUrls: ["./account-classification.component.scss"],
})
export class AccountClassificationComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  user: any;
  unsubscriber$ = new Subject<void>();
  currentTheme: ColorThemeInterface;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    filter: null,
    jumpArray: [],
  };
  itemsRequestLoader: boolean = false;
  tabLoader: boolean;
  loading: boolean = false;
  tabState: string = "PettyCashExpense";
  allAccounts: any[] = [];
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  accountClasses: any[] = [
    // { id: "PettyCashExpense", text: "Expense" },
    { id: "PettyCashCredit", text: "Petty Cash" },
    { id: "staff", text: "Staff" },
    { id: "bank", text: "Bank" },
  ];
  selectedAccounts: any[] = [];
  selectClasses: string[] = [];
  accounts: any[] = [];
  fetchDto = {
    pageSize: this.pagination.pageSize,
    pageNumber: this.pagination.pageNumber,
  };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private financeService: FinanceService,
    private modalService: NgbModal,
    private coaService: ChartOfAccountService
  ) {}

  ngOnInit(): void {
    this.switchViews('PettyCashCredit');
    this.fetchUser();
    this.loadTheme();
    this._getAccounts();
  }
  ngAfterViewInit(): void {
    this.switchViews(this.tabState);
  }

  fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  openModal(content: any): void {
    this.modalService.open(content, { centered: true });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  fetchAccounts(data): void {
    this.tabLoader = true;

    this.financeService
      .getAccountsByClass({ ...data, filter: this.tabState })
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.tabLoader = false;
          this.allAccounts = res?.items;
          this.setPagination(res);
        },
        () => {
          this.tabLoader = false;
        }
      );
  }

  switchViews(tab: string): void {
    this.tabState = tab;
    switch (tab) {
      case "PettyCashExpense":
        $("#nav-expense").addClass("active-tab");
        $("#nav-credit").removeClass("active-tab");
        $("#nav-staff").removeClass("active-tab");
        $("#nav-bank").removeClass("active-tab");
        break;

      case "PettyCashCredit":
        $("#nav-credit").addClass("active-tab");
        $("#nav-expense").removeClass("active-tab");
        $("#nav-staff").removeClass("active-tab");
        $("#nav-bank").removeClass("active-tab");
        break;

      case "staff":
        $("#nav-staff").addClass("active-tab");
        $("#nav-expense").removeClass("active-tab");
        $("#nav-credit").removeClass("active-tab");
        $("#nav-bank").removeClass("active-tab");
        break;
      case "bank":
        $("#nav-bank").addClass("active-tab");
        $("#nav-expense").removeClass("active-tab");
        $("#nav-staff").removeClass("active-tab");
        $("#nav-credit").removeClass("active-tab");
        break;
      default:
        break;
    }

    this.fetchAccounts(this.fetchDto);
  }

  setPagination(res: any): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  attemptDelete(id: any): void {
    Swal.fire({
      type: "info",
      text: "Are you sure you want to remove this account ?",
      title: "Remove account?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Remove it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.declassify(id);
      }
    });
  }

  declassify(id: any): void {
    this.financeService
      .deleteAccountFromClass(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((_) => {
        this.toast.fire({
          title: "Account removed from class",
          type: "success",
        });
        this.fetchAccounts(this.fetchDto);
      });
  }

  selectAccount(event: any): void {
    if (
      this.selectedAccounts.length > 0 &&
      this.selectedAccounts.some((val) => val?.id === event?.accountId)
    ) {
      this.toast.fire({
        type: "info",
        title: "Account already selected",
      });
      return;
    }
    const model = {
      id: event?.accountId,
      name: `${event?.reference} - ${event?.name}`,
    };

    this.selectedAccounts.push(model);
  }

  removeAccount(index: number): void {
    this.selectedAccounts.splice(index, 1);
  }

  selectClass(event: any, action: string): void {
    if (action === "select") {
      this.selectClasses.push(event?.id);
    }

    if (action === "remove") {
      const index = this.selectClasses.indexOf(event?.id);
      this.selectClasses.splice(index, 1);
    }
  }

  private _getAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((accounts) => {
        this.accounts = accounts;
      });
  }

  getAccountNumber(accountId: number): number {
    return this.accounts.find((val) => val.accountId === accountId)?.reference;
  }

  sendAccounts(): void {
    this.loading = true;
    let model = {
      accountClassification: {},
    };
    const classifiedAccounts = [];
    this.selectedAccounts.forEach((item) => {
      classifiedAccounts.push(item.id);
    });

    this.selectClasses.forEach((val: string) => {
      model.accountClassification[val] = classifiedAccounts;
    });

    this.financeService
      .classifyAccount(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (_) => {
          this.fetchAccounts(this.fetchDto);
          this.closeModal();
          this.selectedAccounts = [];
          this.selectClasses = [];
          this.loading = false;

          this.toast.fire({
            title: "Accounts classified.",
            type: "success",
          });
        },
        () => {
          this.loading = false;
        }
      );
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
