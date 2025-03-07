import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlctComponent } from './slct/slct.component';
import { Select2Module } from "ng-select2-component";
import { NgSelectModule } from '@ng-select/ng-select';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { AccountSlctComponent } from './account-slct/account-slct.component';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [SlctComponent, AccountSlctComponent],
  exports: [SlctComponent, AccountSlctComponent],
  imports: [
    CommonModule,
    Select2Module,
    // NgSelectModule,
    NgMultiSelectDropDownModule.forRoot(),
    MatAutocompleteModule,
    MatTreeModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class Select2wrapperModule { }
