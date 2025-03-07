import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "lnd-popup",
  templateUrl: "./popup.component.html",
  styleUrls: ["./popup.component.scss"],
})
export class PopupComponent {
  @Input() togglePopup: boolean;
  @Input() title?: string;
  @Input() icon: string;
  @Input() type: "report" | "default" | "aside" | "filter" = "default";
  @Input() size: "small" | "medium" | "large" = "small";
  @Input() hideFooter = false;
  @Input() useMaxHeight = false;
  @Input() customTableTopPosition = false;

  @Output() closePopup = new EventEmitter();
}
