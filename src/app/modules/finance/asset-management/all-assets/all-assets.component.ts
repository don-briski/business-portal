import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { map, takeUntil, pluck } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import Swal from "sweetalert2";
import * as moment from "moment";
import { toFormData } from "src/app/util/finance/financeHelper";
import { saveAs } from "file-saver";
import { SharedService } from "src/app/service/shared.service";

@Component({
  selector: "app-all-assets",
  templateUrl: "./all-assets.component.html",
  styleUrls: ["./all-assets.component.scss"],
})
export class AllAssetsComponent implements OnInit, OnDestroy {
  allSubscritions = new Subject<void>();
  allAssets: any[] = [];
  tabLoader: boolean;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    count: 0,
    totalCount: 0,
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
  currentTheme: ColorThemeInterface;
  editingAssetCard: any = null;
  loader: boolean;
  activationForm: UntypedFormGroup;
  loggedInUser: any;
  employeeList: any[];
  viewAssetDetails: boolean;
  assetDetail: any = null;
  openAside: any = false;
  ownerInformation: any;
  user: any;
  isImporting = false;
  copy_hover = false;

  constructor(
    private assetMgtService: AssetMgtService,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private modalService: NgbModal,
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private configurationService: ConfigurationService,
    private route: ActivatedRoute,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.fetchUser();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.fetchAllEmpoyee(this.loggedInUser.nameid);
    this.loadAllAssets();
    this.getConstants();
  }

  getAssetIdFromQuery() {
    const assetId = this.route.snapshot.queryParams["assetId"];
    if (assetId) {
      this.viewAsset(assetId);
    }
  }

  protected compareDate(dateA: any, dateB: any): boolean {
    const dateVal1 = moment(dateA);
    const dateVal2 = moment(dateB);
    const difference = dateVal1.diff(dateVal2);
    if (difference >= 0) {
      return true;
    } else {
      return false;
    }
  }

  watchAssetActivationDateChanges(): void {
    this.activationForm
      .get("assetActivationDate")
      .valueChanges.subscribe((res) => {
        if (res !== null) {
          const dateOfPurch = this.editingAssetCard.dateOfPurchaseOrAcquisition;
          const activationDate = this.activationForm.get(
            "assetActivationDate"
          ).value;

          if (dateOfPurch && !this.compareDate(activationDate, dateOfPurch)) {
            Swal.fire({
              title: "Change selected date",
              text: "Asset activation date cannot be before date of purchase.",
              type: "info",
            });
            this.activationForm.get("assetActivationDate").patchValue(null);
          }
        }
      });
  }

  filterAssets(): void {
    this.loadAllAssets(true);
  }

