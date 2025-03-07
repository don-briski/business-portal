import { Component, Input } from "@angular/core";

import { LoanWithApprovalReview } from "../../loan.types";

@Component({
  selector: "lnd-approval-comment",
  templateUrl: "./approval-comment.component.html",
  styleUrls: ["./approval-comment.component.scss"],
})
export class ApprovalCommentComponent {
  @Input() review: LoanWithApprovalReview;
}
