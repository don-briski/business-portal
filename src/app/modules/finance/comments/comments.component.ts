import { Component, Input, OnInit } from "@angular/core";
interface Comment {
  name: string;
  comment: string;
  dateCreated: string;
}
@Component({
  selector: "app-comments",
  templateUrl: "./comments.component.html",
  styleUrls: ["./comments.component.scss"],
})
export class CommentsComponent implements OnInit {
  @Input() comments: Comment[] = [];
  @Input() caller: "addEdit" | "singleView" | "" = "";

  constructor() {}

  ngOnInit(): void {}
}
