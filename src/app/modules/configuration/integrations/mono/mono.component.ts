import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import { CommonModule, NgClass } from "@angular/common";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Integration } from "src/app/model/configuration";
import { Subject } from "rxjs";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ConfigurationService } from "src/app/service/configuration.service";
import { takeUntil } from "rxjs/operators";
import { SharedModule } from "src/app/modules/shared/shared.module";

@Component({
  selector: "lnd-mono",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, NgClass],
  templateUrl: "./mono.component.html",
  styleUrls: ["./mono.component.scss"],
})
export class MonoComponent implements OnInit, OnDestroy {
  @Input() currentTheme: ColorThemeInterface;
  @Input() config: Integration;

  @Output() getAllIntegrations = new EventEmitter();

  private unsubscriber$ = new Subject();

  isLoading = false;

  form = new FormGroup({
    integrationId: new FormControl("", Validators.required),
    apiSecretKey: new FormControl("", Validators.required),
    apiPublicKey: new FormControl("", Validators.required),
    senderName: new FormControl("", Validators.required),
    isActive: new FormControl(false, Validators.required),
    webHookSecret: new FormControl("", Validators.required)
  });

  constructor(private configService: ConfigurationService) {}

  ngOnInit(): void {
    this.config?.id && this.initForm();
  }

  private initForm() {
    this.form.patchValue({
      integrationId: this.config.id as unknown as string,
      apiSecretKey: this.config.apiSecretKey,
      apiPublicKey: this.config.apiPublicKey,
      senderName: this.config.extraInfo?.senderName,
      isActive: this.config.isActive,
      webHookSecret: this.config.extraInfo?.webHookSecret
    });
  }

  toggleSwitch(ctrlKey: string, value: boolean) {
    this.form.get(ctrlKey).setValue(value);
  }

  updateConfig() {
    this.isLoading = true;
    const { senderName,webHookSecret, ...rest } = this.form.value;
    const payload = {
      ...rest,
      integrationExtraInfoDto: { senderName, webHookSecret },
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
