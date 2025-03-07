import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "lnd-accordion",
  templateUrl: "./accordion.component.html",
  styleUrls: ["./accordion.component.scss"],
})
export class AccordionComponent implements OnInit {
  @Input() title: string;
  @Input() subTitle?: string;
  @Input() subtitleMeta?: string;
  @Input() trailing?: string;
  @Input() trailingClass = "";
  @Input() accordionId: string;
  @Input() open: boolean;
  @Input() accordionClass = "";

  caret: string;
  opened: boolean;

  ngOnInit(): void {
    this.open
      ? (this.caret = "assets/images/caret-down.svg")
      : (this.caret = "assets/images/caret-right.svg");
    this.opened = this.open;
  }

  onToggle() {
    this.caret === "assets/images/caret-down.svg"
      ? (this.caret = "assets/images/caret-right.svg")
      : (this.caret = "assets/images/caret-down.svg");
    this.opened = !this.opened;
  }
}
