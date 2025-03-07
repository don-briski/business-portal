import { Component, ElementRef, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import {
  selectedTransaction,
  TransactionLock,
} from "src/app/model/transaction-lock.interface";
import { FinanceService } from "../service/finance.service";
import Swal from "sweetalert2";
import * as moment from "moment";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";

@Component({
  selector: "lnd-transaction-lock",
  templateUrl: "./transaction-lock.component.html",
  styleUrls: ["./transaction-lock.component.scss"],
})
export class TransactionLockComponent implements OnInit, OnDestroy {
  private subs$ = new Subject();
  colorTheme: ColorThemeInterface;
  transactionLocks: TransactionLock;
  selectedTransaction: selectedTransaction;
  lockForm: UntypedFormGroup;
  partialUnlockForm: UntypedFormGroup;
  unlockForm: UntypedFormGroup;
  lockAllTransaction = false;

  isLoading = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  maxDate = "";
  partialUnlockStartDate = "";
  partialUnlockEndDate = "";

  constructor(
    private financeService: FinanceService,
    private modalService: NgbModal,
    private fb: UntypedFormBuilder,
    private colorThemeService: ColorThemeService,
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getTransactionLocks();
    this.initForms();
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  private initForms(): void {
    this.lockForm = this.fb.group({
      type: new UntypedFormControl(null),
      date: new UntypedFormControl(null, Validators.required),
      lockReason: new UntypedFormControl(null, Validators.required),
    });

    this.partialUnlockForm = this.fb.group({
      type: new UntypedFormControl(null, Validators.required),
      unlockIntervalStartDate: new UntypedFormControl(null, Validators.required),
      unlockIntervalEndDate: new UntypedFormControl(null, Validators.required),
      unlockReason: new UntypedFormControl(null, Validators.required),
    });

    this.unlockForm = this.fb.group({
      type: new UntypedFormControl(null),
      unlockReason: new UntypedFormControl(null, Validators.required),
    });

    this.partialUnlockForm
      .get("unlockIntervalStartDate")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((date) => {
        const newDate = new Date(date);
        const selectedDate = moment(newDate).format("yyyy-MM-DD");
        this.partialUnlockStartDate = selectedDate;
      });
  }

  getTransactionLocks(): void {
    this.financeService
      .getTransactionLocks()
      .pipe(pluck("body"), takeUntil(this.subs$))
      .subscribe((transactionLocks) => {
        this.transactionLocks = transactionLocks;
        let locked = [];
        for (const key in this.transactionLocks) {
          if (this.transactionLocks[key]?.status === "Complete") {
            locked.push(key);
            if (locked.length === Object.keys(transactionLocks).length) {
              this.lockAllTransaction = true;
            } else {
              this.lockAllTransaction = false;
            }
          }
        }
      });
  }

  openModal(
    content: ElementRef,
    item?: selectedTransaction,
    type?: string
  ): void {
    this.selectedTransaction = item;

    switch (type) {
      case "partialUnlock":
        this.setDateBoundaries("partialUnlock");
        this.partialUnlockForm.get("type").setValue(item?.key);
        break;

      case "unlock":
        this.unlockForm.get("type").setValue(item?.key);
        break;

      default:
        this.setDateBoundaries("lock");
        this.lockForm.get("type").setValue(item?.key);
        break;
    }

    this.modalService.open(content, { centered: true });
  }

  private setDateBoundaries(type: string) {
    if (type === "lock") {
      const newDate = new Date();
      const yesterday = moment(newDate)
        .subtract(1, "days")
        .format("yyyy-MM-DD");
      this.maxDate = yesterday;
    } else if (type === "partialUnlock") {
      const newDate = new Date(this.selectedTransaction.value?.date);
      const yesterday = moment(newDate)
        .subtract(1, "days")
        .format("yyyy-MM-DD");
      this.partialUnlockEndDate = yesterday;
    }
  }

  closeModal(type?: string): void {
    this.modalService.dismissAll();

    switch (type) {
      case "partialUnlock":
        this.partialUnlockForm.reset();
        break;

      case "unlock":
        this.unlockForm.reset();
        break;

      default:
        this.lockForm.reset();
        break;
    }
  }

  submitLockForm(type: string): void {
    this.isLoading = true;
    if (type === "lock") {
      this.financeService
        .setTransactionLock(this.lockForm.value)
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.getTransactionLocks();
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: `${this.lockForm.get("type").value} locked successfully`,
            });
            this.closeModal();
            this.lockForm.reset();
          },
          () => (this.isLoading = false)
        );
    } else if (type === "lockall") {
      this.financeService
        .lockAllTransaction(this.lockForm.value)
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.getTransactionLocks();
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: "All transactions locked successfully",
            });
            this.closeModal();
            this.lockForm.reset();
            this.lockAllTransaction = true;
          },
          () => (this.isLoading = false)
        );
    } else {
      this.financeService
        .setPartialTransactionLock(this.partialUnlockForm.value)
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.getTransactionLocks();
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: `${
                this.partialUnlockForm.get("type").value
              } unlocked successfully`,
            });
            this.closeModal();
            this.partialUnlockForm.reset();
          },
          () => (this.isLoading = false)
        );
    }
  }

  triggerPartialUnlockPopup(item: selectedTransaction): void {
    this.selectedTransaction = item;
    Swal.fire({
      type: "info",
      text: "Your transactions would be locked completely",
      title: "Disable Partial Unlock?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.disablePartialUnlock();
      }
    });
  }

  triggerLockAllPopup(content: ElementRef): void {
    const lockedAlready = [];
    let lockedTransactions = "";
    for (const key in this.transactionLocks) {
      if (this.transactionLocks[key]?.lockReason) {
        lockedAlready.length > 0
          ? (lockedTransactions = key + ",")
          : (lockedTransactions = key);
        lockedAlready.push(key);
      }
    }
    if (lockedAlready.length > 0) {
      Swal.fire({
        type: "error",
        text: "Please ensure no transaction is currently locked, before proceeding to lock all transactions ",
        title: `${lockedTransactions} ${
          lockedAlready.length > 1 ? "are" : "is"
        } currently locked`,
      });
    } else {
      this.openModal(content);
    }
  }

  disablePartialUnlock(): void {
    this.isLoading = true;
    this.financeService
      .disablePartialTransactionLock({
        type: this.selectedTransaction.value.type,
      })
      .pipe(takeUntil(this.subs$))
      .subscribe(() => {
        this.getTransactionLocks();
        this.isLoading = false;
        this.toast.fire({
          type: "success",
          title: "Partial unlock disabled successfully",
        });
      });
  }

  submitUnlockForm(type: string): void {
    this.isLoading = true;
    if (type === "unlock") {
      this.financeService
        .unlockTransaction(this.unlockForm.value)
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.getTransactionLocks();
            this.isLoading = false;
            this.toast.fire({
              type: "success",
              title: `${
                this.unlockForm.get("type").value
              } unlocked successfully`,
            });
            this.closeModal();
            this.unlockForm.reset();
          },
          () => (this.isLoading = false)
        );
    }
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
