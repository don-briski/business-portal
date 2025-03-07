export interface TotalReceivablesPayables {
  total: number;
  current: number;
  overdue: number;
  _1to15_Days_Overdue: number;
  _16to30_Days_Overdue: number;
  _31to45_Days_Overdue: number;
  _Above45_Days_Overdue: number;
  tab?: string;
}
