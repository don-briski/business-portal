import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
  CreditAffordModeEnum,
  NarrationCipherReqBody,
} from "../../../checkout-admin.types";
import { CheckoutAdminService } from "../../../checkout-admin.service";
import Swal from "sweetalert2";
import { lightenColor } from "src/app/modules/shared/helpers/generic.helpers";
import { User } from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-narration-cipher",
  templateUrl: "./narration-cipher.component.html",
  styleUrls: ["./narration-cipher.component.scss"],
})
export class NarrationCipherComponent implements OnInit, OnDestroy {
  @Input() config: NarrationCipherReqBody;
  @Input() user: User;

  @Output() retrieveConfig = new EventEmitter();

  private subs$ = new Subject();

  mode = CreditAffordModeEnum.View;
  creditAffordModeEnum = CreditAffordModeEnum;
  hideHints = true;
  currentTheme: ColorThemeInterface;
  narrationCipherForm = new FormGroup({
    checkCipher: new FormControl(false, Validators.required),
    periodThreshold: new FormControl(null, [
      Validators.required,
      Validators.min(1),
    ]),
    targetWords: new FormControl(null, Validators.required),
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

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  setInitialMode() {
    if (!this.config) {
      this.mode = CreditAffordModeEnum.None;
    }
  }

  patchForm() {
    this.narrationCipherForm.patchValue({
      ...this.config,
      targetWords: this.config.targetWords[0],
    });
  }

  toggleSwitch(value: boolean) {
    this.narrationCipherForm.get("checkCipher").setValue(value);
  }

  submit() {
    this.isLoading = true;
    this.checkoutAdminService
      .configureNarrationCipher({
        ...this.narrationCipherForm.value,
        targetWords: [this.narrationCipherForm.value.targetWords],
      } as NarrationCipherReqBody)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        () => {
          this.retrieveConfig.emit();
          this.isLoading = false;
          this.toast.fire({
            type: "success",
            title: "Narration Cipher updated successfully!",
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

  getLightenedColor(color: string) {
    return lightenColor(color, 170);
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
