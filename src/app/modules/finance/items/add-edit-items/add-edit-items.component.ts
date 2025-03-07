import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import * as _ from "lodash";
import { AuthService } from "src/app/service/auth.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ItemService } from "src/app/service/item.service";
import { UnitService } from "src/app/service/unit.service";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import Swal from "sweetalert2";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { FinanceItemType } from "../../models/item.model";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ConfigurationService } from "src/app/service/configuration.service";
import { FinanceService } from "../../service/finance.service";
import { Tax } from "../../finance.types";

@Component({
  selector: "app-add-edit-items",
  templateUrl: "./add-edit-items.component.html",
  styleUrls: ["./add-edit-items.component.scss"],
})
export class AddEditItemsComponent implements OnInit {
  @Input() emitNewItem = false;
  @Input() accountType: string;
  @Output() itemAssetAdded = new EventEmitter<
    CustomDropDown & { accountId: number }
  >();

  public isEditing: boolean;
  public itemForm: UntypedFormGroup;

  public item: any;
  public files: any[] = [];
  itemViewFiles: any[] = [];

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  units: CustomDropDown[] = [];
  accounts: any[] = [];
  taxes: Tax[] = [];

  selectedUnit: CustomDropDown[] = [{ id: null, text: null }];

  selectedSalesAccount: CustomDropDown[] = [{ id: null, text: null }];
  selectedSalesTax: CustomDropDown[] = [{ id: null, text: null }];

  selectedPurchasesAccount: CustomDropDown[] = [{ id: null, text: null }];
  selectedPurchasesTax: CustomDropDown[] = [{ id: null, text: null }];

  public loggedInUser: any;
  public loader: boolean = false;
  public selectedItemToEditId: number;
  private unsubscriber$ = new Subject<void>();
  public currentTheme: ColorThemeInterface;

  ItemType_Goods = FinanceItemType.Goods;
  ItemType_Service = FinanceItemType.Service;
  ownerInformation: any;
  billItemName: string;
  constructor(
    private authService: AuthService,
    private accountService: ChartOfAccountService,
    private itemService: ItemService,
    private unitService: UnitService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private route: ActivatedRoute,
    private configService: ConfigurationService,
    private financeService: FinanceService,
  ) {
    this.route.url.pipe(takeUntil(this.unsubscriber$)).subscribe((res: any) => {
      if (res[1].path === "edit") {
        this.isEditing = true;
      } else {
        this.isEditing = false;
      }
    });

    this.route.paramMap
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((params: ParamMap) => {
        this.selectedItemToEditId = +params.get("id");
      });
  }

  ngOnInit(): void {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }

    this.getApplicationownerinformation();

    this.formInit();
    this.loadUnits();
    this.loadAccounts();
    this.loadTaxes();

