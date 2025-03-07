import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Integration } from "src/app/model/configuration";
import { ConfigurationService } from "src/app/service/configuration.service";
@Component({
  selector: "lnd-dojah-setup",
  templateUrl: "./dojah-setup.component.html",
  styleUrls: ["./dojah-setup.component.scss"],
})
export class DojahSetupComponent implements OnInit, OnDestroy {
  @Input() currentTheme: ColorThemeInterface;
  @Input() dojahSetup:Integration;

  @Output() getAllIntegrations = new EventEmitter();

  private subs$ = new Subject<void>();
  form: FormGroup;
  // dojahSetup: Integration;
  isGettingSetup = false;
  isUpdatingSetup = false;
  isUpdatingStatus = false;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });

  constructor(private configService: ConfigurationService) {}

  ngOnInit(): void {
    this.initForm();
    this.initForm(this.dojahSetup);
  }

  initForm(initialData?: Integration): void {
    this.form = new FormGroup({
      id: new FormControl(initialData?.id || "", Validators.required),
      apiSecretKey: new FormControl(
        initialData?.apiSecretKey || "",
        Validators.required
      ),
      isActive: new FormControl(
        initialData?.isActive !== undefined && initialData?.isActive !== null
          ? initialData.isActive
          : false,
        Validators.required
      ),
      integrationExtraInfoDto: new FormGroup({
        appId: new FormControl(
          initialData?.extraInfo?.appId || "",
          Validators.required
        ),
      }),
    });
  }

  onUpdateStatus(isActive: boolean) {
    this.form.get("isActive").setValue(isActive);
    this.isUpdatingStatus = true;

    const data = this.form.value;
    data["integrationId"] = this.dojahSetup.id;
    this.configService
      .updateIntegration(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: () => {
          this.toast.fire({
            type: "success",
            title: `Dojah payment method has been ${
              isActive ? "activated" : "deactivated"
            }.`,
          });
          this.getAllIntegrations.emit();
          this.isUpdatingStatus = false;
        },
        error: () => (this.isUpdatingStatus = false),
      });
  }

  updateSetup() {
    this.isUpdatingSetup = true;

    const data = this.form.value;
    data["integrationId"] = this.dojahSetup.id;
    this.configService
      .updateIntegration(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: () => {
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
          this.getAllIntegrations.emit();
          this.isUpdatingSetup = false;
        },
        error: () => (this.isUpdatingSetup = false),
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
