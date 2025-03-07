import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { pluck, takeUntil, tap, map } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { FinanceService } from "../../service/finance.service";
import {
  customDateFormat,
  toFormData,
} from "src/app/util/finance/financeHelper";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import Swal from "sweetalert2";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { AppOwnerInformation, User } from "src/app/modules/shared/shared.types";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { BankAccount } from "../../types/Account";
import { CustomDropDown } from "src/app/model/CustomDropdown";

@Component({
  selector: "app-add-edit-payments-received",
  templateUrl: "./add-edit-payments-received.component.html",
  styleUrls: ["./add-edit-payments-received.component.scss"],
})
export class AddEditPaymentsReceivedComponent implements OnInit, OnDestroy {
  isEditing: boolean = false;
  isLoading: boolean = false;
  fileDelete: boolean = false;
  currentTheme: ColorThemeInterface;
  selectedPayment: any;
  paymentForm: UntypedFormGroup;
  customers: any[] = [];
  accounts: any[] = [];
  gettingAccounts = false;
  bankAccounts: CustomDropDown[] = [];
  gettingBankAccounts = false;
  paymentModes: any[] = [];
  paymentFiles: any[] = [];
  paymentViewFiles: any[] = [];
  totalPaymentAmountOnLines: number = 0;
  totalTaxAmountOnLines: number = 0;
  amountInExcess: number = 0;

  private _selectedPaymentId: number;
  private _unsubscriber$ = new Subject();

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  ownerInfo: AppOwnerInformation;
  user: User;

