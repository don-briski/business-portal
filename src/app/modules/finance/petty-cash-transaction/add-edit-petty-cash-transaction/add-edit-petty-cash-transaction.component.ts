import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Observable, Subject } from "rxjs";
import { takeUntil, pluck, map } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";
import Swal from "sweetalert2";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";

import { ConfigurationService } from "src/app/service/configuration.service";
import { AuthService } from "src/app/service/auth.service";
import { PettyCashTransactionService } from "src/app/service/petty-cash-transaction.service";
import {
  AddEditPettyCashTransactionReqBody,
  PettyCash,
  PettyCashRecipient,
} from "../../models/petty-cash-transaction.model";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { FinanceService } from "../../service/finance.service";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import {
  customDateFormat,
  transfromAccs,
} from "src/app/util/finance/financeHelper";
import {
  Bank,
  LoggedInUser,
  UploadedFile,
} from "src/app/modules/shared/shared.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { HttpResponse } from "@angular/common/http";

@Component({
  selector: "app-add-edit-petty-cash-transaction",
  templateUrl: "./add-edit-petty-cash-transaction.component.html",
  styleUrls: ["./add-edit-petty-cash-transaction.component.scss"],
})
export class AddEditPettyCashTransactionComponent implements OnInit, OnDestroy {
  private subs$ = new Subject<void>();

  pettyCashAccounts: any[] = [];
  currentTheme: ColorThemeInterface;
  loggedInUser: LoggedInUser;

  pettyCashRecipientEnum = PettyCashRecipient;
  pettyCashRecipientTypes = [
    PettyCashRecipient.Others,
    PettyCashRecipient.Staff,
  ];

  verifyloader: boolean = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  paidThroughAccounts: any[] = [];
  staffList: CustomDropDown[] = [];
  originalBankList: Bank[] = [];
  bankList: CustomDropDown[] = [];
  files: File[] = [];
  uploadedFiles: UploadedFile[] = [];
  loading: boolean;
  fetchingPettyCash = false;
  pettyCash: PettyCash;
  pettyCashId: string;
  editing = false;

