import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Approver } from "../workflow.types";

export function modifyApprovers(approvers: CustomDropDown[]): Approver[] {
  return approvers.map((appr, index) => ({
    approverId: +appr.id,
    approverName: appr.text,
    isFirstToApprove: index === 0,
    position: index,
  }));
}
