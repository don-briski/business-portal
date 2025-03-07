import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ColorThemeService } from "src/app/service/color-theme.service";

@Component({
  selector: "lnd-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
})
export class FilterComponent implements OnInit {
  unsubscriber$ = new Subject<void>();
  @Input() btnText: string;
  @Input() placeholder = "Select Status";
  @Input() filterOptions: CustomDropDown[] = [];
  currentTheme: ColorThemeInterface;

  @Output() optionSelected = new EventEmitter();

  filterOption: CustomDropDown;
  constructor(private readonly colorThemeService: ColorThemeService,) {}

  ngOnInit(): void {
    this.loadTheme();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  selectFilterOption(event): void {
    this.filterOption = event;
  }

  filter(): void {
    this.optionSelected.emit(this.filterOption);
    this.closeFilterModal();
  }

  closeFilterModal(): void {
    $(".filter-menu").toggle();
  }
}
