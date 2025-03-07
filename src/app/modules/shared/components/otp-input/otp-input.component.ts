import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { ColorThemeService } from 'src/app/service/color-theme.service';

@Component({
  selector: 'lnd-otp-input',
  templateUrl: './otp-input.component.html',
  styleUrls: ['./otp-input.component.scss']
})

export class OtpInputComponent implements OnChanges, OnInit , OnDestroy {
  private unsubscriber$ = new Subject();

  @ViewChildren("otpInput") inputs: QueryList<ElementRef>;

  @Input() showOtpRetry: boolean;

  @Output() enteredOtp = new EventEmitter();

  @Output() requestOtp = new EventEmitter();

  timer:Subscription;

  otp: string;

  twoFactorResendTimer:number;

  isProcessing = false;

  colorTheme:ColorThemeInterface;

  constructor(private colorThemeService:ColorThemeService){}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.showOtpRetry.currentValue) {
      if (this.twoFactorResendTimer === 0) {
        this.timer.unsubscribe();
      }
      this.startTimer();
      this.isProcessing = false;
    }
  }

  ngOnInit(): void {
    this.loadTheme();
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  otpInputChange(event: KeyboardEvent): void {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") return;

    let currentId = +event?.target["id"].split("-")[1];
    const value = event.target["value"];
    if (value) {
      if (currentId < 6) {
        // this.focusOTPInput = currentId + 1;

        const regTest = new RegExp("^[0-9]{1,1}?$");
        if (!regTest.test(value)) {
          const prevInput = this.inputs.find((x, i) => i === currentId - 1);
          prevInput.nativeElement["value"] = `${value}`.split("")[0];
        }

        const input = this.inputs.find((x, i) => i === currentId);

        // input.nativeElement['value'] = '';
        input.nativeElement.focus();
      }
      this.otp = "";

      this.inputs.forEach((item) => {
        let value = item.nativeElement["value"];
        if (value) {
          this.otp = this.otp + value;
        }
      });
    }
    this.otp.length === 6 && this.enteredOtp.emit(this.otp);
  }

  startTimer(){
    this.twoFactorResendTimer = 120;
    this.timer = interval(1000).subscribe(()=>{
      if (this.twoFactorResendTimer > 0) {
        this.twoFactorResendTimer -= 1;
      }
    })
  }

  onRequestOtp(){
    if (this.twoFactorResendTimer === 0) {
      this.requestOtp.emit();
      this.isProcessing = true;
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