  closeSidebar(): void {
    this.configurationService.isSidebarClosed$.next(true);
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  loadAllAssets(searchString?: boolean): void {
    const model = {
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
      searchParam: null,
    };
    if (
      typeof this.pagination.assetCode !== "undefined" &&
      this.pagination.assetCode &&
      searchString
    ) {
      model.searchParam = this.pagination.assetCode;
    }
    this.tabLoader = true;
    this.assetMgtService
      .spoolAllAssets(model)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe(
        (res) => {
          this.tabLoader = false;
          this.allAssets = res.body.data?.items;
          this.pagination = res.body.data;
          this.pagination.count = this.allAssets.length;
          this.pagination.jumpArray = [];
          for (let i = 1; i <= this.pagination.totalPages; i++) {
            this.pagination.jumpArray.push(i);
          }
          $(".itemPaginatedJumpModal").toggle(false);

          // For deep linking via reports
          this.getAssetIdFromQuery();
        },
        (err) => {
          this.tabLoader = false;
        }
      );
  }

  deleteAsset(id: any): void {
    this.assetMgtService
      .deleteAsset(id)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res) => {
        this.toast.fire({
          text: "Asset Deleted.",
          type: "success",
        });
        this.filterAssets();
      });
  }

  attemptDelete(assetId: any): void {
    Swal.fire({
      type: "info",
      text: "Are you sure you want to delete this asset ?",
      title: "Delete Asset?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete Asset",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.deleteAsset(assetId);
      }
    });
  }
  editAsset(id: any): void {
    this.assetMgtService.setAssetEditId(id);
    this.router.navigateByUrl("/finance/assets/edit");
  }
  viewAsset(id: any,element?:HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.toggleAside();
        this.assetMgtService
          .getAssetById(id)
          .pipe(takeUntil(this.allSubscritions))
          .subscribe(
            (res) => {
              this.assetDetail = res.body.data;
            },
            () => {
              this.toggleAside();
            }
          );
      }
    });
  }

  fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  openModal(modal: any, assetId?: number, size?: string): void {
    if (assetId) {
      this.getAssetCard(assetId);
      this.initActivationForm();
    }
    this.modalService.open(modal, { centered: true, size: size });
  }

  switchTabs(
    tab: "depreciation" | "revaluation" | "addition" | "asset-info"
  ): void {
    switch (tab) {
      case "depreciation":
        $("#nav-depreciation").addClass("active");
        $("#tab-depreciation").addClass("active show");

        $("#asset-info").removeClass("active");
        $("#nav-revaluation").removeClass("active");
        $("#tab-revaluation").removeClass("active show");
        break;

      case "revaluation":
        $("#nav-revaluation").addClass("active");
        $("#tab-revaluation").addClass("active show");

        $("#asset-info").removeClass("active");
        $("#nav-depreciation").removeClass("active");
        $("#tab-depreciation").removeClass("active show");
        break;

      case "addition":
        $("#nav-addition").addClass("active");
        $("#tab-addition").addClass("active show");

        $("#asset-info").removeClass("active");
        $("#nav-depreciation").removeClass("active");
        $("#tab-depreciation").removeClass("active show");
        $("#nav-revaluation").removeClass("active");
        $("#tab-revaluation").removeClass("active show");
        break;
      default:
        break;
    }
  }

  triggerImportPopup(content) {
    this.openModal(content);
  }

  submitForm(): void {
    this.loader = true;
    const activationData = this.activationForm.value;
    const newData = this.editingAssetCard;
    newData.assignedEmployeeId = activationData.assignedEmployeeId;
    newData.assetActivationDate = activationData.assetActivationDate;

    this.assetMgtService
      .updateAsset(newData)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe(
        (res) => {
          this.loadAllAssets();
          this.closeModal();
          this.toast.fire({
            title: "Asset card has been successfully activated.",
            timer: 3000,
          });
          this.loader = false;
        },
        (error) => (this.loader = false)
      );
  }

  downloadTemplate() {
    this.loader = true;
    this.assetMgtService
      .getAssetTemplate()
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res) => {
        const fileName = `sample-asset-template-${moment().format(
          "YYYY-MM-DD-HH:mm:ss"
        )}`;
        this.loader = false;
        saveAs(res.body, fileName);
      },() => this.loader = false);
  }

  submitImportedAsset(asset) {
    const payload = toFormData({ File: asset });
    this.isImporting = true;
    this.assetMgtService
      .importAssets(payload)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe(
        (res) => {
          this.isImporting = false;
          this.loadAllAssets();
          this.closeModal();
          Swal.fire({
            type: "success",
            title: "Import Successful!",
            text: res?.body?.data?.message,
            confirmButtonText: "Ok",
            confirmButtonColor: "#558E90",
          });
          //Use later
          // .then((result) => {
          //   if (result.value) {
          //     this.onSwitchTableView("closed", [
          //       { id: "Posted", text: "Posted" },
          //       { id: "Rejected", text: "Rejected" },
          //     ]);
          //   }
          // });
        },
        () => (this.isImporting = false)
      );
  }

  changePage(pageNum: number): void {
    this.pagination.pageNumber = pageNum;
    this.loadAllAssets(false);
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  private getAssetCard(id: any): void {
    this.loader = true;
    this.assetMgtService
      .getAssetById(id)
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res) => {
        this.loader = false;
        this.editingAssetCard = res.body.data;
      });
  }

  private initActivationForm(): void {
    this.activationForm = this.fb.group({
      assignedEmployeeId: new UntypedFormControl(null),
      assetActivationDate: new UntypedFormControl(null, [Validators.required]),
    });

    this.watchAssetActivationDateChanges();
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  toggleAside(): void {
    this.openAside = !this.openAside;

    if (!this.openAside) {
      this.assetDetail = null;
    }
  }

  private fetchAllEmpoyee(id: any) {
    this.employeeList = [];
    const model = {
      UserId: id,
      Num: 1000,
    };

    this.userService
      .FetchAllUsers(model)
      .pipe(
        pluck("body"),
        map((res) => res.data.items.filter((user) => user.status === 0)),
        map((res) =>
          res.map((user) => ({
            id: user.person.personId,
            text: user.person.displayName,
          }))
        )
      )
      .subscribe((res) => (this.employeeList = res));
  }

  selectEmployee(event): void {
    this.activationForm.get("assignedEmployeeId").setValue(event.id);
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }
  private getConstants() {
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
      },
      (err) => {}
    );
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Asset code copied to clipboard",type:'success',timer:3000})
    }
  }

  ngOnDestroy(): void {
    this.allSubscritions.next();
    this.allSubscritions.complete();
  }
}
