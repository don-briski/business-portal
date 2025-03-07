import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { CheckoutAdminService } from "../../../checkout-admin.service";
import {
  BankCheckConfig,
  CreditAffordModeEnum,
} from "../../../checkout-admin.types";
import { User } from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-bank-check",
  templateUrl: "./bank-check.component.html",
  styleUrls: ["./bank-check.component.scss"],
})
export class BankCheckComponent implements OnInit, OnDestroy {
  @Input() config: BankCheckConfig;
  @Input() user: User;
  
  @Output() retrieveConfig = new EventEmitter();

  private subs$ = new Subject();

  mode = CreditAffordModeEnum.View;
  creditAffordModeEnum = CreditAffordModeEnum;
  hideHints = true;
  currentTheme: ColorThemeInterface;
  form = new FormGroup({
    bankStatementLengthMonths: new FormControl(null, [
      Validators.required,
      Validators.min(1),
    ]),
    bankSpoolRecencyThresholdInDays: new FormControl(null, [
      Validators.required,
      Validators.min(0),
    ]),
    bankCheckService: new FormControl("MBS", Validators.required),
  });
  isLoading = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private colorThemeService: ColorThemeService,
    private checkoutAdminService: CheckoutAdminService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.setInitialMode();
  }

  setInitialMode() {
    if (!this.config) {
      this.mode = CreditAffordModeEnum.None;
    }
  }

  patchForm() {
    this.form.patchValue({
      ...this.config
    });
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  submit() {
    this.isLoading = true;

    this.checkoutAdminService
      .configureBankCheck(this.form.value as BankCheckConfig)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        () => {
          this.retrieveConfig.emit(true);
          this.isLoading = false;
          this.toast.fire({
            type: "success",
            title: "Bank Check updated successfully!",
          });
          this.onModeChange(CreditAffordModeEnum.View);
        },
        () => (this.isLoading = false)
      );
  }

  onModeChange(value: CreditAffordModeEnum) {
    if (value === CreditAffordModeEnum.Edit) {
      this.patchForm();
    }

    this.mode = value;
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
