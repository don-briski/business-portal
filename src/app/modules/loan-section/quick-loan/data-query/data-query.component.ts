import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ListItem } from "src/app/modules/shared/shared.types";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { LoanoperationsService } from "src/app/service/loanoperations.service";

type Customer = {
  employeeId: string,
  fullName: string,
  bvn: string,
  phoneNumber: string,
  gender: string
}
@Component({
  selector: "lnd-data-query",
  templateUrl: "./data-query.component.html",
  styleUrls: ["./data-query.component.scss"],
})
export class DataQueryComponent implements OnInit, OnDestroy {
  currentTheme: ColorThemeInterface;
  subs$ = new Subject();
  searchTypes: CustomDropDown[] = [
    { id: "Bvn", text: "BVN" },
    { id: "AccountNumber", text: "Account Number" },
  ];

  customer: Customer;

  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    filter: null,
    jumpArray: [],
  };
  openAside = false;
  payrollHistory;
  queryType = "bvn";
  isLoading = false;
  listItems:ListItem[] = [];

  constructor(private colorThemeService: ColorThemeService, private loanOpService:LoanoperationsService) {}

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

  setQueryType(queryType) {
    this.queryType = queryType;
  }

  fetchPayrollUser($event) {
    this.isLoading = true;
    const payload = {Keyword:$event,Category:this.queryType};

    this.loanOpService.getPayrollUser(payload).pipe(pluck("body"),takeUntil(this.subs$)).subscribe((customer)=>{
      this.isLoading = false;
      //hack
      customer?.data ? this.customer = customer?.data : this.customer = null;
    },()=> this.isLoading = false)

  }

  viewPayrollHistory(employeeId:string) {
    this.isLoading = true;
    this.openAside = true;

    this.loanOpService.getCustomerPayrollData(employeeId).pipe(pluck("body","data"),takeUntil(this.subs$)).subscribe(payrollHistory => {
      this.isLoading = false;
      this.payrollHistory = {...this.customer,history:payrollHistory};
      this.listItems = [
        {label:'BVN',value:this.payrollHistory.bvn,iconClass:'icon-editor'},
        {label:'Gender',value:this.payrollHistory.gender,iconClass:'icon-user-o'},
        {label:'Date Of Birth',value:this.payrollHistory.dateOfBirth,iconClass:'icon-calendar',type:'date'},
        {label:'Email',value:this.payrollHistory.email,iconClass:'icon-email'},
        {label:'Is Verified',value:this.payrollHistory.history[0]?.isVerified,iconClass:'icon-circle-check-o'}
      ]
      if (!this.payrollHistory.history[0]?.isVerified) {
        this.listItems.push({label:'Date Verified',value:this.payrollHistory.history[0]?.dateVerified,iconClass:'icon-calendar-new',type:'date'});
      }
    })
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
