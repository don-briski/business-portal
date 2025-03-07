export enum AllModulesEnum {
  Loan = "Loan",
  Finance = "Finance",
  Deposit = "Deposit",
  Investment = "Investment",
  Workflow = "Workflow",
  UserManagement = "UserManagement",
  CheckoutAdmin = "CheckoutAdmin",
  CRM = "CRM",
  wacs = "wacs"
}

export type ModuleCard = {
  subscriptionIsActive: boolean;
  name: string;
  lottieFileName: string;
  routerLink: string;
  module:AllModulesEnum;
};
