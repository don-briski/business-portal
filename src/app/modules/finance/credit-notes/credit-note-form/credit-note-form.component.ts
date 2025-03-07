import { HttpResponse } from "@angular/common/http";
import { Component, Input, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { CustomDropDown } from "../../../../model/CustomDropdown";
import {
  UntypedFormGroup,
  UntypedFormArray,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { takeUntil } from "rxjs/operators";
import { Observable, Subject, forkJoin } from "rxjs";
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
  CreateCNoteResBody,
  CNLine,
  CreditNoteDetails,
  UploadedFile,
} from "../types";
import { CreditNotesService } from "../credit-notes.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { FinanceItem, Tax } from "../../finance.types";

@Component({
  selector: "app-credit-note-form",
  templateUrl: "./credit-note-form.component.html",
  styleUrls: ["./credit-note-form.component.scss"],
})
export class CreditNoteFormComponent implements OnInit {
  @Input() colorTheme: ColorThemeInterface;
  @Input() user: any;
  @Input() editing = false;

  cnId = "";
  creditNote: CreditNoteDetails;
  unsubscriber$ = new Subject<void>();
  loggedInUser: any;

  customers: CustomDropDown[] = [];
  gettingCustomers = false;
  salespersons: CustomDropDown[] = [];
  gettingSalespersons = false;
  cnLines: CNLine[] = [];
  accounts: any[] = [];
  discountAccName: string;
  gettingAccs = false;
  items: FinanceItem[] = [];
  selectedTaxes: {
    id: number;
    value: number;
    name: string;
  }[] = [];
  itemsDropData: any[] = [];
  taxOpts: string[] = ["Tax Exclusive", "Tax Inclusive"];
  lineLevelDiscountSet: boolean = false;
  totalAmount: number = 0;
  adjustable: number = 0;
  discount: number = 0;
  subTotal: number = 0;
  selectedLineIndex: number = 0;
  taxInclusive: boolean = false;
  fetchedTaxes: Tax[] = [];
  isGettingItemsAndTaxes = false;
  taxAmount = 0;
  paymentTerms: any[] = [];
  currentTheme: ColorThemeInterface;
  showDiscountAccount: boolean = false;
  discountAccount: any;
  creatingCN = false;
  selectedItemAccount: { accountId: string; name: string };
  currencySymbol: string;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  loader: boolean;
  cnFiles: File[] = [];
  uploadedFiles: UploadedFile[] = [];
  fileDelete: boolean;
  cnForm: UntypedFormGroup;
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
    private cnServ: CreditNotesService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getCurrencySymbol();
    // Close side nav
    this.configService.isSidebarClosed$.next(true);
    this.loggedInUser = this.authService.decodeToken();

    const cnId = this.route.snapshot.params.id;
    if (cnId) {
      this.cnId = cnId;
      this.editing = true;
      this.fetchCNoteById(cnId);
    } else {
      this.initForm();
      this.getItemsAndTaxes();
    }

    this.fetchUser();
    this.getAccounts();
    this.loadTheme();
    this.getCustomers();
    this.getSalespersons();
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

  getSearchCustomerService(): Select2SearchApi {
    return {
      search: (keyword: string) => {
        const model = {
          filter: "CustomersOnly",
          pageNumber: "1",
          pageSize: "10",
          keyword,
        };
        return this.finServ.getCustomersOrVendorsSummary(model);
      },
    };
  }

  getSearchSalePersonService(): Select2SearchApi {
    return {
      search: (keyword: string) =>
        this.finServ.getSalespersonsLimitedView({
          searchTerm: keyword,
        }),
    };
  }

  getSearchItemsService(): Select2SearchApi {
    return {
      search: (searchTerm: string) =>
        this.itemService.getAssestAndExpenseItems({ searchTerm: searchTerm }),
    };
  }

  updateDropdown($event: any, type: string): void {
    if (type === "customer" && $event?.items.length > 0) {
      this.customers = $event.items;
    } else if (type === "salesPerson" && $event?.length > 0) {
      this.salespersons = $event;
    } else if (type === "items" && $event.data.length > 0) {
      this.itemsDropData = $event.data;
    }
  }

  get initialized() {
    if (this.editing) {
      return (
        !this.gettingCustomers &&
        !this.gettingSalespersons &&
        !this.isGettingItemsAndTaxes &&
        !this.gettingAccs &&
        this.creditNote
      );
    } else {
      return (
        !this.gettingCustomers &&
        !this.gettingSalespersons &&
        !this.gettingAccs &&
        !this.isGettingItemsAndTaxes
      );
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

  fetchCNoteById(id: number) {
    this.cnServ
      .getCNoteById(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.creditNote = res.body.data;

        if (this.creditNote?.files && this.creditNote.files.length > 0) {
          this.uploadedFiles = this.creditNote?.files;
        }

        this.getItemsAndTaxes();
      });
  }

  initForm(cn?: CreditNoteDetails) {
    let cnDate = "";
    if (cn?.date) {
      cnDate = customDateFormat(cn?.date);
    }

    if (cn?.discountAccountId) {
      this.discountAccName = this.accounts.find(
        (acc) => cn?.discountAccountId === acc.accountId
      );
    }

    this.cnForm = new UntypedFormGroup({
      customerId: new UntypedFormControl(
        cn?.customerId || "",
        Validators.required
      ),
      salesPersonId: new UntypedFormControl(
        cn?.salesPersonId || "",
        Validators.required
      ),
      creditNoteDate: new UntypedFormControl(cnDate || "", Validators.required),
      transactionLevelDiscountRate: new UntypedFormControl(
        cn?.transactionLevelDiscountRate || ""
      ),
      discountAccountId: new UntypedFormControl(cn?.discountAccountId || ""),
      discountAfterTax: new UntypedFormControl(cn?.discountAfterTax || false),
      orderNumber: new UntypedFormControl(cn?.orderNumber || ""),
      taxOption: new UntypedFormControl(
        cn?.taxOption || "Exclusive",
        Validators.required
      ),
      lines: new UntypedFormArray([]),
      notes: new UntypedFormControl(cn?.notes || ""),
    });

    if (cn?.taxOption === "Inclusive") this.taxInclusive = true;
    else this.taxInclusive = false;

    if (cn?.lines.length > 0) {
      cn.lines.forEach((line, i) => {
        this.onAddLine(line);

        const item = this.items.find((item) => item.id === +line.itemId);
        const taxes = this.getItemTaxes(item.financeTaxId);
        this.lines.at(i).get("taxes").setValue(taxes);
      });

      this.discount = cn.transactionLevelDiscountRate;
      this.showDiscountAccount = true;
      this.linesCalculation();
    } else {
      this.onAddLine();
    }
  }

  get lines(): UntypedFormArray {
    return this.cnForm.get("lines") as UntypedFormArray;
  }

  onAddLine(ln?: CNLine): void {
    let tax: CustomDropDown = { id: null, text: "" };
    if (ln) {
      const foundTax = this.fetchedTaxes.find(
        (x) => x.financeTaxId === +ln.taxId
      );
      tax = { id: foundTax.financeTaxId, text: foundTax.name };
    }

    const line = new UntypedFormGroup({
      itemId: new UntypedFormControl(ln?.itemId || ""),
      assetId: new UntypedFormControl(ln?.itemId || ""),
      itemType: new UntypedFormControl(ln?.itemType || ""),
      accountId: new UntypedFormControl(ln?.accountId || ""),
      quantity: new UntypedFormControl(ln?.quantity || 0),
      unitPrice: new UntypedFormControl(ln?.unitPrice || 0),
      amount: new UntypedFormControl(ln?.subTotalAmount || 0),
      taxId: new UntypedFormControl(ln?.taxId || ""),
      tax: new UntypedFormControl(ln ? [tax] : [{ id: null, text: "No Tax" }]),
      taxes: new UntypedFormControl([]),
    });
    this.lines.push(line);

    this.selectedItemAccount = null;
  }

  onRemoveLine(index: number): void {
    this.lines.removeAt(index);

    if (this.editing) {
      this.creditNote.lines.splice(index, 1);
    }
    this.selectedItemAccount = null;

    this.linesCalculation();
  }

  setDiscountAfterTax(): void {
    const discountAfterTax = this.cnForm.get("discountAfterTax");
    discountAfterTax.setValue(!discountAfterTax.value);

    this.linesCalculation();
  }

  onSelectItem(event: CustomDropDown, index: number): void {
    const line = this.lines.at(index);
    const item = this.items.find((x) => x.id === event.id);
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

    const taxes = this.getItemTaxes(item.financeTaxId);
    line.get("taxes").reset();
    line.get("taxes").setValue(taxes);
    line
      .get("tax")
      .setValue([{ id: item.financeTaxId, text: item.financeTaxName }]);
    line.get("taxId").setValue(item.financeTaxId);
    this.linesCalculation();

    this.itemsDropData = this.items;
  }

  getItemTaxes(itemTaxId: number) {
    const itemTax = this.fetchedTaxes.find(
      (tax) => tax.financeTaxId === itemTaxId
    );

    return this.fetchedTaxes
      .filter((tax) => tax.type === "Sales" || tax.type === "Both")
      .map((tax) => ({ id: tax.financeTaxId, text: tax.name }));
  }

  onSelectAccount(event: any, index: number): void {
    const line = this.lines.at(index);
    line.get("accountId").setValue(event.accountId);
  }

  onSelectTax(event: CustomDropDown, lineIndex: number): void {
    const line = this.lines.at(lineIndex);
    const selectedTax = this.fetchedTaxes.find(
      (x) => x.financeTaxId === event.id
    );
    line.get("taxId").setValue(selectedTax.financeTaxId);
    this.linesCalculation();
  }

  onSetTaxOption(event: CustomDropDown): void {
    if (event.text === "Tax Inclusive") {
      this.taxInclusive = true;
    } else {
      this.taxInclusive = false;
    }

    this.taxInclusive
      ? this.cnForm.get("taxOption").setValue("Inclusive")
      : this.cnForm.get("taxOption").setValue("Exclusive");

    this.linesCalculation();
  }

  onSelectCustomer(event: CustomDropDown): void {
    this.cnForm.get("customerId").setValue(event.id);
  }

  onSelectSalesperson(event: CustomDropDown): void {
    this.cnForm.get("salesPersonId").setValue(event.id);
  }

  linesCalculation() {
    const discountAfterTax = this.cnForm.get("discountAfterTax").value;
    const transactionLevelDiscountRate = this.cnForm.get(
      "transactionLevelDiscountRate"
    ).value;
    this.selectedTaxes = [];
    calculateLines(
      this.lines.value,
      this.fetchedTaxes,
      this.selectedTaxes,
      discountAfterTax,
      this.taxInclusive,
      "TransactionLevel",
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
    this.cnFiles = [];

    for (let i = 0; i < filelist.length; i++) {
      this.cnFiles.push(filelist.item(i));
    }
  }

  removeFile(index: number): void {
    this.cnFiles.splice(index, 1);
  }

  getItemsAndTaxes() {
    this.isGettingItemsAndTaxes = true;
    forkJoin([
      this.itemService.getAssestAndExpenseItems({ searchTerm: "" }),
      this.finServ.getTaxes({ pageNumber: 1, pageSize: 100, isActive: true }),
    ])
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.items = res[0].body?.data;
          this.itemsDropData = this.items.map(({ itemType, ...rest }) => rest);

          this.fetchedTaxes = res[1].body?.items;

          this.initForm(this.creditNote);
          this.isGettingItemsAndTaxes = false;
        },
        error: () => {
          this.isGettingItemsAndTaxes = false;
        },
      });
  }

  getCustomers() {
    const model = {
      filter: "CustomersOnly",
      pageNumber: "1",
      pageSize: "10",
    };
    this.gettingCustomers = true;
    this.finServ
      .getCustomersOrVendorsSummary(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.customers = res.body.items;
          this.gettingCustomers = false;
        },
        () => {
          this.gettingCustomers = false;
        }
      );
  }

  getSalespersons() {
    this.gettingSalespersons = true;
    this.finServ
      .getSalespersonsLimitedView({ searchTerm: "" })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.salespersons = res.body;
          this.gettingSalespersons = false;
        },
        () => {
          this.gettingSalespersons = false;
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
    this.cnForm.get("discountAccountId").setValue(acc.accountId);
  }

  openModal(modal: any): void {
    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  onSubmit(event): void {
    this.creatingCN = true;
    let cnReq: Observable<HttpResponse<CreateCNoteResBody>>;

    this.cnForm.value.lines.forEach((line) => {
      delete line?.taxes;
    });

    if (this.editing) {
      const data = {
        ...this.cnForm.value,
        creditNoteId: this.creditNote.id,
        status: event?.status || event,
        files: this.cnFiles,
      };

      if (this.cnFiles.length > 0 && this.uploadedFiles.length > 0) {
        const filesIds = this.uploadedFiles.map((file) => file.fileId);
        data["existingFiles"] = filesIds;
      }

      cnReq = this.cnServ.editCNote(data, event.transactionPin);
    } else {
      cnReq = this.cnServ.createCNote(
        {
          ...this.cnForm.value,
          status: event?.status || event,
          files: this.cnFiles,
        },
        event.transactionPin
      );
    }

    cnReq.pipe(takeUntil(this.unsubscriber$)).subscribe(
      (res) => {
        this.creatingCN = false;
        this.toast.fire({
          type: "success",
          title: `Credit note ${
            this.editing ? "edited" : "created"
          } successfully.`,
        });
        this.router.navigateByUrl(
          `/finance/credit-notes${
            event?.status === "Posted" ? "?view=closed" : ""
          }`
        );
      },
      (err) => {
        this.creatingCN = false;
      }
    );
  }

  ngOnDestroy(): void {
    // Open side nav
    this.configService.isSidebarClosed$.next(false);

    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
