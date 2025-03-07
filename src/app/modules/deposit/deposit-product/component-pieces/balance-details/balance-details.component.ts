import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DepositService } from 'src/app/service/deposit.service';
import { DepositProduct } from '../../../models/deposit-product.model';

@Component({
  selector: 'balance-details',
  templateUrl: './balance-details.component.html',
  styleUrls: ['./balance-details.component.scss']
})
export class BalanceDetailsComponent implements OnInit {
  @Input() currentDepositProduct: DepositProduct;
  @Output() nextStep: EventEmitter<void> = new EventEmitter<void>();
  @Output() balanceDetails: EventEmitter<DepositProduct> = new EventEmitter<DepositProduct>();

  public balanceDetailsForm: UntypedFormGroup;
	private unsubscriber$: Subject<void> = new Subject<void>();

  constructor(private fb: UntypedFormBuilder, private service: DepositService) {
   }

  public ngOnInit(): void {
    this.formInit();
    
    this.service.getDepositProductEdit().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      if (res) {
        this.currentDepositProduct = res
        this.formEditInit(this.currentDepositProduct);
      }
    });
    this.watchFormChanges();
  }

  public ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  public goToNextStep(): void {
    this.nextStep.emit();
  }

  private formInit(): void {
    this.balanceDetailsForm = this.fb.group({
      depositProductDefaultOpeningBalance: new UntypedFormControl(0),
      balanceForCalculations: new UntypedFormControl(0),
      maximumBalanceForInterestCalculation: new UntypedFormControl(0),
      depositProductDefaultTermLength: new UntypedFormControl(null),
      depositProductMinimumOpeningBalance: new UntypedFormControl(0),
      depositProductMaximumOpeningBalance: new UntypedFormControl(0),
      depositProductMinTermLength: new UntypedFormControl(null),
      depositProductMaxTermLength: new UntypedFormControl(null),
      depositProductTermUnitMeasure: new UntypedFormControl(null),
      daysInYear: new UntypedFormControl(null),
    });
  }
  private formEditInit(deposit: DepositProduct): void {
    this.balanceDetailsForm = this.fb.group({
      depositProductDefaultOpeningBalance: new UntypedFormControl(0),
      balanceForCalculations: new UntypedFormControl(0),
      maximumBalanceForInterestCalculation: new UntypedFormControl(0),
      depositProductDefaultTermLength: new UntypedFormControl(0),
      depositProductMinimumOpeningBalance: new UntypedFormControl(0),
      depositProductMaximumOpeningBalance: new UntypedFormControl(0),
      depositProductMinTermLength: new UntypedFormControl(null),
      depositProductMaxTermLength: new UntypedFormControl(null),
      depositProductTermUnitMeasure: new UntypedFormControl(null),
      daysInYear: new UntypedFormControl(null),
    });
  }

  private watchFormChanges(): void {
    this.balanceDetailsForm.valueChanges.pipe(takeUntil(this.unsubscriber$)).subscribe((res: UntypedFormGroup) => {
      this.emitDetails(res);
    });
  }

  protected emitDetails(data: any) {
    const deposit = this.currentDepositProduct;

    deposit.depositInterestRateBaseSettings.balanceForCalculations = data.balanceForCalculations;
    deposit.depositInterestRateBaseSettings.daysInYear = data.daysInYear
    deposit.depositInterestRateBaseSettings.maximumBalanceForInterestCalculation = data.maximumBalanceForInterestCalculation

    deposit.depositProductTermLengthSetting = {
      depositProductDefaultTermLength: data.depositProductDefaultTermLength,
      depositProductMinTermLength: data.depositProductMinTermLength,
      depositProductMaxTermLength: data.depositProductMaxTermLength,
      depositProductTermUnitMeasure: data.depositProductTermUnitMeasure
    };
    deposit.openingBalanceSettings = {
      depositProductDefaultOpeningBalance: data.depositProductDefaultOpeningBalance,
      depositProductMaximumOpeningBalance: data.depositProductMaximumOpeningBalance,
      depositProductMinimumOpeningBalance : data.depositProductMinimumOpeningBalance
    };


    this.balanceDetails.emit(deposit);
  }

}
