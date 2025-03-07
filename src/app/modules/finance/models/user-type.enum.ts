import { UserReportTableColumns } from "../../configuration/report-page/types";

export enum UserReportInputDateType {
  StartAndEndDate = "StartAndEndDate",
  AsAtEndDate = "AsAtEndDate",
}

export enum UserReportTypes {
  ActivityLogReport = "Activity Log Report",
}

export enum UserReportNames {
  ActivityLogReport = "Activity Log Report",
}

export const UserReportTableCols: UserReportTableColumns = {
  ActivityDetailsReport: [
    {
      name: "Description",
      property: "activityDescription",
    },
    {
      name: "Date",
      property: "activityDate",
      type: "date",
      alignment: "center",
    },
  ],
};
