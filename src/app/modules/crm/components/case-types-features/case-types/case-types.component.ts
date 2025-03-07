import { Component, OnDestroy, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import { setConfigHero } from "src/app/store/actions";
import { AppWideState } from "src/app/store/models";
import { CrmService } from "../../../crm.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { TableConfig, TableData, TableHeader } from "src/app/modules/shared/shared.types";
import { CaseType } from "../../../crm.types";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";

@Component({
  selector: "lnd-case-types",
  templateUrl: "./case-types.component.html",
  styleUrls: ["./case-types.component.scss"],
})
export class CaseTypesComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject<void>();

  isLoading = false;
  caseTypes: CaseType[] = [];
  caseType: CaseType;
  config:TableConfig = {rowClickable:false}
  header: TableHeader[] = [];
  data: TableData[] = [];
  permissions: string[] = [];
  showPopup = false;

  constructor(
    private store: Store<AppWideState>,
    private crmService: CrmService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchCaseTypes();
    this.fetchUser();
  }

  private fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe((res) => {
        this.permissions = res.body.permission;
        if (this.permissions.includes("View Prospect Case Type")) {
          this.setHeroState();
        }
      });
  }

  fetchCaseTypes() {
    this.isLoading = true;
    this.crmService
      .fetchCaseTypes({ pageNumber: 1, pageSize: 10 })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.caseTypes = res.body.items;
          this.setTableData();
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private setTableData() {
    this.header = [
      { name: "Case" },
      { name: "Description" },
      { name: "Status" },
      { name: "Action" }
    ];

    this.data = this.caseTypes.map((caseType) => ({
      name: { tdValue: caseType.name },
      desc: { tdValue: caseType?.description },
      status: {
        tdValue: caseType?.isActive ? "Active" : "Inactive",
        type: "status",
        statusConfig: {
          class: caseType?.isActive ? "badge-success" : "badge-danger",
        },
      },
      action: { tdValue: "", type:"action", actionConfig: this.getActionConfig(caseType) },
    }));

    if (!this.permissions.includes("Manage Prospect Case Type")) {
      this.header = this.header.filter(item => item.name !== "Action");
      this.data = this.data.map(({action, ...rest}) => rest);
    }

  }

  getActionConfig(caseType: CaseType) {
    return [
      {
        showBtn: this.permissions.includes("Manage Prospect Case Type"),
        iconClass: "icon-edit",
        btnText: "Manage",
        funcRef: () => this.editCaseType(caseType),
      },
    ];
  }

  private editCaseType(caseType:CaseType){
    this.caseType = {...caseType};
    this.togglePopup();
  }

  private setHeroState() {
    const heroProps = {
      title: "CRM Configuration",
      subTitle: "This is where you configure the CRM module",
      tabs: ["Case Type"],
    };

    this.store.dispatch(setConfigHero(heroProps));
  }

  togglePopup(){
    this.showPopup = !this.showPopup;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
