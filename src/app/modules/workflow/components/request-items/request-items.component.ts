import { Component, Input } from "@angular/core";
import { RequestItem } from "../../workflow.types";

@Component({
  selector: "lnd-request-items",
  templateUrl: "./request-items.component.html",
  styleUrls: ["./request-items.component.scss"],
})
export class RequestItemsComponent {
  @Input() items?: RequestItem[];

  get itemsAmount() {
    return this.items
      ?.map((item) => item.amount * item.quantity)
      .reduce((a, b) => a + b, 0);
  }
}
