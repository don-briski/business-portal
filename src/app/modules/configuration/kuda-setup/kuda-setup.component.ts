import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  FormControl,
  FormGroup,
  UntypedFormBuilder,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ConfigurationService } from "src/app/service/configuration.service";
import { accountNumber } from "src/app/util/validators/validators";
import Swal from "sweetalert2";
import { SetupForm } from "../models/forms.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";

@Component({
  selector: "lnd-kuda-setup",
  templateUrl: "./kuda-setup.component.html",
  styleUrls: ["./kuda-setup.component.scss"],
})
export class KudaSetupComponent implements OnInit {
  @Input() currentTheme:ColorThemeInterface;
  @Input() kudaInfo: any;
  @Output() getAllIntegrations = new EventEmitter();
  private _unsubscriber$ = new Subject<void>();

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  isLoading: boolean = false;
  statusLoader: boolean = false;
  setupForm: FormGroup<SetupForm>;

  constructor(
    private _fb: UntypedFormBuilder,
    private _configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.kudaInfo["integrationExtraInfoDto"] = this.kudaInfo?.extraInfo;
    delete this.kudaInfo?.extraInfo;
    this.setupForm.patchValue(this.kudaInfo);
  }


  initForm(): void {
    this.setupForm = new FormGroup<SetupForm>({
      id: new FormControl(null, [Validators.required]),
      apiSecretKey: new FormControl(null, [Validators.required]),
      clientAccountNumber: new FormControl(null, [Validators.required, accountNumber.bind(this)]),
      emailAddress: new FormControl(null, [Validators.required, Validators.email]),
      integrationName: new FormControl(null, [Validators.required]),
      isActive: new FormControl(null, [Validators.required]),
      integrationExtraInfoDto: new FormGroup({
        username: new FormControl(null, Validators.required),
        password: new FormControl(null, Validators.required),
      }),
    });
  }

  updateInfo(): void {
    this.isLoading = true;
    const data = this.setupForm.value;
    data["integrationId"] = data?.id;
    this._configService
      .updateIntegration(data)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe({
        next: (res) => {
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
          this.getAllIntegrations.emit();
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  toggleStatus(status: boolean): void {
    this.statusLoader = true;
    const data = this.setupForm.value;
    data["integrationId"] = data?.id;
    data.isActive = status;
    this._configService
      .updateIntegration(data)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe({
        next: () => {
          this.toast.fire({
            type: "success",
            title: `Kuda payment method has been ${
              status ? "activated" : "deactivated"
            }.`,
          });
          this.getAllIntegrations.emit();
          this.statusLoader = false;
        },
        error: () => (this.statusLoader = false),
      });
  }
}
