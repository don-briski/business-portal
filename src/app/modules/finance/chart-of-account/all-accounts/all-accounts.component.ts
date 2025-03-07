import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { AngularCsv } from "angular7-csv/dist/Angular-csv";
import { Subject } from "rxjs";
import { debounceTime, map, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ExcelService } from "src/app/service/excel.service";
import { toFormData } from "src/app/util/finance/financeHelper";
import Swal from "sweetalert2";
import { saveAs } from "file-saver";
import * as moment from "moment";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-all-accounts",
  templateUrl: "./all-accounts.component.html",
  styleUrls: ["./all-accounts.component.scss"],
})
export class AllCoAccountsComponent implements OnInit, OnDestroy {
  @ViewChild("importFile") importFile: ElementRef;

  allSubscritions = new Subject<void>();
  tabLoader: boolean;
  allAccounts: any[] = [];
  sortedAccountTree: any[] = [];
  flattenedArray: any[] = [];

  isListView: boolean;
  formControl = new UntypedFormControl();

  currentTheme: ColorThemeInterface;
  filteredAccount: any[];
  isFiltering: boolean;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  isImporting = false;

  constructor(
    private chartOfAccountsService: ChartOfAccountService,
    private colorThemeService: ColorThemeService,
    private excelService: ExcelService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.loadAccounts();
    this.formControl.valueChanges
      .pipe(
        debounceTime(300),
        map((value) => {
          if (!value || value.length === 0) {
            this.isFiltering = false;
            this.isListView = false;
          }
          if (3 && (!value || value.length < 3)) return;

          this.isFiltering = true;
          this.isListView = true;
          this.filteredAccount = [];
          const accountData = JSON.parse(JSON.stringify(this.allAccounts));
          this.filteredAccount = this.filterAccountsByName(accountData, value);
        })
      )
      .subscribe();
  }

  openModal(content): void {
    this.modalService.open(content, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  downloadCOATemplate() {
    this.chartOfAccountsService
      .getCOATemplate()
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res) => {
        const fileName = `sample-chart-of-account-${moment().format(
          "YYYY-MM-DD-HH:mm:ss"
        )}`;
        saveAs(res.body, fileName);
      });
  }

  submitImportedCOA(accounts): void {
    this.isImporting = true;
    const payload = toFormData({ File: accounts });
    this.chartOfAccountsService
      .importCOA(payload)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe(
        (res) => {
          this.toast.fire("Chart Of Account Import Successful!", "success");

          this.isImporting = false;
          this.closeModal();
          this.loadAccounts();
        },
        (error) => (this.isImporting = false)
      );
  }

  filterAccountsByName(accountArr: any[], term: string): any {
    const filters = this.filterAccountsByAccountNumber(accountArr, term);
    let nameFilters = [];
    nameFilters = accountArr.filter((x) =>
      x.name.toLocaleLowerCase().includes(term.toLocaleLowerCase())
    );

    nameFilters.forEach((account) => {
      if (!filters.some((acct) => acct?.name === account?.name)) {
        filters.push(account);
      }
    });

    return filters;
  }

