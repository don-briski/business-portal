import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { CustomerType, CRMCustomerDetail } from "../../../crm.types";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { map, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Tab } from "src/app/modules/shared/shared.types";
import { CrmService } from "../../../crm.service";
import { TabBarService } from "src/app/modules/shared/components/tab-bar/tab-bar.service";
import { GrowthbookService } from "src/app/service/growthbook.service";
import GrowthBookFeatureTags from "src/app/model/growthbook-features";
import { Store } from "@ngrx/store";
import { AppState } from "src/app/store/app.state";
import { setCrmCustomer } from "src/app/store/actions";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";

@Component({
  selector: "lnd-customer",
  templateUrl: "./customer.component.html",
  styleUrls: ["./customer.component.scss"],
})
export class CustomerComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject<void>();

  CUSTOMER_TYPE = CustomerType;

  isLoading = false;

  customer: CRMCustomerDetail;

  colorTheme: ColorThemeInterface;

  currentTab = "profile";

  tabs: Tab[] = [];

  customerId: string;
  permissions:string[] = [];

  constructor(
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService,
    private crmService: CrmService,
    private tabBarService: TabBarService,
    private growthbookService: GrowthbookService,
    private store:Store<AppState>,
    private userService:UserService,
    private authService:AuthService
  ) {}

  ngOnInit(): void {
    this.fetchUser();
    this.loadTheme();
    this.customerId = this.route.snapshot.params.id;
    this.getCustomer(this.customerId);
    this.listenTabSwitch();
  }

  private fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.permissions = res.body.permission;
      });
  }

  loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  getCustomer(id: string) {
    this.isLoading = true;
    this.crmService
      .getCustomer(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.customer = res.body.data;

          this.tabs = [
            {
              id: "profile",
              text: "Profile",
            },
            {
              id: "interactions",
              text: "Interactions",
              hide: !this.permissions.includes("View Prospect Case"),
            },
          ];

          if (this.customer.status === this.CUSTOMER_TYPE.Customer) {
            this.tabs.push({
              id: "products",
              text: "Products",
              hide: this.growthbookService.growthbook.isOff(
                GrowthBookFeatureTags.CRMProduct
              ),
            });
          }

          this.store.dispatch(setCrmCustomer(this.customer))
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  listenTabSwitch() {
    this.tabBarService.tabSwitched
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (tab) => {
          this.currentTab = tab.tabId;
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
