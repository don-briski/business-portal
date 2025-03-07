import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import {
  TableData,
  TableHeader,
  TableConfig,
  TableSummation,
  Pagination,
  SearchParams,
  ComplexFilter,
  ComplexFiltersChange,
  CreateLinkInfo,
  TableSubTab,
  FilterTypes,
  FilterParams,
} from "../../shared.types";
import { KeyValue } from "@angular/common";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ConfigurationService } from "src/app/service/configuration.service";
import { pluck, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { SharedService } from "src/app/service/shared.service";
import swal from "sweetalert2";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { lightenColor } from "../../helpers/generic.helpers";

@Component({
  selector: "lnd-table",
  templateUrl: "./table.component.html",
  styleUrls: ["./table.component.scss"],
})
export class TableComponent implements OnChanges,OnInit, OnDestroy {
  private subs$ = new Subject();
  @Input() config: TableConfig;
  @Input() headers: TableHeader[] = [];
  @Input() data: TableData[] = [];
  @Input() summationData: TableSummation[] = [];
  @Input() isLoading: boolean;
  @Input() pagination: Pagination;
  @Input() searchColumns: string[] = [];
  @Input() complexFilters?: ComplexFilter[] = [];
  @Input() useComplexFilters = false;
  @Input() useStartAndEndDate = false;
  @Input() rowClickable = true;
  @Input() noDataTitle = "No Data Available";
  @Input() noDataDesc?: string;
  @Input() filters: CustomDropDown[] = [];
  @Input() selectedFilters: CustomDropDown[];
  @Input() filerLabel = "Select Status";
  @Input() allowSearch = true;
  @Input() enableFiltersSearch = false;
  @Input() createLinkInfo!: CreateLinkInfo;
  @Input() startDate: null | string = null;
  @Input() endDate: null | string = null;
  @Input() useFilterModel = false;
  @Input() subTabs:TableSubTab[] = [];
  @Input() allowMultipleFilters = false;
  @Input() useRelativePosition = false;
  @Input() addTopRule = true;
  @Input() defaultSettings:TableConfig = {
    theadLight: false,
    theadBg: false,
    small: false,
    striped: true,
    shadow: false,
    summations: false,
    bordered: false,
    rowClickable: this.rowClickable,
    searchPlaceholder: "Search...",
    legacySearch: false,
  }
  @Input() useNewFilter = false;
  @Input() filterTypes: FilterTypes[] = [];


  @Output() retrieveRowDetails = new EventEmitter<number>();
  @Output() filter = new EventEmitter<CustomDropDown[]>();
  @Output() paginationChange = new EventEmitter();
  @Output() dateSelectionChange = new EventEmitter<any>();
  @Output() searchParams = new EventEmitter<SearchParams>();
  @Output() complexFiltersChange = new EventEmitter<ComplexFiltersChange[]>();
  @Output() initialized = new EventEmitter();
  @Output() switchSubTab = new EventEmitter();
  @Output() filterParams = new EventEmitter();

  toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });

  currentTheme: ColorThemeInterface;
  complexFilterArr: ComplexFiltersChange[] = [];
  showFilterPopup = false;
  FILTER_TYPES = FilterTypes;
  customTableTopPosition = true;

  constructor(
    private configService: ConfigurationService,
    private colorThemeService: ColorThemeService,
    private sharedService: SharedService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.config = {...this.defaultSettings,...this.config}
  }

  ngOnInit(): void {
    this.loadTheme();
    this.getCurrencySymbol();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private getCurrencySymbol() {
    this.configService
      .getCurrencySymbol()
      .pipe(pluck("body", "currencySymbol"), takeUntil(this.subs$))
      .subscribe((currencySymbol) => (this.defaultSettings.currency = currencySymbol));
  }

  rowClick(row) {
    if (!this.rowClickable || !this.config.rowClickable) return;
    this.retrieveRowDetails.emit(row[this.config.uniqueIdPropLink].id);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
  }

  originalOrder = (
    a: KeyValue<number, string>,
    b: KeyValue<number, string>
  ): number => {
    return 0;
  };

  viewFile(urlInput: string) {
    window.open(urlInput, "_blank");
  }

  copyCode(event: Event, text: string) {
    event.stopPropagation();
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  updatePagination(totalPages: number, totalCount: number) {
    this.pagination.totalPages = totalPages;
    this.pagination.totalCount = totalCount;
    this.pagination.count = this.data.length;
    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  onSearchParams($event) {
    this.searchParams.emit({ ...$event, pageNumber: 1, pageSize: 10 });
  }

  setSearchFilter(searchParam) {
    this.pagination.filter = searchParam;
    if (searchParam === "") {
      this.paginationChange.emit({
        filter: "",
        keyword: "",
        pageNumber: this.pagination.pageNumber,
        pageSize: +this.pagination.pageSize,
      });
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  openFilterModal() {
    if (this.useNewFilter) {
      this.showFilterPopup = true;
    }else{
      $(".filter-menu").toggle();
    }
  }

  closeFilterModal() {
    $(".filter-menu").toggle();
  }

  onFilter() {
    if (this.useComplexFilters) {
      if (this.useStartAndEndDate) {
        this.dateSelectionChange.emit({
          startDate: this.startDate,
          endDate: this.endDate,
        });
      }
      this.complexFiltersChange.emit(this.complexFilterArr);
    } else {
      this.filter.emit(this.selectedFilters);
    }
    this.closeFilterModal();
  }

  onComplexFilterSelected(id: string, data: CustomDropDown): void {
    this.complexFilterArr = this.complexFilterArr.filter((c) => c.id !== id);
    this.complexFilterArr.push({ id, data });
  }

  onComplexFilterRemoved(id: string, data: CustomDropDown): void {
    this.complexFilterArr = this.complexFilterArr.filter((x) => x.id !== id);
  }

  onSelectedFiltersInit($event) {
    this.initialized.emit($event);
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
