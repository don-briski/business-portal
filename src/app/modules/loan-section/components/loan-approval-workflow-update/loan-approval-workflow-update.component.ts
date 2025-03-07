import { Component, Input } from "@angular/core";

@Component({
  selector: "lnd-loan-approval-workflow-update",
  templateUrl: "./loan-approval-workflow-update.component.html",
  styleUrls: ["./loan-approval-workflow-update.component.scss"],
})
export class LoanApprovalWorkflowUpdateComponent {
  @Input() level: string;
  @Input() status: string;
}
