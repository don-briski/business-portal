import { Component, Input } from "@angular/core";

@Component({
  selector: "lnd-check-icon",
  templateUrl: "./check-icon.component.html",
  styleUrls: ["./check-icon.component.scss"],
})
export class CheckIconComponent {
  @Input() circleSize = "16px";
  @Input() checkIconSize = "10px";
  @Input() tooltip = '';
}
