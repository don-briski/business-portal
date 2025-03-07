import { Component, Input } from "@angular/core";

import { Tab } from "../../shared.types";

@Component({
  selector: "lnd-tab-bar",
  templateUrl: "./tab-bar.component.html",
  styleUrls: ["./tab-bar.component.scss"],
})
export class TabBarComponent {
  @Input() tabs: Tab[] = [];
  @Input() currentTabId = "";
  @Input() classes = "";
  @Input() tabBarId = "";
}
