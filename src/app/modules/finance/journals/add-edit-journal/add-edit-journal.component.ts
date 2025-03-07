import { Component, OnInit, OnDestroy } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  UntypedFormArray,
  AbstractControl,
} from "@angular/forms";
import { FinanceService } from "../../service/finance.service";
import { fromEvent, Subject } from "rxjs";
import {
  debounceTime,
  takeUntil,
  distinctUntilChanged,
  filter,
  pluck,
  switchMap,
  share,
} from "rxjs/operators";
import * as $ from "jquery";
import * as moment from "moment";
import {
  calculateJournalLines,
  toFormData,
} from "../../../../util/finance/financeHelper";
import { ParamMap, Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import Swal from "sweetalert2";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { Tax } from "../../finance.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";

@Component({
  selector: "app-add-edit-journal",
  templateUrl: "./add-edit-journal.component.html",
  styleUrls: ["./add-edit-journal.component.scss"],
})
export class AddEditJournalComponent implements OnInit, OnDestroy {
  journalForm: UntypedFormGroup;
  accounts: any[] = [];
  contacts: { id: number; text: string }[] = [];
  taxes: Tax[] = [];
  taxesDropdata: CustomDropDown[];
  taxesObj: any[] = [];

  unsubscriber$ = new Subject<void>();
  requestsDone: string[] = [];
  journalFiles: any[] = [];
  journalViewFiles: any[] = [];
  loading: boolean = false;
  showDropDown: boolean = true;
  currentTheme: ColorThemeInterface;
  totalDebit: number = 0;
  subTotalDebit: number = 0;
  totalCredit: number = 0;
  subTotalCredit: number = 0;

  isEditing: boolean;
  cloning = false;
  fileDelete: boolean = false;
  journal = null;
  journalSet: boolean = false;
  savingAsDraft: string = "";
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  private _selectedDomElementId: number;
  private _selectedJournalId: number;
  ownerInformation: any;
  items!: any;
  itemsTotal: number = 0;
  creditsAndDebitsEqual = false;
  user;

  constructor(
    private fb: UntypedFormBuilder,
    private financeService: FinanceService,
    private router: Router,
    private route: ActivatedRoute,
    private coaService: ChartOfAccountService,
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService,
    private userService: UserService,
    private authService: AuthService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.fetchUser();
    this._loadTheme();

    this.resolveInitialData();
    this._formInit();

    this.getApplicationownerinformation();
    this._getAccounts();
    this._getTaxes();
    this.getContacts();
    
    if (!this.isEditing && !this.cloning) {
      this.addJournal();
    }
    if (this.itemsTotal > 0) this._setFormValues();
  }

  resolveInitialData() {
      const request = this.route.snapshot.queryParamMap.get('items');
      if (request) {
        this.items = JSON.parse(request);
        this.items.requestItems.forEach((item) => {
          this.itemsTotal += item.amount;
        });
      }

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
        this._selectedJournalId = id;
        this._getJournal(this._selectedJournalId);
      }
  }

  getSearchCustomerOrVendorService(): Select2SearchApi {
    return {
      search: (keyword: string) => {
        const model = {
          filter: "CustomersAndVendors",
          pageNumber: "1",
          pageSize: "10",
          keyword,
        };
        return this.financeService.getCustomersOrVendorsSummary(model);
      },
    };
  }

  updateDropdown($event: any, type: string): void {
    if (type === "CustomersAndVendors" && $event?.items.length > 0) {
      this.contacts = $event?.items;
    }
  }

  private fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe(
        (res) => {
          this.user = res.body;
        },
        (err) => {}
      );
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

  private _setFormValues(): void {
    this.journalForm.get("reference").setValue(this.items.requestCode);
    this.journalForm.get("reference").disable();
  }

  setElement(index: number): void {
    if (this._selectedDomElementId !== index) {
      this._selectedDomElementId = index;
      let id = `#${index}slct`;
      fromEvent($(id)[0], "keyup")
        .pipe(
          debounceTime(500),
          pluck("target", "value"),
          distinctUntilChanged(),
          filter((value: string) => value?.length > 2),
          share(),
          switchMap((searchTerm) => {
            return this.financeService
              .getCustomerOrVendor({ type: "customerorvendor", searchTerm })
              .pipe(pluck("body"), takeUntil(this.unsubscriber$));
          })
        )
        .subscribe((contacts) => (this.contacts = contacts));
    }
  }

  getContacts(): void {
    const model = {
      filter: "CustomersAndVendors",
      pageNumber: "1",
      pageSize: "10",
    };
    this.financeService
      .getCustomersOrVendorsSummary(model)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((contacts) => {
        this.contacts = contacts.items;
      });
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
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

  private _getTaxes(): void {
    this.financeService
      .getTaxes({ pageNumber: 1, pageSize: 100, isActive: true })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.taxes = res.body.items;

        this.taxesDropdata = this.taxes.map((tax: Tax) => {
          return {
            id: tax?.financeTaxId,
            text: `${tax?.name} (${tax?.value}%)`,
          };
        });
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

  private _formInit(): void {
    this.journalForm = this.fb.group({
      date: new UntypedFormControl("", Validators.required),
      reference: new UntypedFormControl(""),
      notes: new UntypedFormControl("", Validators.required),
      journalType: new UntypedFormControl(""),
      currencyId: new UntypedFormControl(0, Validators.required),
      journalLines: this.fb.array([]),
      status: new UntypedFormControl("SentForApproval", Validators.required),
      existingFiles: new UntypedFormControl([]),
    });
  }

  journals(): UntypedFormArray {
    return this.journalForm.controls["journalLines"] as UntypedFormArray;
  }

  addJournal(data?: any): void {
    const journal = this.fb.group({
      accountId: new UntypedFormControl("", Validators.required),
      description: new UntypedFormControl(data?.desc || ""),
      contactId: new UntypedFormControl(""),
      debitAmount: new UntypedFormControl("", Validators.required),
      creditAmount: new UntypedFormControl(data?.amount || "", Validators.required),
    });

    this.journals().push(journal);
    this.watchCreditsAndDebitsChange(journal);
  }

  watchCreditsAndDebitsChange(journal: AbstractControl) {
    journal
      .get("debitAmount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.calculateTax("debit");
          this.checkCreditsAndDebitsEquality();
        },
      });

    journal
      .get("creditAmount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.calculateTax("credit");
          this.checkCreditsAndDebitsEquality();
        },
      });
  }

  checkCreditsAndDebitsEquality() {
    let totalDebits = 0;
    let totalCredits = 0;

    this.journals().controls.forEach((journal) => {
      const debitAmt = +journal.get("debitAmount").value;
      totalDebits += +debitAmt.toFixed(2);
      const creditAmt = +journal.get("creditAmount").value;
      totalCredits += +creditAmt.toFixed(2);
    });

    this.creditsAndDebitsEqual = +totalCredits.toFixed(2) === +totalDebits.toFixed(2);
  }

  debitValidator(event: any, i: number): void {
    const debitAmount = this.journals().at(i).get("debitAmount");
    const creditAmount = this.journals().at(i).get("creditAmount");
    if (debitAmount.value) {
      creditAmount.disable();
      creditAmount.setValue(0);
    } else {
      creditAmount.enable();
    }
  }

  creditValidator(event: any, i: number): void {
    const debitAmount = this.journals().at(i).get("debitAmount");
    const creditAmount = this.journals().at(i).get("creditAmount");

    if (
      this.items?.requestItems?.length > 0 &&
      creditAmount.value > this.itemsTotal
    ) {
      this.toast.fire(
        "Total Credits / Debits cannot be greater than the total amount of workflow items"
      );
      creditAmount.reset();
    }
    if (creditAmount.value) {
      debitAmount.disable();
      debitAmount.setValue(0);
    } else {
      debitAmount.enable();
    }
  }

  accumulateDebit(): void {
    let total = 0;
    const debitControls = this.journals().controls;
    debitControls.forEach((debitControl, index) => {
      total += debitControl.get("debitAmount").value;
      if (index === debitControls.length - 1) {
        this.totalDebit = total;
        this.subTotalDebit = total;
      }
    });

    this.taxesObj.forEach((tax) => {
      this.totalDebit += tax.debit;
    });
  }

  accumulateCredit(): void {
    let total = 0;
    const creditControls = this.journals().controls;
    creditControls.forEach((creditControl, index) => {
      total += creditControl.get("creditAmount").value;

      if (index === creditControls.length - 1) {
        this.totalCredit = total;
        this.subTotalCredit = total;
      }
    });

    this.taxesObj.forEach((tax) => {
      this.totalCredit += tax.credit;
    });
  }

  removeJournal(index: number): void {
    if (this.journals().length > 1) {
      const debitAmount = this.journals().at(index).get("debitAmount");
      const creditAmount = this.journals().at(index).get("creditAmount");
      if (debitAmount.value > 0) {
        this.totalDebit -= debitAmount.value;
      }

      if (creditAmount.value > 0) {
        this.totalCredit -= creditAmount.value;
      }

      this.journals().removeAt(index);
      this.checkCreditsAndDebitsEquality();
    }
  }

  onPrefillDescription(index: number) {
    const journal = this.journals().at(index);
    const enteredNote = this.journalForm.get("notes").value;
    if (!journal.get('description').value) {
      journal.get("description").setValue(enteredNote);
    }
  }

  selectAccount(value: any, controlIndex: number): void {
    this.journals().at(controlIndex).get("accountId").setValue(value.accountId);
  }

  setContact(value: any, controlIndex: number): void {
    this.journals().at(controlIndex).get("contactId").setValue(value.id);
  }

  setTaxes(value: any, controlIndex: number): void {
    const item = this.journals().at(controlIndex).get("taxId");
    item.setValue(value.id);
    const debitAmount = this.journals().at(controlIndex).get("debitAmount");
    const creditAmount = this.journals().at(controlIndex).get("creditAmount");

    if (debitAmount.value > 0 || creditAmount.value > 0) {
      this.calculateTax();
    }
  }

  calculateTax(caller?: string): void {
    const lines = this.journals().value;

    this.taxesObj = calculateJournalLines(lines, this.taxes);

    this.accumulateDebit();

    this.accumulateCredit();
  }

  toPositive(totalDebit: number, totalCredit: number): number {
    let value = totalDebit - totalCredit;
    return Math.abs(value);
  }

  handleFileInput(filelist: FileList): void {
    this.journalFiles = [];

    for (let i = 0; i < filelist.length; i++) {
      this.journalFiles.push(filelist.item(i));
      this.journalViewFiles = [...this.journalViewFiles, filelist.item(i)];
    }
  }

  removeFile(index: number): void {
    this.journalViewFiles.splice(index, 1);
  }

  setJournalType(event): void {
    event.target.checked
      ? this.journalForm.get("journalType").setValue("CashBasedJournal")
      : this.journalForm.get("journalType").setValue(null);
  }

  private _getJournal(journalId: number): void {
    this.financeService
      .getJournal(journalId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.journal = res.body.data;
        this.patchJournalForm(this.journal);
      });
  }

  private patchJournalForm(journal) {
    this.journalForm.patchValue({
      date: this._formatDate(journal.date),
      reference: journal.reference,
      notes: journal.notes,
      journalType: journal?.journalType ? "CashBasedJournal" : null,
      status: journal.status,
    });

    journal.journalLines.forEach((line, index) => {
      const journalCont = this.fb.group({
        accountId: new UntypedFormControl(line.account.accountId, Validators.required),
        contactId: new UntypedFormControl(line?.contact?.id),
        debitAmount: new UntypedFormControl(line.debitAmount, Validators.required),
        creditAmount: new UntypedFormControl(line.creditAmount, Validators.required),
        description: new UntypedFormControl(line.description),
      });

      this.watchCreditsAndDebitsChange(journalCont);

      this.journals().push(journalCont);

      if (line.debitAmount > 0) {
        this.journals().at(index).get("creditAmount").disable();
      }

      if (line.creditAmount > 0) {
        this.journals().at(index).get("debitAmount").disable();
      }

      let state;
      line.creditAmount > 0 ? (state = "credit") : (state = "debit");
      this.calculateTax(state);

      if (journal.journalLines.length === index + 1) {
        this.journalSet = true;
      } else {
        this.journalSet = false;
      }
    });

    this.checkCreditsAndDebitsEquality();

    if (journal?.files && this.isEditing) {
      this.journalViewFiles = journal.files;
    }
  }

  private _formatDate(dateString: string): string {
    let date = new Date(dateString);
    return moment(date).format("yyyy-MM-DD");
  }

  submit(event) {
    this.loading = true;
    this.savingAsDraft = event;
    let payload;
    this.journalForm.get("status").setValue(event?.status || event);
    if (this.items?.requestId) {
      this.journalForm.addControl(
        "RequestId",
        new UntypedFormControl(this.items.requestId)
      );
    }
    const { files, ...rest } = this.journalForm.getRawValue();
    payload = rest;
    payload.files = this.journalFiles;

    if (this.isEditing) {
      payload.journalId = this._selectedJournalId;
      this.journalViewFiles.map((file) => {
        if (file.fileId) {
          payload.existingFiles.push(file.fileId);
        }
      });
    }

    const formData = toFormData(payload);
    if (!this.isEditing) {
      this.financeService
        .createJournal(formData, event?.transactionPin)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Journal created successfully.",
            });
            this.loading = false;
            this.navigateToJournals(event);
          },
          (error) => {
            this.loading = false;
            this.savingAsDraft = "";
          }
        );
    } else {
      this.financeService
        .updateJournal(formData, event?.transactionPin)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Journal updated successfully.",
            });
            if (res.status === 200) {
              this.loading = false;

              this.navigateToJournals(event);
            }
          },
          (error) => (this.loading = false)
        );
    }
  }

  private navigateToJournals(event): void {
    if (event.status === "Posted") {
      this.router.navigate(["finance/journals"], {
        fragment: "closed",
      });
    } else {
      this.router.navigate(["finance/journals"]);
    }
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
