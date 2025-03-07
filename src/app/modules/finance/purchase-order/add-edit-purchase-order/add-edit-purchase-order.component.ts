import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  UntypedFormArray,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, Subject, forkJoin } from "rxjs";
import { pluck, takeUntil, tap, map } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { AuthService } from "src/app/service/auth.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ItemService } from "src/app/service/item.service";
import { PurchaseOrderService } from "src/app/service/purchase-order.service";
import { VendorMgtService } from "src/app/service/vendor-mgt.service";
import Swal from "sweetalert2";
import { FinanceService } from "../../service/finance.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import * as moment from "moment";
import {
  calculateLines,
  customDateFormat,
  setDueDate,
  toFormData,
} from "src/app/util/finance/financeHelper";
import { UserService } from "src/app/service/user.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { PurchaseOrder } from "../../models/purchase-order.interface";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { FinanceItem, Tax } from "../../finance.types";
import { AppOwnerInformation, User } from "src/app/modules/shared/shared.types";

@Component({
  selector: "app-add-edit-purchase-order",
  templateUrl: "./add-edit-purchase-order.component.html",
  styleUrls: ["./add-edit-purchase-order.component.scss"],
})
export class AddEditPurchaseOrderComponent implements OnInit, OnDestroy {
  purchaseOrderForm: UntypedFormGroup;
  vendors: CustomDropDown[] = [];
  allVendors: any[] = [];
  accounts: any[] = [];
  allItems: FinanceItem[] = [];
  itemsDropData: any[] = [];
  deliverTo: string = "org";
  selectedLineIndex: number = 0;
  itemsRate: string[] = ["Tax Exclusive", "Tax Inclusive"];
  discountTypes: string[] = ["Transaction Level", "Line Level"];
  taxInclusive: boolean = false;
  selectedItemAccount: any = null;
  taxesObj: any[] = [];
  user: User;
  currencySymbol: string;

  totalAmount: number = 0;
  adjustable: number = 0;
  discount: number = 0;
  subTotal: number = 0;
  unsubscriber$ = new Subject<void>();
  taxes: Tax[] = [];
  taxesDropdata: CustomDropDown[] = [];
  paymentTerms: any[] = [];
  loggedInUser: any;
  currentTheme: ColorThemeInterface;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  loader: boolean;
  purchaseOrderFiles: any[] = [];
  purchaseOrderViewFiles: any[] = [];
  isEditing = false;
  cloning = false;
  fileDelete: boolean;
  lineLevelDiscountSet: boolean = false;
  discountLevel = "TransactionLevel";
  showDiscountAccount: boolean = false;
  allPaymentTerms: any[] = [];
  _selectedPOId: number;
  purchaseOrder: any;
  purchaseOrderLines: any[] = [];
  showHeader: boolean = false;
  setVendor: boolean = false;
  selectedVendor: any = null;
  ownerInformation: AppOwnerInformation;
  POForAsset = false;
  isGettingItemsAndTaxes = false;

