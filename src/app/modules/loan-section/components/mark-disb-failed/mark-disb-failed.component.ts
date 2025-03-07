import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { DisbursementFailed, UpdateDisbFailed } from "../../loan.types";
import Swal from "sweetalert2";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "lnd-mark-disb-failed",
  templateUrl: "./mark-disb-failed.component.html",
  styleUrls: ["./mark-disb-failed.component.scss"],
})
export class MarkDisbFailedComponent implements OnInit, OnDestroy {
  @Input() currencySymbol: string;
  @Input() disbursements: DisbursementFailed[];
  @Input() secondaryColor: string;
  @Input() currentview: string;

  @Output() closeModal = new EventEmitter<boolean>();
  @Output() fetchLoans = new EventEmitter<string>();

  isLoading = false;
  loanCodeType: string;
  private subs$ = new Subject();

  constructor(private loanOperations: LoanoperationsService) {}

  disbursementsFailed: UpdateDisbFailed = { updateDisbursementFailedDtos: [] };
  description: string;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  ngOnInit(): void {
    this.disbursements[0]?.stage === "loan" ? this.loanCodeType = "Loan Code" : this.loanCodeType = "Loan Application";
  }

  setDisbFailedDescription(description: string) {
    this.description = description;
  }

  submit() {
    Swal.fire({
      type: "info",
      text: "Are you sure you want to proceed with this action ?",
      title: "Mark Disbursement As Failed",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Yes, Mark As Failed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.disbursements.forEach((disbursement) => {
          this.disbursementsFailed.updateDisbursementFailedDtos = [
            ...this.disbursementsFailed.updateDisbursementFailedDtos,
            {
              loanId: disbursement?.loanId,
              briefDescription: this.description,
            },
          ];
        });

        this.isLoading = true;

        this.loanOperations
          .markDisbursementAsFailed(this.disbursementsFailed)
          .pipe(takeUntil(this.subs$))
          .subscribe(
            () => {
              this.isLoading = false;
              this.toast.fire({
                type: "success",
                title: "Disbursements were successfully marked as Failed",
              });
              this.fetchLoans.emit(this.currentview);
              this.closeModal.emit();
            },
            () => (this.isLoading = false)
          );
      }
    });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
