export enum CustomerTransactionName {
  Expenses = "Expenses",
  Journals = "Journals",
  Invoices = "Invoices",
  PaymentsReceived = "Payments Received",
  CreditNotes = "Credit Notes",
}

export enum CustomerTransactionType {
  Expense = "Expense",
  Journal = "Journal",
  Invoice = "Invoice",
  PaymentReceived = "PaymentReceived",
  CreditNote = "CreditNote",
}

type Alignment = "left" | "center" | "right";

export interface CustomerTransactionTableColumns {
  [key: string]: {
    colName: string;
    propName: string;
    idName?: string;
    class?: string;
    type?: "date" | "number";
    alignment?: Alignment;
  }[];
}

export const customerTransactionTableColumns: CustomerTransactionTableColumns =
  {
    Expenses: [
      { colName: "Code", propName: "expenseCode", idName: "expenseId" },
      { colName: "Reference", propName: "reference" },
      { colName: "Date", propName: "date", type: "date" },
      {
        colName: "Total Amount",
        propName: "totalAmount",
        type: "number",
        alignment: "right",
      },
      { colName: "Status", propName: "status" },
    ],
    "Credit Notes": [
      { colName: "Code", propName: "code", idName: "creditNoteId" },
      { colName: "Date", propName: "date", type: "date" },
      {
        colName: "Total Amount",
        propName: "totalAmount",
        type: "number",
        alignment: "right",
      },
      {
        colName: "Credits Remaining",
        propName: "totalCreditsRemaining",
        type: "number",
        alignment: "right",
      },
      { colName: "Status", propName: "status" },
    ],
    Invoices: [
      { colName: "Code", propName: "code", idName: "invoiceId" },
      { colName: "Reference", propName: "invoiceReference" },
      {
        colName: "Total Amount",
        propName: "amount",
        type: "number",
        alignment: "right",
      },
      {
        colName: "Balance Due",
        propName: "balanceDue",
        type: "number",
        alignment: "right",
      },
      { colName: "Date", propName: "invoiceDate", type: "date" },
      { colName: "Due Date", propName: "invoiceDueDate", type: "date" },
      { colName: "Status", propName: "status" },
    ],
    "Payments Received": [
      { colName: "Code", propName: "paymentCode", idName: "financePaymentId" },
      {
        colName: "Amount",
        propName: "paymentAmount",
        type: "number",
        alignment: "right",
      },
      { colName: "Date", propName: "createdAt", type: "date" },
      { colName: "Payment Mode", propName: "paymentModeName" },
      { colName: "Status", propName: "status" },
    ],
    Journals: [
      { colName: "Code", propName: "journalCode", idName: "journalId" },
      { colName: "Reference", propName: "reference" },
      { colName: "Date", propName: "date", type: "date" },
      { colName: "Created By", propName: "createdBy" },
      {
        colName: "Total Amount",
        propName: "totalAmount",
        type: "number",
        alignment: "right",
      },
      { colName: "Status", propName: "status" },
    ],
  };

  export type CustomerFinanceTransaction = {
    pageSize: number;
    pageNumber: number;
    customerId?: number;
    search?: string;
    keyword?: string;
    filter?: number | string;
  };
