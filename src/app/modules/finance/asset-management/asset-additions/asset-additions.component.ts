import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { UntypedFormGroup, UntypedFormControl, UntypedFormArray, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { map, pluck, takeUntil, tap } from "rxjs/operators";
import Swal from "sweetalert2";

import { CustomDropDown } from "../../../../model/CustomDropdown";
import { FinanceService } from "../../service/finance.service";
import { UserService } from "../../../../service/user.service";
import { AuthService } from "../../../../service/auth.service";
import { AssetsAdditionsService } from "./asset-additions.service";
import { Asset, GetAssetsData } from "./types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { BankAccount } from "../../types/Account";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { nonZero } from "src/app/util/validators/validators";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-asset-additions",
  templateUrl: "./asset-additions.component.html",
  styleUrls: ["./asset-additions.component.scss"],
})
export class AssetAdditionsComponent implements OnInit {
  @Input() currentTheme: any;
  @Input() user: any;

  @Output() closeDepModal = new EventEmitter();
  @Output() fetchUpdatedAssets = new EventEmitter();

  currentUser: any;
  subs$ = new Subject<void>();
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
  assets: Asset[] = [];
  adding = false;
  loadingAssets = false;
  errorOccured = false;
  currentTab = 1;
  raiseBillOpts = [
    { id: 1, text: "yes" },
    { id: 2, text: "no" },
  ];
  raiseBill = false;
  vendorOpts: CustomDropDown[] = [];
  bankAccounts: CustomDropDown[] = [];
  paymentTermsOpts: CustomDropDown[] = [];
  resPersonOpts: CustomDropDown[] = [];
  assetsForAddition: Asset[] = [];
  assetFiles = [];
  totalAssetsAmount = 0;
  defaultPaymentTerm;

  addToAssetForm = new UntypedFormGroup({
    raiseBill: new UntypedFormControl("no", [Validators.required]),
    vendorId: new UntypedFormControl("", [Validators.required]),
    billDate: new UntypedFormControl("", [Validators.required]),
    billDueDate: new UntypedFormControl(""),
    paymentTermId: new UntypedFormControl("", [Validators.required]),
    reference: new UntypedFormControl(""),
    responsiblePerson: new UntypedFormControl(""),
    responsiblePersonId: new UntypedFormControl(""),
    transactionDate: new UntypedFormControl("", [Validators.required]),
    paidThroughAccountId: new UntypedFormControl("", [Validators.required]),
    lines: new UntypedFormArray([]),
  });
  ownerInformation: any;

  get formIsValid() {
    const {
      vendorId,
      billDate,
      paymentTermId,
      transactionDate,
      paidThroughAccountId,
    } = this.addToAssetForm.value;
    if (this.raiseBill) {
      return vendorId !== "" && billDate !== "" && paymentTermId !== "";
    } else {
      return transactionDate !== "" && paidThroughAccountId !== "";
    }
  }

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  assetIds: number[] = [];

