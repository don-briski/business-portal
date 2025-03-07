import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'lnd-loan-deposit-card',
  templateUrl: './loan-deposit-card.component.html',
  styleUrls: ['./loan-deposit-card.component.scss']
})
export class LoanDepositCardComponent implements OnInit{
  @Input() loanDeposit;
  @Input() currentTheme;

  ngOnInit(): void {
    if (this.loanDeposit && typeof this.loanDeposit === "string") {
      this.loanDeposit = {...JSON.parse(this.loanDeposit)}
    }
  }
}
