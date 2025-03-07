import { Component, Input } from "@angular/core";
import { Approval } from "../../workflow.types";

@Component({
  selector: "lnd-approval-history",
  templateUrl: "./approval-history.component.html",
  styleUrls: ["./approval-history.component.scss"],
})
export class ApprovalHistoryComponent {
  @Input() approvals: Approval[] = [];
}
