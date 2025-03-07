import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lnd-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss']
})
export class SearchInputComponent {
  @Input() placeholder = "Search...";

  @Output() searchHandler = new EventEmitter<string>();
  @Output() clearSearch = new EventEmitter<string>();

  valueChanges(searchInput:string){
    if (!searchInput) {
      this.clearSearch.emit();
    }
  }

}