  form = this.fb.group({
    requestedBy: [""],
    recipient: ["", Validators.required],
    recipientArray: this.fb.control<string[]>([]),
    staffArray: this.fb.control<CustomDropDown[]>([]),
    staffId: [""],
    amount: [0, Validators.required],
    paidThroughAccountId: ["", Validators.required],
    paidThroughAccountArray: this.fb.control<CustomDropDown[]>([]),
    sourceAccountId: ["", Validators.required],
    sourceAccountArray: this.fb.control<CustomDropDown[]>([]),
    transactionDate: ["", Validators.required],
    paymentInformationBankName: ["", Validators.required],
    paymentInformationBankNameArray: this.fb.control<CustomDropDown[]>([]),
    recipientInformation: [""],
    paymentInformationBankSortCode: ["", Validators.required],
    paymentInformationBankAccountNumber: [
      "",
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern("^[0-9]*$"),
      ],
    ],
    paymentInformationAccountName: ["", Validators.required],
    description: ["", Validators.required],
    comment: [""],
    files: [],
    draft: [false],
  });

  constructor(
    private authService: AuthService,
    private configService: ConfigurationService,
    private pettyCashTransactionService: PettyCashTransactionService,
    private router: Router,
    private modalService: NgbModal,
    private colorThemeService: ColorThemeService,
    private financeService: FinanceService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getLoggedInUser();
    this.loadTheme();
    this.watchFormChanges();
    this.fetchStaff();
    this.getpaidThroughAccounts();
    this.getpettyCashAccounts();
    this.fetchBanks();
    this.setEditState();
  }

  getLoggedInUser() {
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  setEditState() {
    this.pettyCashId = this.route.snapshot.params.id;
    if (this.pettyCashId) {
      this.editing = true;
      this.getPettyCash();
    }
  }

  watchFormChanges() {
    this.form
      .get("recipientArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res.length) {
          this.form.get("recipient").setValue(res[0]);

          if (res[0] === PettyCashRecipient.Staff) {
            this.form.get("staffArray").setValue([]);
            this.form.get("recipientInformation").setValue("");
            this.form.get("staffId").setValidators(Validators.required);
          } else {
            this.form.get("staffId").clearValidators();
            this.form.get("staffId").setValue("");
          }

          if (res[0] === PettyCashRecipient.Others) {
            this.form
              .get("paymentInformationAccountName")
              .valueChanges.pipe(takeUntil(this.subs$))
              .subscribe({
                next: (res) => {
                  this.form.get("recipientInformation").setValue(res);
                },
              });
          }
        } else {
          this.form.get("recipient").setValue("");
          this.form.get("staffId").clearValidators();
        }

        this.form.updateValueAndValidity();
      });

    this.form
      .get("staffArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res.length) {
          this.form.get("staffId").setValue(res[0]?.id as string);
          this.form.get("recipientInformation").setValue(res[0].text);
        } else {
          this.form.get("staffId").setValue("");
          this.form.get("recipientInformation").setValue("");
        }
      });

    this.form
      .get("paidThroughAccountArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res.length) {
          this.form.get("paidThroughAccountId").setValue(res[0]?.id as string);
        } else {
          this.form.get("paidThroughAccountId").setValue("");
        }
      });

    this.form
      .get("sourceAccountArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res.length) {
          this.form.get("sourceAccountId").setValue(res[0]?.id as string);
        } else {
          this.form.get("sourceAccountId").setValue("");
        }
      });

    this.form
      .get("paymentInformationBankNameArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res.length) {
          this.form
            .get("paymentInformationBankName")
            .setValue(res[0]?.text as string);

          this.form
            .get("paymentInformationBankSortCode")
            .setValue(res[0]?.id as string);
        } else {
          this.form.get("paymentInformationBankName").setValue("");
          this.form.get("paymentInformationBankSortCode").setValue("");
        }
      });
  }

  patchForm(pettyCash: PettyCash) {
    this.form.patchValue({
      requestedBy: this.loggedInUser.nameid,
      recipient: pettyCash.recipient,
      recipientArray: [pettyCash.recipient],
      staffId: pettyCash.personId ? String(pettyCash.personId) : "",
      staffArray: [
        { id: pettyCash.personId, text: pettyCash.recipientInformation },
      ],
      amount: pettyCash.amount,
      paidThroughAccountId: String(pettyCash.paidThroughAccountId),
      paidThroughAccountArray: [
        {
          id: pettyCash.paidThroughAccountId,
          text: pettyCash.paidThroughAccount,
        },
      ],
      sourceAccountId: String(pettyCash.sourceAccountId),
      sourceAccountArray: [
        { id: pettyCash.sourceAccountId, text: pettyCash.sourceAccount },
      ],
      transactionDate: customDateFormat(pettyCash.transactionDate),
      paymentInformationBankName: pettyCash.paymentInformation.bankName,
      paymentInformationBankNameArray: [
        {
          id: pettyCash.paymentInformation.bankSortCode,
          text: pettyCash.paymentInformation.bankName,
        },
      ],
      recipientInformation: pettyCash.recipientInformation,
      paymentInformationBankSortCode: pettyCash.paymentInformation.bankSortCode,
      paymentInformationBankAccountNumber:
        pettyCash.paymentInformation.bankAccountNumber,
      paymentInformationAccountName: pettyCash.paymentInformation.accountName,
      description: pettyCash.description,
      comment: "",
    });
  }

  getPettyCash() {
    this.fetchingPettyCash = true;
    this.pettyCashTransactionService
      .getPettyCashTransactionById(this.pettyCashId)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.pettyCash = res.body;
          this.patchForm(this.pettyCash);
          this.uploadedFiles = this.pettyCash?.files;
          this.fetchingPettyCash = false;
        },
        error: () => {
          this.fetchingPettyCash = false;
        },
      });
  }

  getStaffService(): Select2SearchApi {
    return {
      search: (name: string) =>
        this.pettyCashTransactionService.getStaff({
          keyword: name,
        }),
    };
  }

  getAccountService(filter: string): Select2SearchApi {
    return {
      search: (accountName: string) =>
        this.financeService.getAccountsByClass({
          keyword: accountName,
          pageNumber: "1",
          pageSize: "10",
          filter,
        }),
    };
  }

  updateDropdown($event: any, type: string): void {
    if (type === "staff") {
      this.staffList = $event.map((staff) => ({
        id: staff.id,
        text: staff.name,
      }));
    } else if (type === "paidThrough") {
      this.paidThroughAccounts = transfromAccs($event?.items);
    } else if (type === "PettyCashCredit") {
      this.pettyCashAccounts = transfromAccs($event?.items);
    }
  }

  openModal(modal: any): void {
    this.modalService.open(modal, { centered: true });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  getpaidThroughAccounts(): void {
    this.financeService
      .getAccountsByClass({ filter: "Bank" })
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
        this.paidThroughAccounts = res;
      });
  }

  private getpettyCashAccounts(): void {
    this.financeService
      .getAccountsByClass({ filter: "PettyCashCredit" })
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
        this.pettyCashAccounts = res;
      });
  }

  onSubmit() {
    const data = this.form.value;

    if (this.form.value.recipient === PettyCashRecipient.Staff) {
      delete data["recipientArray"];
      delete data["staffArray"];
      delete data["paidThroughAccountArray"];
      delete data["sourceAccountArray"];
    }
    delete data["paymentInformationBankNameArray"];

    data.requestedBy = this.loggedInUser.nameid;
    data.files = this.files;
    if (this.files.length > 0 && this.uploadedFiles.length > 0) {
      const filesIds = this.uploadedFiles.map((file) => file.fileId);
      data["existingFiles"] = filesIds;
    }

    this.loading = true;
    let req: Observable<HttpResponse<any>>;

    if (this.editing) {
      data["pettyCashTransactionId"] = this.pettyCash.pettyCashTransactionId;
      req = this.pettyCashTransactionService.updatePettyCashTransaction(
        data as unknown as AddEditPettyCashTransactionReqBody
      );
    } else {
      req = this.pettyCashTransactionService.createPettyCashTransaction(
        data as unknown as AddEditPettyCashTransactionReqBody
      );
    }

    req.subscribe(
      (res) => {
        this.toast.fire({
          type: "success",
          text: `Transaction successfully ${
            this.editing ? "updated" : "created"
          }`,
        });
        this.loading = false;
        this.router.navigateByUrl("finance/pettycash/transaction");
        this.loading = false;
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  fetchBanks() {
    this.configService
      .spoolBanks()
      .pipe(
        map((res) => {
          return {
            original: res.body,
            modified: res.body.map((b) => ({
              id: b.sortCode,
              text: b.bankName,
            })),
          };
        })
      )
      .subscribe((res) => {
        this.bankList = res.modified;
        this.originalBankList = res.original;
      });
  }

  handleFileInput(filelist: FileList) {
    this.files = [];
    for (let i = 0; i < filelist.length; i++) {
      this.files.push(filelist.item(i));
    }
  }

  onRemoveFile(index: number): void {
    this.files.splice(index, 1);
  }

  isNullOrEmpty(str: string) {
    return str == null || str.trim() == "";
  }

  private fetchStaff() {
    this.staffList = [];
    this.pettyCashTransactionService.getStaff().subscribe(
      (res) => {
        this.staffList = res.body.map((x) => {
          return { id: x.id, text: x.name };
        });
      },
      (err) => {}
    );
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }

  protected formatDate(date: string): string {
    let newDate = new Date(date);
    return moment(newDate).format("yyyy-MM-DD");
  }

  protected isGreaterThanToday(value: any): boolean {
    const dateVal = moment(value);
    const today = moment();
    const difference = dateVal.diff(today);
    if (difference > 0) {
      return true;
    } else {
      return false;
    }
  }

  compareDate(dateA: any, dateB: any): boolean {
    const dateVal1 = moment(dateA);
    const dateVal2 = moment(dateB);
    const difference = dateVal1.diff(dateVal2);
    if (difference > 0) {
      return true;
    } else {
      return false;
    }
  }
}
