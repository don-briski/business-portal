import { Component, Input } from "@angular/core";

import { getInputErrors } from "src/app/util/validators/validators";

@Component({
  selector: "lnd-input-errors",
  template: `<span
    class="text-danger error-text d-block mt-1"
    *ngFor="let errMsg of inputErrors(label, control!, custom)"
    >{{ errMsg | titlecase }}</span
  >`,
  styleUrls: ["./input-errors.component.scss"],
})
export class InputErrorsComponent {
  @Input() control!: any;
  @Input() label!: string;
  @Input() custom?: { key: string; message: string };

  inputErrors = getInputErrors;
}
