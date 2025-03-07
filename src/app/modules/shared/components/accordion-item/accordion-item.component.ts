import { Component, Input } from "@angular/core";

@Component({
  selector: "lnd-accordion-item",
  templateUrl: "./accordion-item.component.html",
  styleUrls: ["./accordion-item.component.scss"],
})
export class AccordionItemComponent {
  @Input() title: string;
  @Input() value: string;
  @Input() type: string;
  @Input() primaryColor: string;
  @Input() bgColor: string;
  @Input() tooltip?: string;
  @Input() showValueAsPill = false;
  @Input() trailing?: string;
  @Input() trailingClass = "";
  @Input() useTitleCasePipe = true;
  @Input() containerStyle = { margin: "20px 100px 20px 0" };
}
