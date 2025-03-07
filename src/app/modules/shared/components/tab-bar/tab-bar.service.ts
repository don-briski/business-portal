import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { TabSwitch } from "src/app/modules/shared/shared.types";

@Injectable({
  providedIn: "root",
})
export class TabBarService {
  tabSwitched = new Subject<TabSwitch>();
}
