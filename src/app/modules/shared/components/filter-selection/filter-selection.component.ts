import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { clearFilters, setFilters } from 'src/app/store/actions';
import { Filters } from 'src/app/store/models';
import { filtersSelector } from 'src/app/store/selectors';

@Component({
  selector: 'lnd-filter-selection',
  templateUrl: './filter-selection.component.html',
  styleUrls: ['./filter-selection.component.scss']
})
export class FilterSelectionComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  @Output() filterParams =  new EventEmitter();

  filters:Filters;
  showPopup = false;
  popupTitle = "";
  appliedFilterKey = "";

  constructor(private store:Store, private router:Router) {}

  ngOnInit(): void {
    this.listenForRouterChanges();
    this.listenForFilterChanges();
  }

  private listenForRouterChanges(){
    this.router.events.pipe(takeUntil(this.unsubscriber$)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.store.dispatch(clearFilters())
      }
    })
  }

  private listenForFilterChanges(){
    this.store.pipe(select(filtersSelector),takeUntil(this.unsubscriber$)).subscribe(selectedFilters => {
      if (selectedFilters) {
        const {type,...filters} = structuredClone(selectedFilters);
        this.filters = filters
        const filterParams = this.transFormFiltersForApi();
        this.filterParams.emit(filterParams);
      }else {
        this.filters = null;
        this.filterParams.emit(this.filters);
      }
    })
  }

  private transFormFiltersForApi(){
    let filterParams = {};
    for (const filter in this.filters) {
      if (Object.prototype.hasOwnProperty.call(this.filters, filter) && filter !== 'type') {
        const element = this.filters[filter].map(filter => filter.id);
        filterParams[filter] = element;
      }
    }
    return filterParams
  }

  removeFilter(key:string, index:number){
    this.filters[key].splice(index,1);
    this.store.dispatch(setFilters(this.filters))
  }

  openPopup(key:string,length:number){
    this.appliedFilterKey = key
    this.popupTitle = `Applied ${key} (${length})`;
    this.showPopup = true;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
