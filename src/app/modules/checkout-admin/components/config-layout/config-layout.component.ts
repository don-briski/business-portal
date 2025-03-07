import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { CheckoutAdminService } from '../../checkout-admin.service';
import { delay, takeUntil } from 'rxjs/operators';
import { AppWideState, ConfigurationHero } from 'src/app/store/models';
import { Store } from '@ngrx/store';
import { configurationHeroSelector } from 'src/app/store/selectors';
import { clearConfigHero } from 'src/app/store/actions';

@Component({
  selector: 'lnd-config-layout',
  templateUrl: './config-layout.component.html',
  styleUrls: ['./config-layout.component.scss']
})
export class ConfigLayoutComponent implements OnInit, OnDestroy{

  private subs$ = new Subject();

  heroState:ConfigurationHero;
  currentTabIndex = 0;

  constructor(private checkoutAdminService: CheckoutAdminService, private store:Store<AppWideState>){}

  ngOnInit(): void {
    this.listenForHeroState();
  }

  private listenForHeroState(){
    this.store.select(configurationHeroSelector).pipe(takeUntil(this.subs$)).subscribe(heroState => {
      this.heroState = heroState;
    })
  }

  switchTab(currentTabIndex:number){
    this.currentTabIndex = currentTabIndex;
    this.checkoutAdminService.tabIndex$.next(currentTabIndex);
  }

  ngOnDestroy(): void {
    this.store.dispatch(clearConfigHero())
    this.subs$.next();
    this.subs$.complete();
  }
}
