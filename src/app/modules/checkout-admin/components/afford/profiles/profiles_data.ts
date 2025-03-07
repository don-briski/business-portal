export type CustomersTab = 'customers' | 'feedback-response';

export enum CustomerStatusEnum {
  Eligible = "Eligible",
  NotEligible = "NotEligible",
  FailedUniquenessCheck = "FailedUniquenessCheck",
  CreditFileOutDated = "CreditFileOutDated",
  SystemError = "SystemError",
  NotEligibleRSB1 = "NotEligibleRSB1",
  NotEligibleRSB2 = "NotEligibleRSB2",
  NotEligibleRSB3 = "NotEligibleRSB3",
  NotEligibleRSB4 = "NotEligibleRSB4",
  NotEligibleRSB5 = "NotEligibleRSB5",
  NotEligibleRSB6 = "NotEligibleRSB6",
  NotEligibleRSB7 = "NotEligibleRSB7",
  NotEligibleRSB8 = "NotEligibleRSB8",
  NotEligibleRSB9 = "NotEligibleRSB9",
  NotEligibleRSB10 = "NotEligibleRSB10",
  NotEligibleRSB11 = "NotEligibleRSB11",
  NotEligibleRSB12 = "NotEligibleRSB12",
  NotEligibleRSB13 = "NotEligibleRSB13",
  NotEligibleRSB14 = "NotEligibleRSB14",
  NotEligibleRSB15 = "NotEligibleRSB15",
  NotEligibleRSB16 = "NotEligibleRSB16",
  NotEligibleRSB17 = "NotEligibleRSB17",
  NotEligibleRSB18 = "NotEligibleRSB18",
  NotEligibleRSB19 = "NotEligibleRSB19",
  NotEligibleRSB20 = "NotEligibleRSB20",
  // NotEligibleRSB21 = "NotEligibleRSB21",
}

export type FeedbackResponseData = {
  status: CustomerStatusEnum;
  description: string;
  feedback: string;
};

