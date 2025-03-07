import { Component, OnInit } from "@angular/core";
import { CustomDropDown } from "../../../../model/CustomDropdown";
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  UntypedFormArray,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { pluck, takeUntil, tap, map } from "rxjs/operators";
import { Observable, Subject, forkJoin } from "rxjs";
import { FinanceService } from "../../service/finance.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ItemService } from "src/app/service/item.service";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { BillsMgtService } from "src/app/service/bills-mgt.service";
import {
  calculateDiscount,
  calculateLines,
  customDateFormat,
  setDueDate,
  toFormData,
} from "src/app/util/finance/financeHelper";
import Swal from "sweetalert2";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { ConfigurationService } from "src/app/service/configuration.service";
import * as moment from "moment";
import { UserService } from "src/app/service/user.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { Asset } from "../../types/asset.interface";
import { nonZero } from "src/app/util/validators/validators";
import { FinanceItem, Tax } from "../../finance.types";

@Component({
  selector: "app-add-edit-bills",
  templateUrl: "./add-edit-bills.component.html",
  styleUrls: ["./add-edit-bills.component.scss"],
})
export class AddEditBillComponent implements OnInit {
  billsForm: UntypedFormGroup;
  vendors: CustomDropDown[];
  allVendors: any[] = [];
  bill!: any;
  billLines: any[] = [];
  accounts: any[] = [];
  allItems: any[] = [];
  taxesObj: any[] = [];
  selectedItemAccount: any;
  itemsDropData: any[] = [];
  unSortedAccount: any[] = [];
  itemsRate: string[] = ["Tax Exclusive", "Tax Inclusive"];
  discountTypes: string[] = ["Transaction Level", "Line Level"];

  taxInclusive: boolean = false;
  lineLevelDiscountSet: boolean = false;

  totalAmount: number = 0;
  adjustable: number = 0;
  discount: number = 0;
  subTotal: number = 0;
  selectedLineIndex: number = 0;
  unsubscriber$ = new Subject<void>();
  taxes: Tax[] = [];
  paymentTerms: any[] = [];
  loggedInUser: any;
  currentTheme: ColorThemeInterface;
  showDiscountAccount: boolean = false;
  discountAccount: any;
  selectedVendor: any;
  currentItemAssetIndex: number;
  lineIndex: number;
  allAssets: Asset[] = [];
  isGettingItemsAndTaxes = false;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  loader: boolean;
  billFiles: any[] = [];
  billViewFiles: any[] = [];
  isEditing = false;
  cloning = false;
  fileDelete: boolean;
  discountLevel: string = "TransactionLevel";
  _selectedBillId: number;
  allPaymentTerms: any[] = [];
  user;
  showHeader: boolean = false;
  ownerInformation: any;
  billForAsset = false;
  currencySymbol: string;

  constructor(
    private fb: UntypedFormBuilder,
    private coaService: ChartOfAccountService,
    private billService: BillsMgtService,
    private itemService: ItemService,
    private financeService: FinanceService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private router: Router,
    private configService: ConfigurationService,
    private route: ActivatedRoute,
    private userService: UserService,
    private modalService: NgbModal,
    private assetMgtService: AssetMgtService,
    private _itemService: ItemService
  ) {}

