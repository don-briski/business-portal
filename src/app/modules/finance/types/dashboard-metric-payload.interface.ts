import { Moment } from "moment";

export interface DashboardMetricPayload {
  endDate?: Moment | string;
  startDate?: Moment | string;
}
