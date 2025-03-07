import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { FinanceService } from "../../service/finance.service";
import Swal from "sweetalert2";
import { printFile } from "src/app/util/helpers/print.helper";
import { SharedService } from "src/app/service/shared.service";
import { Router } from "@angular/router";
@Component({
  selector: "app-journal",
  templateUrl: "./journal.component.html",
  styleUrls: ["./journal.component.scss"],
})
export class JournalComponent implements OnInit, OnDestroy {
  @Input() journals: any[] = [];
  @Input() selectedJournalId: number;
  @Input() currency;
  @Input() user;
  @Input() isLoading;
  @Input() currentTheme;
  @Input() pagination;
  @Output() setIsSingleView = new EventEmitter<boolean>();
  @Output() getJournalsPaginatedSearch = new EventEmitter<any>();
  @ViewChild("JournalPaper") JournalPaper: ElementRef;

  unsubscriber$ = new Subject();
  fetchingJournal = false;
  selectedJournal;
  approvalStatus: "Redraft" | "Posted" | "Rejected" | null;
  loading: boolean = false;
  activityLogs: any[] = [];
  totalDebits = 0;
  totalCredits = 0;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  printStatus: string;

  constructor(
    private financeService: FinanceService,
    private modalService: NgbModal,
    private sharedService: SharedService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this._getJournal(this.selectedJournalId);
    this.sharedService.printStatus$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((status) => (this.printStatus = status));
  }

  public printJournal(filename): void {
    this.printStatus = "Processing";
    printFile(this.JournalPaper, filename, "journal").then((res) =>
      this.sharedService.printStatus$.next("Print")
    );
  }

  showJournalInfo(journalId: number): void {
    this.fetchingJournal = true;
    this._getJournal(journalId);
  }

  private _getJournal(journalId: number) {
    this.fetchingJournal = true;
    this.financeService
      .getJournal(journalId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.totalCredits = 0;
          this.totalDebits = 0;
          this.selectedJournal = res?.body.data;

          this.selectedJournal.journalLines.forEach((line) => {
            this.totalDebits += line.debitAmount;
            this.totalCredits += line.creditAmount;
          });
          this.fetchingJournal = false;
          this._getActivityLogs(this.selectedJournal.journalId);
        },
        () => {
          this.fetchingJournal = false;
        }
      );
  }

  private _getActivityLogs(journalId: number): void {
    this.financeService
      .getJournalActivityLogs(journalId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => (this.activityLogs = res.body));
  }

  close(): void {
    this.setIsSingleView.emit(false);
  }

  emitGetJournalsPaginatedSearch(pageSize, pageNumber): void {
    this.isLoading = true;
    this.getJournalsPaginatedSearch.emit({ pageSize, pageNumber });
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

  switchTabs(tab: string): void {
    switch (tab) {
      case "overview":
        $("#nav-overview").addClass("active-tab");
        $("#nav-activity,#nav-comments,#nav-files").removeClass("active-tab");

        $("#tab-overview").addClass("active show");
        $("#tab-activity,#tab-comments,#tab-files").removeClass("active show");
        break;

      case "comments":
        $("#nav-comments").addClass("active-tab");
        $("#nav-overview,#nav-activity,#nav-files").removeClass("active-tab");

        $("#tab-comments").addClass("active show");
        $("#tab-overview,#tab-activity,#tab-files").removeClass("active show");
        break;

      case "activity":
        $("#nav-activity").addClass("active-tab");
        $("#nav-overview,#nav-comments,#nav-files").removeClass("active-tab");

        $("#tab-activity").addClass("active show");
        $("#tab-overview,#tab-comments,#tab-files").removeClass("active show");
        break;

      case "files":
        $("#nav-files").addClass("active-tab");
        $("#nav-overview,#nav-comments,#nav-activity").removeClass(
          "active-tab"
        );

        $("#tab-files").addClass("active show");
        $("#tab-overview,#tab-comments,#tab-activity").removeClass(
          "active show"
        );
        break;
      default:
        break;
    }
  }

  submit(event?): void {
    const { transactionPin, ...rest } = event;
    const payload = {
      ...rest,
      journalId: this.selectedJournal.journalId,
    };
    this.approvalStatus = payload.status;
    let state: string;
    let message: string;
    switch (this.approvalStatus) {
      case "Posted":
        state = "Post";
        message = `Journal (${this.selectedJournal.journalCode}) Posted Successfully`;
        break;
      case "Redraft":
        state = "Redraft";
        message = `Journal (${this.selectedJournal.journalCode}) Redrafted Successfully`;
        break;
      case "Rejected":
        state = "Reject";
        message = `Journal (${this.selectedJournal.journalCode}) Rejected Successfully`;
        break;
      default:
        break;
    }
    Swal.fire({
      type: "info",
      text: `This Action Will ${state} this journal`,
      title: `${state} Journal`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.financeService
          .approveJournal(payload, transactionPin)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.loading = false;
              this.toast.fire({
                type: "success",
                text: message,
              });
              this.closeModal();
              this.setIsSingleView.emit(false);
              if (
                this.approvalStatus === "Posted" ||
                this.approvalStatus === "Rejected"
              ) {
                this.getJournalsPaginatedSearch.emit("closed");
              } else {
                this.getJournalsPaginatedSearch.emit("!Posted");
              }
              this.getJournalsPaginatedSearch.emit({
                pageSize: this.pagination.pageSize,
                pageNumber: this.pagination.pageNumber,
              });
            },
            (err) => {
              this.loading = false;
            }
          );
      }
    });
  }

  cloneJournal() {
    Swal.fire({
      type: "info",
      title: "Clone Journal?",
      text: `Are you sure you want to clone this Journal (${this.selectedJournal.journalCode})?`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Clone it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.router.navigateByUrl(
          `/finance/journals/${this.selectedJournal.journalId}/clone`
        );
      }
    });
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
