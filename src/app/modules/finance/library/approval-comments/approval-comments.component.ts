import { Component, Input } from "@angular/core";

import { Comment } from "src/app/model/comment";

@Component({
  selector: "lnd-approval-comments",
  templateUrl: "./approval-comments.component.html",
})
export class ApprovalCommentsComponent {
  @Input() comments: Comment[] = [];
}
