import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DepositService } from 'src/app/service/deposit.service';
import { DepositProduct, InterestRateTier } from '../../../models/deposit-product.model';

@Component({
  selector: 'interest-details',
  templateUrl: './interest-details.component.html',
  styleUrls: ['./interest-details.component.scss']
})
export class InterestDetailsComponent implements OnInit, OnDestroy {
  @Input() currentDepositProduct: DepositProduct;
  @Input() isEditing: boolean;
  @Output() nextStep: EventEmitter<void>;
  @Output() interestDetails: EventEmitter<DepositProduct>;
  public interestDetailsForm: UntypedFormGroup;
  public interestTiers: UntypedFormGroup[] = [];
	private unsubscriber$: Subject<void> = new Subject<void>();

  constructor(private fb: UntypedFormBuilder, private service: DepositService) {
    this.interestDetails = new EventEmitter<DepositProduct>();
    this.nextStep = new EventEmitter<void>();
   }

  public ngOnInit(): void {
    this.formInit();
    this.service.getDepositProductEdit().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      if (res) {
        this.currentDepositProduct = res
        this.formEditInit(this.currentDepositProduct);
      }
    });
  }

  public ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  public goToNextStep(): void {
    this.nextStep.emit();
  }

  private formInit(): void {
    this.interestDetailsForm = this.fb.group({
      currencyId: new UntypedFormControl(null, [Validators.required]),
      interestRateBaseSettingsRateTerms: new UntypedFormControl(null, [Validators.required]),
      interestRateChargedPer: new UntypedFormControl(null, [Validators.required]),
      interestRateChargedDays: new UntypedFormControl(null, [Validators.required]),
      interestRateConstraintsDefault: new UntypedFormControl(null, [Validators.required]),
      interestRateConstraintsMaximum: new UntypedFormControl(null, [Validators.required]),
      interestRateConstraintsMinimum: new UntypedFormControl(null, [Validators.required]),
      depositProductInterestPaidIntoAccount: new UntypedFormControl(null, [Validators.required])
    });
    this.watchFormChanges();
  }
  
  private formEditInit(currentDepositProduct: DepositProduct): void {
    this.interestDetailsForm = this.fb.group({
      currencyId: new UntypedFormControl(currentDepositProduct?.currencyId, [Validators.required]),
      interestRateBaseSettingsRateTerms: new UntypedFormControl(currentDepositProduct?.depositInterestRateBaseSettings?.interestRateBaseSettingsRateTerms, [Validators.required]),
      interestRateChargedPer: new UntypedFormControl(currentDepositProduct?.depositInterestRateBaseSettings?.interestRateChargedPer, [Validators.required]),
      interestRateChargedDays: new UntypedFormControl(currentDepositProduct?.depositInterestRateBaseSettings?.interestRateChargedDays, [Validators.required]),
      interestRateConstraintsDefault: new UntypedFormControl(currentDepositProduct?.depositInterestRateBaseSettings?.interestRateConstraintsDefault, [Validators.required]),
      interestRateConstraintsMaximum: new UntypedFormControl(currentDepositProduct?.depositInterestRateBaseSettings?.interestRateConstraintsMaximum, [Validators.required]),
      interestRateConstraintsMinimum: new UntypedFormControl(currentDepositProduct?.depositInterestRateBaseSettings?.interestRateConstraintsMinimum, [Validators.required]),
      depositProductInterestPaidIntoAccount: new UntypedFormControl(currentDepositProduct?.depositProductInterestPaidIntoAccount, [Validators.required])
    });
    this.watchFormChanges();
  }

  private watchFormChanges(): void {
    this.interestDetailsForm.valueChanges.pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      this.emitDetails(res);
    });

    this.interestDetailsForm.get('interestRateBaseSettingsRateTerms').valueChanges.pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      if (res !== 'Fixed') {
        this.interestDetailsForm.removeControl('balanceTier');
        this.interestDetailsForm.addControl('balanceTier', this.fb.array([this.initTierForm()]));
      } else {
        this.interestDetailsForm.removeControl('balanceTier');
      }
    })
  }

  public initTierForm(): UntypedFormGroup {
    const rateTerms = +this.interestDetailsForm.get('interestRateBaseSettingsRateTerms').value;
    let incrementValue = 0;

    let initialBalanceValue = incrementValue;
    let initialPeriodValue = incrementValue;

    if (rateTerms === 2) {
      incrementValue = 1;
      initialBalanceValue++;
    } else if (rateTerms === 1) {
      incrementValue = 0.1;
      initialPeriodValue++;
    }

    return this.fb.group({
      startBalance: 0,
      startDay: 0,
      interestRateTierEndingBalance: initialBalanceValue,
      interestRateTierEndingDay: initialPeriodValue,
      interestRateTierIndex: 0,
      interestRateTierInterestRate: 0
    })
  }

  public createTierForm(): void {
    const tiers = this.interestDetailsForm.get('balanceTier') as UntypedFormArray;

    const rateTerms = +this.interestDetailsForm.get('interestRateBaseSettingsRateTerms')?.value;
    let incrementValue = 0;
    let initialBalanceValue = incrementValue;
    let initialPeriodValue = incrementValue;

    if (rateTerms === 1) {
      incrementValue = 0.1;
      initialBalanceValue = parseFloat((tiers.value[tiers.value.length - 1].interestRateTierEndingBalance + incrementValue).toFixed(2));
    } else if (rateTerms === 2) {
      incrementValue = 1
      initialPeriodValue = tiers.value[tiers.value.length - 1].interestRateTierEndingDay + incrementValue;

    }
    
    tiers.push(
      this.fb.group({
        startBalance: parseFloat((tiers.value[tiers.value.length - 1].interestRateTierEndingBalance + incrementValue).toFixed(2)),
        startDay: tiers.value[tiers.value.length - 1].interestRateTierEndingDay + incrementValue,
        interestRateTierEndingBalance: parseFloat((initialBalanceValue + incrementValue).toFixed(2)),
        interestRateTierEndingDay: initialPeriodValue + incrementValue,
        interestRateTierIndex: 0,
        interestRateTierInterestRate: 0
      })
    );

  }

  public removeTierForm(index: number) {
    let tiers = this.interestDetailsForm.get('balanceTier') as UntypedFormArray;
    tiers.removeAt(index);
  }

  protected emitDetails(data: any) {
    let deposit = this.currentDepositProduct;

    deposit.currencyId = data.currencyId;
    deposit.depositProductInterestPaidIntoAccount = data.depositProductInterestPaidIntoAccount;
    deposit.depositInterestRateBaseSettings = {
      interestRateBaseSettingsRateTerms: data.interestRateBaseSettingsRateTerms,
      interestRateChargedPer: data.interestRateChargedPer,
      interestRateChargedDays: data.interestRateChargedDays,
      interestRateConstraintsDefault: data.interestRateConstraintsDefault,
      interestRateConstraintsMaximum: data.interestRateConstraintsMaximum,
      interestRateConstraintsMinimum: data.interestRateConstraintsMinimum
    }
    const interestTiers = this.interestDetailsForm.get('balanceTier') as UntypedFormArray
    
    deposit.interestRateTiers = interestTiers?.value

    this.interestDetails.emit(deposit);
  }



}
