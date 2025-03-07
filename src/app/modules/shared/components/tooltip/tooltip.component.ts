import { Component, Input } from "@angular/core";

@Component({
  selector: "lnd-tooltip",
  templateUrl: "./tooltip.component.html",
  styleUrls: ["./tooltip.component.scss"],
})
export class TooltipComponent {
  @Input() placement = "top";
  @Input() text: string;
  @Input() useProjection = false;
}
