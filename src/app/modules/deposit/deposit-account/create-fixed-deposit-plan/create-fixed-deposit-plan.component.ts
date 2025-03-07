import { Component, OnInit, OnDestroy } from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ConfigurationService } from "src/app/service/configuration.service";
import { DepositService } from "src/app/service/deposit.service";

@Component({
  selector: "app-create-fixed-deposit-plan",
  templateUrl: "./create-fixed-deposit-plan.component.html",
  styleUrls: ["./create-fixed-deposit-plan.component.scss"],
})
export class CreateFixedDepositPlanComponent implements OnInit, OnDestroy {
  subs$ = new Subject<void>();
  appOwner: any;
  gettingAppOwner = false;
  colorTheme: ColorThemeInterface;

  form: UntypedFormGroup;
  creating = false;

  constructor(
    private configService: ConfigurationService,
    private themeService: ColorThemeService,
    private depositService: DepositService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getAppOwnerDetails();
    this.initForm();
  }

  loadTheme(): void {
    this.themeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.colorTheme = res;
      });
  }

  getAppOwnerDetails() {
    this.gettingAppOwner = true;
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.appOwner = res.body;
          this.gettingAppOwner = false;
        },
        error: () => {
          this.gettingAppOwner = false;
        },
      });
  }

  initForm() {
    this.form = new UntypedFormGroup({
      openingBalance: new UntypedFormControl("", Validators.required),
      termLength: new UntypedFormControl("", [
        Validators.required,
        Validators.min(30),
        Validators.max(90),
      ]),
      depositSource: new UntypedFormControl("", Validators.required),
      description: new UntypedFormControl("", Validators.required),
    });
  }

  onSubmit() {
    this.creating = true;
    return this.depositService
      .createFixedDepositAccount(this.form.value)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.creating = false;
        },
        error: () => {
          this.creating = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
