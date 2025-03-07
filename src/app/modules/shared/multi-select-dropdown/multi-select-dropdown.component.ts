import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { fromEvent, Subject } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  pluck,
  switchMap,
  takeUntil,
} from "rxjs/operators";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";

@Component({
  selector: "multi-select-dropdown",
  templateUrl: "./multi-select-dropdown.component.html",
  styleUrls: ["./multi-select-dropdown.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectDropdownComponent),
      multi: true,
    },
  ],
})
export class MultiSelectDropdownComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  /**
   * FORMCONTROL VALUE SHOULD BE INITIALIZED TO EMPTY ARRAY
   * multipe option
   * itemInSelectedItems - maybe remove method
   */
  @HostListener("document:click", ["$event"])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      if (this.dropdownState === "open") {
        this.dropdownState = "close";
      }
    }
  }
  @Input() data: CustomDropDown[] = [];
  @Input() active: CustomDropDown[] = [];
  @Input() multiple: boolean = false;
  @Input() currentTheme: ColorThemeInterface;
  @Input() searchService?: Select2SearchApi;
  @Input() showAddBtn = false;
  @Input() showAddBtnText;
  @Input() placeholder = "Select Item";
  @Input() mainContainerWidth = "200px";
  @Input() disableApiSearch = false;

  @Output() selected = new EventEmitter<CustomDropDown | CustomDropDown[]>();
  @Output() addBtnClick = new EventEmitter<boolean>();
  @Output() public searchResult = new EventEmitter<any>();

  @ViewChild("search", { static: false }) searchInput: ElementRef;

  private _onTouched = () => undefined;
  private _onChange = (value: CustomDropDown[] | null) => undefined;

  private subs$ = new Subject();

  searchTerm$ = new Subject();

  dropdownState: "open" | "close" = "close";
  selectedItems: CustomDropDown[] | null = [];
  originalList: CustomDropDown[] = [];
  isLoading = false;
  originalDataState:CustomDropDown[] = [];

  constructor(private eRef: ElementRef) {}

  ngOnInit(): void {
    this.originalDataState = this.data;
    if (this.active) {
      this.active.forEach((item) => this.selectedItems.push(item));
    }
    this.searchTerm$
      .pipe(
        takeUntil(this.subs$),
        debounceTime(700),
        switchMap((searchValue: string) => {
          this.isLoading = true;
          return this.searchService.search(searchValue);
        })
      )
      .subscribe((res) => {
        this.searchResult.emit(res?.body);
        this.isLoading = false;
      });
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  writeValue(obj: any): void {
    if (!this.multiple) {
      this.selectedItems = obj;
    }
  }

  toggleDropdownState(): void {
    if (this.dropdownState === "close") {
      this.dropdownState = "open";
      this.originalList = [...this.data];
      setTimeout(() => {
        this.watchChangesOnSearch();
      });
    } else {
      this.dropdownState = "close";
      this.data = [...this.originalList];
    }
  }

  private watchChangesOnSearch() {
    fromEvent(this.searchInput.nativeElement, "input")
      .pipe(
        pluck("target", "value"),
        debounceTime(500),
        takeUntil(this.subs$),
        distinctUntilChanged()
      )
      .subscribe((searchTerm: any) => {
        this.searchItems(searchTerm);
      });
  }

  selectItem(item: CustomDropDown) {
    const itemFound = this.selectedItems.find(
      (selectedItem) => selectedItem?.id === item?.id
    );
    if (this.multiple) {
      !itemFound
        ? this.selectedItems.push(item)
        : (this.selectedItems = this.selectedItems.filter(
            (selectedItem) => selectedItem?.id !== item?.id
          ));
      this._onChange(this.selectedItems);
    } else {
      !itemFound
        ? (this.selectedItems = [item])
        : (this.selectedItems = this.selectedItems.filter(
            (selectedItem) => selectedItem?.id !== item?.id
          ));
      this._onChange(this.selectedItems);
    }
    this.selected.emit(this.selectedItems);
  }

  itemInSelectedItems(index: number): number {
    return this.selectedItems.filter((currentItem) => currentItem.id === index)
      .length;
  }

  searchItems(searchTerm: string) {
    if (this.disableApiSearch) {
      this.data = [...this.originalDataState].filter(item => item.text.toLowerCase().includes(searchTerm.toLowerCase()));
    } else {
      if (searchTerm.length > 2) {
        this.searchTerm$.next(searchTerm);
      }
      if (searchTerm === "") {
        this.searchTerm$.next(searchTerm);
      }
    }
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
