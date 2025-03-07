import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { CustomFieldDataType } from "../../workflow.types";

@Component({
  selector: "lnd-custom-field",
  templateUrl: "./custom-field.component.html",
  styleUrls: ["./custom-field.component.scss"],
})
export class CustomFieldComponent {
  @Input() colorTheme: ColorThemeInterface;
  @Input() customFields?: UntypedFormArray;
  @Input() viewMode: false;

  @Output() remove = new EventEmitter<void>();

  dataTypes: CustomDropDown[] = [
    { id: "FreeText", text: "Free Text" },
    { id: "Date", text: "Date" },
    { id: "Number", text: "Number" },
    { id: "Selection", text: "Selection" },
    { id: "RadioGroup", text: "Radio Group" },
  ];

  statuses: CustomDropDown[] = [
    { id: 1, text: "Activated" },
    { id: 2, text: "Deactivated" },
  ];

  selectedCFieldIndex?: number;

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    if (this.viewMode) {
      this.customFields.controls.forEach((control) => {
        control.get("isRequired").disable({ onlySelf: true });
      });
    }
  }

  onAddCustomField() {
    const customField = this.fb.group({
      customFieldName: ["", Validators.required],
      dataType: ["", Validators.required],
      customFieldStatus: ["", Validators.required],
      customFieldDescription: [""],
      isRequired: [false],
      customFieldType: ["Users"],
      validationPattern: [""],
      valueLength: ["Short"],
    });

    this.customFields.push(customField);

    this.selectedCFieldIndex = this.customFields?.controls.length - 1;
  }

  onRemoveCustomField(index: number) {
    this.customFields.removeAt(index);
    this.selectedCFieldIndex = null;
  }

  onAddSelection(fieldIndex: number) {
    this.getSelections(fieldIndex)?.push(
      this.fb.group({
        label: ["", Validators.required],
      })
    );
  }

  onRemoveSelection(fieldIndex: number, selectnIndex: number) {
    this.getSelections(fieldIndex).removeAt(selectnIndex);
  }

  getSelections(fieldIndex: number) {
    return this.customFields
      .at(fieldIndex)
      .get("customFieldSelections") as UntypedFormArray;
  }

  onSelect(fieldName: string, index: number, event: CustomDropDown) {
    const customField = this.customFields.at(index) as UntypedFormControl;
    switch (fieldName) {
      case "status":
        customField.get("customFieldStatus").setValue(event.text);
        break;
      case "dataType":
        customField.get("dataType").setValue(event.id);

        if (event.id === "Selection" || event.id === "RadioGroup") {
          const cField = this.customFields.at(index) as UntypedFormGroup;
          cField.addControl(
            "customFieldSelections",
            this.fb.array([], Validators.required)
          );

          this.onAddSelection(index);
        }
        break;
    }
  }

  onDeselect(fieldName: string, index: number, event: CustomDropDown) {
    const customField = this.customFields.at(index) as UntypedFormControl;
    switch (fieldName) {
      case "status":
        customField.get("customFieldStatus").setValue("");
        break;
      case "dataType":
        customField.get("dataType").setValue("");

        const cField = this.customFields.at(index) as UntypedFormGroup;

        if (event.text === "Selection" || event.text === "RadioGroup") {
          this.getSelections(index).clear();
          cField.removeControl("customFieldSelections");
        }
        break;
    }
  }

  onSetIsRequired(value: boolean, index: number) {
    this.customFields.at(index).get("isRequired").setValue(value);
  }

  onExpandCustomField(index: number) {
    if (index === this.selectedCFieldIndex) {
      this.selectedCFieldIndex = null;
    } else {
      this.selectedCFieldIndex = index;
    }
  }

  getFormattedDataType(dT: CustomFieldDataType) {
    if (dT === "FreeText") return "Free Text";
    if (dT === "RadioGroup") return "Radio Group";
    else return dT;
  }
}
