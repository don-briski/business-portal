import { AbstractControl, ValidationErrors } from "@angular/forms";

export function isValidEmail(email: string) {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
}

export function getInputErrors(
  label: string,
  control: AbstractControl | null,
  custom?: { key: string; message: string }
): string[] {
  const { touched, dirty, errors } = control!;
  const errMsgs: string[] = [];
  if ((touched || dirty) && errors) {
    if (errors["required"]) {
      errMsgs.push(`${label} is required`);
    }

    if (errors["minlength"]) {
      errMsgs.push(
        `${label} should be at least ${errors["minlength"]["requiredLength"]} characters`
      );
    }

    if (errors["maxlength"]) {
      errMsgs.push(
        `${label} should be at most ${errors["maxlength"]["requiredLength"]} characters`
      );
    }

    if (errors["min"]) {
      errMsgs.push(`${label} can't be less than ${errors["min"]["min"]}`);
    }

    if (errors["max"]) {
      errMsgs.push(`${label} can't be greater than ${errors["max"]["max"]}`);
    }

    if (errors["pattern"]) {
      errMsgs.push(
        custom.message ? custom.message : `${label} isn't in the right format`
      );
    }

    if (errors["email"]) {
      errMsgs.push(`${label} is invalid`);
    }

    if (errors["zeroValue"]) {
      errMsgs.push(`${label} must be greater than Zero(0)`);
    }

    if (errors["isGreater"] || errors["isLesser"]) {
      errMsgs.push(errors["msg"]);
    }

    if (custom && errors[custom.key]) {
      errMsgs.push(custom.message);
    }
  }

  return errMsgs;
}

export function nonZero(control: AbstractControl): ValidationErrors | null {
  if (control.value === 0) {
    return { zeroValue: "Value should be greater than 0" };
  } else {
    return null;
  }
}

export function accountNumber(
  control: AbstractControl
): ValidationErrors | null {
  const integerOnlyPattern = /^\d+$/;
  if (!integerOnlyPattern.test(control.value)) {
    return { invalidAccountNumber: "Should only contain integers from 0-9" };
  } else if (control.value.length > 10 || control.value.length < 10) {
    return {
      invalidAccountNumber: "Account Number should be exactly 10 characters",
    };
  } else {
    return null;
  }
}
