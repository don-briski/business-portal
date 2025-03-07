import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "lnd-aside",
  templateUrl: "./aside.component.html",
  styleUrls: ["./aside.component.scss"],
})
export class AsideComponent {
  @Output() closeAside = new EventEmitter();
  @Input() isOpen = false;
  @Input() shrinkWidth = false;
  @Input() usesCustomHeader = false;
  @Input() useCustomHeader = false;

  onCloseAside() {
    this.closeAside.next();
  }
}
