import { Component, Input } from "@angular/core";

import { CustomField, CustomForm } from "../../workflow.types";

@Component({
  selector: "lnd-request-preview",
  templateUrl: "./request-preview.component.html",
  styleUrls: ["./request-preview.component.scss"],
})
export class RequestPreviewComponent {
  @Input() configName: string;
  @Input() configType: string;
  @Input() requireSupportingDocument: boolean;
  @Input() customForm: CustomForm;

  selectedCFSetIndex: number;

  onExpandCFSet(index: number) {
    if (index === this.selectedCFSetIndex) {
      this.selectedCFSetIndex = null;
    } else {
      this.selectedCFSetIndex = index;
    }
  }

  getCustomFieldDataType(dataType: string): string {
    let nativeType = "";
    if (dataType === "FreeText") nativeType = "text";
    else if (dataType === "Date") nativeType = "date";
    else if (dataType === "Number") nativeType = "number";

    return nativeType;
  }

  getSelectionsLabels(customField: CustomField): string[] {
    return customField.customFieldSelections.map((selection) => {
      return selection.label;
    });
  }
}
