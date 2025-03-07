import { Component, Input, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { CustomDropDown } from "../../../../model/CustomDropdown";
import {
  UntypedFormGroup,
  UntypedFormArray,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { map, takeUntil } from "rxjs/operators";
import { Observable, Subject, forkJoin } from "rxjs";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";

import { FinanceService } from "../../service/finance.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ItemService } from "src/app/service/item.service";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import {
  customDateFormat,
  calculateLines,
} from "src/app/util/finance/financeHelper";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import {
  CreateVCNoteResBody,
  VCNDetails,
  VCNLine,
} from "src/app/modules/finance/types/vendor-credit-note";
import { VendorCreditNoteService } from "../vendor-credits.service";
import { HttpResponse } from "@angular/common/http";
import { UploadedFile } from "../../credit-notes/types";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { FinanceItem, Tax } from "../../finance.types";
import { User } from "src/app/modules/shared/shared.types";

@Component({
  selector: "app-add-edit-vendor-credit",
  templateUrl: "./add-edit-vendor-credit.component.html",
  styleUrls: ["./add-edit-vendor-credit.component.scss"],
})
export class AddEditVendorCreditComponent implements OnInit {
  colorTheme: ColorThemeInterface;
  user: User;

  editing = false;
  cloning = false;
  vcnId = "";
  vcnDetails: VCNDetails;
  unsubscriber$ = new Subject<void>();
  loggedInUser: any;

  vendors: CustomDropDown[] = [];
  gettingVendors = false;
  vcLines: VCNLine[] = [];
  accounts: any[] = [];
  gettingAccs = false;
  items: FinanceItem[] = [];
  allItems: FinanceItem[] = [];
  selectedTaxes: {
    id: number;
    value: number;
    name: string;
  }[] = [];
  isGettingItemsAndTaxes = false;
  taxOptions: string[] = ["Tax Exclusive", "Tax Inclusive"];

  lineLevelDiscountSet: boolean = false;
  totalAmount: number = 0;
  adjustable: number = 0;
  discount: number = 0;
  subTotal: number = 0;
  selectedLineIndex: number = 0;
  taxInclusive: boolean = false;
  fetchedTaxes: Tax[] = [];
  selectedTax = null;
  taxAmount = 0;
  paymentTerms: any[] = [];
  currentTheme: ColorThemeInterface;
  showDiscountAccount: boolean = false;
  discountAccount: any;
  loading = false;
  selectedItemAccount: { accountId: string; name: string };
  currencySymbol: string;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  vcnFiles: File[] = [];
  uploadedFiles: UploadedFile[] = [];
  fileDelete: boolean;
  vcnForm: UntypedFormGroup;
  ownerInformation: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private coaService: ChartOfAccountService,
    private itemService: ItemService,
    private finServ: FinanceService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService,
    private userService: UserService,
    private vcnServ: VendorCreditNoteService,
    private modalServ: NgbModal
  ) {}

  ngOnInit(): void {
    this.getCurrencySymbol();
    // Close side nav
    this.configService.isSidebarClosed$.next(true);
    this.loggedInUser = this.authService.decodeToken();

    this.resolveEditOrCloneMode();
    this.fetchUser();
    this.getAccounts();
    this.loadTheme();
    this.getVendors();
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
      this.editing = true;
    } else if (urlSegments[2] && urlSegments[2].path === "clone") {
      this.cloning = true;
    } else {
      this.editing = false;
      this.cloning = false;
    }

    if (this.editing || this.cloning) {
      const vcnId = this.route.snapshot.params.id;
      this.fetchVCNoteById(vcnId);
    } else {
      this.getItemsAndTaxes();
      this.initForm();
    }
  }

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
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
        return this.finServ.getCustomersOrVendorsSummary(model);
      },
    };
  }

  getSearchItemsService(): Select2SearchApi {
    return {
      search: (searchTerm: string) =>
        this.itemService.getAssestAndExpenseItems(
          { searchTerm: searchTerm },
          "VCN"
        ),
    };
  }

  updateDropdown($event: any, type: string): void {
    if (type === "vendor" && $event?.items?.length > 0) {
      this.vendors = $event?.items;
    } else if (type === "items" && $event.data.length > 0) {
      this.items = this.addCodeToItemName($event.data);
    }
  }

  get initialized() {
    if (this.editing || this.cloning) {
      return (
        !this.gettingVendors &&
        !this.isGettingItemsAndTaxes &&
        !this.gettingAccs &&
        this.vcnDetails
      );
    } else {
      return (
        !this.gettingVendors &&
        !this.isGettingItemsAndTaxes &&
        !this.gettingAccs
      );
    }
  }

  fetchVCNoteById(id: number) {
    this.vcnServ
      .getVCNoteById(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.vcnDetails = res.body.data;
        this.uploadedFiles = this.editing ? this.vcnDetails?.files : [];

        this.getItemsAndTaxes();
      });
  }

  addCodeToItemName(items: FinanceItem[]) {
    if (items.length) {
      return items.map((item) => ({
        ...item,
        text: `${item.text} (${item.code})`,
      }));
    }
  }

  getItemsAndTaxes() {
    this.isGettingItemsAndTaxes = true;
    forkJoin([
      this.itemService.getAssestAndExpenseItems({ searchTerm: "" }, "VCN"),
      this.finServ.getTaxes({ pageNumber: 1, pageSize: 100, isActive: true }),
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
          this.items = res.items;
          this.allItems = res.items;
          this.fetchedTaxes = res.taxes;

          this.initForm(this.vcnDetails);
          this.isGettingItemsAndTaxes = false;
        },
        error: () => {
          this.isGettingItemsAndTaxes = false;
        },
      });
  }

  initForm(vcn?: VCNDetails) {
    let vcnDate = "";
    if (vcn?.vendorCreditNoteDate) {
      vcnDate = customDateFormat(vcn?.vendorCreditNoteDate);
    }

    this.vcnForm = new UntypedFormGroup({
      vendorId: new UntypedFormControl(
        vcn?.vendorId || "",
        Validators.required
      ),
      vendorCreditDate: new UntypedFormControl(
        vcnDate || "",
        Validators.required
      ),
      transactionLevelDiscountRate: new UntypedFormControl(
        vcn?.transactionLevelDiscountRate || ""
      ),
      discountAccountId: new UntypedFormControl(vcn?.discountAccountId || ""),
      discountAfterTax: new UntypedFormControl(vcn?.discountAfterTax || false),
      orderNumber: new UntypedFormControl(vcn?.orderNumber || ""),
      taxOption: new UntypedFormControl(
        vcn?.taxOption || "Exclusive",
        Validators.required
      ),
      lines: new UntypedFormArray([]),
      notes: new UntypedFormControl(vcn?.notes || ""),
    });

    if (vcn?.taxOption === "Inclusive") this.taxInclusive = true;
    else this.taxInclusive = false;

    if (vcn?.lines.length > 0) {
      vcn.lines.forEach((line, i) => {
        this.onAddLine(line);

        const taxes = this.getItemTaxes();
        this.lines.at(i).get("taxes").setValue(taxes);
      });

      this.discount = vcn.transactionLevelDiscountRate;
      this.showDiscountAccount = true;
      this.linesCalculation();
    } else {
      this.onAddLine();
    }
  }

  get lines(): UntypedFormArray {
    return this.vcnForm.get("lines") as UntypedFormArray;
  }

  onAddLine(ln?: VCNLine): void {
    let tax: [CustomDropDown] = [{ id: null, text: "No Tax" }];
    let item: [CustomDropDown] = [{ id: null, text: "Select an Item" }];
    if (ln) {
      tax = [{ id: ln.taxId, text: ln.taxName }];
      item = [{ id: ln.itemId, text: ln.itemName }];
    }

    const line = new UntypedFormGroup({
      itemId: new UntypedFormControl(ln?.itemId || ""),
      item: new UntypedFormControl(item),
      assetId: new UntypedFormControl(ln?.itemId || ""),
      itemType: new UntypedFormControl(ln?.itemType || ""),
      accountId: new UntypedFormControl(ln?.accountId || ""),
      quantity: new UntypedFormControl(ln?.quantity || 0),
      unitPrice: new UntypedFormControl(ln?.unitPrice || 0),
      amount: new UntypedFormControl(ln?.subTotalAmount || 0),
      taxId: new UntypedFormControl(ln?.taxId || ""),
      tax: new UntypedFormControl(tax),
      taxes: new UntypedFormControl([]),
    });
    this.lines.push(line);

    this.selectedItemAccount = null;
  }

  onRemoveLine(index: number): void {
    this.lines.removeAt(index);
    if (this.editing || this.cloning) {
      this.vcnDetails.lines.splice(index, 1);
    }
    this.selectedItemAccount = null;

    this.linesCalculation();
  }

  setDiscountAfterTax(): void {
    const discountAfterTax = this.vcnForm.get("discountAfterTax");
    discountAfterTax.setValue(!discountAfterTax.value);

    this.linesCalculation();
  }

  onSelectItem(event: [FinanceItem], index: number): void {
    const item = event[0];
    const line = this.lines.at(index);
    line.get("itemId").setValue(item.id);
    line.get("assetId").setValue(item.id);
    line.get("itemType").setValue(item.itemType);
    line.get("quantity").setValue(1);
    line.get("unitPrice").setValue(item.amount ? item.amount : 0);

    const acc = this.accounts.find((acc) => acc.accountId === item.accountId);
    const itemAcc = {
      accountId: acc.accountId,
      name: acc.name,
    };
    line.get("accountId").setValue(itemAcc.accountId);
    this.selectedItemAccount = itemAcc;

    const taxes = this.getItemTaxes();
    line.get("taxes").reset();
    line.get("taxes").setValue(taxes);
    line
      .get("tax")
      .setValue([{ id: item.financeTaxId, text: item.financeTaxName }]);
    line.get("taxId").setValue(item.financeTaxId);
    this.linesCalculation();

    this.items = this.allItems;
  }

  getItemTaxes() {
    return this.fetchedTaxes
      .filter((tax) => tax.type === "Purchase" || tax.type === "Both")
      .map((tax) => ({ id: tax.financeTaxId, text: tax.name }));
  }

  onSelectAccount(event: any, index: number): void {
    const line = this.lines.at(index);
    line.get("accountId").setValue(event.accountId);
  }

  onSelectTax(event: CustomDropDown, lineIndex: number): void {
    this.selectedTax = null;
    const line = this.lines.at(lineIndex);

    const selectedTax = this.fetchedTaxes.find(
      (x) => x.financeTaxId === event.id
    );
    this.selectedTax = selectedTax;

    line.get("taxId").setValue(selectedTax.financeTaxId);
    if (
      (this.editing || this.cloning) &&
      this.vcnDetails.lines[lineIndex]?.taxId
    ) {
      this.vcnDetails.lines[lineIndex].taxId = selectedTax.financeTaxId;
      this.vcnDetails.lines[lineIndex].taxName = selectedTax.name;
    }
    this.linesCalculation();
  }

  onSetTaxOption(event: CustomDropDown): void {
    if (event.text === "Tax Inclusive") {
      this.taxInclusive = true;
    } else {
      this.taxInclusive = false;
    }

    this.taxInclusive
      ? this.vcnForm.get("taxOption").setValue("Inclusive")
      : this.vcnForm.get("taxOption").setValue("Exclusive");

    this.linesCalculation();
  }

  onSelectVendor(event: CustomDropDown[]): void {
    this.vcnForm.get("vendorId").setValue(event[0]?.id);
  }

  linesCalculation() {
    const discountAfterTax = this.vcnForm.get("discountAfterTax").value;
    const transactionLevelDiscountRate = this.vcnForm.get(
      "transactionLevelDiscountRate"
    ).value;
    const discountLevel = "TransactionLevel";
    this.selectedTaxes = [];
    calculateLines(
      this.lines.value,
      this.fetchedTaxes,
      this.selectedTaxes,
      discountAfterTax,
      this.taxInclusive,
      discountLevel,
      transactionLevelDiscountRate
    );

    this.subTotal = 0;
    this.totalAmount = 0;
    this.discount = 0;

    this.lines.value.forEach((line: any, index: number) => {
      this.lines.at(index).get("amount").patchValue(line.subTotalAmount);
      this.subTotal = this.subTotal + line.subTotalAmount;
      this.totalAmount += line.totalAmount;
      this.discount += line.discountAmount;
    });

    this.showDiscountAccount = this.discount > 0;
  }

  handleFileInput(filelist: FileList): void {
    this.vcnFiles = [];

    for (let i = 0; i < filelist.length; i++) {
      this.vcnFiles.push(filelist.item(i));
    }
  }

  removeFile(index: number): void {
    this.vcnFiles.splice(index, 1);
  }

  getVendors() {
    const model = {
      filter: "VendorsOnly",
      pageNumber: "1",
      pageSize: "10",
    };
    this.gettingVendors = true;
    this.finServ
      .getCustomersOrVendorsSummary(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.vendors = res.body.items;
          this.gettingVendors = false;
        },
        () => {
          this.gettingVendors = false;
        }
      );
  }

  getAccounts(): void {
    this.gettingAccs = true;
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (accounts) => {
          this.accounts = accounts;
          this.gettingAccs = false;
        },
        () => {
          this.gettingAccs = false;
        }
      );
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  onSelectDiscountAccount(acc: any) {
    this.vcnForm.get("discountAccountId").setValue(acc.accountId);
  }

  onSubmit(event): void {
    this.loading = true;
    let vcnReq: Observable<HttpResponse<CreateVCNoteResBody>>;

    this.vcnForm.value.lines.forEach((line) => {
      delete line.tax;
      delete line.taxes;
      delete line.item;
    });

    if (this.editing) {
      const data = {
        ...this.vcnForm.value,
        vendorCreditNoteId: this.vcnDetails.vendorCreditNoteId,
        status: event?.status || event,
        files: this.vcnFiles,
      };

      if (this.vcnFiles.length > 0 && this.uploadedFiles.length > 0) {
        const filesIds = this.uploadedFiles.map((file) => file.fileId);
        data["existingFiles"] = filesIds;
      }

      vcnReq = this.vcnServ.editVCNote(data, event?.transactionPin);
    } else {
      vcnReq = this.vcnServ.createVCNote(
        {
          ...this.vcnForm.value,
          status: event?.status || event,
          files: this.vcnFiles,
        },
        event?.transactionPin
      );
    }

    let toastTitleSegment: string;
    if (this.editing) {
      toastTitleSegment = "updated";
    } else {
      toastTitleSegment = this.cloning ? "cloned" : "created";
    }

    vcnReq.pipe(takeUntil(this.unsubscriber$)).subscribe(
      (res) => {
        this.loading = false;
        this.toast.fire({
          type: "success",
          title: `Vendor Credit Note ${toastTitleSegment} successfully!`,
        });
        this.router.navigateByUrl(
          `/finance/vendor-credit-notes${
            event?.status === "Posted" ? "?view=closed" : ""
          }`
        );
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  openModal(view: any, size?) {
    this.modalServ.open(view, { centered: true, size });
  }

  closeModal(): void {
    this.modalServ.dismissAll();
  }

  ngOnDestroy(): void {
    // Open side nav
    this.configService.isSidebarClosed$.next(false);

    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