  ngOnInit(): void {
    this.resolveEditOrCloneMode();
    this.closeSidebar();
    this._fetchUser();
    this._getAccounts();
    this.getApplicationownerinformation();
    this._loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.getVendors();
    this.initForm();
    this._loadPaymentTerms();
    this.getCurrencySymbol();
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
      const id = this.route.snapshot.params["id"];
      this._selectedBillId = id;
      this._getBill(this._selectedBillId);
    } else {
      this.billForAsset = false;
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
      search: (keyword: string) =>
        this._itemService.getAssestAndExpenseItems({
          searchTerm: keyword,
        }, 'Bills'),
    };
  }

  updateDropdown($event: any, type: string, index?: number): void {
    if (type === "vendor" && $event.items.length > 0) {
      this.vendors = $event?.items;
    } else if (type === "paymentTerms" && $event?.data?.items?.length > 0) {
      this.paymentTerms = $event?.data?.items?.map((paymentTerm: any) => {
        return {
          id: paymentTerm.paymentTermId,
          text: paymentTerm.paymentTermName,
        };
      });
    } else if (
      type === "items" &&
      $event.data.length > 0
    ) {
      this.setItemList();
      this.itemsDropData = this.addCodeToItemName($event.data);
      this.currentItemAssetIndex = index;
    }
  }

  setBillForAsset($event): void {
    this.billForAsset = $event;
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

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  onSetInclusive(event): void {
    if (event.text === "Tax Inclusive") {
      this.taxInclusive = true;
    } else {
      this.taxInclusive = false;
    }

    this.taxInclusive
      ? this.billsForm.get("taxOption").setValue("Inclusive")
      : this.billsForm.get("taxOption").setValue("Exclusive");

    this.linesCalculation();
  }

  onSetDiscountLevel(event): void {
    event.text === "Transaction Level"
      ? (this.discountLevel = "TransactionLevel")
      : (this.discountLevel = "LineItemLevel");

    this.billsForm.get("discountLevel").setValue(this.discountLevel);
    this.linesCalculation();
  }

  setDiscountAfterTax(): void {
    const discountAfterTax = this.billsForm.get("discountAfterTax");
    discountAfterTax.setValue(!discountAfterTax.value);

    this.linesCalculation();
  }

  items(): UntypedFormArray {
    return this.billsForm?.get("lines") as UntypedFormArray;
  }

  initForm(): void {
    this.billsForm = this.fb.group({
      billDate: new UntypedFormControl(null, [Validators.required]),
      billDueDate: new UntypedFormControl(null, [Validators.required]),
      billRequestInitiatorId: new UntypedFormControl(
        this.loggedInUser?.nameid,
        [Validators.required]
      ),
      billInternalNote: new UntypedFormControl(null),
      billNotes: new UntypedFormControl(null),
      billCode: new UntypedFormControl(null),
      billReference: new UntypedFormControl(null),
      billType: new UntypedFormControl("default"),
      status: new UntypedFormControl(null),
      totalAmount: new UntypedFormControl(null),
      subTotal: new UntypedFormControl(null),
      taxTotalAmount: new UntypedFormControl(0),
      discountAmount: new UntypedFormControl(0),
      transactionLevelDiscountRate: new UntypedFormControl(null),
      discountAccountId: new UntypedFormControl(null),
      paymentTerm: new UntypedFormControl(null),
      paymentTermId: new UntypedFormControl(null, Validators.required),
      vendor: new UntypedFormControl([]),
      vendorId: new UntypedFormControl(null, Validators.required),
      billedStatus: new UntypedFormControl(null),
      taxOption: new UntypedFormControl("Exclusive"),
      discountLevel: new UntypedFormControl(this.discountLevel),
      discountAfterTax: new UntypedFormControl(false),
      adjustment: new UntypedFormControl(null),
      existingFiles: new UntypedFormControl([]),
      lines: this.fb.array([]),
    });
    this.addItem();
    this._watchFormChanges();
  }

  private setPaymentTerm(vendor) {
    if (vendor?.paymentTermId) {
      const paymentTerm = this.allPaymentTerms.find(
        (paymentTerm) => paymentTerm.paymentTermId === vendor?.paymentTermId
      );

      this.billsForm.get("paymentTerm").setValue([
        {
          id: paymentTerm?.paymentTermId,
          text: paymentTerm?.paymentTermName,
        },
      ]);

      this.billsForm.get("paymentTermId").setValue(paymentTerm?.paymentTermId);

      this._updateDueDate();
    }
  }

  private _watchFormChanges(): void {
    this.billsForm
      .get("vendor")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.billsForm.get("vendorId").setValue(res[0]?.id);

        const vendor = this.allVendors.find(
          (vendor) => vendor.vendorId === res[0]?.id
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

    this.billsForm
      .get("paymentTerm")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.billsForm.get("paymentTermId").setValue(res[0].id);
        this._updateDueDate();
      });

    this.billsForm
      .get("billDate")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe(() => {
        this._updateDueDate();
      });
  }

  addItem(): void {
    const item = this.fb.group({
      itemId: new UntypedFormControl("", Validators.required),
      assetId: new UntypedFormControl(null, Validators.required),
      item: new UntypedFormControl([]),
      itemType: new UntypedFormControl("", Validators.required),
      accountId: new UntypedFormControl("", Validators.required),
      quantity: new UntypedFormControl(1),
      tax: new UntypedFormControl([{id: null, text: 'No Tax'}]),
      taxId: new UntypedFormControl(""),
      customerId: new UntypedFormControl(""),
      unitPrice: new UntypedFormControl(0, nonZero.bind(this)),
      amount: new UntypedFormControl(0),
      originalAmount: new UntypedFormControl(0),
      discountValueOnType: new UntypedFormControl(0),
      discountType: new UntypedFormControl("Percentage"),
      description: new UntypedFormControl(null),
      taxes: new UntypedFormControl([]),
    });
    this.items().push(item);
  }

  private _updateDueDate(): void {
    if (
      this.billsForm.get("paymentTermId").value &&
      this.billsForm.get("billDate").value
    ) {
      const paymentTermDays = this.allPaymentTerms.find(
        (paymentTerm) =>
          paymentTerm.paymentTermId ===
          this.billsForm.get("paymentTermId").value
      )?.paymentTermDays;

      const dueDate = setDueDate(
        this.billsForm.get("billDate").value,
        paymentTermDays
      );

      this.billsForm
        .get("billDueDate")
        .setValue(moment(dueDate).format("YYYY-MM-DD"));
    }
  }

  selectPaymentTerm(event: any): void {
    this.billsForm.get("paymentTermId").patchValue(event?.id);
    this._updateDueDate();
  }

  selectAccount(event: any, index: number): void {
    const singleItem = this.items().at(index);
    singleItem.get("accountId").patchValue(event?.accountId);
  }

  selectTax(event: any, index: number): void {
    const singleItem = this.items().at(index);

    const selectedTax = this.taxes.find((x) => x.financeTaxId === event.id);
    singleItem.get("taxId").patchValue(selectedTax?.financeTaxId);

    this.linesCalculation()
  }

  private setItemValues(selectedItem, popupAdd?, accountId?: number) {
    const singleItem = this.items().at(this.lineIndex);

    if (this.billForAsset) {
      singleItem.get("itemType").setValue("AssetItem");
    } else {
      singleItem.get("itemType").setValue("ExpenseItem");
    }
    singleItem.get("accountId").setValue(selectedItem?.accountId);
    singleItem.value.accountName = selectedItem?.accountName;

    singleItem
      .get("itemId")
      .setValue(selectedItem?.id || selectedItem?.assetCardId);

    singleItem
      .get("assetId")
      .setValue(selectedItem?.assetCardId || selectedItem?.id);

    singleItem.get("unitPrice").setValue(selectedItem.amount);

    if (popupAdd) {
      singleItem
        .get("item")
        .setValue([{ id: selectedItem.id, text: selectedItem.text }]);

      singleItem.get("accountId").setValue(accountId);
      this.linesCalculation();
    }

    this.linesCalculation();
  }

  selectItem(event, index: number, popupAdd?: boolean): void {
    this.lineIndex = index;
    const selectedItem = this.allItems.find((item) => item.id === event[0]?.id);
    if (selectedItem) {
      this.setItemValues(selectedItem, popupAdd, event[0]?.accountId);
    } else {
      this.billForAsset
        ? this.getAsset(event[0]?.id)
        : this.getItem(event[0]?.id);
    }

    const line = this.items().at(index);
    const taxes = this.getItemTaxes();
    line.get("taxes").reset();
    line.get("taxes").setValue(taxes);

    this.items()
            .at(index)
            .get("tax")
            .setValue([{id: event[0]?.financeTaxId, text: event[0]?.financeTaxName}], { emitEvent: false });
    this.items()
            .at(index)
            .get("taxId")
            .setValue(event[0]?.financeTaxId);
    this.linesCalculation()

    this.setItemList();
  }

  getItemTaxes() {
    return this.taxes
      .filter((tax) => tax.type === 'Purchase' || tax.type === "Both")
      .map((tax) => ({ id: tax.financeTaxId, text: tax.name }));
  }

  private getAsset(id: number) {
    this.assetMgtService
      .getAssetById(id)
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe((asset) => {
        this.setItemValues(asset);
      });
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

  calculateItemAmount(): void {
    this.subTotal = 0;
    this.items().value.forEach((item) => {
      this.subTotal += item?.amount;
    });
    this.billsForm.get("subTotal").patchValue(this.subTotal);

    this.calculateTotal();
  }

  calculateTotal(): void {
    this.totalAmount = 0;
    const discountInPercentage = +this.billsForm.get(
      "transactionLevelDiscountRate"
    ).value;
    const discountAfterTax = this.billsForm.get("discountAfterTax").value;

    if (discountInPercentage) {
      this.discount = calculateDiscount(
        discountAfterTax,
        this.subTotal,
        discountInPercentage,
        this.taxesObj
      );
    } else {
      this.discount = 0;
    }

    if (this.discount > 0) {
      this.showDiscountAccount = true;
      this.discountLevel === "TransactionLevel"
        ? this.updateDiscountProps(this.discount)
        : null;
    }
    this.totalAmount = +(
      this.subTotal -
      this.discount +
      this.adjustable
    ).toFixed(2);

    if (!this.taxInclusive) {
      this.taxesObj.forEach((tax) => (this.totalAmount += tax.value));
    }

    this.billsForm.get("totalAmount").patchValue(this.totalAmount);
  }

  updateDiscountProps(rate: number): void {
    if (this.showDiscountAccount) {
      this.billsForm.get("discountAmount").setValue(rate);
    }
  }

  selectDiscountAccount(event: any): void {
    this.billsForm.get("discountAccountId").setValue(event.accountId);
  }

  public handleFileInput(filelist: FileList): void {
    this.billFiles = [];

    for (let i = 0; i < filelist.length; i++) {
      this.billFiles.push(filelist.item(i));
      this.billViewFiles = [...this.billViewFiles, filelist.item(i)];
    }
  }

  public removeFile(index: number): void {
    this.billViewFiles.splice(index, 1);
  }

  getVendors(vendor?: CustomDropDown) {
    const model = {
      pageSize: 10,
      pageNumber: 1,
    };
    this.financeService
      .getVendors(model)
      .pipe(pluck("body", "items"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const filteredVendors = res?.filter(
          (vendor) => vendor.status === true
        );
        this.allVendors = filteredVendors;

        this.vendors = this.allVendors.map(
          (item) =>
            <CustomDropDown>{
              id: item?.id,
              text: item?.fullName,
            }
        );
        if (vendor) {
          this.closeModal();
          this.billsForm.get("vendor").patchValue([vendor]);
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

        this.allItems.push(newItem);
        this.selectItem(newItem, this.lineIndex, true);
      });
  }

  linesCalculation(): void {
    const discountAfterTax = this.billsForm.get("discountAfterTax").value;
    const discountLevel = this.billsForm.get("discountLevel").value;
    const transactionLevelDiscountRate = this.billsForm.get(
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

  setItemList() {
    if (this.billForAsset) {
      this.itemsDropData = this.allItems.filter(item => item.itemType === 'AssetItem');
    } else {
      this.itemsDropData = this.allItems.filter(item => item.itemType === 'ExpenseItem');
    }
  }

  addCodeToItemName(items: FinanceItem[]) {
    if (items.length) {
      return items.map((item) => ({
        ...item,
        text: `${item.text} (${item.code})`,
      }))
    }
  }

  getItemsAndTaxes() {
    this.isGettingItemsAndTaxes = true;
    forkJoin([
      this.itemService.getAssestAndExpenseItems({ searchTerm: "" }, "Bills"),
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
            this._patchForm(this.bill);
          }
          this.isGettingItemsAndTaxes = false;
        },
        error: () => {
          this.isGettingItemsAndTaxes = false;
        },
      });
  }

  openModal(modal: any, size?: string, index?: number): void {
    if (index) {
      this.lineIndex = index;
    }
    this.modalService.open(modal, { centered: true, size });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  setItem($event: CustomDropDown & { accountId: number }) {
    this.selectItem($event, this.lineIndex, true);
    this.closeModal();
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
            this.billsForm
              .get("paymentTermId")
              .setValue(paymentTerm.paymentTermId);
            this.billsForm.get("paymentTerm").setValue([
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
      .subscribe((paymentTerms) => {
        this.paymentTerms = paymentTerms;
      });
  }

  removeItem(index: number): void {
    this.items().removeAt(index);
    this.linesCalculation();
  }

  private _loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private _getBill(billId: number): void {
    this.billService
      .getBill(billId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.bill = res.data;
        this.bill.billLines[0].itemType === "AssetItem"
          ? this.setBillForAsset(true)
          : this.setBillForAsset(false);

        this.getItemsAndTaxes();
      });
  }

  private _patchForm(bill): void {
    this.billsForm.patchValue({
      billDate: customDateFormat(bill.billDate),
      billDueDate: customDateFormat(bill.billDueDate),
      billRequestInitiatorId:
        bill.billRequestInitiatorId || this.loggedInUser?.nameid,
      billInternalNote: bill.billInternalNote,
      billNotes: bill.billNotes,
      billCode: bill.billCode,
      billReference: bill.billReference,
      billType: bill.billType,
      billStatus: bill.billStatus,
      billedStatus: null,
      totalAmount: bill.totalAmount,
      subTotal: bill.subTotal,
      taxTotalAmount: bill.taxTotalAmount,
      discountAmount: bill.discountAmount,
      transactionLevelDiscountRate: bill.transactionLevelDiscountRate,
      discountAccountId: bill.discountAccountId,
      paymentTerm: [{ id: bill.paymentTermId, text: bill.paymentTermName }],
      paymentTermId: bill.paymentTermId,
      vendor: [{ id: bill.vendorId, text: bill.vendorName }],
      vendorId: bill.vendorId,
      taxOption: bill.taxOption,
      discountLevel: bill.discountLevel,
      discountAfterTax: bill.discountAfterTax,
      adjustment: null,
    });

    this.discountLevel = bill.discountLevel;
    this.discountLevel === "LineItemLevel"
      ? (this.discountTypes = ["Line Level", "Transaction Level"])
      : (this.discountTypes = ["Transaction Level", "Line Level"]);

    this.discountAccount = {
      accountId: bill.discountAccountId,
      name: bill.discountName,
    };

    this.billLines = bill.billLines;

    if (this.billLines.length > 0) {
      this.items().removeAt(0);
      this.billLines.forEach((bill, billIndex) => {
        let item = [{text: '', id: null}]
        if (bill.assetId) {
          const foundAssetCode = this.allItems.find(item => item.id === bill.assetId).code;
          item = [
            {
              id: bill.assetId,
              text: `${bill.assetName} (${foundAssetCode})`,
            },
          ]
        } else {
          const foundItemCode = this.allItems.find(item => item.id === bill.itemId).code;
          item = [
            {
              id: bill.itemId,
              text: `${bill.itemName} (${foundItemCode})`,
            },
          ]
        }

        const billControl = this.fb.group({
          itemId: new UntypedFormControl(bill.itemId),
          assetId: new UntypedFormControl(bill.assetId),
          item: new UntypedFormControl(item),
          description: new UntypedFormControl(bill.description),
          itemType: new UntypedFormControl(bill.itemType),
          accountId: new UntypedFormControl(bill.accountId),
          quantity: new UntypedFormControl(bill.quantity),
          tax: new UntypedFormControl([{id: bill.taxId, text: bill.taxName}]),
          taxId: new UntypedFormControl(bill.taxId),
          customerId: new UntypedFormControl(""),
          unitPrice: new UntypedFormControl(bill.unitPrice),
          amount: new UntypedFormControl(bill.subTotalAmount),
          purchaseLineId: new UntypedFormControl(bill.purchaseLineId),
          discountValueOnType: bill.discountValueOnType,
          discountType: bill.discountType,
          originalAmount: bill.quantity * bill.unitPrice,
          taxes: new UntypedFormControl([]),
        });

        if (bill.taxOption === "Inclusive") {
          this.itemsRate = ["Tax Inclusive", "Tax Exclusive"];
          this.taxInclusive = true;
        } else {
          this.itemsRate = ["Tax Exclusive", "Tax Inclusive"];
          this.taxInclusive = false;
        }

        this.items().push(billControl);

        const taxes = this.getItemTaxes();
        this.items().at(billIndex).get("taxes").setValue(taxes);

        this.taxesObj.push({
          id: bill.taxId,
          name: bill.taxName,
          value: bill.taxAmount,
        });

        this.linesCalculation();
      });
    }

    this.billViewFiles = this.isEditing ? bill.files : [];
  }

  protected sendToService$(
    data: any,
    transactionPin?: string
  ): Observable<any> {
    if (this.isEditing) {
      return this.billService.updateBill(data, transactionPin);
    }
    return this.billService.createBill(data, transactionPin);
  }

  closeSidebar(): void {
    this.configService.isSidebarClosed$.next(true);
  }

  submitForm(event, billedStatus?: string): void {
    this.loader = true;

    this.billsForm.get("status").patchValue(event?.status || event);
    this.billsForm.get("billedStatus").patchValue(billedStatus);
    const data = this.billsForm.value;

    data?.lines?.forEach((line) => {
      delete line?.taxes;
    });

    data.files = this.billFiles;

    if (this.isEditing) {
      data.billId = this.bill.billId;

      this.billViewFiles?.map((file) => {
        if (file.fileId) {
          data.existingFiles.push(file.fileId);
        }
      });
    }

    let formData = toFormData(data);

    let toastTitleSegment: string;
    if (this.isEditing) {
      toastTitleSegment = 'updated'
    } else {
      toastTitleSegment = this.cloning ? 'cloned' : 'created';
    }

    this.sendToService$(formData, event?.transactionPin)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            title: `Bill ${toastTitleSegment} successfully!`,
          });
          this.loader = false;
          this.router.navigateByUrl("/finance/bills/all");
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  ngOnDestroy(): void {
    this.configService.isSidebarClosed$.next(false);

    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
