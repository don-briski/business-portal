import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CheckoutAdminService } from "../../../checkout-admin.service";
import {
  AccSweeperCipherReqBody,
  CreditAffordModeEnum,
} from "../../../checkout-admin.types";
import { User } from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-sweeper-cipher",
  templateUrl: "./sweeper-cipher.component.html",
  styleUrls: ["./sweeper-cipher.component.scss"],
})
export class SweeperCipherComponent implements OnInit, OnDestroy {
  @Input() config: AccSweeperCipherReqBody;
  @Input() user: User;

  @Output() retrieveConfig = new EventEmitter();

  private subs$ = new Subject();

  creditAffordModeEnum = CreditAffordModeEnum;
  mode = CreditAffordModeEnum.View;
  hideHints = true;
  currentTheme: ColorThemeInterface;
  form = new FormGroup({
    daysPostSalary: new FormControl(null, [
      Validators.required,
      Validators.min(1),
    ]),
    balanceThreshold: new FormControl(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    sweeperThreshold: new FormControl(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    sweepPeriodCheck: new FormControl(null, [
      Validators.required,
      Validators.min(1),
    ]),
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
    this.form.patchValue(this.config);
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
      .configureAccSweeperCipher(this.form.value as AccSweeperCipherReqBody)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.retrieveConfig.emit();
          this.isLoading = false;
          this.toast.fire({
            type: "success",
            title: "Sweeper cipher updated successfully!",
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
