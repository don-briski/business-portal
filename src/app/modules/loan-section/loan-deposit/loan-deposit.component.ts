import { Component, Input } from '@angular/core';

@Component({
  selector: 'lnd-loan-deposit',
  templateUrl: './loan-deposit.component.html',
  styleUrls: ['./loan-deposit.component.scss']
})
export class LoanDepositComponent {
  @Input() isDepositRequired: boolean;
  @Input() depositAmount: number;
  @Input() depositType: string;
  @Input() currencySymbol: string;
  @Input() depositValue: number;
  @Input() LoanAmount: number;

}
