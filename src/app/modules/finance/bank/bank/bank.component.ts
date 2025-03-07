import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
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

@Component({
  selector: "app-bank",
  templateUrl: "./bank.component.html",
  styleUrls: ["./bank.component.scss"],
})
export class BankComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter();
  @Output() newBank = new EventEmitter<any>();

  bankForm: UntypedFormGroup;
  isLoading: boolean = false;

  private _unsubscriber$ = new Subject();

  constructor(
    private _fb: UntypedFormBuilder,
    private _configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this._initForm();
  }

  private _initForm(): void {
    this.bankForm = this._fb.group({
      sortCode: new UntypedFormControl(null),
      bankName: new UntypedFormControl(null, Validators.required),
    });
  }

  closeModal(): void {
    this.close.emit();
    this.bankForm.reset();
  }

  submit(): void {
    this.isLoading = true;

    this._configService
      .addBank(this.bankForm.value)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.newBank.emit(res.body.data);
        this.isLoading = false;
        this.closeModal();
      });
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
