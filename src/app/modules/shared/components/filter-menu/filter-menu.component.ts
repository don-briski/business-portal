import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { FilterMenuSelection, FilterTypes } from "../../shared.types";
import { Subject } from "rxjs";
import { AuthService } from "src/app/service/auth.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { map, takeUntil } from "rxjs/operators";
import { select, Store } from "@ngrx/store";
import { AppWideState } from "src/app/store/models";
import { setFilters } from "src/app/store/actions";
import { filtersSelector } from "src/app/store/selectors";
import { SharedService } from "src/app/service/shared.service";

@Component({
  selector: "lnd-filter-menu",
  templateUrl: "./filter-menu.component.html",
  styleUrls: ["./filter-menu.component.scss"],
})
export class FilterMenuComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  @Input() showPopup = false;
  @Input() filterTypes: FilterTypes[];
  @Input() statuses: CustomDropDown[] = [];

  @Input() allowMultipleStatuses = false;
  @Input() isLoading = false;
  @Input() customTableTopPosition = false;

  @Output() closePopup = new EventEmitter();

  branches: CustomDropDown[] = [];
  loanProducts: CustomDropDown[] = [];

  selectedStatuses: CustomDropDown[] = [];
  selectedBranches: CustomDropDown[] = [];
  selectedLoanProducts: CustomDropDown[] = [];

  FILTER_TYPES = FilterTypes;

  constructor(
    private authService: AuthService,
    private configService: ConfigurationService,
    private sharedService:SharedService,
    private store: Store<AppWideState>
  ) {}

  ngOnInit(): void {
    this.getBranches();
    this.getLoanProducts();
    this.listenForFilterChanges();
  }

  //syncs filter state with form
  private listenForFilterChanges() {
    this.store
      .pipe(select(filtersSelector), takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters) => {
        if (selectedFilters) {
          if (selectedFilters["branches"]) {
            this.selectedBranches = selectedFilters["branches"];
          }

          if (selectedFilters["loanProducts"]) {
            this.selectedLoanProducts = selectedFilters["loanProducts"];
          }

          if (selectedFilters["statuses"]) {
            this.selectedStatuses = selectedFilters["statuses"];
          }
        } else {
          this.selectedBranches = [];
          this.selectedLoanProducts = [];
          this.selectedStatuses = [];
        }
      });
  }

  private getBranches() {
    const model = {
      userId: this.authService.decodeToken().nameid,
      pageNumber: 1,
      pageSize: 10,
    };

    this.configService
      .spoolAccessibleBranches(model)
      .pipe(
        map((branches) =>
          branches.body.map((branch) => ({
            id: branch?.branchId,
            text: branch?.branchName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (branches) => {
          this.branches = branches;
        },
      });
  }

  private getLoanProducts() {
    this.configService
      .fetchLoanTypes(this.authService.decodeToken().nameid)
      .pipe(
        map((response) =>
          response.body.map((loanProduct) => ({
            id: loanProduct.loanTypeId,
            text: loanProduct.loanName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (loanProducts) => {
          this.loanProducts = loanProducts;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  filter() {
    let payload: FilterMenuSelection;
    if (this.selectedBranches?.length > 0) {
      payload = { ...payload, branches: this.selectedBranches };
    }

    if (this.selectedLoanProducts?.length > 0) {
      payload = { ...payload, loanProducts: this.selectedLoanProducts };
    }

    if (this.selectedStatuses?.length > 0) {
      if (typeof this.selectedStatuses[0] === "string") {
        this.selectedStatuses = this.selectedStatuses.map((status) => ({
          id: status as unknown as string,
          text: status as unknown as string,
        }));
      }
      payload = { ...payload, statuses: this.selectedStatuses };
    }

    this.sharedService.setFilterActionTriggered$.next(true);
    this.store.dispatch(setFilters(payload));
    this.closePopup.emit();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
