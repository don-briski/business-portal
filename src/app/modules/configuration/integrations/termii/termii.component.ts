import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { CommonModule, NgClass } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { SharedModule } from "src/app/modules/shared/shared.module";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ConfigurationService } from "src/app/service/configuration.service";
import { takeUntil } from "rxjs/operators";
import { Integration } from "src/app/model/configuration";

@Component({
  selector: "lnd-termii",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, NgClass],
  templateUrl: "./termii.component.html",
  styleUrls: ["./termii.component.scss"],
})
export class TermiiComponent implements OnInit, OnDestroy {
  @Input() currentTheme: ColorThemeInterface;
  @Input() config: Integration;

  @Output() getAllIntegrations = new EventEmitter();

  private unsubscriber$ = new Subject();

  isLoading = false;

  form = new FormGroup({
    integrationId: new FormControl("", Validators.required),
    apiSecretKey: new FormControl("", Validators.required),
    senderId: new FormControl("", Validators.required),
    useApiKey: new FormControl(false, Validators.required),
    isActive: new FormControl(false, Validators.required),
  });

  constructor(private configService: ConfigurationService) {}

  ngOnInit(): void {
    this.config?.id && this.initForm();
  }

  private initForm() {
    this.form.patchValue({
      integrationId: this.config.id as unknown as string,
      apiSecretKey: this.config.apiSecretKey,
      senderId: this.config.extraInfo?.senderId,
      useApiKey: this.config.extraInfo?.useApiKey,
      isActive: this.config.isActive,
    });
  }

  toggleSwitch(ctrlKey: string, value: boolean) {
    this.form.get(ctrlKey).setValue(value);
  }

  updateConfig() {
    this.isLoading = true;
    const { senderId, useApiKey, ...rest } = this.form.value;
    const payload = {
      ...rest,
      integrationExtraInfoDto: { senderId, useApiKey },
    };
    this.configService
      .updateIntegration(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.getAllIntegrations.emit();
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
