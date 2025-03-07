import { Component, Input } from "@angular/core";
import { UntypedFormArray, UntypedFormBuilder, Validators } from "@angular/forms";

import { ColorThemeInterface } from "../../../../model/color-theme.interface";

@Component({
  selector: "lnd-custom-field-set",
  templateUrl: "./custom-field-set.component.html",
  styleUrls: ["./custom-field-set.component.scss"],
})
export class CustomFieldSetComponent {
  @Input() colorTheme: ColorThemeInterface;
  @Input() customFieldSets: UntypedFormArray;
  @Input() customFormKey: string;
  @Input() viewMode: false;

  selectedCFSetIndex: number;

  constructor(private fb: UntypedFormBuilder) {}

  onAddCustomFieldSet() {
    const cFieldSet = this.fb.group({
      customFieldSetName: ["", Validators.required],
      customFieldSetNotes: [""],
      customFieldSetType: ["WorkFlowRequest"],
      usage: ["Standard"],
      customFormKey: [this.customFormKey || ""],
      customFields: this.fb.array([]),
    });

    this.customFieldSets.push(cFieldSet);

    this.selectedCFSetIndex = this.customFieldSets?.controls.length - 1;
  }

  onExpandCFSet(index: number) {
    if (index === this.selectedCFSetIndex) {
      this.selectedCFSetIndex = null;
    } else {
      this.selectedCFSetIndex = index;
    }
  }

  onRemoveCustomFieldSet(index: number) {
    this.customFieldSets.removeAt(index);
  }
}