  constructor(
    private router: Router,
    private assetAddServ: AssetsAdditionsService,
    private finServ: FinanceService,
    private userServ: UserService,
    private authServ: AuthService,
    private configService: ConfigurationService,
    private assetMgtService: AssetMgtService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authServ.decodeToken();
    if (!this.currentUser || this.currentUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this._getBankAccounts();

    this.getApplicationownerinformation();
    this.getAssets();
    this.watchFormChanges();
    this.getVendorOpts();
    this.getBankAccounts();
    this.getPaymentTermsOpts();
    this.fetchUsers(this.currentUser.nameid);
    this.onSwitchTab(1);
  }
  private _getBankAccounts(): void {
    this.finServ
      .getAccountsByClass({ filter: "bank" })
      .pipe(
        pluck("body"),
        takeUntil(this.subs$),
        map((res) => {
          return res.items.map((account) => ({
            id: account.accountId,
            text: account.name,
          }));
        })
      )
      .subscribe((res) => {
        this.bankAccounts = res;
      });
  }

  closeModal(): void {
    this.closeDepModal.emit();
  }

  addToLines(assetsForAddition: Asset[]) {
    if (!assetsForAddition) return;

    const lines = <UntypedFormArray>this.addToAssetForm.get("lines");
    lines.clear();

    assetsForAddition.forEach((asset) => {
      const item = new UntypedFormGroup({
        assetCardId: new UntypedFormControl(asset.assetCardId),
        description: new UntypedFormControl(""),
        amount: new UntypedFormControl(0, nonZero.bind(this)),
      });

      lines.push(item);

      if (!this.assetIds.includes(asset.assetCardId)) {
        this.assetIds.push(asset.assetCardId);

        if (this.addToAssetForm.get("transactionDate").value) {
          this.fetchNBV();
        }
      }
    });
  }

  get lines() {
    return <UntypedFormArray>this.addToAssetForm.get("lines");
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  getVendorOpts() {
    const model = {
      filter: "VendorsOnly",
      pageNumber: "1",
      pageSize: "10",
    };
    this.finServ
      .getCustomersOrVendorsSummary(model)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.vendorOpts = res.body.items;
      });
  }

