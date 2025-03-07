export type LoanMetricsData = {
  name: string;
  tag: string;
  description: string;
  type: string;
  permission: string;
  value: number;
  count: number;
  todayCount?: number;
  todayValue?: number;
  monthCount?: number;
  monthValue?: number;
  yearCount?: number;
  yearValue?: number;
  customDate?: boolean;
  customCount?: number;
  customValue?: number;
};

export type GetLoanMetricsDataQueryParams = {
  start: string;
  end?: string;
};

export type MetricsRange = "Today" | "MTD" | "YTD";

export type GetLoanMetricsDto = { start: string; end: string };
export type GetMetricsResBody = {
  data: LoanMetricsInfo;
};

export type LoanMetricsInfo = {
  count?: number;
  value?: number;
  valueName?: string;
  permission?: string;
};

export type UserLoanActivity = {
  activity: string;
  activityDate: string;
};

export type GetUserLoanActivitiesResBody = {
  items: UserLoanActivity[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type LoanStatusBreakdown = {
  percentage: number;
  status: string;
  totalAmount: number;
};

export type ModifiedLoanStatusBreakdown = {
  name: string;
  amount: number;
};

export type GetLoanStatusBreakdownResBody = {
  data: LoanStatusBreakdown[];
};

export type LoanDashboardCardData = {
  text: string;
  value: string;
  type?: "amount" | "text";
};
