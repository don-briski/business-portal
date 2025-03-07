export interface SmsEventsInterface {
  LoanApproved: GenericSmsEvent;
  LoanDisbursed: GenericSmsEvent;
  LoanSettled: GenericSmsEvent;
  LoanPaymentMade: GenericSmsEvent;
  LoanRepaymentDue: GenericSmsEvent;
}

export class GenericSmsEvent {
  IsActive: boolean;
  Template: string;
}
