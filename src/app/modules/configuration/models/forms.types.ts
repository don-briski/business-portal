import { FormControl, FormGroup } from "@angular/forms";

export type SetupForm = {
  id: FormControl<number>;
  apiSecretKey: FormControl<string>;
  clientAccountNumber: FormControl<string>;
  emailAddress: FormControl<string>;
  integrationName: FormControl<string>;
  isActive: FormControl<boolean>;
  integrationExtraInfoDto?: FormGroup<{
    username: FormControl<string>;
    password: FormControl<string>;
  }>;
};
