import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { SearchParams } from '../../shared.types';
import { ColorThemeService } from 'src/app/service/color-theme.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'lnd-search-dropdown',
  templateUrl: './search-dropdown.component.html',
  styleUrls: ['./search-dropdown.component.scss']
})

export class SearchDropdownComponent implements OnChanges, OnInit, OnDestroy {
  private subs$ = new Subject();
  @Input() searchColumns:string[];
  @Input() addTopRule = false;
  @Input() currentTheme:ColorThemeInterface;
  @Input() currentView?:string;
  @Input() showSearchIconInInput = true;
  @Input() showBtnSearchLabel = false;
  @Input() useRelativePosition:boolean;
  @Output() searchParams = new EventEmitter<SearchParams>();
  @Output() valueChange = new EventEmitter<string>();

  placeholder = "Enter Keyword";
  searchColumn:string;
  searchValue:string;
  displayDropdown = false;
  searchFocused = false;
  searchParamsEmitted = false;

  constructor(private colorThemeService:ColorThemeService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.searchColumn && this.searchValue && changes.currentView?.currentValue) {
        this.resetInput();
      }
  }

  ngOnInit(): void {
      this.loadTheme();
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  setSelectedColumn(searchColumn:string){
    this.searchColumn = searchColumn;
    this.placeholder = "";
  }

  emitSelectedColumn(value:boolean){
    this.searchParams.emit({selectedSearchColumn:this.searchColumn,keyword:this.searchValue});
    this.searchParamsEmitted = value;
  }

  resetInput(){
   this.searchColumn = "";
   this.searchValue = "";
   this.placeholder = "Enter Keyword";
   this.searchParamsEmitted && this.emitSelectedColumn(false);
  }

  toggleDropdown(){
    setTimeout(() => {
      this.displayDropdown = !this.displayDropdown;
      this.searchFocused = !this.searchFocused;
    },500);
  }

  onValueChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(value);
  }

  ngOnDestroy(): void {
      this.subs$.next();
      this.subs$.complete();
  }
}
