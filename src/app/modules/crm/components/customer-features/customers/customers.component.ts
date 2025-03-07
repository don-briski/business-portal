import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import {
  BasicPaginationReqProps,
  CreateLinkInfo,
  Pagination,
  SearchParams,
  TableConfig,
  TableData,
  TableHeader,
  TablePaginationChange,
} from "src/app/modules/shared/shared.types";
import { ColorThemeService } from "src/app/service/color-theme.service";
import {
  CustomerType,
  CRMCustomer,
  FetchCRMCustomersResponse,
} from "../../../crm.types";
import { Router } from "@angular/router";
import { CrmService } from "../../../crm.service";
import { UserService } from "src/app/service/user.service";

@Component({
  selector: "lnd-customers",
  templateUrl: "./customers.component.html",
  styleUrls: ["./customers.component.scss"],
})
export class CustomersComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  colorTheme: ColorThemeInterface;

  isLoading = false;

  tableConfig: TableConfig = {
    striped: true,
    uniqueIdPropLink: "name",
  };

  tableHeaders: TableHeader[] = [
    { name: "Name" },
    { name: "Email" },
    { name: "Phone Number" },
    { name: "Status" },
    { name: "" },
  ];

  tableData: TableData[] = [];

  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
    searchColumns: [],
  };

  createLinkInfo:CreateLinkInfo = {
    text:'Add New Prospect/Customer',
    url: '/crm/customers/create',
    type: "url"
  }
  permissions:string[] = [];


  constructor(
    private colorThemeService: ColorThemeService,
    private router: Router,
    private crmService: CrmService,
    private userService:UserService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.fetchCustomers({
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    });
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  fetchCustomers(payload: BasicPaginationReqProps) {
    this.isLoading = true;
    this.crmService
      .fetchCrmCustomers(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.pagination.searchColumns = res.body.searchColumns;
          this.isLoading = false;
          this.permissions = this.userService.userPermissions;
          this.setTableData(res.body.items, res.body);
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  setTableData(
    CRMCustomers: CRMCustomer[],
    payload: FetchCRMCustomersResponse
  ) {
    this.tableData = CRMCustomers.map((CRMCustomer) => ({
      name: {
        tdValue: `${CRMCustomer?.firstName} ${CRMCustomer?.lastName}`,
        id: CRMCustomer?.id,
      },
      email: { tdValue: CRMCustomer?.email },
      phoneNumber: { tdValue: CRMCustomer?.phoneNumber },
      status: {
        tdValue: CRMCustomer?.status,
        type: "status",
        statusConfig: {
          class: this.getStatusClass(CRMCustomer?.status),
        },
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(CRMCustomer?.id,CRMCustomer.status),
      },
    }));

    this.setPagination(payload);
    this.isLoading = false;
  }

  getActionConfig(id: string, status:string) {
    return [
      {
        showBtn: this.permissions.includes("View Prospect"),
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.viewCustomer(id),
      },
      {
        showBtn: this.permissions.includes("Edit Prospect"),
        iconClass: "icon-edit",
        btnText: "Edit",
        funcRef: () => this.editCustomer(id),
      },
      {
        showBtn: this.permissions.includes("Delete Prospect") && status === CustomerType.Prospect,
        iconClass: "icon-trash text-danger",
        btnText: "Delete",
        funcRef: () => this.deleteCustomer(id),
      },
    ];
  }

  viewCustomer(id: string) {
    this.router.navigateByUrl(`/crm/customers/${id}`);
  }

  editCustomer(id:string){
    this.router.navigateByUrl(`/crm/customers/edit/${id}`);
  }

  deleteCustomer(id:string){
    this.isLoading = true;
    this.crmService.deleteCustomer(id).pipe(takeUntil(this.unsubscriber$)).subscribe({
      next:() => {
        this.fetchCustomers({pageNumber:this.pagination.pageNumber,pageSize:this.pagination.pageSize})
      },
      error:() => {
        this.isLoading = false;
      }
    })
  }

  getStatusClass(status: string): string {
    if (status === CustomerType.Prospect) {
      return "badge-warning";
    } else if (status === CustomerType.Customer) {
      return "badge-success";
    }
  }

  private setPagination(res: FetchCRMCustomersResponse): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  paginationChange(event: TablePaginationChange) {
    this.pagination = { ...this.pagination, ...event };

    this.fetchCustomers({
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    });
  }

  search(event: SearchParams) {
    this.pagination.keyword = event.keyword;
    this.pagination.selectedSearchColumn = event.selectedSearchColumn;
    this.pagination.pageNumber = event.pageNumber;
    this.pagination.pageSize = event.pageSize;
    this.fetchCustomers({
      keyword: event.keyword,
      selectedSearchColumn: event.selectedSearchColumn,
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