  constructor(
    private fb: UntypedFormBuilder,
    private vendorService: VendorMgtService,
    private coaService: ChartOfAccountService,
    private itemService: ItemService,
    private financeService: FinanceService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private router: Router,
    private poService: PurchaseOrderService,
    private configService: ConfigurationService,
    private route: ActivatedRoute,
    private userService: UserService,
    private modalService: NgbModal,
    private assetMgtService: AssetMgtService
  ) {}

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.resolveEditOrCloneMode();
    this._fetchUser();
    this.initForm();
    this._getAccounts();
    this._loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.getApplicationownerinformation();
    this.getVendors();
    this._loadPaymentTerms();
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configService.currencySymbol;
    if (!this.currencySymbol) {
      this.configService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  resolveEditOrCloneMode() {
    const urlSegments = this.route.snapshot.url;
    if (urlSegments[1].path === "edit") {
      this.isEditing = true;
    } else if (urlSegments[2] && urlSegments[2].path === "clone") {
        this.cloning = true;
    } else {
      this.isEditing = false;
      this.cloning = false;
    }

    if (this.isEditing || this.cloning) {
      this._selectedPOId = this.route.snapshot.params.id;
      this._getPurchaseOrder(this._selectedPOId);
    } else {
      this.POForAsset = false;
      this.getItemsAndTaxes();
    }
  }

  getSearchVendorService(): Select2SearchApi {
    return {
      search: (keyword: string) => {
        const model = {
          filter: "VendorsOnly",
          pageNumber: "1",
          pageSize: "10",
          keyword,
        };
        return this.financeService.getCustomersOrVendorsSummary(model);
      },
    };
  }

  getPaymentTermsService(): Select2SearchApi {
    return {
      search: (paymentModeName: string) =>
        this.financeService.spoolAllPaymentTerms({
          paymentModeName: paymentModeName,
          isActive: true,
        }),
    };
  }

  getSearchItemsService(): Select2SearchApi {
    return {
      search: (searchTerm: string) =>
        this.itemService.getAssestAndExpenseItems(
          { searchTerm: searchTerm },
          "PO"
        ),
    };
  }

  updateDropdown($event: any, type: string, lineIndex?: number): void {
    if (lineIndex) {
      this.selectedLineIndex = lineIndex;
    }
    if (type === "vendor" && $event?.items.length > 0) {
      this.vendors = $event?.items;
    } else if (type === "paymentTerms" && $event?.length > 0) {
      this.paymentTerms = $event?.map((paymentTerm: any) => {
        return {
          id: paymentTerm.paymentTermId,
          text: paymentTerm.paymentTermName,
        };
      });
    } else if (type === "items" && $event.data.length > 0) {
      this.itemsDropData = this.addCodeToItemName($event.data);
    }
  }

  setPOForAsset($event) {
    this.POForAsset = $event;
    this.setItemList();
  }

  private _fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe(
        (res) => {
          this.user = res.body;
        },
        (err) => {}
      );
  }

