import { Component, Input } from "@angular/core";

@Component({
  selector: "lnd-payables-receivables",
  templateUrl: "./payables-receivables.component.html",
  styleUrls: ["./payables-receivables.component.scss"],
})
export class PayablesReceivablesComponent {
  @Input() outstandingPayables: number = 0;
  @Input() outstandingReceivables: number = 0;
  @Input() unusedCredits: number = 0;
  @Input() currencySymbol: string;
  @Input() type: "payables" | "receivables";
}
