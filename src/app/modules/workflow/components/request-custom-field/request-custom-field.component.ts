import { Component, Input } from "@angular/core";
import { UntypedFormGroup, UntypedFormArray } from "@angular/forms";

import { CustomDropDown } from "src/app/model/CustomDropdown";

@Component({
  selector: "lnd-request-custom-field",
  templateUrl: "./request-custom-field.component.html",
  styleUrls: ["./request-custom-field.component.scss"],
})
export class RequestCustomFieldComponent {
  @Input() customField: UntypedFormGroup;
  @Input() customFieldIndex: number;

  getCustomFieldDataType(dType: string): string {
    let type = "";
    if (dType === "FreeText") type = "text";
    else if (dType === "Date") type = "date";
    else if (dType === "Number") type = "number";

    return type;
  }

  onCFieldSelect(event: CustomDropDown) {
    this.customField.get("value").setValue(event.text);
  }

  onCFieldDeselect() {
    this.customField.get("value").setValue("");
  }

  get customFieldSelections() {
    return this.customField.get("customFieldSelections") as UntypedFormArray;
  }

  getCFieldTansformedSelections(): CustomDropDown[] {
    return this.customFieldSelections.controls.map((selectn) => {
      return {
        id: selectn.get("uniqueId").value,
        text: selectn.get("label").value,
      };
    });
  }

  getSelectedOption(value: string): CustomDropDown[] {
    const selectn = this.getCFieldTansformedSelections().find((item) => {
      return item.text === value;
    });

    return selectn
      ? [
          {
            id: selectn.id,
            text: selectn.text,
          },
        ]
      : null;
  }
}