  constructor(
    private _fb: UntypedFormBuilder,
    private _colorThemeService: ColorThemeService,
    private _configService: ConfigurationService,
    private _coaService: ChartOfAccountService,
    private _financeService: FinanceService,
    private _router: Router,
    private _route: ActivatedRoute,
    private modalService: NgbModal,
    private userService: UserService,
    private authService: AuthService
  ) {
    this._route.url
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any) => {
        if (res[1].path === "edit") {
          this.isEditing = true;

          this._route.paramMap
            .pipe(takeUntil(this._unsubscriber$))
            .subscribe((params: ParamMap) => {
              this._selectedPaymentId = +params.get("id");
            });
        } else {
          this.isEditing = false;
        }
      });
  }

  ngOnInit(): void {
    this.fetchUser();
    this.getAppOwnerInfo();
    this._getAccounts();
    this.getBankAccounts();
    this._configService.isSidebarClosed$.next(true);
    this._loadTheme();
    this._initForm();
    this._getCustomers();
    this._getPaymentModes();

    this.isEditing ? this._getPayment(this._selectedPaymentId) : null;
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

  getPaymentModeService(): Select2SearchApi {
    return {
      search: (paymentModeName: string) =>
        this._financeService.getPaymentModes({
          paymentModeName: paymentModeName,
          pageNumber: "1",
          pageSize: "10",
          isActive: true,
        }),
    };
  }

  updateDropdown($event: any, type: string): void {
    if (type === "customer" && $event?.items.length > 0) {
      this.customers = $event;
    } else if (type === "paymentMode" && $event?.length > 0) {
      this.paymentModes = $event?.map((paymentMode: any) => {
        return {
          id: paymentMode?.financePaymentModeId,
          text: paymentMode?.name,
        };
      });
    }
  }

  private fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(
        (res) => {
          this.user = res.body;
        }
      );
  }

  private _initForm(): void {
    this.paymentForm = this._fb.group({
      person: new UntypedFormControl(null, Validators.required),
      personId: new UntypedFormControl(null, Validators.required),
      paymentMode: new UntypedFormControl(null, Validators.required),
      paymentModeId: new UntypedFormControl(null, Validators.required),
      paymentAmount: new UntypedFormControl(0, Validators.required),
      paymentMadeDate: new UntypedFormControl(null, Validators.required),
      paidThroughAccountId: new UntypedFormControl(null, Validators.required),
      taxAccountId: new UntypedFormControl(null),
      internalNote: new UntypedFormControl(null),
      paymentReference: new UntypedFormControl(null),
      relatedObject: new UntypedFormControl("Invoice", Validators.required),
      status: new UntypedFormControl(null),
      existingFiles: new UntypedFormControl([]),
      linesAffectedTItems: this._fb.array([]),
    });

    this._watchFormChanges();
  }

  lineItems(): UntypedFormArray {
    return this.paymentForm.get("linesAffectedTItems") as UntypedFormArray;
  }

  getAppOwnerInfo() {
    this._configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.ownerInfo = res.body;
      });
  }

  private _addLine(invoice: any, index?: number): void {
    const line = this._fb.group({
      createdAt: new UntypedFormControl(invoice.createdAt),
      invoiceCode: new UntypedFormControl(invoice.code),
      totalAmount: new UntypedFormControl(invoice.amount),
      balanceDue: new UntypedFormControl(invoice.balanceDue),
      invoiceId: new UntypedFormControl(invoice.id, Validators.required),
      paymentAmount: new UntypedFormControl(
        !this.isEditing
          ? 0
          : this.selectedPayment?.paymentLines[index]?.amountAllocated || 0,
        Validators.required
      ),
      whtAmount: new UntypedFormControl(
        !this.isEditing
          ? 0
          : this.selectedPayment?.paymentLines[index]?.whtAmount || 0
      ),
      paymentLineId: new UntypedFormControl(
        !this.isEditing
          ? null
          : this.selectedPayment?.paymentLines[index]?.financePaymentLineId
      ),
    });

    this.lineItems().push(line);
  }

  private _watchFormChanges(): void {
    this.paymentForm
      .get("paymentMode")
      .valueChanges.subscribe((paymentMode) => {
        this.paymentForm.get("paymentModeId").setValue(paymentMode[0]?.id);
      });

    this.paymentForm.get("person").valueChanges.subscribe((person) => {
      this.paymentForm.get("personId").setValue(person[0]?.id);
      if (person[0].id) {
        const statusFilter = {
          pageNumber: 1,
          pageSize: 10,
          statusFilter: {
            status: ["Draft", "ReDraft", "SentForApproval"],
            operator: "Or",
            paymentStatuses: ["NotPaid", "PartiallyPaid"],
          },
        };
        this._getInvoices(person[0].id, statusFilter);
      }
    });

    this.paymentForm
      .get("linesAffectedTItems")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.totalPaymentAmountOnLines = 0;
        this.totalTaxAmountOnLines = 0;
        res.forEach((line) => {
          this.totalPaymentAmountOnLines += line.paymentAmount;
          this.totalTaxAmountOnLines += line?.whtAmount;
          this.amountInExcess =
            this.paymentForm.get("paymentAmount").value -
            this.totalPaymentAmountOnLines;
        });
      });
  }

  private _getAccounts(): void {
    this.gettingAccounts = true;
    this._coaService
      .getAllAccounts()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(
        (accounts) => {
          this.accounts = accounts;
          this.gettingAccounts = false;
        },
        () => {
          this.gettingAccounts = false;
        }
      );
  }

  getBankAccounts(): void {
    this.gettingBankAccounts = true;
    this._financeService
      .getAccountsByClass({ filter: "bank" })
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(
        (res) => {
          this.bankAccounts = res.body.items.map((acc: BankAccount) => ({
            id: acc.accountId,
            text: acc.name,
          }));
          this.gettingBankAccounts = false;
        },
        () => {
          this.gettingBankAccounts = false;
        }
      );
  }

  private _getCustomers(): void {
    const model = {
      filter: "CustomersOnly",
      pageNumber: "1",
      pageSize: "10",
    };
    this._financeService
      .getCustomersOrVendorsSummary(model)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => (this.customers = res.body.items));
  }

  private _getPaymentModes() {
    const model = {
      pageSize: 1000,
      pageNumber: 1,
    };
    this._financeService
      .getPaymentModes(model)
      .pipe(
        pluck("body", "data", "items"),
        tap((paymentModes: any[]) => {
          const paymentMode = paymentModes.find(
            (paymentMode) => paymentMode.isDefault
          );

          if (paymentMode) {
            this.paymentForm
              .get("paymentModeId")
              .setValue(paymentMode?.financePaymentModeId);
            this.paymentForm.get("paymentMode").setValue([
              {
                id: paymentMode?.financePaymentModeId,
                text: paymentMode.name,
              },
            ]);
          }

        }),
        map((paymentModes: any[]) => {
          return paymentModes.map((paymentMode) => ({
            id: paymentMode?.financePaymentModeId,
            text: paymentMode?.name,
          }));
        }),
        takeUntil(this._unsubscriber$)
      )
      .subscribe((paymentModes) => {
        this.paymentModes = paymentModes;
      });
  }

  private _loadTheme(): void {
    this._colorThemeService
      .getTheme()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private _getInvoices(personId: number, statusFilter?): void {
    this.isLoading = true;
    let model = { customerId: personId };
    if (statusFilter) {
      model = { ...model, ...statusFilter };
    }
    this._financeService
      .getInvoices(model)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any) => {
        this.isLoading = false;
        this.lineItems().clear();
        res.body?.items.forEach((invoice, index) => {
          if (invoice.balanceDue > 0) this._addLine(invoice, index);
        });
      });
  }

  private _getPayment(paymentId: number): void {
    this.isLoading = true;
    this._financeService
      .getPayment(paymentId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.selectedPayment = res.body.data;
        this._patchForm(this.selectedPayment);
        this.isLoading = false;
      });
  }

  private _patchForm(payment: any): void {
    this.paymentForm.patchValue({
      person: [
        {
          id: payment.personId,
          text: payment.personName,
        },
      ],
      personId: payment.personId,
      paymentMode: [
        {
          id: payment.paymentModeId,
          text: payment.paymentModeName,
        },
      ],
      paymentModeId: payment.paymentModeId,
      paymentAmount: payment.paymentAmount,
      paymentMadeDate: customDateFormat(payment.paymentMadeDate),
      paidThroughAccountId: payment.paidThroughAccountId,
      taxAccountId: payment?.taxAccountId,
      internalNote: payment?.internalNote,
      paymentReference: payment?.paymentReference,
      relatedObject: "Invoice",
      status: payment.status,
    });

    this.paymentForm.addControl(
      "financePaymentId",
      new UntypedFormControl(payment.financePaymentId, Validators.required)
    );

    this._getInvoices(payment.personId);

    this.paymentViewFiles = [...payment.files];
  }

  selectAccount(event: any, type: "paidInto" | "tax"): void {
    type === "paidInto"
      ? this.paymentForm.get("paidThroughAccountId").setValue(event.id)
      : this.paymentForm.get("taxAccountId").setValue(event.accountId);
  }

  handleFileInput(filelist: FileList): void {
    this.paymentFiles = [];

    for (let i = 0; i < filelist.length; i++) {
      this.paymentFiles.push(filelist.item(i));
      this.paymentViewFiles = [...this.paymentViewFiles, filelist.item(i)];
    }
  }

  removeFile(index: number): void {
    this.paymentViewFiles.splice(index, 1);
  }

  private _sanitizeFormValues(): any {
    let newLines: any[] = [];
    const { paymentMode, person, taxAccount, ...rest } = this.paymentForm.value;

    newLines = rest.linesAffectedTItems.filter(
      (line) => line.paymentAmount !== 0
    );

    newLines = newLines.map(
      ({ balanceDue, createdAt, invoiceCode, totalAmount, ...obj }) => obj
    );
    return { ...rest, linesAffectedTItems: newLines };
  }

  submit(event): void {
    this.isLoading = true;
    this.paymentForm.get("status").setValue(event.status || event);
    const payload = this._sanitizeFormValues();
    payload.files = this.paymentFiles;
    if (this.isEditing) {
      this.paymentViewFiles.map((file) => {
        if (file.fileId) {
          payload.existingFiles.push(file.fileId);
        }
      });
    }

    const formData = toFormData(payload);
    if (!this.isEditing) {
      this._financeService
        .createPaymentMade(formData, event?.transactionPin)
        .pipe(takeUntil(this._unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Payment Created successfully",
            });
            this._router.navigate(["finance/payments-received"]);
          },
          (err) => (this.isLoading = false)
        );
    } else {
      this._financeService
        .updatePaymentMade(formData)
        .pipe(takeUntil(this._unsubscriber$))
        .subscribe(
          (res) => {
            this.toast.fire({
              type: "success",
              title: "Payment Updated successfully",
            });
            this._router.navigate(["finance/payments-received"]);
          },
          (err) => (this.isLoading = false)
        );
    }
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

  ngOnDestroy(): void {
    this._configService.isSidebarClosed$.next(false);

    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
