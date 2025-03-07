export interface PurchaseOrder {
  purchaseOrderId?: string;
  deliveredTo?: string;
  reference?: string;
  date?: string;
  expectedDeliveryDate?: string;
  termsAndConditions?: string;
  totalAmount: number;
  subTotal: number;
  taxTotalAmount: number;
  discountAmount: number;
  transactionLevelDiscountRate: number;
  currencyId: number;
  discountAccountId: number;
  paymentTermId: number;
  paymentTermName?: string;
  vendorId: number;
  vendorName?: string;
  status?: string;
  billedStatus?: string;
  taxOption?: string;
  discountLevel?: string;
  discountAfterTax: boolean;
  lines: [
    {
      purchaseLineId: number;
      purchaseOrderId: number;
      billId: number;
      itemId: number;
      assetId: number;
      itemType?: string;
      accountId: number;
      customerId: number;
      quantity: number;
      unitPrice: number;
      taxId: number;
      taxAmount: number;
      discountAmount: number;
      discountValueOnType: number;
      discountType: "Flat" | "Percentage";
      subTotalAmount: number;
      amountAfterDiscount: number;
      amountAfterTax: number;
      totalAmount: number;
    }
  ];
  files: File[];
  existingFiles: File[];
}
