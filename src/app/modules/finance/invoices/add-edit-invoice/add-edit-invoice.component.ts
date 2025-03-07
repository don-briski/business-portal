import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject, forkJoin } from "rxjs";
import { map, pluck, takeUntil, tap } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ItemService } from "src/app/service/item.service";
import { UserService } from "src/app/service/user.service";
import {
  calculateLines,
  customDateFormat,
  setDueDate,
  toFormData,
} from "src/app/util/finance/financeHelper";
import { FinanceService } from "../../service/finance.service";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import * as moment from "moment";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { nonZero } from "src/app/util/validators/validators";
import { Customer } from "src/app/model/Customer.dto";
import { FinanceItem, Tax } from "../../finance.types";
import { User } from "src/app/modules/shared/shared.types";

@Component({
  selector: "app-add-edit-invoice",
  templateUrl: "./add-edit-invoice.component.html",
  styleUrls: ["./add-edit-invoice.component.scss"],
})
export class AddEditInvoiceComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  invoiceForm: UntypedFormGroup;
  isEditing: boolean = false;
  cloning = false;
  isLoading: boolean = false;
  fileDelete: boolean = false;
  currentTheme: ColorThemeInterface;
  user: User;
  customers: CustomDropDown[] = [];
  salesPersons: any[] = [];
  allPaymentTerms: any[] = [];
  paymentTerms: any[] = [];
  items: FinanceItem[] = [];
  allItems: any[] = [];
  accounts: any[] = [];
  taxes: Tax[] = [];
  taxesObj: any[] = [];
  invoiceFiles: any[] = [];
  invoiceFilesView: any[] = [];
  taxOptions: string[] = ["Tax Exclusive", "Tax Inclusive"];
  discountTypes: string[] = ["Transaction Level", "Line Level"];
  subTotal: number = 0;
  totalAmount: number = 0;
  discount: number = 0;
  showDiscountAcc: boolean = false;
  private selectedInvId: number;
  selectedInvoice: any = null;
  isGettingItemsAndTaxes = false;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  ownerInformation: any;
  invoiceForAsset: boolean | null = null;
  currentItemAssetIndex: number;
  lineIndex: number;
  selectedItemAccount: any;
  currencySymbol: string;

  constructor(
    private _fb: UntypedFormBuilder,
    private _colorThemeService: ColorThemeService,
    private _configService: ConfigurationService,
    private _financeService: FinanceService,
    private _itemService: ItemService,
    private _coaService: ChartOfAccountService,
    private _userService: UserService,
    private _authService: AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private assetMgtService: AssetMgtService
  ) {}

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.resolveEditOrCloneMode();
    this._fetchUser();
    this._loadTheme();
    this.closeSidebar();
    this._getCustomers();
    this._getSalesPersons();
    this._getPaymentTerms();
    this._getAccounts();
    this.getApplicationownerinformation();
    this._initForm();
    this._watchFormChanges();
  }

  getCurrencySymbol() {
    this.currencySymbol = this._configService.currencySymbol;
    if (!this.currencySymbol) {
      this._configService
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
      this.selectedInvId = id;
      this.getInvoice(this.selectedInvId);
    } else {
      this.invoiceForAsset = false;
      this.getItemsAndTaxes();
    }
  }

  private _watchFormChanges(): void {
    this.invoiceForm
      .get("customer")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((customer) => {
        this.invoiceForm.get("customerId").setValue(customer[0]?.id);
        this.invoiceForm.get("branchId").setValue(this.user?.branchId);
      });

    this.invoiceForm
      .get("salesPerson")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((salesPerson) => {
        if (salesPerson) {
          this.invoiceForm.get("salesPersonId").setValue(salesPerson[0]?.id);
        }
      });

    this.invoiceForm
      .get("invoiceDate")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (this.invoiceForm.get("paymentTermId").value) {
          this.updateDueDate(this.invoiceForm.get("paymentTermId").value);
        }
      });

    this.invoiceForm
      .get("paymentTerm")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((paymentTerm) => {
        this.invoiceForm.get("paymentTermId").setValue(paymentTerm[0]?.id);

        if (this.invoiceForm.get("invoiceDate").value) {
          this.updateDueDate(paymentTerm[0]?.id);
        }
      });

    this.invoiceForm
      .get("transactionLevelDiscountRate")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((transactionLevelDiscountRate) => {
        if (transactionLevelDiscountRate) {
          this.invoiceForm
            .get("discountAccountId")
            .setValidators(Validators.required);
          this.invoiceForm.get("discountAccountId").updateValueAndValidity();
        } else {
          this.invoiceForm.get("discountAccountId").clearValidators();
          this.invoiceForm.get("discountAccountId").updateValueAndValidity();
        }
      });

    //watch lines
    this.invoiceForm
      .get("lines")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: any[]) => {
        res.forEach((line: any, index: number) => {
          let item;
          if (!this.invoiceForAsset) {
            item = this.allItems.find((item) => item?.id === line?.item[0]?.id);
          } else {
            item = this.allItems.find((item) => item?.id === line?.item[0]?.id);
          }

          if (!item) {
            this.invoiceForAsset
              ? this.getAsset(line.item[0]?.id, index)
              : this.getItem(line.item[0]?.id, index);
          }

          this.invoiceLines()
            .at(index)
            .get("itemId")
            .setValue(item?.id || item?.assetCardId, { emitEvent: false });

          this.invoiceLines()
            .at(index)
            .get("assetId")
            .setValue(item?.id || item?.assetCardId, { emitEvent: false });

          const itemType = this.invoiceForAsset ? "AssetItem" : "ExpenseItem";
          this.invoiceLines()
            .at(index)
            .get("itemType")
            .setValue(itemType, { emitEvent: false });

          this.invoiceLines()
            .at(index)
            .get("accountId")
            .setValue(item?.accountId, { emitEvent: false });
          this.invoiceLines()
            .at(index)
            .get("accountName")
            .setValue(item?.accountName, { emitEvent: false });

          const tax = this.taxes.find(
            (tax) => tax?.financeTaxId === line?.tax[0]?.id
          );

          this.invoiceLines()
            .at(index)
            .get("taxId")
            .setValue(tax?.financeTaxId, { emitEvent: false });

          const amount =
            this.invoiceLines().at(index).get("unitPrice").value *
            this.invoiceLines().at(index).get("quantity").value;

          this.invoiceLines()
            .at(index)
            .get("amount")
            .setValue(amount, { emitEvent: false });
        });
        const withDiscountValueOnType = res.filter(
          (control) => control.discountValueOnType > 0
        );

        withDiscountValueOnType.length > 0
          ? (this.showDiscountAcc = true)
          : (this.showDiscountAcc = false);

        this.performCalculations();
      });
  }

  setUnitPrice(index: number) {
    const item = this.invoiceLines().at(index).get("item").value[0];
    const unitPrice = item ? item?.amount : 0;
    this.invoiceLines().at(index).get("unitPrice").setValue(unitPrice);
  }

  setInvoiceForAsset($event): void {
    this.invoiceForAsset = $event;
    this.setItemList();

    (<UntypedFormArray>this.invoiceForm.get("lines")).controls.forEach(
      (control) => {
        control.get("item").reset([], { emitEvent: false });
        control.get("itemId").reset(null, { emitEvent: false });
      }
    );
  }

  setItem($event: CustomDropDown & { accountId: number }) {
    const newItem = {
      itemId: $event.id,
      salesAccountId: $event.accountId,
      sellingPrice: 0,
    };
    this.allItems.push(newItem);
    this.invoiceLines()
      .at(this.currentItemAssetIndex)
      .get("item")
      .setValue([{ id: $event.id, text: $event.text }]);

    this.invoiceLines()
      .at(this.currentItemAssetIndex)
      .get("accountId")
      .setValue(newItem.salesAccountId);

    this.closeModal();
  }

  onSelectItem(item: FinanceItem[], index: number): void {
    this.lineIndex = index;

    const line = this.invoiceLines().at(index);
    const taxes = this.getItemTaxes();
    line.get("taxes").reset();
    line.get("taxes").setValue(taxes);

    this.invoiceLines()
      .at(index)
      .get("tax")
      .setValue(
        [{ id: item[0]?.financeTaxId, text: item[0]?.financeTaxName }],
        { emitEvent: false }
      );

    this.setUnitPrice(index);
    this.setItemList();
  }

  setItemList() {
    if (this.invoiceForAsset) {
      this.items = this.allItems.filter(
        (item) => item.itemType === "AssetItem"
      );
    } else {
      this.items = this.allItems.filter(
        (item) => item.itemType === "ExpenseItem"
      );
    }
  }

  getItemTaxes() {
    return this.taxes
      .filter((tax) => tax.type === "Sales" || tax.type === "Both")
      .map((tax) => ({ id: tax.financeTaxId, text: tax.name }));
  }

  getSearchCustomerService(): Select2SearchApi {
    return {
      search: (keyword: string) => {
        const model = {
          filter: "CustomersOnly",
          pageNumber: "1",
          pageSize: "10",
          keyword,
        };
        return this._financeService.getCustomersOrVendorsSummary(model);
      },
    };
  }

  getSearchSalePersonService(): Select2SearchApi {
    return {
      search: (keyword: string) =>
        this._financeService.getSalespersonsLimitedView({
          searchTerm: keyword,
        }),
    };
  }

  getPaymentTermsService(): Select2SearchApi {
    return {
      search: (paymentModeName: string) =>
        this._financeService.spoolAllPaymentTerms({
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
        }),
    };
  }

  updateDropdown($event: any, type: string): void {
    if (type === "customer" && $event?.items.length > 0) {
      this.customers = $event.items;
    } else if (type === "salesPerson" && $event?.length > 0) {
      this.salesPersons = $event;
    } else if (type === "paymentTerms" && $event?.data.items.length > 0) {
      this.paymentTerms = $event?.data.items.map((paymentTerm: any) => {
        return {
          id: paymentTerm.paymentTermId,
          text: paymentTerm.paymentTermName,
        };
      });
    } else if (type === "items" && $event?.data) {
      if (this.invoiceForAsset) {
        this.items = $event?.data?.filter(
          (item) => item.itemType === "AssetItem"
        );
      } else {
        this.items = $event?.data?.filter(
          (item) => item.itemType === "ExpenseItem"
        );
      }
    }
  }

  private getInvoice(invoiceId: number): void {
    this.isLoading = true;
    this._financeService
      .getInvoice(invoiceId)
      .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.selectedInvoice = res;
        this.selectedInvoice.lines[0].itemType === "AssetItem"
          ? this.setInvoiceForAsset(true)
          : this.setInvoiceForAsset(false);
        this.isLoading = false;

        this.getItemsAndTaxes();
      });
  }

  private _loadTheme(): void {
    this._colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private _initForm(): void {
    this.invoiceForm = this._fb.group({
      branchId: new UntypedFormControl(null, Validators.required),
      customer: new UntypedFormControl([], Validators.required),
      customerId: new UntypedFormControl(null, Validators.required),
      invoiceDate: new UntypedFormControl(null, Validators.required),
      invoiceDueDate: new UntypedFormControl(null, Validators.required),
      subject: new UntypedFormControl(null),
      customerNotes: new UntypedFormControl(null),
      invoiceReference: new UntypedFormControl(null),
      status: new UntypedFormControl(null),
      transactionLevelDiscount: new UntypedFormControl(null),
      paymentTerm: new UntypedFormControl(null, Validators.required),
      paymentTermId: new UntypedFormControl(null, Validators.required),
      salesPerson: new UntypedFormControl(null),
      salesPersonId: new UntypedFormControl(null),
      discountAccountId: new UntypedFormControl(null),
      discountAfterTax: new UntypedFormControl(false),
      discountLevel: new UntypedFormControl("TransactionLevel"),
      taxOption: new UntypedFormControl("Exclusive"),
      transactionLevelDiscountRate: new UntypedFormControl(null),
      existingFiles: new UntypedFormControl([]),
      lines: this._fb.array([]),
    });

    if (!this.isEditing && !this.cloning) {
      this.addInvoice();
    }
  }

  getApplicationownerinformation() {
    this._configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  private _patchForm(invoice: any): void {
    this.invoiceForm.patchValue({
      branchId: invoice?.branchId,
      customer: [
        {
          id: invoice?.customerId,
          text: invoice?.customer,
        },
      ],
      customerId: invoice?.customerId,
      invoiceDate: customDateFormat(invoice?.invoiceDate),
      invoiceDueDate: customDateFormat(invoice?.invoiceDueDate),
      subject: invoice?.subject,
      customerNotes: invoice?.customerNotes,
      invoiceReference: invoice?.invoiceReference,
      status: invoice?.status,
      transactionLevelDiscount: invoice?.transactionLevelDiscount,
      paymentTerm: [
        {
          id: invoice?.paymentTerm.paymentTermId,
          text: invoice?.paymentTerm.paymentTermName,
        },
      ],
      paymentTermId: invoice?.paymentTermId,
      salesPerson: invoice?.salesPerson && [
        {
          id: invoice?.salesPerson?.userId,
          text: invoice?.salesPerson?.displayName,
        },
      ],
      salesPersonId: invoice?.salesPersonId,
      discountAccountId: invoice?.discountAccountId,
      discountAfterTax: invoice?.discountAfterTax,
      discountLevel: invoice?.discountLevel,
      taxOption: invoice?.taxOption,
      transactionLevelDiscountRate: invoice?.transactionLevelDiscountRate,
    });

    this.invoiceForm.addControl(
      "invoiceId",
      new UntypedFormControl(invoice?.invoiceId, Validators.required)
    );
    this.invoiceFilesView = this.isEditing ? [...invoice?.files] : [];

    invoice?.lines[0].itemType === "AssetItem"
      ? (this.invoiceForAsset = true)
      : (this.invoiceForAsset = false);

    invoice?.lines.forEach((invoice, invoiceIndex: number) => {
      this.addInvoice(invoice);

      const taxes = this.getItemTaxes();
      this.invoiceLines().at(invoiceIndex).get("taxes").setValue(taxes);
    });
  }

  private _fetchUser(): void {
    this._userService
      .getUserInfo(this._authService.decodeToken().nameid)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res;
      });
  }

  setTaxOption(taxOption: any): void {
    taxOption.text === "Tax Inclusive"
      ? this.invoiceForm.get("taxOption").setValue("Inclusive")
      : this.invoiceForm.get("taxOption").setValue("Exclusive");

    this.performCalculations();
  }

  setDiscountLevel(discountLevel: any): void {
    discountLevel.text === "Transaction Level"
      ? this.invoiceForm.get("discountLevel").setValue("TransactionLevel")
      : this.invoiceForm.get("discountLevel").setValue("LineItemLevel");

    this.performCalculations();
  }

  selectAccount(event: any): void {
    this.invoiceForm.get("discountAccountId").setValue(event.accountId);
  }

  selectItemAccount(event: any, index: number): void {
    const singleItem = this.invoiceLines().at(index);
    singleItem.get("accountId").setValue(event?.accountId);
  }

  setDiscountOrder(): void {
    this.invoiceForm
      .get("discountAfterTax")
      .setValue(!this.invoiceForm.get("discountAfterTax").value);

    this.performCalculations();
  }

  updateDueDate(paymentTermId): void {
    const paymentTermDays = this.allPaymentTerms.find(
      (x) => x.paymentTermId === paymentTermId
    )?.paymentTermDays;

    const dueDate = setDueDate(
      this.invoiceForm.get("invoiceDate").value,
      paymentTermDays
    );

    this.invoiceForm
      .get("invoiceDueDate")
      .setValue(moment(dueDate).format("YYYY-MM-DD"));
  }

  performCalculations() {
    let taxInclusive: boolean =
      this.invoiceForm.get("taxOption").value === "Inclusive";

    this.subTotal = 0;
    this.totalAmount = 0;
    this.taxesObj = [];
    this.discount = 0;

    calculateLines(
      this.invoiceLines().value,
      this.taxes,
      this.taxesObj,
      this.invoiceForm.get("discountAfterTax").value,
      taxInclusive,
      this.invoiceForm.get("discountLevel").value,
      this.invoiceForm.get("transactionLevelDiscountRate").value
    );

    this.invoiceLines().value.forEach((item) => {
      if (item.assetId) {
        this.subTotal = this.subTotal + item.subTotalAmount;
        this.totalAmount += item.totalAmount;
        this.discount += item.discountAmount;
      }
    });
  }

  private _getCustomers(): void {
    const model = {
      filter: "CustomersOnly",
      pageNumber: "1",
      pageSize: "10",
    };
    this._financeService
      .getCustomersOrVendorsSummary(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => (this.customers = res?.body?.items));
  }

  private _getSalesPersons() {
    this._financeService
      .getSalespersonsLimitedView({ searchTerm: "" })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.salesPersons = res.body;
      });
  }

  private _getPaymentTerms() {
    this._financeService
      .spoolAllPaymentTerms({ pageNum: 1, pageSize: 10, isActive: true })
      .pipe(
        pluck("body", "data", "items"),
        tap((paymentTerms: any[]) => {
          const paymentTerm = paymentTerms.find(
            (paymentTerm) => paymentTerm.isDefault
          );
          if (paymentTerm) {
            this.invoiceForm
              .get("paymentTermId")
              .setValue(paymentTerm?.paymentTermId);
            this.invoiceForm.get("paymentTerm").setValue([
              {
                id: paymentTerm?.paymentTermId,
                text: paymentTerm?.paymentTermName,
              },
            ]);
          }
        }),
        map((res: any) => {
          this.allPaymentTerms = res;
          return this.allPaymentTerms.map((paymentTerm) => ({
            id: paymentTerm.paymentTermId,
            text: paymentTerm.paymentTermName,
          }));
        }),

        takeUntil(this.unsubscriber$)
      )
      .subscribe((res) => {
        this.paymentTerms = res;
      });
  }

  private getItem(id: number, currentIndex?: number) {
    if (id) {
      this._itemService
        .getItemById(id)
        .pipe(pluck("body"), takeUntil(this.unsubscriber$))
        .subscribe((item) => {
          this.allItems = [
            { id: item.itemId, text: item.itemName },
            ...this.allItems,
          ];

          this.invoiceLines()
            .at(currentIndex)
            .get("item")
            .setValue([{ id: item.itemId, text: item.itemName }]);
        });
    }
  }

  private getAsset(id: number, index: number) {
    if (id) {
      this.assetMgtService
        .getAssetById(id)
        .pipe(pluck("body", "data"), takeUntil(this.unsubscriber$))
        .subscribe((asset) => {
          const newAsset = {
            id: asset?.assetCardId,
            text: asset?.assetName,
            code: asset?.assetCode,
            amount: asset?.purchasePrice,
            accountId: asset?.assetSubClassId,
            accountName: asset?.assetSubClassAccount,
          };
          this.allItems = [...this.allItems, newAsset];

          this.invoiceLines()
            .at(index)
            .get("item")
            .setValue([{ id: asset.assetCardId, text: asset.assetName }]);
        });
    }
  }

  getItemsAndTaxes() {
    this.isGettingItemsAndTaxes = true;
    forkJoin([
      this._itemService.getAssestAndExpenseItems({ searchTerm: "" }),
      this._financeService.getTaxes({
        pageNumber: 1,
        pageSize: 100,
        isActive: true,
      }),
    ])
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.allItems = res[0].body?.data;
          this.setItemList();

          this.taxes = res[1].body?.items;

          if (this.isEditing || this.cloning) {
            this._patchForm(this.selectedInvoice);
          }
          this.isGettingItemsAndTaxes = false;
        },
        error: () => {
          this.isGettingItemsAndTaxes = false;
        },
      });
  }

  private _getAccounts(): void {
    this._coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((accounts) => {
        this.accounts = accounts;
      });
  }

  invoiceLines(): UntypedFormArray {
    return this.invoiceForm.get("lines") as UntypedFormArray;
  }

  onRemoveLine(index: number) {
    this.invoiceLines().removeAt(index);
  }

  addInvoice(data?: any): void {
    const invoice = this._fb.group({
      item: new UntypedFormControl(
        !data ? [] : [{ id: data.itemId, text: data.itemName }]
      ),
      itemId: new UntypedFormControl(
        !data ? null : data.itemId,
        Validators.required
      ),
      invoiceLineId: new UntypedFormControl(!data ? null : data.invoiceLineId),
      assetId: new UntypedFormControl(
        !data ? null : data.assetCardId,
        Validators.required
      ),
      itemType: new UntypedFormControl(
        !data ? null : data.itemType,
        Validators.required
      ),
      accountId: new UntypedFormControl(
        !data ? null : data.accountId,
        Validators.required
      ),
      accountName: new UntypedFormControl(!data ? null : data.accountName),
      quantity: new UntypedFormControl(
        !data ? 1 : data.quantity,
        Validators.required
      ),
      unitPrice: new UntypedFormControl(
        !data ? 0 : data.unitPrice,
        nonZero.bind(this)
      ),
      amount: new UntypedFormControl(
        !data ? 0 : data.unitPrice * data.quantity
      ),
      tax: new UntypedFormControl(
        !data
          ? [{ id: null, text: "No Tax" }]
          : data.tax
          ? [{ id: data?.tax?.financeTaxId, text: data?.tax?.name }]
          : [{ id: null, text: "No Tax" }]
      ),
      taxId: new UntypedFormControl(!data ? null : data?.taxId),
      discountValueOnType: new UntypedFormControl(
        !data ? null : data?.discountValueOnType
      ),
      discountType: new UntypedFormControl(
        !data ? "Percentage" : data.discountType
      ),
      selectedAcc: new UntypedFormControl(data?.accountId || null),
      selectedUnitPrice: new UntypedFormControl(null),
      taxes: new UntypedFormControl([]),
    });

    this.invoiceLines().push(invoice);
  }

  closeSidebar(): void {
    this._configService.isSidebarClosed$.next(true);
  }

  handleFileInput(filelist: FileList): void {
    this.invoiceFiles = [];

    for (let i = 0; i < filelist.length; i++) {
      this.invoiceFiles.push(filelist.item(i));
      this.invoiceFilesView = [...this.invoiceFilesView, filelist.item(i)];
    }
  }

  removeFile(index: number): void {
    this.invoiceFilesView.splice(index, 1);
  }

  private _processForm(): any {
    this.invoiceForm.value?.lines?.forEach((line) => {
      delete line?.taxes;
    });

    const { customer, paymentTerm, salesPerson, ...rest } =
      this.invoiceForm.value;

    const newLines = rest.lines.map(({ item, tax, amount, ...obj }) => obj);
    return { ...rest, lines: newLines };
  }

  openModal(modal: any, id?: number): void {
    this.currentItemAssetIndex = id;

    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  submit(status): void {
    this.isLoading = true;
    this.invoiceForm.get("status").setValue(status.status || status);

    const payload = this._processForm();
    payload.files = this.invoiceFiles;

    if (this.isEditing) {
      this.invoiceFilesView.map((file) => {
        if (file.fileId) {
          payload.existingFiles.push(file.fileId);
        }
      });
    }

    if (this.cloning) {
      delete payload['invoiceId'];
      payload.lines.forEach(item => {
        delete item.invoiceLineId;
      })
    }

    const formData = toFormData(payload);
    if (!this.isEditing) {
      this._financeService
        .createInvoice(formData, status?.transactionPin)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          () => {
            this.toast.fire({
              type: "success",
              title: `Invoice ${
                this.cloning ? "cloned" : "created"
              } successfully!`,
            });
            this.isLoading = false;
            this._router.navigate(["finance/invoices"]);
          },
          () => (this.isLoading = false)
        );
    } else {
      this._financeService
        .updateInvoice(formData)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          () => {
            this.toast.fire({
              type: "success",
              title: "Invoice updated successfully!",
            });
            this.isLoading = false;
            this._router.navigate(["finance/invoices"]);
          },
          () => (this.isLoading = false)
        );
    }
  }

  customerAdded(customer: Customer) {
    this.customers.unshift({ id: customer?.id, text: customer?.fullName });
    this.invoiceForm
      .get("customer")
      .setValue([{ id: customer?.id, text: customer?.fullName }]);
    this.closeModal();
  }

  ngOnDestroy(): void {
    this._configService.isSidebarClosed$.next(false);

    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
