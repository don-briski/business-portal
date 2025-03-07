import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { nonZero } from "src/app/util/validators/validators";
import { toFormData } from "src/app/util/finance/financeHelper";
import Swal from "sweetalert2";

@Component({
  selector: "app-asset-revaluation",
  templateUrl: "./asset-revaluation.component.html",
  styleUrls: ["./asset-revaluation.component.scss"],
})
export class AssetRevaluationComponent implements OnInit, OnDestroy {
  @Input() initAssets: any[] = [];
  @Input() user: any;
  @Input() currentTheme: any;
  @Input() initPagination: any;

  @Output() closeDepModal = new EventEmitter();
  @Output() loadAllAssets = new EventEmitter();

  private _unsubscriber = new Subject();
  tabState: string = "revalueable";
  assets: any[] = [];
  assetsToBeRevalued: any[] = [];
  isLoading: boolean = false;
  fileDelete: boolean = false;
  assetFiles: any[] = [];
  revaluationForm: UntypedFormGroup;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

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
  ownerInformation: any;
  assetIds: number[] = [];
  totalAssetsAmount = 0;

  constructor(
    private assetMgtService: AssetMgtService,
    private fb: UntypedFormBuilder,
    private configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.fetchAssets();
    this.initForm();
    this.getApplicationownerinformation();
  }

  initForm(): void {
    this.revaluationForm = this.fb.group({
      reference: new UntypedFormControl(null),
      transactionDate: new UntypedFormControl(null, Validators.required),
      raiseInvoice: new UntypedFormControl(false, Validators.required),
      lines: this.fb.array([]),
      files: new UntypedFormControl(null),
    });

    this.revaluationForm
      .get("transactionDate")
      .valueChanges.pipe(takeUntil(this._unsubscriber))
      .subscribe((res) => {
        if (res) {
          this.fetchNBV();
        }
      });

    this.revaluationForm
      .get("lines")
      .valueChanges.pipe(takeUntil(this._unsubscriber))
      .subscribe((res) => {
        this.totalAssetsAmount = 0;
        res.forEach((asset) => {
          this.totalAssetsAmount += asset.newValue;
          asset.diff = asset.newValue - asset.netBookValue;
        });
      });
  }

  lines(): UntypedFormArray {
    return this.revaluationForm.controls["lines"] as UntypedFormArray;
  }

  private fetchNBV(): void {
    const payload = {
      transactionDate: this.revaluationForm.get("transactionDate").value,
      assetIds: this.assetIds,
    };

    this.assetMgtService
      .getNBV(payload)
      .pipe(pluck("body", "data"), takeUntil(this._unsubscriber))
      .subscribe((assets) => {
        this.lines().controls.forEach((control) => {
          const assetAsAtDate = assets.filter(
            (assetAsAt) => assetAsAt.assetCardId === control.value.assetCardId
          );

          control.get("netBookValue").setValue(assetAsAtDate[0].netBookValue);
        });
      });
  }

  addLine(asset: any, index: number): void {
    const line = this.fb.group({
      assetCardId: new UntypedFormControl(asset.assetCardId, Validators.required),
      newValue: new UntypedFormControl(0, [Validators.required, nonZero.bind(this)]),
      assetTag: new UntypedFormControl(asset.assetCode),
      assetName: new UntypedFormControl(asset.assetName),
      assetSubClassAccount: new UntypedFormControl(asset.assetSubClassAccount),
      netBookValue: new UntypedFormControl(asset.netBookValue),
      asset: new UntypedFormControl(asset),
      index: new UntypedFormControl(index),
      diff: new UntypedFormControl(0 - asset.netBookValue),
    });

    this.lines().push(line);

    if (!this.assetIds.includes(asset.assetCardId)) {
      this.assetIds.push(asset.assetCardId);

      if (this.revaluationForm.get("transactionDate").value) {
        this.fetchNBV();
      }
    }
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  closeModal(): void {
    this.closeDepModal.emit();
  }

  fetchAssets(searchParam?: string): void {
    this.isLoading = true;
    const model = {
      pageSize: +this.pagination.pageSize,
      pageNumber: +this.pagination.pageNumber,
      assetCode: null,
      searchParam: searchParam || null,
      status: "Running",
    };

    this.assetMgtService
      .spoolAllAssets(model)
      .pipe(takeUntil(this._unsubscriber))
      .subscribe(
        (res) => {
          this.isLoading = false;
          this.assets = res.body.data.items.filter(
            (asset) =>
              !this.assetsToBeRevalued.find(
                (assetToBeRevalued) =>
                  asset.assetCardId === assetToBeRevalued.assetCardId
              )
          );
          this.setPagination(res.body.data);
        },
        (err) => {
          this.isLoading = false;
        }
      );
    $(".itemPaginatedJumpModal").toggle(false);
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  switchTabs(tab: "revalueable" | "toberevalued"): void {
    this.tabState = tab;
  }

  setPagination(res: any): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = this.assets.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  addAsset(asset: any, index: number): void {
    this.assetsToBeRevalued.push(asset);
    this.addLine(asset, index);
    this.assets.splice(index, 1);
    this.pagination.count = this.assets.length;
  }

  removeAsset(asset: any, index: number): void {
    const selectedAssetIndex = this.lines().at(index).value.index;
    this.assets.splice(selectedAssetIndex, 0, asset);
    this.lines().removeAt(index);
    this.assetsToBeRevalued.splice(index, 1);
    this.pagination.count = this.assets.length;
  }

  handleFileInput(filelist: FileList): void {
    this.assetFiles = [];

    for (let i = 0; i < filelist.length; i++) {
      this.assetFiles.push(filelist.item(i));
    }
  }

  submit(): void {
    this.isLoading = true;
    let newLines = this.revaluationForm.value.lines.map((line) => {
      return { assetCardId: line.assetCardId, newValue: line.newValue };
    });
    const payload = {
      ...this.revaluationForm.value,
      lines: newLines,
      files: this.assetFiles,
    };

    const formData = toFormData(payload);

    this.assetMgtService
      .postRevaluation(formData)
      .pipe(takeUntil(this._unsubscriber))
      .subscribe((res) => {
        this.isLoading = false;
        this.toast.fire({
          type: "success",
          title: "Assets Revalued Successfully",
        });
        this.loadAllAssets.emit();
        this.closeModal();
      });
  }

  ngOnDestroy(): void {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }
}