  filterAccountsByAccountNumber(accountArr: any[], term: string): any {
    return accountArr
      .filter((x) => x?.isPostingAccount)
      .filter((x) => x?.reference)
      .filter((x) =>
        x.reference
          .toString()
          .toLocaleLowerCase()
          .includes(term.toLocaleLowerCase())
      );
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  toggleList() {
    this.isListView = !this.isListView;
  }

  changeToTree() {
    this.isListView = false;
  }

  exportAccount(format: string) {
    const exportAble = [];
    const options = {
      headers: [
        "Account Name",
        "Account Code",
        "Parent Account",
        "Account Type",
        "Debit",
        "Credit",
      ],
    };
    this.flattenedArray.forEach((account) => {
      const row = {
        "Account Name": account?.name,
        "Account Code": account?.isPostingAccount
          ? `${account?.reference}`
          : `${account?.referenceLowerBoundary} - ${account?.referenceUpperBoundary}`,
        "Parent Account": account?.isHeader
          ? ""
          : this.getAccountName(account?.parentId),
        "Account Type": account?.isHeader ? "" : account?.groupAccount,
        Debit: account?.transactionType === 1 ? "Debit" : "",
        Credit: account?.transactionType === 2 ? "Credit" : "",
      };
      exportAble.push(row);
    });

    const excelData = {
      title: "Chart of accounts",
      headers: options.headers,
      data: exportAble,
    };
    if (format === "excel") {
      this.excelService.exportExcel(excelData);
    } else if (format === "csv") {
      return new AngularCsv(exportAble, excelData.title, options);
    }
  }

  loadAccounts(): void {
    this.tabLoader = true;
    this.chartOfAccountsService
      .getAllAccounts()
      .pipe(takeUntil(this.allSubscritions))
      .subscribe(
        (res) => {
          this.allAccounts = res;
          this.tabLoader = false;
          this.chartOfAccountsService.setCacheAccounts(this.allAccounts);
          if (!sessionStorage.getItem('openState')) {
            this.allAccounts.filter(x => x.isHeader).forEach(item => {
              sessionStorage.setItem(item?.name, 'show')
            })
            sessionStorage.setItem('openState', 'true');
          }
        },
        (err) => {
          this.tabLoader = false;
        },
        () => {
          this.flattenedArray = [];
          this.sortedAccountTree = this.listToTree(this.allAccounts);
          this.flattenArray(this.sortedAccountTree);
        }
      );
  }

  protected listToTree(list: any[]): any[] {
    let map = {},
      node: any,
      roots = [],
      i: number;

    for (i = 0; i < list?.length; i += 1) {
      map[list[i]?.accountId] = i;
      list[i].children = [];
    }

    for (i = 0; i < list?.length; i += 1) {
      node = list[i];
      if (node?.parentId) {
        list[map[node?.parentId]]?.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  flattenArray(arr: any[]): void {
    arr[arr.length - 1]["isLastItem"] = true;
    arr.forEach((item) => {
      this.flattenedArray.push(item);
      if (item?.children?.length > 0) {
        this.flattenArray(item.children);
      }
    });
  }

  getAccountName(id: any): string {
    return this.allAccounts.find((x) => x.accountId === id)?.name;
  }
  getParentHeirarchyLevel(id: any): number {
    return this.allAccounts.find((c) => c?.accountId === id)?.heirarchyLevel;
  }

  getClass(index: number): string {
    const light = "btn-light";
    const white = "btn-outline-light text-dark";
    if (index === 0 || index === 2) {
      return light;
    } else if (index === 1) {
      return white;
    } else if (index % 2 === 0) {
      return light;
    } else {
      return white;
    }
  }

  isParentLastItem(id: any): boolean {
    return this.flattenedArray.find((x) => x.accountId === id)?.isLastItem;
  }
  isGrandParentLastItem(id: any): boolean {
    const parent = this.flattenedArray.find((x) => x.accountId === id);
    return this.flattenedArray.find((x) => x.accountId === parent?.accountId)
      ?.isLastItem;
  }
  isGreatParentLastItem(id: any): boolean {
    const parent = this.flattenedArray.find((x) => x.accountId === id);
    const grandParent = this.flattenedArray.find(
      (x) => x.accountId === parent?.parentId
    );

    if (grandParent?.isHeader) {
      return false;
    }
    return this.flattenedArray.find(
      (x) => x.accountId === grandParent?.accountId
    )?.isLastItem;
  }

  isGreatParentNotHeader(id: any): boolean {
    const parent = this.flattenedArray.find((x) => x.accountId === id);
    const grandParent = this.flattenedArray.find(
      (x) => x.accountId === parent?.parentId
    );

    return grandParent?.isHeader;
  }

  getState(account: any): string {
    const accountName = account?.parentId ? account?.groupAccount : account?.name;
    const state = (sessionStorage.getItem(accountName) && account?.parentId) ? 'show' : (!sessionStorage.getItem(accountName) && !account?.parentId) ? 'collapsed' : null;
    return state
  }

  toggleState(account: any): void {
    if (account?.parentId) return;
    setTimeout(() => {
      if (sessionStorage.getItem(account?.name)) {
        sessionStorage.removeItem(account?.name)
      } else {
        sessionStorage.setItem(account?.name, 'show')
      }
    }, 500)
  }

  ngOnDestroy(): void {
    this.allSubscritions.next();
    this.allSubscritions.complete();
  }
}