    if (this.isEditing) {
      this.getItem(this.selectedItemToEditId);
    }
  }

  get salesTaxes(): CustomDropDown[] {
    return this.taxes
    .filter(tax => tax.type === 'Sales' || tax.type === 'Both')
    .map(tax => ({id: tax.financeTaxId, text: tax.name}));
  }

  get purchaseTaxes(): CustomDropDown[] {
    return this.taxes
    .filter(tax => tax.type === 'Purchase' || tax.type === 'Both')
    .map(tax => ({id: tax.financeTaxId, text: tax.name}));
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  private formInit(): void {
    this.itemForm = this.fb.group({
      itemName: new UntypedFormControl("", [Validators.required]),
      sku: new UntypedFormControl(""),
      itemType: new UntypedFormControl(this.ItemType_Goods),
      unit: new UntypedFormControl(null),
      unitId: new UntypedFormControl(null),
      stockOnHand: new UntypedFormControl(0),

      hasSalesInformation: new UntypedFormControl(false),
      sellingPrice: new UntypedFormControl(0),
      salesAccountId: new UntypedFormControl(null),
      salesTax: new UntypedFormControl(null),
      salesTaxId: new UntypedFormControl(null),
      salesDescription: new UntypedFormControl(""),

      hasPurchaseInformation: new UntypedFormControl(false),
      costPrice: new UntypedFormControl(0),
      purchaseAccountId: new UntypedFormControl(null),
      purchaseTax: new UntypedFormControl(null),
      purchaseTaxId: new UntypedFormControl(null),
      purchaseDescription: new UntypedFormControl(""),
    });

    this._watchFormChanges();
  }
  private _watchFormChanges(): void {
    this.itemForm
      .get("itemName")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (this.accountType === "SalesAccount" && res.length === 1) {
          this.itemForm.get("hasSalesInformation").setValue(true);
          this.itemForm.get("hasPurchaseInformation").setValue(false);
        }
        if (this.accountType === "PurchaseAccount" && res.length === 1) {
          this.itemForm.get("hasPurchaseInformation").setValue(true);
          this.itemForm.get("hasSalesInformation").setValue(false);
        }
      });

    this.itemForm
      .get("unit")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.itemForm.get("unitId").setValue(res[0]?.id);
      });

    this.itemForm
      .get("salesTax")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.itemForm.get("salesTaxId").setValue(res[0]?.id);
      });

    this.itemForm
      .get("purchaseTax")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.itemForm.get("purchaseTaxId").setValue(res[0]?.id);
      });

    this.itemForm
      .get("hasSalesInformation")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res === true) {
          this.itemForm
            .get("sellingPrice")
            .setValidators([Validators.required]);
          this.itemForm
            .get("salesAccountId")
            .setValidators([Validators.required]);

          this.itemForm.get("sellingPrice").updateValueAndValidity();
          this.itemForm.get("salesAccountId").updateValueAndValidity();
        } else {
          this.itemForm.get("sellingPrice").clearValidators();
          this.itemForm.get("salesAccountId").clearValidators();

          this.itemForm.get("sellingPrice").updateValueAndValidity();
          this.itemForm.get("salesAccountId").updateValueAndValidity();
        }
        this.itemForm.updateValueAndValidity();
      });

    this.itemForm
      .get("hasPurchaseInformation")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res === true) {
          this.itemForm.get("costPrice").setValidators([Validators.required]);
          this.itemForm
            .get("purchaseAccountId")
            .setValidators([Validators.required]);

          this.itemForm.get("costPrice").updateValueAndValidity();
          this.itemForm.get("purchaseAccountId").updateValueAndValidity();
        } else {
          this.itemForm.get("costPrice").clearValidators();
          this.itemForm.get("purchaseAccountId").clearValidators();

          this.itemForm.get("costPrice").updateValueAndValidity();
          this.itemForm.get("purchaseAccountId").updateValueAndValidity();
        }
        this.itemForm.updateValueAndValidity();
      });
  }

  private loadUnits(): void {
    this.unitService
      .getUnitsLimitedView()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.units = res.body;
      });
  }

  private loadAccounts(): void {
    this.accountService
      .getAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.accounts = res;
      });
  }

  private loadTaxes(): void {
    this.financeService
      .getTaxes({pageNumber: 1, pageSize: 1000, isActive: true})
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.taxes = res.body.items;
      });
  }

  public submitForm(): void {
    this.loader = true;
    const data = this.itemForm.value;

    data.files = this.files;

    if (!data.hasPurchaseInformation && !data.hasSalesInformation) {
      Swal.fire({
        type: "warning",
        text: "This item would not be available across the system if no sales or purchase account is selected",
        title: "No Sales or Purchase Account!",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Cancel",
      }).then((result) => {
        this.loader = false;
        if (result.value) {
          if (!this.isEditing) {
            this.addItem(data);
          } else {
            this.editItem(data);
          }
        }
      });
    } else {
      if (!this.isEditing) {
        this.addItem(data);
      } else {
        this.editItem(data);
      }
    }
  }

  addBillItem(): void {
    this.addItem(this.itemForm.value);
  }

  private addItem(data: any): void {
    this.loader = true;

    this.itemService
      .createItem(data)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          if (this.emitNewItem) {
            this.itemAssetAdded.emit({
              id: res.data,
              text: data.itemName,
              accountId: data?.purchaseAccountId || data?.salesAccountId,
            });
          } else {
            this.toast.fire({
              type: "success",
              text: "Item added",
            });
            this.loader = false;
            this.router.navigateByUrl("finance/items");
            this.itemForm.reset();
            this.formInit();
          }
        },
        (err) => {
          this.loader = false;
        }
      );
  }
  private editItem(data: any): void {
    this.itemService
      .updateItem(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            text: "Item has been successfully updated.",
          });
          this.loader = false;
          this.router.navigateByUrl("finance/items");
          this.itemForm.reset();
          this.formInit();
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  private getItem(id: any): void {
    this.itemService
      .getItemById(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.item = res.body;
        this.itemViewFiles = this.item.files;
        this.patchForm();
      });
  }

  private patchForm(): void {
    this.itemForm.addControl(
      "itemId",
      new UntypedFormControl(this.selectedItemToEditId, [Validators.required])
    );

    this.itemForm.get("itemName").patchValue(this.item.itemName);
    this.itemForm.get("sku").patchValue(this.item.sku);
    this.itemForm.get("itemType").patchValue(this.item.itemType);
    if (this.item.unitId) {
      this.itemForm
        .get("unit")
        .patchValue([{ id: this.item.unitId, text: this.item.unitSymbol }]);
    }
    this.itemForm.get("unitId").patchValue(this.item.unitId);
    this.itemForm.get("stockOnHand").patchValue(this.item.stockOnHand);

    this.itemForm
      .get("hasSalesInformation")
      .patchValue(this.item.hasSalesInformation);
    this.itemForm.get("costPrice").patchValue(this.item.costPrice);
    this.itemForm.get("salesAccountId").patchValue(this.item.salesAccountId);
    if (this.item.salesTax) {
      this.itemForm.get("salesTax").patchValue([
        {
          id: this.item.salesTax.financeTaxId,
          text: this.item.salesTax.name,
        },
      ]);
      this.itemForm.get("salesTaxId").patchValue(this.item.salesTaxId);
    }
    this.itemForm
      .get("salesDescription")
      .patchValue(this.item.salesDescription);

    this.itemForm
      .get("hasPurchaseInformation")
      .patchValue(this.item.hasPurchaseInformation);
    this.itemForm.get("sellingPrice").patchValue(this.item.sellingPrice);
    this.itemForm
      .get("purchaseAccountId")
      .patchValue(this.item.purchaseAccountId);
    if (this.item.purchaseTax) {
      this.itemForm.get("purchaseTax").patchValue([
        {
          id: this.item.purchaseTax.financeTaxId,
          text: this.item.purchaseTax.name,
        },
      ]);
      this.itemForm.get("purchaseTaxId").patchValue(this.item.purchaseTaxId);
    }
    this.itemForm
      .get("purchaseDescription")
      .patchValue(this.item.purchaseDescription);

    this.itemForm.updateValueAndValidity();
  }

  selected(type, value): void {
    if (type === "SalesTax") {
      this.itemForm.get("salesTaxId").patchValue(value["id"]);
      this.itemForm.get("salesTaxId").updateValueAndValidity();
    } else if (type === "SalesAccount") {
      this.itemForm.get("salesAccountId").patchValue(value["accountId"]);
      this.itemForm.get("salesAccountId").updateValueAndValidity();
    } else if (type === "PurchaseTax") {
      this.itemForm.get("purchaseTaxId").patchValue(value["id"]);
      this.itemForm.get("purchaseTaxId").updateValueAndValidity();
    } else if (type === "PurchaseAccount") {
      this.itemForm.get("purchaseAccountId").patchValue(value["accountId"]);
      this.itemForm.get("purchaseAccountId").updateValueAndValidity();
    }
  }

  handleFileInput(filelist: FileList) {
    this.clearFileHandler();
    for (let i = 0; i < filelist.length; i++) {
      this.files.push(filelist.item(i));
      this.itemViewFiles = [...this.itemViewFiles, filelist.item(i)];
    }
  }

  removeFile(index: number): void {
    this.itemViewFiles.splice(index, 1);
  }

  clearFileHandler() {
    this.files = [];
    this.itemViewFiles = [];
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
