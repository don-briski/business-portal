import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil, pluck } from "rxjs/operators";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import Swal from "sweetalert2";
import * as moment from "moment";

@Component({
  selector: "app-asset-depreciation",
  templateUrl: "./asset-depreciation.component.html",
  styleUrls: ["./asset-depreciation.component.scss"],
})
export class AssetDepreciationComponent implements OnInit, OnDestroy {
  @Input() user: any;
  @Input() currentTheme: any;
  @Output() closeDepModal = new EventEmitter();
  @Output() loadAllAssets = new EventEmitter();

  tabState: "month" | "backlogs" | "removed" = "month";
  assetsDueForPosting: any[] = [];
  assetsBackLogs: any[] = [];
  assetsRemoved: any[] = [];
  isLoading: boolean = false;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
  };

  pagination2 = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
  };
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  private _unsubscriber$ = new Subject();
  ownerInformation: any;
  fromDate;
  activationDate;
  toDate;
  depreciationDates: string[] = [];
  assetCardIds: number[] = [];

  constructor(
    private assetMgtService: AssetMgtService,
    private configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.getLastAssetDepreciationPeriod();
    this.fetchLogsBacklogs();
    this.getApplicationownerinformation();
  }

  setDatesForDepreciation() {
    const dates: string[] = [];

    const value = this.fromDate || this.activationDate;
    const currentDate = new Date(value);
    const currentYear = currentDate.getFullYear();

    for (let i = currentYear; i < currentYear + 10; i++) {
      for (let j = 1; j <= 12; j++) {
        const modifiedDate = new Date(i, currentDate.getMonth() + j, 0);

        const day = modifiedDate.getDate();
        const month = moment(modifiedDate).format("MMM");
        const year = modifiedDate.getFullYear();

        const stringDate = `${day} ${month} ${year}`;
        dates.push(stringDate);
      }
    }

    this.depreciationDates = dates;
  }

  private getLastAssetDepreciationPeriod(): void {
    this.assetMgtService
      .getLastAssetDepreciationPeriod()
      .pipe(pluck("body", "data"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        if (res?.lastDepreciationEndDate) {
          this.fromDate = moment(res?.lastDepreciationEndDate).format(
            "yyyy-MM-DD"
          );
        } else {
          this.activationDate = res?.activationDate;
        }
        this.setDatesForDepreciation();

        this.updateToDate(this.depreciationDates[0]);
      });
  }

  private getAssetDepreciationInPeriodView(): void {
    this.isLoading = true;
    this.assetMgtService
      .getAssetDepreciationInPeriodView({
        From: this.fromDate || this.activationDate,
        To: this.toDate,
      })
      .pipe(pluck("body", "data"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.assetsDueForPosting = res;
        this.assetCardIds = this.assetsDueForPosting.map(
          (asset) => asset.assetCardId
        );
        this.isLoading = false;
      });
  }

  fetchLogsDueThisMonth(): void {
    this.isLoading = true;
    let model = {
      pageNumber: this.pagination.pageNumber,
      pageSize: +this.pagination.pageSize,
      isDueThisMonth: true,
      isOverdue: true,
      isPosted: true,
    };
    this.assetMgtService
      .spoolAllAssetsDepreciationLogs(model)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.assetsDueForPosting = res.body.data.items.filter(
          (asset) =>
            !this.assetsRemoved.find(
              (assetRemoved) => asset.assetCardId === assetRemoved.assetCardId
            )
        );
        this.isLoading = false;
        this.setPagination(res.body, "month");
      });
  }
  fetchLogsBacklogs(): void {
    let model = {
      pageNumber: this.pagination2.pageNumber,
      pageSize: +this.pagination2.pageSize,
      isDueThisMonth: false,
      isOverDue: true,
      isPosted: false,
    };
    this.assetMgtService
      .spoolAllAssetsDepreciationLogs(model)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.assetsBackLogs = res.body.data.items;
        this.isLoading = false;
        this.setPagination2(res.body);
      });
  }

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  setPagination(res: any, type: "backlog" | "month"): void {
    this.pagination.pageSize = res.data.pageSize;
    this.pagination.pageNumber = res.data.pageNumber;
    this.pagination.totalCount = res.data.totalCount;
    this.pagination.hasNextPage = res.data.hasNextPage;
    this.pagination.hasPreviousPage = res.data.hasPreviousPage;
    this.pagination.totalPages = res.data.totalPages;
    if (type === "month") {
      this.pagination.count = this.assetsDueForPosting.length;
    }

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  setPagination2(res: any): void {
    this.pagination2.pageSize = res.data.pageSize;
    this.pagination2.pageNumber = res.data.pageNumber;
    this.pagination2.totalCount = res.data.totalCount;
    this.pagination2.hasNextPage = res.data.hasNextPage;
    this.pagination2.hasPreviousPage = res.data.hasPreviousPage;
    this.pagination2.totalPages = res.data.totalPages;
    this.pagination2.count = res.data.items.length;

    this.pagination2.jumpArray = Array(this.pagination2.totalPages);
    for (let i = 0; i < this.pagination2.jumpArray.length; i++) {
      this.pagination2.jumpArray[i] = i + 1;
    }
  }
  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  closeModal(): void {
    this.closeDepModal.emit();
  }

  switchTabs(tab: "month" | "backlogs" | "removed"): void {
    this.tabState = tab;
  }

  addAsset(asset: any, removedIndex: number): void {
    this.assetsDueForPosting.splice(asset.index, 0, asset);
    this.assetsRemoved.splice(removedIndex, 1);
    this.pagination.count = this.assetsDueForPosting.length;
  }

  removeAssetLog(assetLog: any, index: number): void {
    this.assetsDueForPosting = this.assetsDueForPosting.filter(
      (log) => log.assetDepreciationLogId !== assetLog.assetDepreciationLogId
    );
    assetLog.index = index;
    this.assetsRemoved.push(assetLog);
    this.pagination.count = this.assetsDueForPosting.length;
  }

  updateToDate($event): void {
    const newDate = moment($event).format("YYYY-MM-DD");
    this.toDate = newDate;
    if ((this.fromDate || this.activationDate) && this.toDate) {
      this.getAssetDepreciationInPeriodView();
    }
  }

  postSchedule(): void {
    this.isLoading = true;
    let depreciationLogIds: number[] = [];
    this.assetsDueForPosting.forEach((log) => {
      depreciationLogIds.push(log.assetDepreciationLogId);
    });
    const payload = {
      from: this.fromDate || this.activationDate,
      to: this.toDate,
      assetIds: this.assetCardIds,
    };

    this.assetMgtService
      .postDepreciationsInperiod(payload)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.isLoading = false;
        this.toast.fire({
          type: "success",
          title: "Assets Posted Successfully",
        });
        this.closeModal();
        this.loadAllAssets.emit();
      });
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