export const FEEDBACK_RESPONSE_DATA: FeedbackResponseData[] = [
  {
    status: CustomerStatusEnum.Eligible,
    description: "Default Ineligible",
    feedback:
      "We're currently unable to approve a loan for you at this time. Please consider reapplying in the future or contact us if you'd like to discuss your options.",
  },
  {
    status: CustomerStatusEnum.FailedUniquenessCheck,
    description: "Parent Application Check: Failed Uniqueness Check",
    feedback:
      "We're currently unable to approve a loan for you at this time. Please consider reapplying in the future or contact us if you'd like to discuss your options.",
  },
  {
    status: CustomerStatusEnum.CreditFileOutDated,
    description: "Credit Check: Credit File Out Dated",
    feedback:
      "We're currently unable to approve a loan for you. Please consider reapplying in the future or contact us if you'd like to discuss your options.",
  },
  {
    status: CustomerStatusEnum.SystemError,
    description: "Internal error occurred while processing",
    feedback:
      "We're currently unable to process your information. Please try again later or contact us for assistance. ",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB1,
    description: "Category not permitted: Auto Decline set for Category",
    feedback:
      "We're currently unable to approve a loan for you. Please consider reapplying in the future or contact us if you'd like to discuss your options.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB2,
    description:
      "Bank Statement Length Failure: Customer does not meet the required bank statement length",
    feedback:
      "We're unable to generate a loan offer now as your bank statement shows limited transaction activity, which is needed for an accurate assessment. Please feel free to reapply in the future or contact us if you'd like to discuss your options.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB3,
    description:
      "Gambling Rate: Customer's gambling rate within the review period is above the set threshold",
    feedback:
      "We're unable to approve your loan at this time because some activity patterns on your account do not meet our lending criteria. If these change, we encourage you to reapply in the future.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB4,
    description:
      "Narration Cipher: Customer statement contains a restricted transactio",
    feedback:
      "We're unable to approve your loan at this time due to a transaction in your bank statement that falls outside our eligibility criteria. Please consider using another bank account and reapplying.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB5,
    description:
      "Earner Check: Customer not be identified as a salaried earner",
    feedback:
      "We're unable to approve your loan application due to the inconsistency in salary deposits shown in your bank statements. Please try again with a different account that has consistent salary deposits or contact us if you think there's been a mistake.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB6,
    description: "Income Check: Customer was not identified as a salary earner",
    feedback:
      "We're unable to approve your loan application due to the inconsistency in salary deposits shown in your bank statements. Please try again with a different account that has consistent salary deposits or contact us if you think there's been a mistake.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB7,
    description:
      "Income Check: Customer did not have the required number of salaried earnings",
    feedback:
      "We're unable to approve your loan at this time as your bank statement does not show enough regular salary deposits to meet our criteria. Please try again with a different account that has consistent salary deposits or contact us if you think there's been a mistake.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB8,
    description:
      "Income Check: Customer salaries are not consistent enough to validate salary date",
    feedback:
      "We're unable to approve your loan at this time as your bank statement does not show enough regular salary deposits to meet our criteria. Please try again with a different account that has consistent salary deposits or contact us if you think there's been a mistake.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB9,
    description: "Income Check: Customer salary could not be determined",
    feedback:
      "We're unable to approve your loan application due to the inconsistency in salary deposits shown in your bank statements. Please try again with a different account that has consistent salary deposits or contact us if you think there's been a mistake.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB10,
    description:
      "Sweeper Check: Customer withdrawal behaviour is not within acceptable limits",
    feedback:
      "We're unable to approve your loan right now because your bank account doesn't have enough activity. Please apply using a different salaried account or contact us for more information.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB11,
    description:
      "Loan Limit Check: Customer earning does not meet the minimum income level",
    feedback:
      "We're unable to offer you a loan right now as your salary does not meet our required criteria. Please feel free to reapply when your salary changes.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB12,
    description:
      "Loan Limit Check: Customer does not have all data points required to calculate a loan limit",
    feedback:
      "We're unable to approve your loan right now as we haven't received all the necessary information to assess your request. Please contact our support team for further assistance.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB13,
    description:
      "Loan Limit Check: Customer loan offer is less than minimum loan amount allowed for this category",
    feedback:
      "We're unable to offer you a loan at this time as the amount you qualify for falls below our minimum lending limit. Please consider reapplying if your financial needs increase to meet our threshold.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB14,
    description:
      "Account Activity Check: Customer account activity did not meet required threshold",
    feedback:
      "We're unable to approve your loan right now because your bank account doesn't have enough activity. Please apply using a different salaried account or contact us for more information.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB15,
    description:
      "Bank Statement Check: No transactions found in back statement for provided bank account within the selected period",
    feedback:
      "We're unable to approve your loan right now as no transactions were found in your account during the review period. For a better chance of approval, please apply using an account with an active transaction history. ",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB16,
    description:
      "Bank Statement Check: Retrieval failed due to insufficient funds in the customer's account.",
    feedback:
      "We're unable to approve your loan right now as we could not retrieve any transactions from your account, possibly due to insufficient funds. Please ensure your account is funded and try again or apply with a different account that has funds and active transactions to increase your chances of approval. ",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB17,
    description:
      "Bank Statement Check: Bank retrieval processing from partner.",
    feedback:
      "We are currently unable to approve your loan due to the inability to retrieve your bank transactions from your bank. Please try again later.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB18,
    description:
      "Loan Limit Check: Customer analysis went through EMI secondary route and failed Eligibility checks",
    feedback:
      "We are unable to approve your loan right now as you have not passed our eligibility checks. Please try again later when your circumstances change, or please contact our support team for further assistance",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB19,
    description:
      "Merchant Decline Check: Category set to auto-decline at Merchant",
    feedback:
      "We are unable to approve your loan through this seller right now. Please contact us for more information, or try again later.",
  },
  {
    status: CustomerStatusEnum.NotEligibleRSB20,
    description:
      "Merchant Decline Check: Earning Class set to auto-decline at Merchant",
    feedback:
      "We are unable to approve your loan through this seller right now. Please contact us for more information, or try again later.",
  },
  // {
  //   status: CustomerStatusEnum.NotEligibleRSB21,
  //   description:
  //     "Loan Configuration Decline Check: Earning class set to auto-decline for category",
  //   feedback:
  //     "We are unable to approve your loan through this seller right now. Please contact us for more information, or try again later.",
  // },
];
