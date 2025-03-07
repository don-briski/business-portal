import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ConfigurationService } from "src/app/service/configuration.service";
import Swal from "sweetalert2";

@Component({
  selector: "app-monnify-setup",
  templateUrl: "./monnify-setup.component.html",
  styleUrls: ["./monnify-setup.component.scss"],
})
export class MonnifySetupComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("retry") retryElem: ElementRef;
  @ViewChild("dontRetry") dontRetryElem: ElementRef;
  @Input() currentTheme;
  @Input() monnifyInfo: any = null;
  @Output() retriveAppownerInfo = new EventEmitter();
  setupForm: UntypedFormGroup;
  isLoading: boolean = false;
  state: string = "";
  private _unsubscriber$ = new Subject();

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });

  constructor(
    private _fb: UntypedFormBuilder,
    private _configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this._initForm();

    if (this.monnifyInfo) {
      this.monnifyInfo = JSON.parse(this.monnifyInfo);
      this._patchForm();
    }
  }

  ngAfterViewInit(): void {
    if (this.setupForm.get("isRetryEnabled").value) {
      this.retryElem.nativeElement.checked = true;
    }

    if (!this.setupForm.get("isRetryEnabled").value) {
      this.dontRetryElem.nativeElement.checked = true;
    }
  }

  private _initForm(): void {
    this.setupForm = this._fb.group({
      apiKey: new UntypedFormControl(null, Validators.required),
      secretKey: new UntypedFormControl(null, Validators.required),
      contractCode: new UntypedFormControl(null, Validators.required),
      isActive: new UntypedFormControl(true, Validators.required),
      isRetryEnabled: new UntypedFormControl(false, Validators.required),
    });
  }

  private _patchForm(): void {
    this.setupForm.patchValue({
      apiKey: this.monnifyInfo.ApiKey,
      secretKey: this.monnifyInfo.SecretKey,
      contractCode: this.monnifyInfo.ContractCode,
      isActive: this.monnifyInfo.IsActive,
      isRetryEnabled: this.monnifyInfo.IsRetryEnabled,
    });
  }

  setIsActive(state: string): void {
    state === "deactivate"
      ? this.setupForm.get("isActive").patchValue(false)
      : this.setupForm.get("isActive").patchValue(true);
    this.submit(state);
  }

  checked(event): void {
    this.setupForm.get("isRetryEnabled").setValue(event.target.value);
  }

  submit(state: string): void {
    this.isLoading = true;
    this.state = state;
    let status;

    switch (state) {
      case "update":
        status = "Update";
        break;

      case "deactivate":
        status = "Deactivation";
        break;

      case "activate":
        status = "Activation";
        break;

      default:
        break;
    }
    this._configService
      .updateMonnifyParams(this.setupForm.value)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.isLoading = false;
        this.toast.fire({
          type: "success",
          title: `${status} was successful`,
        });

        // if (res.status === 200 && state === "deactivate")
        //   this.setupForm.get("isActive").patchValue(false);

        // if (res.status === 200 && state === "activate")
        //   this.setupForm.get("isActive").patchValue(true);

        if (res.status === 200) {
          this.retriveAppownerInfo.emit();
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