  private getBankAccounts(): void {
    this.finServ
      .getAccountsByClass({ filter: "bank" })
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.bankAccounts = res.body.items.map((acc: BankAccount) => ({
          id: acc.accountId,
          text: acc.name,
        }));
      });
  }

  getPaymentTermsOpts(): void {
    this.finServ
      .spoolAllPaymentTerms({ pageNum: 1, pageSize: 100, isActive: true })
      .pipe(
        pluck("body", "data", "items"),
        tap((paymentTerms) => {
          const paymentTerm = paymentTerms.find(
            (paymentTerm) => paymentTerm.isDefault
          );

          if (paymentTerm) {
            this.defaultPaymentTerm = [
              {
                id: paymentTerm.paymentTermId,
                text: paymentTerm.paymentTermName,
              },
            ];

            this.addToAssetForm
              .get("paymentTermId")
              .setValue(paymentTerm.paymentTermId);
          }
        }),
        map((paymentTerms) => {
          return paymentTerms.map((acc) => ({
              id: acc?.paymentTermId,
              text: `${acc?.paymentTermName} (${acc?.paymentTermDays} days)`,
          }));
        }),
        takeUntil(this.subs$)
      )
      .subscribe((paymentTerms) => {
        this.paymentTermsOpts = paymentTerms;
      });
  }

  fetchUsers(id: any) {
    const data = {
      UserId: id,
      Num: 1000,
    };

    this.userServ
      .FetchAllUsersPaginated("allusersshortdetailspaginated", data)
      .pipe(
        pluck("body", "data"),
        map((res) =>
          res.items?.map((user) => ({
            id: user.personId,
            text: user.displayName,
          }))
        )
      )
      .subscribe((res) => {
        this.resPersonOpts = res;
      });
  }

  watchFormChanges() {
    this.addToAssetForm
      .get("responsiblePerson")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((val) => {
        this.addToAssetForm.get("responsiblePersonId").setValue(val[0]?.id);
      });

    this.addToAssetForm
      .get("lines")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.totalAssetsAmount = 0;
        res.forEach((asset) => (this.totalAssetsAmount += asset.amount));
      });

    this.addToAssetForm
      .get("transactionDate")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res) {
          this.addToAssetForm
            .get("billDate")
            .setValue("", { emitEvent: false });
          this.fetchNBV();
        }
      });

    this.addToAssetForm
      .get("billDate")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res) {
          this.addToAssetForm
            .get("transactionDate")
            .setValue("", { emitEvent: false });
          this.fetchNBV();
        }
      });
  }

  private fetchNBV(): void {
    const payload = {
      transactionDate:
        this.addToAssetForm.get("transactionDate").value ||
        this.addToAssetForm.get("billDate").value,
      assetIds: this.assetIds,
    };

    this.assetMgtService
      .getNBV(payload)
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe((assets) => {
        this.assetsForAddition = this.assetsForAddition.map((asset) => {
          const assetAsAtDate = assets.filter(
            (assetAsAt) => assetAsAt.assetCardId === asset.assetCardId
          );

          asset = { ...asset, netBookValue: assetAsAtDate[0].netBookValue };

          return asset;
        });
      });
  }

  onRaiseBill(val: CustomDropDown) {
    this.raiseBill = val.text === "yes" ? true : false;
    this.addToAssetForm.get("raiseBill").setValue(val.text);
  }

  onSelectVendor(val: CustomDropDown) {
    this.addToAssetForm.get("vendorId").setValue(val.id);
  }

  onSelectPaymentTerms(val: CustomDropDown) {
    this.addToAssetForm.get("paymentTermId").setValue(val.id);
  }

  onSelectResPerson(val: CustomDropDown) {
    this.addToAssetForm.get("responsiblePersonId").setValue(val.id);
  }

  onSelectPaidThrough(val: any) {
    this.addToAssetForm.get("paidThroughAccountId").setValue(val.id);
  }

  handleFileInput(files: FileList): void {
    this.assetFiles = [];

    for (let i = 0; i < files.length; i++) {
      this.assetFiles.push(files.item(i));
    }
  }

  removeFile(index: number) {
    this.assetFiles.splice(index, 1);
  }

  onSubmit($event?, approvalElem?) {
    let transactionPin = null;
    if (approvalElem && this.addToAssetForm.get("raiseBill").value === "yes") {
      this.openModal(approvalElem);
      return;
    }

    if ($event) {
      transactionPin = $event.transactionPin;
    }

    if (!this.formIsValid) return;
    this.adding = true;

    this.assetAddServ
      .addToAsset(
        this.addToAssetForm.value,
        this.assetFiles,
        {
          raiseBill: this.raiseBill,
        },
        transactionPin
      )
      .subscribe(
        (res) => {
          this.adding = false;
          this.toast.fire({
            type: "success",
            title: "Asset addition successfully posted.",
          });
          this.fetchUpdatedAssets.emit();
          this.closeModal();
        },
        (err) => {
          this.adding = false;
        }
      );
  }

  get haveAssets() {
    return this.assets.length > 0;
  }

  get haveAssetsForAddition() {
    return this.assetsForAddition.length > 0;
  }

  getAssets(
    data: GetAssetsData = {
      pageSize: +this.pagination.pageSize,
      pageNumber: 1,
      searchParam: "",
    }
  ): void {
    this.loadingAssets = true;
    data.status = "Running";

    this.assetAddServ
      .getAssets(data)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.loadingAssets = false;
          this.errorOccured = false;

          this.assets = res.body.data.items;

          this.setPagination(res.body.data);
        },
        (err) => {
          this.errorOccured = true;
          this.loadingAssets = false;
        }
      );
    $(".itemPaginatedJumpModal").toggle(false);
  }

  setPagination(res: any): void {
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

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  hasBeenDisposed(asset: Asset) {
    if (asset.status === "Disposed") {
      this.toast.fire({
        type: "error",
        title: "This asset has been disposed of.",
      });
      return true;
    } else {
      return false;
    }
  }

  onAddAssetForAddition(asset: Asset, index: number) {
    if (this.hasBeenDisposed(asset)) return;

    this.assetsForAddition.push(asset);
    this.assets.splice(index, 1);
    this.addToLines([...this.assetsForAddition]);
    this.pagination.count--;
  }

  onRemoveAssetAddition(asset: Asset, index: number) {
    if (this.hasBeenDisposed(asset)) return;

    this.assets.push(asset);
    this.assetsForAddition.splice(index, 1);
    this.addToLines([...this.assetsForAddition]);
    this.pagination.count++;
  }

  onSwitchTab(tabNumber: number) {
    this.currentTab = tabNumber;
    if (this.currentTab === 2) {
      this.addToLines(this.assetsForAddition);
    }
  }

  openModal(modal: any): void {
    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeAllModal(): void {
    this.modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
