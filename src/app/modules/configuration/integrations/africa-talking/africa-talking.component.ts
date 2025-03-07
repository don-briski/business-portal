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
  selector: 'lnd-africa-talking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, NgClass],
  templateUrl: './africa-talking.component.html',
  styleUrls: ['./africa-talking.component.scss']
})
export class AfricaTalkingComponent  implements OnInit, OnDestroy {
  @Input() currentTheme: ColorThemeInterface;
  @Input() config: Integration;

  @Output() getAllIntegrations = new EventEmitter();

  private unsubscriber$ = new Subject();

  isLoading = false;

  form = new FormGroup({
    integrationId: new FormControl("", Validators.required),
    apiSecretKey: new FormControl("", Validators.required),
    senderId: new FormControl("", Validators.required),
    username: new FormControl("", Validators.required),
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
      username: this.config.extraInfo?.username,
      isActive: this.config.isActive,
    });
  }

  toggleSwitch(ctrlKey: string, value: boolean) {
    this.form.get(ctrlKey).setValue(value);
  }

  updateConfig() {
    this.isLoading = true;
    const { senderId, username, ...rest } =
      this.form.value;
    const payload = {
      ...rest,
      integrationExtraInfoDto: { senderId, username },
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
