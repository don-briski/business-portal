import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import {
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
  TablePaginationChange,
} from "src/app/modules/shared/shared.types";
import {
  DISBURSEMENT_CATEGORY,
  DISBURSEMENT_LIMIT_POPUP,
  DISBURSEMENT_LIMIT_TAB,
  DisbursementLimit,
  DisbursementLimitGroup,
  DisbursementLimitGroupMember,
} from "../../models/disbursement-limit-type";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ConfigurationService } from "src/app/service/configuration.service";
import { map, takeUntil } from "rxjs/operators";
import { AuthService } from "src/app/service/auth.service";
import { DisbursementLimitService } from "../../services/disbursement-limit.service";
import Swal from "sweetalert2";
import { removeNullUndefinedWithReduce } from "src/app/modules/shared/helpers/generic.helpers";
import { UserService } from "src/app/service/user.service";

@Component({
  selector: "lnd-disbursement-limits",
  templateUrl: "./disbursement-limits.component.html",
  styleUrls: ["./disbursement-limits.component.scss"],
})
export class DisbursementLimitsComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  isLoading = false;
  config: TableConfig = { rowClickable: true };
  headers: TableHeader[] = [];
  data: TableData[] = [];
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
  limitCategories = ["Employer", "Branch", "State", "ProductType"];
  showPopup = false;
  limitDetail;
  currentTab: DISBURSEMENT_LIMIT_TAB;
  DISBURSEMENT_LIMIT_TAB = DISBURSEMENT_LIMIT_TAB;

  showAlertForm = false;
  disbursementLimits: DisbursementLimit[] = [];
  selectedResource: string;
  selectedPopup: DISBURSEMENT_LIMIT_POPUP;
  DISBURSEMENT_LIMIT_POPUP = DISBURSEMENT_LIMIT_POPUP;
  disbursementLimitGroups: DisbursementLimitGroup[] = [];
  members: CustomDropDown[] = [];
  disbursementGroupForm = new FormGroup({
    name: new FormControl("", Validators.required),
    category: new FormControl("", Validators.required),
    members: new FormControl([], Validators.required),
  });
  isProcessing = false;
  disbursementLimitGroupId: number;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  groupMembers: DisbursementLimitGroupMember[] = [];
  disbursementCategories = ["Employer", "ProductType", "State", "Branch", "Group"];
  isRetrievingLimitDetail = false;
  permissions: string[] = [];

  constructor(
    private disbursementLimitService: DisbursementLimitService,
    private configService: ConfigurationService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.fetchUser();
    this.setDefaultViewBasedOnPermission();
  }

  private setDefaultViewBasedOnPermission() {
    if (this.permissions.includes("View Loan Disbursement Group")) {
      this.switchTab(DISBURSEMENT_LIMIT_TAB.group);
    } else if (this.permissions.includes("View Loan Disbursement Limit")) {
      this.switchTab(DISBURSEMENT_LIMIT_TAB.disbursementLimit);
    } else if (
      this.permissions.includes("View Loan Disbursement Limit Notification")
    ) {
      this.switchTab(DISBURSEMENT_LIMIT_TAB.limitAlert);
    }
  }

  private fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe((res) => {
        this.permissions = res.body.permission;
      });
  }

  getDisbursementLimits(extras?: TablePaginationChange) {
    let payload = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };

    if (extras) {
      payload = { ...payload, ...extras };
    }

    this.isLoading = true;
    this.disbursementLimitService
      .getDisbursementLimits(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (response) => {
          this.disbursementLimits = response.body.items;
          this.isLoading = false;
          this.data = this.disbursementLimits.map((limit) => ({
            code: { tdValue: limit?.code, type: "code", id: limit?.id },
            category: { tdValue: limit?.category },
            entity: { tdValue: limit?.entityName },
            limitAmt: {
              tdValue: limit?.limitAmount,
              type: "amount",
              alignment: "right",
            },
            minAlert: {
              tdValue:
                limit?.minimumAlertThreshold?.type !== "Percentage"
                  ? limit?.minimumAlertThreshold?.amount
                  : limit?.minimumAlertThreshold?.amount + "%",
              type:
                limit?.minimumAlertThreshold?.type !== "Percentage"
                  ? "amount"
                  : "",
              alignment: "right",
            },
            status: {
              tdValue: limit?.isActive ? "Active" : "Inactive",
              type: "status",
              statusConfig: { class: this.getStatusClass(limit?.isActive) },
            },
            action: {
              tdValue: "",
              type: "action",
              actionConfig: this.getActionConfig(limit?.id),
            },
          }));
          this.setPagination(response.body);
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private getStatusClass(isActive: boolean): string {
    if (isActive) {
      return "badge-success";
    } else {
      return "badge-warning";
    }
  }

  private getActionConfig(id: number) {
    return [
      {
        showBtn: this.permissions.includes("View Loan Disbursement Limit"),
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.viewDisbursementLimit(id),
      },
      {
        showBtn: this.permissions.includes("Manage Loan Disbursement Limit"),
        iconClass: "icon-edit",
        btnText: "Edit",
        funcRef: () => this.editDisbursementLimit(id),
      },
    ];
  }

  view(id: number) {
    if (this.currentTab === DISBURSEMENT_LIMIT_TAB.group) {
      this.viewGroupMembers(id);
    }

    if (this.currentTab === DISBURSEMENT_LIMIT_TAB.disbursementLimit) {
      this.viewDisbursementLimit(id);
    }
  }

  getDisbursementLimitDetail(id: number, isEditMode = false) {
    this.isRetrievingLimitDetail = true;
    this.disbursementLimitService
      .getDisbursementLimit(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (response) => {
          this.limitDetail = response.body.data;
          this.isRetrievingLimitDetail = false;

          if (isEditMode) {
            this.openModal(this.limitDetail.category);
          }
        },
        error: () => (this.isRetrievingLimitDetail = false),
      });
  }

  viewDisbursementLimit(id: number) {
    this.selectedPopup = DISBURSEMENT_LIMIT_POPUP.limitDetail;
    this.getDisbursementLimitDetail(id);
  }

  editDisbursementLimit(id: number) {
    this.getDisbursementLimitDetail(id, true);
  }

  viewGroupMembers(id: number) {
    this.groupMembers = this.disbursementLimitGroups.find(
      (group) => group.id === id
    ).members;
    this.selectedPopup = DISBURSEMENT_LIMIT_POPUP.groupMembers;
  }

  private setPagination(res): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;
    this.pagination.searchColumns = res.searchColumns;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  paginationChange(event: TablePaginationChange) {
    const payload = removeNullUndefinedWithReduce(event);
    if (this.currentTab === DISBURSEMENT_LIMIT_TAB.group) {
      this.getGroups(payload);
    } else if (this.currentTab === DISBURSEMENT_LIMIT_TAB.disbursementLimit) {
      this.getDisbursementLimits(payload);
    }
  }

  openModal(dropdownItem: string) {
    this.selectedResource = dropdownItem;
    this.showPopup = true;
  }

  closeModal() {
    this.showPopup = false;
  }

  switchTab(tab: DISBURSEMENT_LIMIT_TAB) {
    this.currentTab = tab;
    if (this.currentTab === DISBURSEMENT_LIMIT_TAB.group) {
      this.config = { ...this.config, uniqueIdPropLink: "name" };
      this.headers = [
        { name: "Name" },
        { name: "Category" },
        { name: "Members" },
        { name: "Action" },
      ];
      this.getGroups();
    } else if (this.currentTab === DISBURSEMENT_LIMIT_TAB.disbursementLimit) {
      this.headers = [
        { name: "Code", type: "code" },
        { name: "Category" },
        { name: "Entity" },
        { name: "Limit Amount", type: "amount", alignment: "right" },
        { name: "Minimum Alert Threshold", alignment: "right" },
        { name: "Status" },
        { name: "Action" },
      ];
      this.config = { ...this.config, uniqueIdPropLink: "code" };

      this.getDisbursementLimits();
    }
  }

  private getGroups(extras?: TablePaginationChange) {
    this.isLoading = true;

    let payload = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };

    if (extras) {
      payload = { ...payload, ...extras };
    }

    this.disbursementLimitService
      .getDisbursementLimitGroups(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.disbursementLimitGroups = res.body.items;
          this.data = this.disbursementLimitGroups.map((group) => ({
            name: { tdValue: group?.name, id: group.id },
            category: { tdValue: group?.category },
            members: {
              tdValue:
                (group?.members as any)
                  .map((member) => member?.entityName)
                  .slice(0, 5)
                  .join(", ") + `${group.members.length > 5 ? "....." : ""}`,
            },
            action: {
              tdValue: "",
              type: "action",
              actionConfig: this.getDisbursementLimitActionGroupConfig(group),
            },
          }));
          this.setPagination(res.body);
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private getDisbursementLimitActionGroupConfig(group: DisbursementLimitGroup) {
    return [
      {
        showBtn: this.permissions.includes("View Loan Disbursement Group"),
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.view(group.id),
      },
      {
        showBtn: this.permissions.includes("Manage Loan Disbursement Group"),
        iconClass: "icon-edit",
        btnText: "Edit",
        funcRef: () => this.editDisbursementLimitGroup(group),
      },
    ];
  }

  private editDisbursementLimitGroup(group: DisbursementLimitGroup) {
    this.disbursementLimitGroupId = group.id;
    const category = [group.category] as unknown as string;
    const members = group.members.map((group) => ({
      id: group?.entityId,
      text: group?.entityName,
    }));
    this.disbursementGroupForm.patchValue({
      name: group?.name,
      category,
      members,
    });
    this.fetchMembers(group.category);
    this.addNewGroup();
  }

  addNewGroup() {
    this.selectedPopup = DISBURSEMENT_LIMIT_POPUP.addEditGroup;
    this.watchDisbursementGroupFormChanges();
  }

  closePopup() {
    this.selectedPopup = null;
    this.disbursementLimitGroupId = null;
  }

  private watchDisbursementGroupFormChanges() {
    this.disbursementGroupForm
      .get("category")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.disbursementGroupForm.get("members").setValue(null);
        this.isLoading = true;
        this.fetchMembers(res[0] as DISBURSEMENT_CATEGORY);
      });
  }

  private fetchMembers(category: DISBURSEMENT_CATEGORY) {
    if (category === DISBURSEMENT_CATEGORY.Employer) {
      this.getEmployers();
    } else if (category === DISBURSEMENT_CATEGORY.Branch) {
      this.getBranches();
    } else if (category === DISBURSEMENT_CATEGORY.ProductType) {
      this.getProductTypes();
    } else {
      this.getCountries();
    }
  }

  submitGroup() {
    const members = this.disbursementGroupForm.value.members.map((member) => ({
      entityId: member?.id,
      entityName: member?.text,
    }));
    let payload = {
      ...this.disbursementGroupForm.value,
      category: this.disbursementGroupForm.value.category[0],
      members,
    } as DisbursementLimitGroup;

    if (this.disbursementLimitGroupId) {
      payload.id = this.disbursementLimitGroupId;
    }

    this.isProcessing = true;
    if (this.disbursementLimitGroupId) {
      this.disbursementLimitService
        .updateDisbursementLimitGroup(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => this.submitSuccess(),
          error: () => (this.isProcessing = false),
        });
    } else {
      this.disbursementLimitService
        .createDisbursementLimitGroup(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => this.submitSuccess(),
          error: () => (this.isProcessing = false),
        });
    }
  }

  private submitSuccess() {
    this.isProcessing = false;
    this.toast.fire({
      type: "success",
      title: `Group ${
        this.disbursementLimitGroupId ? "updated" : "created"
      } successfully!`,
    });
    this.closePopup();
    this.getGroups();
  }

  private getEmployers() {
    this.configService
      .spoolEmployers({ pageNumber: 1, pageSize: 1000 })
      .pipe(
        map((response) =>
          response.body.value.data.map((employee) => ({
            id: employee?.employerId,
            text: employee?.employerName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (employers) => {
          this.members = employers;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private getBranches() {
    this.configService
      .spoolAccessibleBranches({
        userId: this.authService.decodeToken().nameid,
      })
      .pipe(
        map((response) =>
          response.body.map((branch) => ({
            id: branch?.branchId,
            text: branch?.branchName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (branches) => {
          this.members = branches;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private getProductTypes() {
    this.configService
      .fetchLoanTypes(this.authService.decodeToken().nameid)
      .pipe(
        map((response) =>
          response.body.map((productType) => ({
            id: productType.loanTypeId,
            text: productType.loanName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (productTypes) => {
          this.members = productTypes;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private getCountries() {
    this.configService.spoolCountries().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      const countryIdForNigeria = res.body.find(country => country?.name?.toLowerCase() === "nigeria")?.id;
      if (countryIdForNigeria) {
        this.getStates(countryIdForNigeria)
      }
    })
  }

  private getStates(id:number) {
    this.configService
      .spoolStatesByCountry(id)
      .pipe(
        map((res) =>
          res.body.map((state) => ({ id: state.id, text: state.name }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (states) => {
          this.members = states;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  onClosePopup(){
    this.showPopup = false;
    this.selectedResource = null;
    this.limitDetail = null;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