  openModal(modal: any, size?, index?: number): void {
    if (index) {
      this.selectedLineIndex = index;
    }
    this.modalService.open(modal, { centered: true, size });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  items(): UntypedFormArray {
    return this.purchaseOrderForm.controls["lines"] as UntypedFormArray;
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  initForm(): void {
    this.purchaseOrderForm = this.fb.group({
      date: new UntypedFormControl(null, [Validators.required]),
      expectedDeliveryDate: new UntypedFormControl(null, Validators.required),
      termsAndConditions: new UntypedFormControl(null),
      reference: new UntypedFormControl(null),
      status: new UntypedFormControl(null),
      totalAmount: new UntypedFormControl(null),
      subTotal: new UntypedFormControl(null),
      taxTotalAmount: new UntypedFormControl(null),
      discountAmount: new UntypedFormControl(0),
      transactionLevelDiscountRate: new UntypedFormControl(null),
      discountAccountId: new UntypedFormControl(null),
      paymentTerm: new UntypedFormControl(null),
      paymentTermId: new UntypedFormControl(null, Validators.required),
      vendor: new UntypedFormControl([], Validators.required),
      vendorId: new UntypedFormControl(null),
      billedStatus: new UntypedFormControl("Billed"),
      deliveredTo: new UntypedFormControl(null),
      taxOption: new UntypedFormControl("Exclusive"),
      discountLevel: new UntypedFormControl(this.discountLevel),
      discountAfterTax: new UntypedFormControl(null),
      existingFiles: new UntypedFormControl([]),
      lines: this.fb.array([]),
    });
    this.addItem();
    this._watchFormChanges();
  }

  private setPaymentTerm(vendor) {
    if (vendor?.paymentTermId) {
      const paymentTerm = this.allPaymentTerms.find(
        (paymentTerm) => paymentTerm.paymentTermId === vendor.paymentTermId
      );

      this.purchaseOrderForm.get("paymentTerm").setValue([
        {
          id: paymentTerm?.paymentTermId,
          text: paymentTerm?.paymentTermName,
        },
      ]);

      this.purchaseOrderForm
        .get("paymentTermId")
        .setValue(paymentTerm?.paymentTermId);

      this._updateDueDate();
    }
  }

  private _watchFormChanges(): void {
    this.purchaseOrderForm
      .get("vendor")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.purchaseOrderForm.get("vendorId").setValue(res[0].id);

        const vendor = this.allVendors.find(
          (vendor) => vendor.id === res[0].id
        );

        if (!vendor) {
          this.financeService
            .getVendor(res[0]?.id)
            .pipe(pluck("body"), takeUntil(this.unsubscriber$))
            .subscribe((vendor) => {
              this.allVendors = [vendor, ...this.allVendors];
              this.setPaymentTerm(vendor);
            });
        } else {
          this.setPaymentTerm(vendor);
        }
      });

    this.purchaseOrderForm
      .get("paymentTerm")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.purchaseOrderForm.get("paymentTermId").setValue(res[0].id);
        this._updateDueDate();
      });

    this.purchaseOrderForm
      .get("date")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this._updateDueDate();
      });
  }

  private _updateDueDate(): void {
    if (
      this.purchaseOrderForm.get("paymentTermId").value &&
      this.purchaseOrderForm.get("date").value
    ) {
      const paymentTermDays = this.allPaymentTerms.find(
        (paymentTerm) =>
          paymentTerm.paymentTermId ===
          this.purchaseOrderForm.get("paymentTermId").value
      )?.paymentTermDays;

      const dueDate = setDueDate(
        this.purchaseOrderForm.get("date").value,
        paymentTermDays
      );

      this.purchaseOrderForm
        .get("expectedDeliveryDate")
        .setValue(moment(dueDate).format("YYYY-MM-DD"));
    }
  }

  public handleFileInput(filelist: FileList): void {
    this.purchaseOrderFiles = [];

    for (let i = 0; i < filelist.length; i++) {
      this.purchaseOrderFiles.push(filelist.item(i));
      this.purchaseOrderViewFiles = [
        ...this.purchaseOrderViewFiles,
        filelist.item(i),
      ];
    }
  }
  public removeFile(index: number): void {
    this.purchaseOrderViewFiles.splice(index, 1);
  }

  private _getPurchaseOrder(purchaseOrderId: number): void {
    this.poService
      .getPurchaseOrderById(purchaseOrderId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.purchaseOrder = res.body.data;
        this.setPOForAsset(
          this.purchaseOrder.lines[0].itemType === "AssetItem"
        );
        this.getItemsAndTaxes();
      });
  }

  private _patchForm(purchaseOrder: PurchaseOrder): void {
    this.purchaseOrderForm.patchValue({
      date: customDateFormat(purchaseOrder.date),
      expectedDeliveryDate: customDateFormat(
        purchaseOrder.expectedDeliveryDate
      ),
      reference: purchaseOrder.reference,
      currencyId: purchaseOrder.currencyId,
      status: purchaseOrder.status,
      totalAmount: purchaseOrder.totalAmount,
      subTotal: purchaseOrder.subTotal,
      taxTotalAmount: purchaseOrder.taxTotalAmount,
      discountAmount: purchaseOrder.discountAmount,
      transactionLevelDiscountRate: purchaseOrder.transactionLevelDiscountRate,
      discountAccountId: purchaseOrder.discountAccountId,
      paymentTerm: [
        {
          id: purchaseOrder.paymentTermId,
          text: purchaseOrder.paymentTermName,
        },
      ],
      paymentTermId: purchaseOrder.paymentTermId,
      vendor: [
        {
          id: purchaseOrder.vendorId,
          text: purchaseOrder.vendorName,
        },
      ],
      vendorId: purchaseOrder.vendorId,
      billedStatus: purchaseOrder.billedStatus,
      deliveredTo: purchaseOrder.deliveredTo,
      taxOption: purchaseOrder.taxOption,
      discountLevel: purchaseOrder.discountLevel,
      discountAfterTax: purchaseOrder.discountAfterTax,
      termsAndConditions: purchaseOrder.termsAndConditions,
    });

    this.purchaseOrderViewFiles = this.isEditing ? purchaseOrder.files : [];

    if (purchaseOrder.taxOption === "Inclusive") {
      this.itemsRate = ["Tax Inclusive", "Tax Exclusive"];
      this.taxInclusive = true;
    } else {
      this.itemsRate = ["Tax Exclusive", "Tax Inclusive"];
      this.taxInclusive = false;
    }

    this.discountLevel = purchaseOrder.discountLevel;

    if (this.discountLevel === "LineItemLevel") {
      this.discountTypes = ["Line Level", "Transaction Level"];
      this.showDiscountAccount = false;
    } else {
      this.discountTypes = ["Transaction Level", "Line Level"];
    }

    this.purchaseOrderLines = purchaseOrder.lines;

    if (this.purchaseOrderLines.length > 0) {
      this.items().removeAt(0);
      this.purchaseOrderLines.forEach((purchaseOrder, index) => {
        const foundTax = this.taxes.find(
          (tax) => tax.financeTaxId === purchaseOrder.taxId
        );
        let selectedTax;
        foundTax
          ? (selectedTax = [{ id: foundTax?.financeTaxId, text: foundTax?.name }])
          : (selectedTax = [{ id: null, text: "No Tax" }]);

        let item = [{text: '', id: null}]
        if (purchaseOrder.assetId) {
          const foundAssetCode = this.allItems.find(item => item.id === purchaseOrder.assetId).code;
          item = [
            {
              id: purchaseOrder.assetId,
              text: `${purchaseOrder.assetName} (${foundAssetCode})`,
            },
          ]
        } else {
          const foundItemCode = this.allItems.find(item => item.id === purchaseOrder.itemId).code;
          item = [
            {
              id: purchaseOrder.itemId,
              text: `${purchaseOrder.itemName} (${foundItemCode})`,
            },
          ]
        }

        const purchaseOrderControl = this.fb.group({
          itemId: new UntypedFormControl(
            purchaseOrder.itemId || purchaseOrder.assetId
          ),
          assetId: new UntypedFormControl(purchaseOrder.assetId),
          item: new UntypedFormControl(item),
          itemType: new UntypedFormControl(purchaseOrder.itemType),
          accountId: new UntypedFormControl(purchaseOrder.accountId),
          quantity: new UntypedFormControl(purchaseOrder.quantity),
          tax: new UntypedFormControl(selectedTax),
          taxId: new UntypedFormControl(purchaseOrder.taxId),
          customerId: new UntypedFormControl(""),
          unitPrice: new UntypedFormControl(purchaseOrder.unitPrice),
          amount: new UntypedFormControl(purchaseOrder.subTotalAmount),
          purchaseLineId: new UntypedFormControl(purchaseOrder.purchaseLineId),
          originalAmount: purchaseOrder.quantity * purchaseOrder.unitPrice,
          discountType: purchaseOrder.discountType,
          discountValueOnType: purchaseOrder.discountValueOnType,
          taxes: new UntypedFormControl([]),
        });

        this.items().push(purchaseOrderControl);
        const taxes = this.getItemTaxes();
        this.items().at(index).get("taxes").setValue(taxes);


        this.taxesObj.push({
          id: purchaseOrder.tax?.financeTaxId,
          name: purchaseOrder.tax?.name,
          value: purchaseOrder.taxAmount,
        });

        this.linesCalculation();
      });
    }
  }

  private cleanUp(): void {
    this.purchaseOrderForm.removeControl("paymentTerm");
    this.purchaseOrderForm.removeControl("vendor");

    this.items().controls.forEach((control) =>
      (control as UntypedFormGroup).removeControl("tax")
    );
  }

  submitForm(event): void {
    this.cleanUp();
    this.purchaseOrderForm.get("status").patchValue(event.status || event);
    this.loader = true;
    const data: PurchaseOrder = this.purchaseOrderForm.value;

    data.files = this.purchaseOrderFiles;

    if (this.isEditing) {
      data.purchaseOrderId = this.purchaseOrder.purchaseOrderId;
      this.purchaseOrderViewFiles.map((file) => {
        if (file.fileId) {
          data.existingFiles.push(file.fileId);
        }
      });
    }

    if (this.cloning) {
      delete data['purchaseOrderId'];
      data.lines.forEach(item => {
        delete item.purchaseLineId;
      });
    }

    const formData = toFormData(data);

    if (!this.isEditing) {
      this.sendToService$(formData, event?.transactionPin)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: `Purchase order ${this.cloning ? 'cloned' : 'created'} successfully!`,
            });
            this.loader = false;
            this.router.navigateByUrl("/finance/purchase-orders");
          },
          (err) => {
            this.loader = false;
          }
        );
    } else {
      this.poService
        .updatePurchaseOrder(formData)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Purchase order Updated successfully.",
            });
            this.loader = false;
            this.router.navigateByUrl("/finance/purchase-orders");
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  updateDueDate(): void {
    const paymentId = this.purchaseOrderForm.get("paymentTermId").value;
    if (paymentId !== null) {
      const date = this.purchaseOrderForm.get("date").value;
      const paymentTermDays = this.allPaymentTerms.find(
        (x) => x.paymentTermId === paymentId
      )?.paymentTermDays;

      const dateMoment = moment(date);
      let dueDate = moment(dateMoment).add(+paymentTermDays, "days");

      this.purchaseOrderForm
        .get("expectedDeliveryDate")
        .patchValue(moment(dueDate).format("YYYY-MM-DD"));
    }
  }

  selectAccount(event: any, index: number): void {
    const singleItem = this.items().at(index);
    singleItem.get("accountId").patchValue(event?.accountId);
  }

  selectDiscountAccount(event: any): void {
    this.purchaseOrderForm.get("discountAccountId").setValue(event.accountId);
  }

  selectTax(event: any, index: number): void {
    const singleItem = this.items().at(index);
    const selectedTax = this.taxes.find((x) => x.financeTaxId === event.id);
    singleItem.get("taxId").patchValue(selectedTax?.financeTaxId);

    this.linesCalculation();
  }

  removeTax(event: any, index: number): void {
    const singleItem = this.items().at(index);
    singleItem.get("taxId").reset();
    this.linesCalculation();
  }

  setItemValues(singleItem, selectedItem) {
    singleItem
      .get("item")
      .patchValue([{ id: selectedItem?.id, text: selectedItem?.text }]);
    singleItem.get("itemId").patchValue(selectedItem?.id);
    singleItem.get("assetId").patchValue(selectedItem?.id);
    singleItem
      .get("unitPrice")
      .patchValue(selectedItem?.amount ? selectedItem?.amount : 0);

    const account = this.accounts.find(
      (account) => account.accountId === selectedItem?.accountId
    );
    this.selectedItemAccount = {
      accountId: account?.accountId,
      name: account?.name,
    };

    this.POForAsset
      ? singleItem.get("itemType").setValue("AssetItem")
      : singleItem.get("itemType").setValue("ExpenseItem");

    this.linesCalculation();
  }

  private getItem(id: number) {
    this.itemService
      .getItemById(id)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((item) => {
        const newItem = {
          id: item.itemId,
          text: item.itemName,
          code: item.itemCode,
          amount: item.costPrice,
          accountId: item.purchaseAccountId,
          accountName: item.purchaseAccount.name,
        };

        this.allItems = [newItem, ...this.allItems];
        this.selectItem(newItem, this.selectedLineIndex);
      });
  }

  private getAsset(id: number) {
    this.assetMgtService
      .getAssetById(id)
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe((asset) => {
        const newItem = {
          id: asset.assetCardId,
          text: asset.assetName,
          code: asset.assetCode,
          amount: asset.purchasePrice,
        };
        this.allItems = [newItem, ...this.allItems];

        this.selectItem(newItem, this.selectedLineIndex);
      });
  }

  selectItem(event: any, index: number): void {
    const singleItem = this.items().at(index);
    const selectedItem = this.allItems.find((x) => x.id === event[0]?.id);
    if (selectedItem) {
      this.setItemValues(singleItem, selectedItem);
    } else {
      this.POForAsset ? this.getAsset(event[0]?.id) : this.getItem(event[0]?.id);
    }

    const taxes = this.getItemTaxes();
    singleItem.get("taxes").reset();
    singleItem.get("taxes").setValue(taxes);

    this.items()
            .at(index)
            .get("tax")
            .setValue([{id: event[0]?.financeTaxId, text: event[0]?.financeTaxName}], { emitEvent: false });
    this.items()
            .at(index)
            .get("taxId")
            .setValue(event[0]?.financeTaxId);

    this.setItemList();
  }

  getItemTaxes() {
    return this.taxes
      .filter((tax) => tax.type === 'Purchase' || tax.type === "Both")
      .map((tax) => ({ id: tax.financeTaxId, text: tax.name }));
  }

  reCalculateTax(): void {
    this.items().value.forEach((item, index) => {
      const quantity = +item.quantity;
      const unitPrice = +item.unitPrice;

      let amount = +(quantity * unitPrice).toFixed(2);

      let tax = 0;
      const taxId = +item.taxId;

      if (taxId && !this.taxInclusive) {
        let taxInPercentage = this.taxes.find(
          (x) => x.financeTaxId === taxId
        ).value;

        tax = +((amount * taxInPercentage) / 100).toFixed(2);
      }

      let amountAfterTax = +(amount + tax).toFixed(2);

      const singleItem = this.items().at(index);

      singleItem.get("amount").patchValue(amountAfterTax);
    });
  }

  setDiscountAfterTax(): void {
    const discountAfterTax = this.purchaseOrderForm.get("discountAfterTax");
    discountAfterTax.setValue(!discountAfterTax.value);

    this.linesCalculation();
  }

  updateDiscountProps(rate: number): void {
    if (this.showDiscountAccount) {
      this.purchaseOrderForm.get("discountAmount").setValue(rate);
    }
  }

  addItem(): void {
    const item = this.fb.group({
      itemId: new UntypedFormControl(null),
      item: new UntypedFormControl([]),
      assetId: new UntypedFormControl(null),
      itemType: new UntypedFormControl(null),
      accountId: new UntypedFormControl(null),
      quantity: new UntypedFormControl(1),
      tax: new UntypedFormControl([{id: null, text: 'No Tax'}]),
      taxId: new UntypedFormControl(null),
      customerId: new UntypedFormControl(null),
      unitPrice: new UntypedFormControl(0),
      amount: new UntypedFormControl(0),
      originalAmount: new UntypedFormControl(0),
      discountValueOnType: new UntypedFormControl(null),
      discountType: new UntypedFormControl("Percentage"),
      taxes: new UntypedFormControl([]),
    });

    this.items().push(item);
  }

  removeItem(index: number): void {
    this.items().removeAt(index);
    this.linesCalculation();
  }

  setDeliverTo(selected: HTMLInputElement, other: HTMLInputElement): void {
    if (selected.value) {
      this.deliverTo = selected.value;
      other.checked = false;
    }
  }

  onSetInclusive(event): void {
    event.text === "Tax Inclusive"
      ? (this.taxInclusive = true)
      : (this.taxInclusive = false);
    this.purchaseOrderForm
      .get("taxOption")
      .patchValue(this.taxInclusive ? "Inclusive" : "Exclusive");
    this.linesCalculation();
  }

  linesCalculation(): void {
    const discountAfterTax =
      this.purchaseOrderForm.get("discountAfterTax").value;
    const discountLevel = this.purchaseOrderForm.get("discountLevel").value;
    const transactionLevelDiscountRate = this.purchaseOrderForm.get(
      "transactionLevelDiscountRate"
    ).value;
    this.taxesObj = [];
    calculateLines(
      this.items().value,
      this.taxes,
      this.taxesObj,
      discountAfterTax,
      this.taxInclusive,
      discountLevel,
      transactionLevelDiscountRate
    );

    this.subTotal = 0;
    this.totalAmount = 0;
    this.discount = 0;
    this.items().value.forEach((item, index) => {
      this.items().at(index).get("amount").patchValue(item.subTotalAmount);
      this.subTotal = this.subTotal + item.subTotalAmount;
      this.totalAmount += item.totalAmount;
      this.discount += item.discountAmount;
    });

    this.showDiscountAccount =
      discountLevel === "TransactionLevel" && this.discount > 0;
  }

  onSetDiscountLevel(event): void {
    event.text === "Transaction Level"
      ? (this.discountLevel = "TransactionLevel")
      : (this.discountLevel = "LineItemLevel");

    this.purchaseOrderForm.get("discountLevel").setValue(this.discountLevel);
  }

  closeSidebar(): void {
    this.configService.isSidebarClosed$.next(true);
  }

  getVendors(vendor?: any) {
    const model = {
      pageSize: 10,
      pageNumber: 1,
    };
    this.vendorService
      .spoolAllVendors(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const filteredVendors = res?.items.filter(
          (vendor) => vendor.status
        );
        this.allVendors = filteredVendors;
        if (this.allVendors.length > 0) {
          this.vendors = this.allVendors.map(
            (item) =>
              <CustomDropDown>{
                id: item?.id,
                text: item?.fullName,
              }
          );

          if (vendor) {
            this.closeModal();
            this.purchaseOrderForm.get("vendor").patchValue([vendor]);
          }
        }
      });
  }

  private _getAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((accounts) => {
        this.accounts = accounts;
      });
  }

  addCodeToItemName(items: FinanceItem[]) {
    if (items.length) {
      return items.map((item) => ({
        ...item,
        text: `${item.text} (${item.code})`,
      }))
    }
  }

  setItemList() {
    if (this.POForAsset) {
      this.itemsDropData = this.allItems.filter(item => item.itemType === 'AssetItem');
    } else {
      this.itemsDropData = this.allItems.filter(item => item.itemType === 'ExpenseItem');
    }
  }

  getItemsAndTaxes() {
    this.isGettingItemsAndTaxes = true;
    forkJoin([
      this.itemService.getAssestAndExpenseItems({ searchTerm: "" }, "PO"),
      this.financeService.getTaxes({
        pageNumber: 1,
        pageSize: 100,
        isActive: true,
      }),
    ])
      .pipe(
        map((res) => {
          const items = this.addCodeToItemName(res[0].body?.data);

          return { items, taxes: res[1].body?.items };
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (res) => {
          this.allItems = res.items;
          this.setItemList();
          this.taxes = res.taxes;

          if (this.isEditing || this.cloning) {
            this._patchForm(this.purchaseOrder);
          }
          this.isGettingItemsAndTaxes = false;
        },
        error: () => {
          this.isGettingItemsAndTaxes = false;
        },
      });
  }

  private _loadPaymentTerms(): void {
    this.financeService
      .spoolAllPaymentTerms({ pageNum: 1, pageSize: 100, isActive: true })
      .pipe(
        pluck("body", "data", "items"),
        tap((allPaymentTerms: any[]) => {
          this.allPaymentTerms = allPaymentTerms;
          const paymentTerm = allPaymentTerms.find(
            (paymentTerm) => paymentTerm.isDefault
          );
          if (paymentTerm) {
            this.purchaseOrderForm
            .get("paymentTermId")
            .setValue(paymentTerm.paymentTermId);
          this.purchaseOrderForm.get("paymentTerm").setValue([
            {
              id: paymentTerm.paymentTermId,
              text: paymentTerm.paymentTermName,
            },
          ]);
          }
        }),
        map((paymentTerms: any[]) => {
          return paymentTerms.map((paymentTerm) => ({
            id: paymentTerm?.paymentTermId,
            text: `${paymentTerm?.paymentTermName} (${paymentTerm?.paymentTermDays} days)`,
          }));
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((paymentTerm) => {
        this.paymentTerms = paymentTerm;
      });
  }
  private _loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  protected sendToService$(data: any, transactionPin?): Observable<any> {
    return this.poService.createPurchaseOrder(data, transactionPin);
  }

  ngOnDestroy(): void {
    this.configService.isSidebarClosed$.next(false);
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
