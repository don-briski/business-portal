import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConfigurationService } from "src/app/service/configuration.service";
import { map, pluck, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { LoadingState } from "../../shared/shared.types";
import { SharedModule } from "../../shared/shared.module";
import { ActivateSmsProvider } from "../models/sms-provider-info.interface";
import { SharedService } from "src/app/service/shared.service";
import Swal from "sweetalert2";
import { SmsSetupInterface } from "../models/sms-setup.interface";
import { SmsEventsInterface } from "../models/sms-events.interface";

@Component({
  selector: "lnd-sms-settings",
  standalone: true,
  imports: [
    CommonModule,
    Select2wrapperModule,
    ReactiveFormsModule,
    SharedModule,
  ],
  templateUrl: "./sms-settings.component.html",
  styleUrls: ["./sms-settings.component.scss"],
})
export class SmsSettingsComponent implements OnInit, OnDestroy {
  @Input() smsEvents: SmsEventsInterface;
  @Input() smsTemplateSyntaxStrings: string[];

  private unsubscribers$ = new Subject();

  form = new FormGroup({
    smsProvider: new FormControl([]),
  });

  smsProviders: CustomDropDown[] = [];
  activeSmsProviders = [];
  currentTheme: ColorThemeInterface;
  loadingState: LoadingState = { isLoading: false, text: "Processing..." };
  selectedSmsProvider: CustomDropDown[] = [];
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  invalidTemplates = [];
  activateSms = false;

  constructor(
    private configService: ConfigurationService,
    private colorThemeService: ColorThemeService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getSmsProviders();
    this.updateInvalidTemplates();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscribers$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private getSmsProviders() {
    this.loadingState.isLoading = true;
    this.activeSmsProviders = [];
    this.configService
      .getSmsProviders()
      .pipe(
        pluck("body"),
        map((activeProviders) =>
          activeProviders.map((activeProvider) => {
            if (activeProvider.isActive) {
              this.activeSmsProviders.push(activeProvider);
            }
            return {
              id: activeProvider.smsProviderName,
              text: activeProvider.smsProviderName,
            };
          })
        ),
        takeUntil(this.unsubscribers$)
      )
      .subscribe({
        next: (smsProviders) => {
          this.smsProviders = smsProviders;
          this.selectedSmsProvider = smsProviders.filter(
            (smsProvider) =>
              smsProvider.id === this.activeSmsProviders[0]?.smsProviderName
          );
          this.form.get("smsProvider").setValue(this.selectedSmsProvider);
          this.loadingState.isLoading = false;
          if (this.activeSmsProviders.length > 0) {
            this.activateSms = true;
          }
        },
        error: () => {
          this.loadingState.isLoading = false;
        },
      });
  }

  activateSmsProvider(isActive = true) {
    this.loadingState.isLoading = true;
    let payload = {
      isActive,
      activeSmsProviders: this.form.value.smsProvider[0]?.id,
    };
    this.configService
      .activateSmsProvider(payload as ActivateSmsProvider)
      .pipe(takeUntil(this.unsubscribers$))
      .subscribe({
        next: () => {
          const action = isActive ? "activated" : "deactivated"
          this.toast.fire({
            title:`SMS ${action} successfully`,
            type: "success",
            timer: 3000,
          });
          this.getSmsProviders();
        },
        error: () => {
          this.loadingState.isLoading = false;
        },
      });
  }

  toggleStatusSwitch(value: boolean, key: string) {
    this.smsEvents[key].IsActive = value;
  }

  setTemplate(value: string, key: string) {
    this.invalidTemplates = [];
    this.smsEvents[key].Template = value;
    this.updateInvalidTemplates();
  }

  updateInvalidTemplates() {
    for (const key in this.smsEvents) {
      if (this.smsEvents[key].Template.length > 160) {
        this.invalidTemplates.push(key);
      } else {
        this.invalidTemplates = this.invalidTemplates.filter(
          (template) => template !== key
        );
      }
    }
  }

  copyKey(value: string) {
    if (this.sharedService.copyToClipboard(value)) {
      this.toast.fire({
        title:
          "Copied to clipboard, you can paste it in the appropriate template now",
        type: "success",
        timer: 3000,
      });
    }
  }

  saveTemplates() {
    this.loadingState.isLoading = true;
    const payload: SmsSetupInterface = {
      sendSmsEvents: this.smsEvents,
    };
    this.configService
      .updateSmsSetup(payload)
      .pipe(takeUntil(this.unsubscribers$))
      .subscribe({
        next: () => {
          this.loadingState.isLoading = false;
        },
        error: () => {
          this.loadingState.isLoading = false;
        },
      });
  }

  toggleSms(value:boolean) {
    this.activateSms = value;
    if (!this.activateSms && this.activeSmsProviders.length > 0) {
      this.activateSmsProvider(this.activateSms);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribers$.next();
    this.unsubscribers$.complete();
  }
}
