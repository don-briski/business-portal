import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import Swal from "sweetalert2";

@Component({
  selector: "app-asset-subclass",
  templateUrl: "./asset-subclass.component.html",
  styleUrls: ["./asset-subclass.component.scss"],
})
export class AssetSubclassComponent implements OnInit, OnDestroy {
  allSubscritions = new Subject<void>();

  allAssets: any[] = [];
  asset: any;
  accounts: any[] = [];
  tabLoader: boolean;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
    assetSubClassName: null,
  };
  isEditing: boolean;
  subClassForm: UntypedFormGroup;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  loader: boolean;

  currentTheme: ColorThemeInterface;
  assetClass: any[] = [
    { id: 1, text: "Intangible Assets" },
    { id: 2, text: "Property Plant And Equipment" },
  ];
  depreciationMethods: any[] = [
    { id: 1, text: "No Depreciation" },
    { id: 2, text: "Straight Line" },
    { id: 3, text: "Declining Balance" },
  ];
  ownerInformation;

  constructor(
    private assetMgtService: AssetMgtService,
    private modalService: NgbModal,
    private fb: UntypedFormBuilder,
    private colorThemeService: ColorThemeService,
    private coaService: ChartOfAccountService,
    private configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this._getAccounts();
    this.loadAllAssetSubClass({
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
    });
    this.getApplicationownerinformation();
  }

  private getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private _getAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((accounts) => {
        this.accounts = accounts;
      });
  }

  filterAssets(): void {
    let model = {
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
      assetSubClassName: null,
    };
    if (
      typeof this.pagination.assetSubClassName !== "undefined" &&
      this.pagination.assetSubClassName
    ) {
      model.assetSubClassName = this.pagination.assetSubClassName;
    }
    this.loadAllAssetSubClass(model);
  }

  loadAllAssetSubClass(model: any): void {
    this.tabLoader = true;
    this.assetMgtService
      .spoolAssetSubClasses(model)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe(
        (res) => {
          this.tabLoader = false;
          this.allAssets = res.body.data?.items;
          this.setPagination(res.body.data);
        },
        (err) => {
          this.tabLoader = false;
        }
      );
  }

  setPagination(res: any): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  delete(id: any): void {
    this.assetMgtService
      .deleteAssetSubClass(id)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res) => {
        this.toast.fire({
          text: "Asset sub class deleted.",
          type: "success",
        });
        this.filterAssets();
      });
  }

  attemptDelete(id: any): void {
    Swal.fire({
      type: "info",
      text: "Are you sure you want to delete this asset sub class?",
      title: "Delete Asset Sub class?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.delete(id);
      }
    });
  }

  openModal(modal: any, subClass = null): void {
    if (subClass !== null) {
      this.isEditing = true;
      this.getSubclass(subClass.assetSubClassId);
    } else {
      this.isEditing = false;
    }
    this.formInit(subClass);
    this.modalService.open(modal, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "modalSubclassWidth",
    });
  }

  getSubclass(id: number): void {
    this.assetMgtService
      .getSubClass(id)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res) => (this.asset = res.body.data));
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  selectAccount(type: string, value: any): void {
    this.subClassForm.get(type).setValue(value.accountId);
  }

  watchFormChanges(): void {
    this.subClassForm
      .get("assetclass")
      .valueChanges.pipe(takeUntil(this.allSubscritions))
      .subscribe((res) => {
        this.subClassForm.get("assetClass").setValue(res[0]?.text);
      });

    this.subClassForm
      .get("depreciationmethod")
      .valueChanges.pipe(takeUntil(this.allSubscritions))
      .subscribe((res) => {
        this.subClassForm.get("depreciationMethod").setValue(res[0]?.text);
        if (res[0]?.text === "Straight Line") {
          this.subClassForm
            .get("effectiveLifeInYears")
            .setValidators(Validators.required);
          this.subClassForm.get("depreciationRate").clearValidators();
          this.subClassForm.get("depreciationRate").reset();
        } else {
          this.subClassForm.get("effectiveLifeInYears").clearValidators();

          this.subClassForm.get("effectiveLifeInYears").reset();

          this.subClassForm
            .get("depreciationRate")
            .setValidators(Validators.required);
        }

        this.subClassForm.updateValueAndValidity();
      });
  }

  formInit(item: any): void {
    let filteredAssetClass;
    let filteredDepMeth;
    if (this.isEditing) {
      filteredAssetClass = this.assetClass.filter(
        (assetclass) => assetclass.text === item.assetClass
      );

      filteredDepMeth = this.depreciationMethods.filter(
        (depMeth) => depMeth.text === item.depreciationMethod
      );
    }

    this.subClassForm = this.fb.group({
      assetSubClassName: new UntypedFormControl(item?.assetSubClassName, [
        Validators.required,
      ]),
      assetClass: new UntypedFormControl(item?.assetClass?.split(" ").join(""), [
        Validators.required,
      ]),
      assetclass: new UntypedFormControl(filteredAssetClass, [Validators.required]),
      assetSubClassAccountId: new UntypedFormControl(item?.assetSubClassAccountId, [
        Validators.required,
      ]),
      depreciationExpenseAccountId: new UntypedFormControl(
        item?.depreciationExpenseAccountId,
        [Validators.required]
      ),
      assetSubClassTagPrefix: new UntypedFormControl(item?.assetSubClassTagPrefix, [
        Validators.required,
      ]),
      effectiveLifeInYears: new UntypedFormControl(item?.effectiveLifeInYears),
      depreciationMethod: new UntypedFormControl(
        item?.depreciationMethod?.split(" ").join(""),
        [Validators.required]
      ),
      depreciationmethod: new UntypedFormControl(filteredDepMeth, [
        Validators.required,
      ]),
      accumDepreciationAccountId: new UntypedFormControl(
        item?.accumDepreciationAccountId,
        [Validators.required]
      ),
      revaluationAccountId: new UntypedFormControl(item?.revaluationAccountId),
      depreciationRate: new UntypedFormControl(item?.depreciationRate),
    });

    if (this.isEditing) {
      this.subClassForm.addControl(
        "assetSubClassId",
        new UntypedFormControl(item?.assetSubClassId, [Validators.required])
      );
    }

    this.watchFormChanges();
  }

  submitForm(): void {
    const { assetclass, depreciationmethod, ...data } = this.subClassForm.value;
    this.loader = true;
    // return;
    if (this.subClassForm.valid) {
      if (this.isEditing) {
        this.update();
      } else {
        this.create(data);
      }
    }
  }

  create(data: any): void {
    this.assetMgtService
      .createAssetSubClass(data)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe(
        (res) => {
          this.toast.fire({
            text: "Asset sub class added",
            type: "success",
          });
          this.filterAssets();
          this.closeModal();
          this.loader = false;
        },
        (err) => {
          this.loader = false;
        }
      );
  }
  update(): void {
    this.subClassForm.removeControl("assetclass");
    this.subClassForm.removeControl("depreciationmethod");

    this.assetMgtService
      .updateAssetSubClass(this.subClassForm.value)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe(
        (res) => {
          this.toast.fire({
            text: "Asset sub class updated",
            type: "success",
          });
          this.filterAssets();
          this.closeModal();
          this.loader = false;
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  ngOnDestroy(): void {
    this.allSubscritions.next();
    this.allSubscritions.complete();
  }
}
