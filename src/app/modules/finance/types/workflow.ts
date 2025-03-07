import { RequestItem } from "../../workflow/workflow.types";

export type ModifiedRequestItem = RequestItem & { selected: boolean };
