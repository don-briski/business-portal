import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgOtpInputComponent } from 'ng-otp-input';

@Component({
  selector: 'lnd-transaction-pin',
  templateUrl: './transaction-pin.component.html',
  styleUrls: ['./transaction-pin.component.scss']
})
export class TransactionPinComponent implements OnChanges, AfterViewInit {
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<any>();
  config = {
    length: 4,
    allowNumbersOnly: true,
    isPasswordInput: true,
    placeholder: '*'
  }
  @ViewChild(NgOtpInputComponent, { static: false}) ngOtpInput:NgOtpInputComponent;

  onValueChange(value: any): void {
    if (value.toString().length < this.config.length) value = null;
    this.valueChange.emit(value);
  }

  togglePassword(): void {
    this.config.isPasswordInput = !this.config.isPasswordInput
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.disabled && changes.disabled.currentValue) {
      this.disabled ? this.ngOtpInput?.otpForm.disable() : this.ngOtpInput?.otpForm.enable()
      this.ngOtpInput?.otpForm.updateValueAndValidity()
    }
  }

  ngAfterViewInit(): void {
    this.disabled ? this.ngOtpInput?.otpForm.disable() : this.ngOtpInput?.otpForm.enable();
    this.ngOtpInput?.otpForm.updateValueAndValidity()
  }

  clearValue(): void {
    this.ngOtpInput?.otpForm.reset()
  }
}
