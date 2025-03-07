import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { PillFilter, PillFilters } from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";
import { Filter } from "src/app/model/filter";

@Component({
  selector: "lnd-selected-filters",
  templateUrl: "./selected-filters.component.html",
  styleUrls: ["./selected-filters.component.scss"],
})
export class SelectedFiltersComponent implements OnInit, OnDestroy {
  @Input() secondaryColor: string;
  @Input() useFilterModel = true;
  @Output() initialized = new EventEmitter<Filter>();
  private subs$ = new Subject();

  start = 0;
  limit = 10;
  togglePopup = false;
  selectedFilters: PillFilters;
  popupFilter: PillFilter[];
  filterIndex: number;
  title: string;
  filterModel: Filter;

  constructor(
    private readonly sharedService: SharedService,
    private readonly colorThemeService: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.getColorTheme();

    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.subs$))
      .subscribe((selectedFilters) => {
        this.selectedFilters = selectedFilters;
      });

    if (this.useFilterModel) {
      this.filterModel = new Filter(this.sharedService);
      this.initialized.emit(this.filterModel);
    }
  }

  getColorTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (theme) => {
          this.secondaryColor = this.secondaryColor || theme.secondaryColor;
        },
      });
  }

  onRemoveFilter(filter: PillFilter) {
    const filters = this.selectedFilters.filters.map((selectedFilter) => {
      if (selectedFilter[0]?.type === filter?.type) {
        return (selectedFilter = selectedFilter.filter(
          (selectedFilter) => selectedFilter.id !== filter.id
        ));
      } else {
        return selectedFilter;
      }
    });

    this.selectedFilters = {
      ...this.selectedFilters,
      filters,
      action: "remove",
    };

    if (this.filterIndex) {
      this.popupFilter = this.selectedFilters.filters[this.filterIndex];
    }

    this.useFilterModel
      ? this.filterModel.onChange(null, this.selectedFilters)
      : this.sharedService.selectedFilters$.next(this.selectedFilters);
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }

  onTogglePopup(popupFilter: PillFilter[], index: number) {
    this.togglePopup = !this.togglePopup;
    this.filterIndex = index;
    this.title = this.selectedFilters.headers[this.filterIndex];
    this.popupFilter = popupFilter;
  }
}
