import { AppActivity } from "./app-activity.interface";

export interface Bill {
  billId: number;
  vendorName: string;
  billCode: string;
  billDate: string;
  billDueDate: string;
  billEmailStatus: boolean;
  billLines: [
    {
      itemName: string;
      accountId: number;
      accountName: string;
      quantity: number;
      unitPrice: number;
      taxName: string;
      taxAmount: number;
      discountAmount: number;
      discountType: "Percentage" | "Flat";
      subTotalAmount: number;
      amountAfterDiscount: number;
      amountAfterTax: number;
      totalAmount: number;
      itemType: "AssetItem" | "ExpenseItem";
      itemId: number;
      assetId: number;
      assetName: string;
      description?: string;
    }
  ];
  billReference: string;
  billStatus: string;
  isOverdue?: boolean;
  totalAmount: number;
  billType: string;
  createdAt: string;
  paymentTermId: number;
  paymentTermName: string;
  createdBy: string;
  files: [];
  subTotal: number;
  amountAfterDiscountForLineLevelDiscount: number;
  taxTotalAmount: number;
  discountAmount: number;
  discountAfterTax: false;
  discountLevel: "TransactionLevel" | "LineItemLevel";
  taxOption: "Exclusive" | "Inclusive";

  billStatusCommentData: [];
  totalAmountPaid: number;
  totalCreditsApplied: number;
  balanceDue: number;
  credits: [];
  payments: [];
  appActivities: AppActivity[];
  vendorId: string;
  totalPayments: number;
}
