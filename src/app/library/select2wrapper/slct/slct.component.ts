import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  forwardRef,
  OnDestroy,
  HostListener,
  ElementRef,
} from "@angular/core";
import { Select2Value } from "ng-select2-component";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import ListPosition, { Select2SearchApi } from "./select-lib-model";
import { debounceTime, switchMap, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

/*
**********************************************************
Do not modify this component without asking for permission
**********************************************************
*/

const noop = () => {};

export const CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SlctComponent),
  multi: true,
};
@Component({
  selector: "slct-2",
  templateUrl: "./slct.component.html",
  styleUrls: ["./slct.component.scss"],
  providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR],
})
export class SlctComponent implements OnInit, ControlValueAccessor, OnDestroy {
  @Input() public label: string;
  @Input() public data: any;
  @Input() public active: any[];
  @Input() public placeholder: string;
  @Input() public disabled: boolean = false;
  @Input() public multiple: boolean;
  @Input() public customSearchEnabled: boolean;
  @Input() public hideSelectedItems: boolean;
  @Input() public allowClear: boolean;
  @Input() public nostyle: boolean;
  @Input() public allowSelectAll: boolean = false;
  @Input() public listPosition: typeof ListPosition;
  @Input() public searchService?: Select2SearchApi;
  @Input() searchPlaceholderText = "Search";

  unsubscriber$ = new Subject<any>();
  searchTerm$ = new Subject<string>();

  dropdownSettings = {};

  public mappedData: any[];
  public val: Select2Value;
  //The internal data model
  private innerValue: any = "";

  //Placeholders for the callbacks which are later provided
  //by the Control Value Accessor
  private onTouchedCallback: () => void = noop;
  private onChangeCallback: (_: any) => void = noop;

  @Output() public selected: EventEmitter<any>;
  @Output() public dropdownClosed: EventEmitter<any>;
  @Output() public removed: EventEmitter<any>;
  @Output() public selectedAll: EventEmitter<void>;
  @Output() public deselectedAll: EventEmitter<void>;
  @Output() clickOutside = new EventEmitter<void>();
  @Output() public searchResult = new EventEmitter<any>();

  @HostListener("document:click", ["$event"])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.clickOutside.emit();
    }
  }

  constructor(private eRef: ElementRef) {
    this.selected = new EventEmitter<any>();
    this.dropdownClosed = new EventEmitter<any>();
    this.removed = new EventEmitter<any>();
    this.selectedAll = new EventEmitter<void>();
    this.deselectedAll = new EventEmitter<void>();
  }

  ngOnInit(): void {
    this.dropdownSettings = {
      singleSelection: !this.multiple,
      idField: "id",
      textField: "text",
      enableCheckAll: this.allowSelectAll,
      itemsShowLimit: 3,
      allowSearchFilter: this.customSearchEnabled,
      searchPlaceholderText: this.searchPlaceholderText,
    };
    this.mapData();
    if (this.active && this.active.length > 0) {
      this.value = this.active[0].id;
    }
    this.setActive();

    this.searchTerm$
      .pipe(
        takeUntil(this.unsubscriber$),
        debounceTime(700),
        switchMap((searchValue: string) => {
          return this.searchService?.search(searchValue);
        })
      )
      .subscribe((res) => {
        this.searchResult.emit(res?.body);
      });
  }

  //get accessor
  get value(): any {
    return this.innerValue;
  }

  //set accessor including call the onchange callback
  set value(v: any) {
    if (v !== this.innerValue) {
      this.innerValue = v;
      this.onChangeCallback(v);
    }
  }

  //Set touched on blur
  onBlur() {
    this.onTouchedCallback();
  }

  //From ControlValueAccessor interface
  writeValue(value: any) {
    if (value !== this.innerValue) {
      this.innerValue = value;
    }
  }

  //From ControlValueAccessor interface
  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  //From ControlValueAccessor interface
  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  private mapData(): void {
    if (this.data !== undefined && this.data.length > 0) {
      this.mappedData = this.data.map((x) => {
        return { label: x.text || x, value: x.id || x };
      });
    }
  }

  public valueChange($event: any): void {
    let dataEmit;
    if (!this.multiple) {
      let data = this.innerValue;
      dataEmit = {
        id: data[0].id || data.toString(),
        text: data[0].text || data.toString(),
      };
    } else {
      let data = $event;
      dataEmit = {
        id: data.id || data.toString(),
        text: data.text || data.toString(),
      };
    }
    this.selected.emit(dataEmit);
  }

  dropdownClosedEvent($event): void {
    this.dropdownClosed.emit($event);
  }

  public removeValue($event: any): void {
    let data;
    if (this.multiple) {
      data = {
        id: $event.id || $event.toString(),
        text: $event.text || $event.toString(),
      };
      this.removed.emit(data);
    } else {
      data = $event;
      this.removed.emit(data);
    }
  }

  private setActive(): void {
    if (this.active && this.active.length > 0) {
      if (!this.multiple) {
        this.innerValue = this.active;
      } else {
        this.innerValue = this.active.map((x) => {
          if (x !== null) {
            return { text: x.text || x, id: x.id || x };
          }
        });
      }
    }
  }

  public selectAll(): void {
    this.selectedAll.emit();
  }

  public deselectAll(): void {
    this.deselectedAll.emit();
  }

  onFilterChange($event: any): void {
    let value = $event;
    if (value.length > 2 || !value) {
      this.searchTerm$.next(value);
      // this.onSearch(value);
    }
  }

  private onSearch(searchValue: any): void {
    this.searchService
      .search(searchValue)
      .pipe(takeUntil(this.unsubscriber$), debounceTime(500))
      .subscribe((res) => {
        this.searchResult.emit(res?.body);
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
