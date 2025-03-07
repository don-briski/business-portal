export interface StatusFilter {
  customerId?: number;
  search?: string;
  pageNumber: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  statusFilter: {
    status?: string[];
    operator?: "Or" | "And";
    paymentStatuses?: string[];
  };
  isPaymentComplete?: boolean;
}
