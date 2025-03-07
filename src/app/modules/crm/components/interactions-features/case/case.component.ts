import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from "@angular/core";
import { CrmCustomerCase, PROSPECT_CASE_STAGE } from "../../../crm.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Subject } from "rxjs";
import { CrmService } from "../../../crm.service";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "lnd-case",
  templateUrl: "./case.component.html",
  styleUrls: ["./case.component.scss"],
})
export class CaseComponent implements OnDestroy {
  private unsubscriber$ = new Subject();
  @Input() secondaryColor: string;
  @Input() showAside: boolean;
  @Input() selectedCase: CrmCustomerCase;
  @Input() permissions:string[] = [];

  @Output() editCase = new EventEmitter<CrmCustomerCase>();
  @Output() closeAside = new EventEmitter();
  @Output() stageUpdated = new EventEmitter();


  isProcessingStage: boolean;
  PROSPECT_CASE_STAGE = PROSPECT_CASE_STAGE;

  caseStages: CustomDropDown[] = [
    {
      id: PROSPECT_CASE_STAGE.Open,
      text: "Open",
    },
    {
      id: PROSPECT_CASE_STAGE.InProgress,
      text: "In Progress",
    },
    {
      id: PROSPECT_CASE_STAGE.Resolved,
      text: "Resolved",
    },
    {
      id: PROSPECT_CASE_STAGE.Closed,
      text: "Closed",
    },
  ];

  constructor(private crmService: CrmService) {}

  editSelectedCase(){
    this.showAside = false;
    this.editCase.emit(this.selectedCase)
  }

  updateStage(stage: PROSPECT_CASE_STAGE) {
    const payload = { ...this.selectedCase, stage };
    this.isProcessingStage = true;
    this.crmService
      .createEditCase(payload as CrmCustomerCase)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.selectedCase = {...this.selectedCase,stage};
          this.stageUpdated.emit({stage,id:this.selectedCase?.id})
          this.isProcessingStage = false;
        },
        error: () => {
          this.isProcessingStage = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
