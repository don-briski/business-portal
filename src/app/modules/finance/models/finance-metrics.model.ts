export interface FinanceMetricsData {
  name: string;
  tag: string;
  description: string;
  type: string;
  permission: string;

  todayCount: number;
  todayValue: number;

  monthCount: number;
  monthValue: number;

  yearCount: number;
  yearValue: number;

  customDate: boolean;
  customCount: number;
  customValue: number;
}
