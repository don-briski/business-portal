import { UserReportTypes } from "./user-type.enum";

export const UserReportLists = {
  allReports: [
    {
      parent: "Activity",
      children: [
        {
          name: "Activity Log Report",
          type: UserReportTypes.ActivityLogReport,
        },
      ],
    },
  ],
};
