import { Directive, HostListener } from "@angular/core";
import * as moment from "moment";
import Swal from "sweetalert2";

@Directive({
  selector: "[lndInvalidDateChecker]",
})
export class InvalidDateCheckerDirective {
  @HostListener("blur", ["$event.target"])
  public onBlur(input: HTMLInputElement) {
    const dateIsValid = moment(input.value).isValid();
    if (!dateIsValid) {
      Swal.fire({
        type: "error",
        text: "Invalid date entered or no date selected.",
      });
      input.value = "";
    }
  }
}
