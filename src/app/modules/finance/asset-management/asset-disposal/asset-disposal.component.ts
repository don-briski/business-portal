import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
} from "@angular/core";
import { UntypedFormGroup, UntypedFormControl, UntypedFormArray, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { map, pluck, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { CustomDropDown } from "../../../../model/CustomDropdown";
import { FinanceService } from "../../service/finance.service";
import { UserService } from "../../../../service/user.service";
import { AuthService } from "../../../../service/auth.service";
import { AssetDisposalService } from "./asset-disposal.service";
import { Asset, GetAssetsData } from "./types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { BankAccount } from "../../types/Account";
import { User } from "src/app/modules/shared/shared.types";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-asset-disposal",
  templateUrl: "./asset-disposal.component.html",
  styleUrls: ["./asset-disposal.component.scss"],
})
export class AssetDisposalComponent implements OnInit, OnDestroy {
  @Input() user: any;
  @Input() currentTheme: any;

  @Output() closeDepModal = new EventEmitter();
  @Output() fetchUpdatedAssets = new EventEmitter();

  subs$ = new Subject<void>();
  disposing = false;
  loadingAssets = false;
  errorOccured = false;
  currentTab = 1;
  currentUser: any;
  raiseInvoiceOpts = [
    { id: 1, text: "yes" },
    { id: 2, text: "no" },
  ];
  raiseInvoice = false;
  customerOpts: CustomDropDown[] = [];
  paymentTermsOpts: CustomDropDown[] = [];
  responsiblePersons: CustomDropDown[] = [];
  bankAccounts: CustomDropDown[] = [];
  accounts = [];
  assetDisposalCount = 0;
  assets: Asset[] = [];
  assetsForDisposal: Asset[] = [];
  assetFiles = [];
  searchTerm: "";
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    maxPage: Infinity,
    pageSize: 10,
    pageNumber: 1,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: "",
    jumpArray: [],
  };
  totalAssetsAmount = 0;

  disposeAssetForm = new UntypedFormGroup({
    raiseInvoice: new UntypedFormControl("", Validators.required),
    customerPersonId: new UntypedFormControl("", Validators.required),
    invoiceDate: new UntypedFormControl("", Validators.required),
    dueDate: new UntypedFormControl(""),
    paymentTermId: new UntypedFormControl("", Validators.required),
    reference: new UntypedFormControl(""),
    responsiblePerson: new UntypedFormControl(""),
    responsiblePersonId: new UntypedFormControl(""),
    transactionDate: new UntypedFormControl("", Validators.required),
    cashOrBankAccountId: new UntypedFormControl("", Validators.required),
    lines: new UntypedFormArray([]),
  });
  ownerInformation: any;
  assetIds: number[] = [];

  get formIsValid() {
    const {
      customerPersonId,
      invoiceDate,
      paymentTermId,
      transactionDate,
      cashOrBankAccountId,
    } = this.disposeAssetForm.value;
    if (this.raiseInvoice) {
      return (
        customerPersonId !== "" &&
        invoiceDate !== "" &&
        paymentTermId !== "" &&
        cashOrBankAccountId !== ""
      );
    } else {
      return transactionDate !== "" && cashOrBankAccountId !== "";
    }
  }

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private assetDispoServ: AssetDisposalService,
    private finServ: FinanceService,
    private userServ: UserService,
    private authServ: AuthService,
    private router: Router,
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

    this.getApplicationownerinformation();

    this.fetchUser();
    this.watchFormChanges();
    this.getAssets();
    this.getCustomerOpts();
    this.getPaymentTermsOpts();
    this.getBankAccounts();
    this.fetchUsers(this.currentUser.nameid);
  }

  closeModal(): void {
    this.closeDepModal.emit();
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  fetchUser(): void {
    this.userServ
      .getUserInfo(this.authServ.decodeToken().nameid)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  addToLines(assetsForDisposal: Asset[]) {
    if (!assetsForDisposal) return;
    const lines = <UntypedFormArray>this.disposeAssetForm.get("lines");
    lines.clear();
    assetsForDisposal.forEach((asset) => {
      const item = new UntypedFormGroup({
        assetCardId: new UntypedFormControl(asset.assetCardId),
        sellingPrice: new UntypedFormControl(""),
        diff: new UntypedFormControl(0 - asset.netBookValue),
      });
      lines.push(item);
      lines.controls.forEach((control, index) => {
        const assetForDisposal = assetsForDisposal[index];
        control.valueChanges.pipe(takeUntil(this.subs$)).subscribe((value) => {
          const res = value.sellingPrice - assetForDisposal.netBookValue;
          control.get("diff").setValue(res, { emitEvent: false });
        });
      });
      if (!this.assetIds.includes(asset.assetCardId)) {
        this.assetIds.push(asset.assetCardId);
        if (this.disposeAssetForm.get("transactionDate").value) {
          this.fetchNBV();
        }
      }
    });
  }

  get lines() {
    return <UntypedFormArray>this.disposeAssetForm.get("lines");
  }

  getCustomerOpts() {
    const model = {
      filter: "CustomersOnly",
      pageNumber: "1",
      pageSize: "10",
    };
    this.finServ
      .getCustomersOrVendorsSummary(model)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.customerOpts = res.body.items;
      });
  }

  getPaymentTermsOpts(): void {
    this.finServ
      .spoolAllPaymentTerms({ pageNum: 1, pageSize: 100, isActive: true })
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.paymentTermsOpts = res.body?.data?.items.map((acc) => {
          return {
            id: acc?.paymentTermId,
            text: `${acc?.paymentTermName} (${acc?.paymentTermDays} days)`,
          };
        });
      });
  }

  fetchUsers(id: any) {
    const data = {
      UserId: id,
      Num: 1000,
    };
    this.userServ
      .FetchAllUsers(data)
      .pipe(
        takeUntil(this.subs$),
        pluck("body", "data"),
        map((res) => {
          return res.items.filter((user: User) => user.status === 0);
        }),
        map((res) => {
          return res.map((user: User) => {
            return {
              id: user.person.personId,
              text: user.person.displayName,
            };
          });
        })
      )
      .subscribe((res) => {
        this.responsiblePersons = res;
      });
  }

  getBankAccounts(): void {
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

  watchFormChanges() {
    this.disposeAssetForm
      .get("responsiblePerson")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((val) => {
        this.disposeAssetForm.get("responsiblePersonId").setValue(val[0]?.id);
      });

    this.disposeAssetForm
      .get("transactionDate")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res) {
          this.disposeAssetForm
            .get("invoiceDate")
            .setValue("", { emitEvent: false });
          this.fetchNBV();
        }
      });

    this.disposeAssetForm
      .get("invoiceDate")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res) {
          this.disposeAssetForm
            .get("transactionDate")
            .setValue("", { emitEvent: false });
          this.fetchNBV();
        }
      });

    this.disposeAssetForm
      .get("lines")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.totalAssetsAmount = 0;
        res.forEach((asset) => (this.totalAssetsAmount += asset.sellingPrice));
      });
  }
  private fetchNBV(): void {
    const payload = {
      transactionDate:
        this.disposeAssetForm.get("transactionDate").value ||
        this.disposeAssetForm.get("invoiceDate").value,
      assetIds: this.assetIds,
    };

    this.assetMgtService
      .getNBV(payload)
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe((assets) => {
        this.assetsForDisposal = this.assetsForDisposal.map((asset) => {
          const assetAsAtDate = assets.filter(
            (assetAsAt) => assetAsAt.assetCardId === asset.assetCardId
          );

          asset = { ...asset, netBookValue: assetAsAtDate[0].netBookValue };

          return asset;
        });
      });
  }

  onRaiseInvoice(val: CustomDropDown) {
    this.raiseInvoice = val.text === "yes" ? true : false;
    this.disposeAssetForm.get("raiseInvoice").setValue(val.text);
  }

  onSelectCustomer(val: CustomDropDown) {
    this.disposeAssetForm.get("customerPersonId").setValue(val.id);
  }

  onSelectPaymentTerms(val: CustomDropDown) {
    this.disposeAssetForm.get("paymentTermId").setValue(val.id);
  }

  onSelectResPerson(val: CustomDropDown) {
    this.disposeAssetForm.get("responsiblePersonId").setValue(val.id);
  }

  onSelectDisposeTo(val: CustomDropDown) {
    this.disposeAssetForm.get("depositToAccountId").setValue(val.id);
  }

  onSelectAccount(acc: any) {
    this.disposeAssetForm.get("cashOrBankAccountId").setValue(acc.id);
  }

  onSubmit($event, approvalElem) {
    let transactionPin = null;
    if (
      approvalElem &&
      this.disposeAssetForm.get("raiseInvoice").value === "yes"
    ) {
      this.openModal(approvalElem);
      return;
    }

    if ($event) {
      transactionPin = $event.transactionPin;
    }
    if (!this.formIsValid) return;

    this.disposing = true;
    this.assetDispoServ
      .disposeAsset(
        this.disposeAssetForm.value,
        this.assetFiles,
        {
          raiseInvoice: this.raiseInvoice,
        },
        transactionPin
      )
      .subscribe(
        (res) => {
          this.disposing = false;
          this.toast.fire({
            type: "success",
            title: "Asset(s) successfully disposed.",
          });
          this.fetchUpdatedAssets.emit();
          this.closeModal();
        },
        (err) => {
          this.disposing = false;
        }
      );
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

  get haveAssets() {
    return this.assets.length > 0;
  }

  get haveAssetsForDisposal() {
    return this.assetsForDisposal.length > 0;
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

    this.assetDispoServ
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
          this.loadingAssets = false;
          this.errorOccured = true;
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

  onAddAssetForDisposal(asset: Asset, index: number) {
    this.assetsForDisposal.push(asset);
    this.assets.splice(index, 1);
    this.addToLines([...this.assetsForDisposal]);
    this.pagination.count--;
  }

  onRemoveAssetForDisposal(asset: Asset, index: number) {
    this.assets.push(asset);
    this.assetsForDisposal.splice(index, 1);
    this.addToLines([...this.assetsForDisposal]);
    this.pagination.count++;
  }

  onSwitchTab(tabNumber: number) {
    this.currentTab = tabNumber;
    if (this.currentTab === 2) {
      this.addToLines(this.assetsForDisposal);
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
