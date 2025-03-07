import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { Subject } from "rxjs";
import { debounceTime, map } from "rxjs/operators";
import {
  MatLegacyAutocomplete as MatAutocomplete,
  MatLegacyAutocompleteTrigger as MatAutocompleteTrigger,
} from "@angular/material/legacy-autocomplete";
import { UntypedFormControl } from "@angular/forms";

import { AccountModel } from "./account-lib.model";

const SEARCH_DELAY = 300;

@Component({
  selector: "account-slct",
  templateUrl: "./account-slct.component.html",
  styleUrls: ["./account-slct.component.scss"],
})
export class AccountSlctComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public data: any[];

  @Input() placeholder = "";

  @Input() disabled = false;

  @Input()
  public allowSearch?: boolean = true;

  @Input()
  public allowSelectAny?: boolean;

  @Input()
  public searchMinLength = 2;

  @Input()
  public preselectedAccount?: AccountModel;

  @Output()
  public selectedAccount: EventEmitter<AccountModel>;

  allAccounts: any[] = [];
  sortedAccountTree: any[] = [];
  filteredAccount: any[] = [];
  unsubscriber$ = new Subject<void>();
  isPanelOpened = false;
  searchTimeOut: any;
  dataTree: any[] = [];
  formControl = new UntypedFormControl();
  isFiltering: boolean;
  accountSelected: string;

  @ViewChild("autoCompletePanel") autoCompletePanel: MatAutocomplete;
  @ViewChild("autoCompleteInput", { read: MatAutocompleteTrigger })
  autoCompleteInput: MatAutocompleteTrigger;

  @HostListener("document:click", ["$event"])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isPanelOpened = false;
    }
  }

  constructor(private eRef: ElementRef) {
    this.selectedAccount = new EventEmitter();
  }

  ngOnInit(): void {
    this.dataTree = this.listToTree(this.data);

    this.formControl.valueChanges
      .pipe(
        debounceTime(SEARCH_DELAY),
        map((value) => {
          if (!value || value.length === 0) {
            this.isFiltering = false;
          }
          if (
            this.searchMinLength &&
            (!value || value.length < this.searchMinLength)
          )
            return;

          this.isFiltering = true;
          this.filteredAccount = [];
          const accountData = JSON.parse(JSON.stringify(this.data));
          this.filteredAccount = this.filterAccountsByName(accountData, value);
        })
      )
      .subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.preselectedAccount = changes.preselectedAccount?.currentValue;
    if (this.preselectedAccount) {
      this.preselectedAccount = this.data.find(
        (x) => x?.accountId === this.preselectedAccount?.accountId
      );
      this.accountSelected = this.preselectedAccount
        ? `${this.preselectedAccount?.reference} - ${this.preselectedAccount?.name}`
        : "";
    }

    const prevData = changes?.data?.previousValue;
    const currentData = changes?.data?.currentValue;
    if (prevData?.length !== currentData?.length) {
      this.dataTree = this.listToTree(this.data);
    }
  }

  filterAccountsByName(accountArr: any[], term: string): any {
    const filters = this.filterAccountsByAccountNumber(accountArr, term);
    let nameFilters = [];
    if (this.allowSelectAny)
      nameFilters = accountArr.filter((x) =>
        x?.name.toLocaleLowerCase().includes(term?.toLocaleLowerCase())
      );
    nameFilters = accountArr
      .filter((x) =>
        x?.name.toLocaleLowerCase().includes(term?.toLocaleLowerCase())
      )
      .filter((y) => y?.isPostingAccount);

    nameFilters.forEach((account) => {
      if (!filters.some((acct) => acct?.name === account?.name)) {
        filters.push(account);
      }
    });

    return filters;
  }

  filterAccountsByAccountNumber(accountArr: any[], term: string): any {
    return accountArr
      .filter(x => x?.isPostingAccount)
      .filter(x => x?.reference)
      .filter(c =>
        c?.reference
          .toString()
          .toLocaleLowerCase()
          .includes(term?.toLocaleLowerCase())
      );
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  selectAccount(account: any): void {
    if (!account?.isPostingAccount && !this.allowSelectAny) {
      return;
    }
    this.isPanelOpened = false;
    this.preselectedAccount = account;
    this.accountSelected = `${this.preselectedAccount?.reference} - ${this.preselectedAccount?.name}`;
    this.selectedAccount.emit(account);
    this.isPanelOpened = false;
  }

  protected listToTree(list: AccountModel[]): any[] {
    let map = {},
      node: any,
      roots = [],
      i: number;

    for (i = 0; i < list.length; i += 1) {
      map[list[i].accountId] = i;
      list[i].children = [];
    }

    for (i = 0; i < list.length; i += 1) {
      node = list[i];
      if (node?.parentId) {
        list[map[node.parentId]].children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}
