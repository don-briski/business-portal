import { Component, Input } from "@angular/core";
import { UntypedFormArray } from "@angular/forms";

@Component({
  selector: "lnd-request-custom-field-sets",
  templateUrl: "./request-custom-field-sets.component.html",
  styleUrls: ["./request-custom-field-sets.component.scss"],
})
export class RequestCustomFieldSetsComponent {
  @Input() customFieldSets: UntypedFormArray;

  selectedCFSetIndex: number;

  onExpandCFSet(index: number) {
    if (index === this.selectedCFSetIndex) {
      this.selectedCFSetIndex = null;
    } else {
      this.selectedCFSetIndex = index;
    }
  }
}
