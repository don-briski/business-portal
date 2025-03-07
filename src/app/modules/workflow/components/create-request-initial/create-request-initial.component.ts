import { Component, OnDestroy, OnInit, TemplateRef } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { CustomDropDown } from "src/app/model/CustomDropdown";
import { WorkflowService } from "../../services/workflow.service";
import { GetReqConfigsQueryParams, ReqConfig } from "../../workflow.types";

@Component({
  selector: "lnd-create-request-initial",
  templateUrl: "./create-request-initial.component.html",
  styleUrls: ["./create-request-initial.component.scss"],
})
export class CreateRequestInitialComponent implements OnInit, OnDestroy {
  subs$ = new Subject<void>();

  loading = false;
  modifiedReqConfigs: CustomDropDown[] = [];
  reqConfigs: ReqConfig[] = [];
  selectedReqConfigId: number;

  constructor(
    private workflowService: WorkflowService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getReqConfigs();
  }

  onSelect(
    event: CustomDropDown,
    createCustomReqView: TemplateRef<any>,
    createPaymentsReqView: TemplateRef<any>
  ) {
    this.onCloseForm();

    let view: TemplateRef<any>;
    const reqConfig = this.reqConfigs.find(
      (rc) => rc.requestSetupId === event.id
    );
    this.selectedReqConfigId = reqConfig.requestSetupId;

    if (reqConfig.requestType === "Custom") {
      this.reqConfigs = this.reqConfigs.filter(
        (rc) => rc.requestType === "Custom"
      );
      view = createCustomReqView;
    } else {
      this.reqConfigs = this.reqConfigs.filter(
        (rc) => rc.requestType === "Payments"
      );
      view = createPaymentsReqView;
    }

    this.modalService.open(view, {
      size: "lg",
      centered: true,
    });
  }

  getReqConfigs(
    data: GetReqConfigsQueryParams = {
      pageNumber: 1,
      pageSize: 1000,
      keyword: "",
    }
  ) {
    this.loading = true;
    this.workflowService
      .getRequestConfigs(data, { forInitiators: true })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.reqConfigs = res.body.items;
          this.modifiedReqConfigs = this.reqConfigs.map((config) => ({
            id: config.requestSetupId,
            text: config.requestName,
          }));
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onCloseForm() {
    this.modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
