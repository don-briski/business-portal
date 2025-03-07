import { Component } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "lnd-loan-reassignment-error",
  templateUrl: "./loan-reassignment-error.component.html",
  styleUrls: ["./loan-reassignment-error.component.scss"],
})
export class LoanReassignmentErrorComponent {
  constructor(private readonly modalService: NgbModal) {}

  onClose() {
    this.modalService.dismissAll();
  }
}
