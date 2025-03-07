import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Observable, Subject, forkJoin } from "rxjs";
import { map, pluck, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ConfigurationService } from "src/app/service/configuration.service";
import Swal from "sweetalert2";
import { WebhookConfig } from "../../models/notifications.interface";

type Sources = {
  updateWebhook?: "post" | "update";
  events?: boolean;
  activate?: boolean;
};

interface WebhookForm {
  webhookUrl?: FormControl<string | null>;
  events?: FormControl<string[] | null>;
  selectedEvents?: FormControl<{ id: string; text: string }[] | null>;
  activate?: FormControl<boolean | null>;
}

@Component({
  selector: "lnd-notifications",
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.scss"],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Input() primaryColor: string;

  private subs$ = new Subject();
  isLoading = false;
  webhookUrl = "";
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  showEvents = false;
  config: WebhookConfig;
  availableEvents: CustomDropDown[] = [];
  selectedEvents: string[] = [];
  sources: Sources = {};
  webhookForm: FormGroup<WebhookForm>;
  dropdownToggled = false;
  registering:boolean = false;

  constructor(private configService: ConfigurationService) {}

  ngOnInit(): void {
    this.getWebhookConfig();
    this.getWebhookEvents();
    this.initForm();
  }

  private initForm() {
    this.webhookForm = new FormGroup<WebhookForm>({
      webhookUrl: new FormControl(null),
      events: new FormControl(null),
      selectedEvents: new FormControl(null),
      activate: new FormControl(false),
    });

    this.webhookForm
      .get("selectedEvents")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((events) => {
        if (events) {
          const eventIds = events.map((event) => event?.id);
          this.webhookForm.get("events").setValue(eventIds);
        }
      });
  }

  private getWebhookEvents() {
    this.configService
      .getWebhookEvents()
      .pipe(
        pluck("body", "data"),
        map((events) => {
          return events.map((event) => {
            return { id: event, text: event.split("_").join(" ") };
          });
        }),
        takeUntil(this.subs$)
      )
      .subscribe((events) => {
        this.availableEvents = events;
      });
  }

  private getWebhookConfig() {
    this.isLoading = true;
    this.configService
      .getWebhookConfig()
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe((config:WebhookConfig) => {
        this.config = config;
        const selectedEvents = this.config?.subscriptions.map((ev) => ({
          id: ev,
          text: ev.split("_").join(" "),
        }));
        this.webhookForm.patchValue({
          webhookUrl: this.config?.webhookUrl,
          events: this.config?.subscriptions,
          selectedEvents,
          activate: this.config?.activated,
        });
        this.isLoading = false;
        this.sources.updateWebhook && delete this.sources.updateWebhook;
        this.sources.events && delete this.sources.events;
        this.sources.activate && delete this.sources.activate;
      });
  }

  addEvent(event: CustomDropDown) {
    if (!this.selectedEvents.find((selEvent) => selEvent === event?.id)) {
      this.selectedEvents.push(event.id as string);
    }
  }

  removeEvent(event: CustomDropDown) {
    this.selectedEvents = this.selectedEvents.filter((ev) => ev === event?.id);
  }

  activateDeactivateNotifications(activate: boolean) {
    this.webhookForm.get("activate").setValue(activate);
  }

  arraysAreDifferent(arr1, arr2) {
    if (arr1?.length !== arr2?.length) {
      return true;
    }

    for (let i = 0; i < arr1?.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return true;
      }
    }

    return false;
  }

  private registerUpdateWebhook(){
    if (this.sources.updateWebhook === "post") {
      this.registering = true;
      this.configService.registerWebhookUrl({webhookUrl: this.webhookForm.get("webhookUrl").value}).pipe(takeUntil(this.subs$)).subscribe(() => {
        this.isLoading = false;

        this.toast.fire({
          title: "Webhook URL configured successfully",
          type: "success",
        });

        this.activateDeactivateNotification();
      },()=> this.isLoading = false)
    }

    if (this.sources.updateWebhook === "update") {
      this.configService.updateWebhookUrl({webhookUrl: this.webhookForm.get("webhookUrl").value}).pipe(takeUntil(this.subs$)).subscribe(() => {
        this.isLoading = false;

        this.toast.fire({
          title: "Webhook URL configured successfully",
          type: "success",
        });
        this.getWebhookConfig();

      },()=> this.isLoading = false)
    }
  }

  private activateDeactivateNotification(){
    if (this.sources.activate) {
      this.configService.activateDeactivateWebhook({activate:this.webhookForm.value.activate}).pipe(takeUntil(this.subs$)).subscribe(() => {
        this.isLoading = false;
        this.toast.fire({
          title: `${
            this.webhookForm.value.activate ? "Activated" : "Deactivated"
          } successfully`,
          type: "success",
        });
        if (this.sources.updateWebhook === "post") {
          this.subscribeToEvents();
        }else{
          this.getWebhookConfig();
        }
        if (!this.config.activated && this.sources.updateWebhook === 'update') {
          this.registerUpdateWebhook()
        }
      },()=> this.isLoading = false)
    }
  }


  private subscribeToEvents() {
    if (this.sources.events) {
      this.configService
        .subscribeToWebhookEvent({ events: this.webhookForm.value.events })
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.isLoading = false;
            this.toast.fire({
              title: "Subscription successful",
              type: "success",
            });

            this.getWebhookConfig();
            if (this.sources.updateWebhook === "post") {
              this.registering = false;
            }
          },
          () => (this.isLoading = false)
        );
    }
  }

  //track variables that changes to determine endpoint to call
  setChangedVariables(){
    if (
      this.webhookForm.value.webhookUrl !== this.config?.webhookUrl &&
      this.webhookForm.value.webhookUrl
    ) {
      this.sources.updateWebhook = !this.config.appId
        ? "post"
        : "update";
    }

    if (this.webhookForm.value.activate !== this.config?.activated) {
      this.sources.activate = true;
    }

    if (
      this.arraysAreDifferent(
        this.webhookForm.value.events,
        this.config?.subscriptions
      )
    ) {
      this.sources.events = true
    }

    if (
      this.webhookForm.value.webhookUrl === this.config?.webhookUrl &&
      !this.arraysAreDifferent(
        this.webhookForm.value.events,
        this.config?.subscriptions
      ) &&
      this.webhookForm.value.activate === this.config?.activated
    ) {
      this.isLoading = false;
      Swal.fire({
        title: "No changes detected!",
        type: "info",
      });
    }
  }

  submit() {
    this.isLoading = true;
    this.setChangedVariables();

    //call first only on first registration
    !this.config.appId && this.registerUpdateWebhook();

    if (!this.registering && (this.sources.updateWebhook === "update" || this.sources.activate || this.sources.events)) {
      this.activateDeactivateNotification();
      this.subscribeToEvents();
    }
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
