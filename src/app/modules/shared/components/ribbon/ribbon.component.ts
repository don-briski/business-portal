import { Component, OnInit, Input } from "@angular/core";

@Component({
  selector: "lnd-ribbon",
  templateUrl: "./ribbon.component.html",
  styleUrls: ["./ribbon.component.scss"],
})
export class RibbonComponent implements OnInit {
  @Input() status: string;
  @Input() paymentStatus?: string;
  constructor() {}

  ngOnInit(): void {}
}
