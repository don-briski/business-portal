import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgxPrintModule } from "ngx-print";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatMenuModule } from "@angular/material/menu";
import { MatNativeDateModule } from "@angular/material/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatPaginatorModule } from "@angular/material/paginator";
import { RouterModule } from "@angular/router";

import { UploadedFilesComponent } from "./components/uploaded-files/uploaded-files.component";
import { SecsToMinsPipe } from "src/app/util/custom-pipes/sec-to-min.pipe";
import { RequiredPwParamsComponent } from "./components/required-pw-params/required-pw-params.component";
import { SwitchComponent } from "./components/switch/switch.component";
import { FilterComponent } from "./components/filter/filter.component";
import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { PopupComponent } from "src/app/modules/shared/components/popup/popup.component";
import { InputErrorsComponent } from "./components/input-errors/input-errors.component";
import { AsideComponent } from "./components/aside/aside.component";
import { SpinnerComponent } from "./components/spinner/spinner.component";
import { CustomDatePipePipe } from "src/app/util/custom-pipes/custom-date-pipe.pipe";
import { StringHumanifyPipe } from "src/app/util/custom-pipes/string-humanify.pipe";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TableHeaderComponent } from "./components/table-components/table-header/table-header.component";
import { TableFooterComponent } from "./components/table-components/table-footer/table-footer.component";
import { RibbonComponent } from "./components/ribbon/ribbon.component";
import { TransPinModalComponent } from "./components/trans-pin-modal/trans-pin-modal.component";
import { FinLayoutComponent } from "./components/fin-layout/fin-layout.component";
import { StuckDirective } from "./directives/stuck.directive";
import { MultiSelectDropdownComponent } from "./multi-select-dropdown/multi-select-dropdown.component";
import { TabBarComponent } from "./components/tab-bar/tab-bar.component";
import { TabComponent } from "./components/tab/tab.component";
import { DateRangeComponent } from "./components/date-range/date-range.component";
import { NoDataComponent } from "./components/no-data/no-data.component";
import { SelectedFiltersComponent } from "./components/selected-filters/selected-filters.component";
import { SearchInputComponent } from "./components/search-input/search-input.component";
import { InitialsComponent } from "./components/initials/initials.component";
import { ListItemComponent } from "./components/list-item/list-item.component";
import { StepperComponent } from "./components/stepper/stepper.component";
import { StepComponent } from "./components/step/step.component";
import { AccordionComponent } from "./components/accordion/accordion.component";
import { AccordionItemComponent } from "./components/accordion-item/accordion-item.component";
import { StepFooterComponent } from "./components/step-footer/step-footer.component";
import { TooltipComponent } from "./components/tooltip/tooltip.component";
import { CheckIconComponent } from "./components/check-icon/check-icon.component";
import { TableComponent } from "./components/table/table.component";
import { SearchDropdownComponent } from "./components/search-dropdown/search-dropdown.component";
import { FilterBtnComponent } from "./components/filter-btn/filter-btn.component";
import { DtListItemComponent } from "./components/dt-list-item/dt-list-item.component";
import { PaginatorComponent } from "./components/paginator/paginator.component";
import { LayoutNavComponent } from "./components/layout-nav/layout-nav.component";
import { InvalidDateCheckerDirective } from './directives/invalid-date-checker.directive';
import { OtpInputComponent } from './components/otp-input/otp-input.component';
import { CurrencyMaskModule } from "ng2-currency-mask";
import { ClickOutsideDirective } from "./directives/click-outside.directive";
import { TextAreaWithCharLimitComponent } from './components/text-area-with-char-limit/text-area-with-char-limit.component';
import { AddEditHeaderComponent } from './components/add-edit-header/add-edit-header.component';
import { SetupWrapperComponent } from './components/setup-wrapper/setup-wrapper.component';
import { SubmitBtnComponent } from './components/submit-btn/submit-btn.component';
import { FilterMenuComponent } from './components/filter-menu/filter-menu.component';
import { FilterSelectionComponent } from './components/filter-selection/filter-selection.component';
import { ProfileUploadComponent } from "./components/profile-upload/profile-upload.component";

@NgModule({
  declarations: [
    UploadedFilesComponent,
    CustomDatePipePipe,
    StringHumanifyPipe,
    SecsToMinsPipe,
    RequiredPwParamsComponent,
    SwitchComponent,
    FilterComponent,
    PopupComponent,
    InputErrorsComponent,
    AsideComponent,
    SpinnerComponent,
    TableHeaderComponent,
    TableFooterComponent,
    RibbonComponent,
    TransPinModalComponent,
    FinLayoutComponent,
    StuckDirective,
    MultiSelectDropdownComponent,
    TabBarComponent,
    TabComponent,
    DateRangeComponent,
    NoDataComponent,
    SelectedFiltersComponent,
    SearchInputComponent,
    InitialsComponent,
    ListItemComponent,
    StepperComponent,
    StepComponent,
    AccordionComponent,
    AccordionItemComponent,
    StepFooterComponent,
    TooltipComponent,
    CheckIconComponent,
    TableComponent,
    SearchDropdownComponent,
    DtListItemComponent,
    PaginatorComponent,
    LayoutNavComponent,
    InvalidDateCheckerDirective,
    ClickOutsideDirective,
    TextAreaWithCharLimitComponent,
    OtpInputComponent,
    AddEditHeaderComponent,
    SetupWrapperComponent,
    SubmitBtnComponent,
    FilterMenuComponent,
    FilterSelectionComponent,
    ProfileUploadComponent,
  ],
  imports: [
    CommonModule,
    Select2wrapperModule,
    FormsModule,
    ReactiveFormsModule,
    NgxPrintModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    NgbModule,
    MatMenuModule,
    MatButtonModule,
    FilterBtnComponent,
    MatPaginatorModule,
    MatCheckboxModule,
    RouterModule,
    CurrencyMaskModule,
  ],
  exports: [
    NgxPrintModule,
    CustomDatePipePipe,
    StringHumanifyPipe,
    SecsToMinsPipe,
    UploadedFilesComponent,
    RequiredPwParamsComponent,
    SwitchComponent,
    FilterComponent,
    PopupComponent,
    InputErrorsComponent,
    AsideComponent,
    SpinnerComponent,
    TableHeaderComponent,
    TableFooterComponent,
    RibbonComponent,
    TransPinModalComponent,
    FinLayoutComponent,
    StuckDirective,
    MultiSelectDropdownComponent,
    TabBarComponent,
    TabComponent,
    NoDataComponent,
    DateRangeComponent,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    SelectedFiltersComponent,
    SearchInputComponent,
    InitialsComponent,
    ListItemComponent,
    StepperComponent,
    AccordionComponent,
    AccordionItemComponent,
    StepFooterComponent,
    TooltipComponent,
    CheckIconComponent,
    TableComponent,
    SearchDropdownComponent,
    DtListItemComponent,
    Select2wrapperModule,
    PaginatorComponent,
    MatCheckboxModule,
    LayoutNavComponent,
    Select2wrapperModule,
    InvalidDateCheckerDirective,
    CurrencyMaskModule,
    ClickOutsideDirective,
    TextAreaWithCharLimitComponent,
    OtpInputComponent,
    CurrencyMaskModule,
    AddEditHeaderComponent,
    SetupWrapperComponent,
    SubmitBtnComponent,
    FilterMenuComponent,
    FilterSelectionComponent,
    ProfileUploadComponent
  ],
})
export class SharedModule {}
