import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import {
  CrmCustomerCase,
  PROSPECT_CASE_STAGE,
} from "../../../crm.types";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import {
  TableConfig,
  TableData,
  TableHeader,
} from "src/app/modules/shared/shared.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CrmService } from "../../../crm.service";

@Component({
  selector: "crm-interactions",
  templateUrl: "./crm-interactions.component.html",
  styleUrls: ["./crm-interactions.component.scss"],
})
export class CrmInteractionsComponent implements OnInit, OnDestroy {
  @Input() id: string;
  @Input() permissions:string[] = [];

  private unsubscriber$ = new Subject<void>();

  isLoading = false;

  isProcessing = false;

  isRetrievingNotes = false;

  cases: CrmCustomerCase[] = [];

  colorTheme: ColorThemeInterface;

  tableConfig: TableConfig = {
    small: true,
    uniqueIdPropLink: "caseType",
    theadLight: true,
    tdStyle:{'min-width':'100px'}
  };

  tableHeaders: TableHeader[] = [
    { name: "Case Type" },
    { name: "Date" },
    { name: "Title" },
    { name: "Description" },
    { name: "Stage" },
    { name: "" },
  ];

  tableData: TableData[] = [];

  showPopup = false;

  caseStages: CustomDropDown[] = [
    {
      id: PROSPECT_CASE_STAGE.Open,
      text: "Open",
    },
    {
      id: PROSPECT_CASE_STAGE.Closed,
      text: "Closed",
    },
    {
      id: PROSPECT_CASE_STAGE.InProgress,
      text: "In Progress",
    },
    {
      id: PROSPECT_CASE_STAGE.Resolved,
      text: "Resolved",
    },
  ];

  caseTypes: CustomDropDown[] = [];
  charLimit = 250;

  form = new FormGroup({
    id: new FormControl(0),
    caseTypeId: new FormControl(null, Validators.required),
    stage: new FormControl("", Validators.required),
    title: new FormControl("", Validators.required),
    description: new FormControl("", [Validators.required, Validators.maxLength(this.charLimit)]),
    prospectId: new FormControl("", Validators.required),
  });

  showAside = false;
  selectedCase: CrmCustomerCase;
  popupTitle: string;
  PROSPECT_CASE_STAGE = PROSPECT_CASE_STAGE;
  showNote = false;

  constructor(
    private crmService: CrmService,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.form.get("prospectId").setValue(this.id);
    this.loadTheme();
    this.fetchInteractions();
    this.fetchCaseTypes();
  }

  private fetchInteractions() {
    this.isLoading = true;

    this.crmService
      .fetchCustomerInteractions(this.id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.cases = res.body.data;
          this.setTableData(this.cases);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private setTableData(crmCustomerCases: CrmCustomerCase[]) {
    this.tableData = crmCustomerCases.map((crmCustomerCase) => ({
      caseType: {
        tdValue: crmCustomerCase?.caseType,
        id: crmCustomerCase?.id,
      },
      date: { tdValue: crmCustomerCase?.createdAt, type: "date" },
      title: { tdValue: crmCustomerCase?.title },
      desc: { tdValue: crmCustomerCase?.description },
      stage: {
        tdValue: crmCustomerCase.stage,
        type: "status",
        statusConfig: {
          class: this.getStatusClass(crmCustomerCase?.stage),
        },
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(crmCustomerCase),
      },
    }));
  }

  getStatusClass(status: string): string {
    if (status === PROSPECT_CASE_STAGE.Open) {
      return "badge-warning";
    } else if (status === PROSPECT_CASE_STAGE.InProgress) {
      return "badge-primary";
    } else if (status === PROSPECT_CASE_STAGE.Resolved) {
      return "badge-success";
    } else if (status === PROSPECT_CASE_STAGE.Closed) {
      return "badge-danger";
    }
  }

  getActionConfig(crmCustomerCase: CrmCustomerCase) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.viewCase(crmCustomerCase?.id),
      },
      {
        showBtn: this.permissions.includes('Manage Prospect Case'),
        iconClass: "icon-edit",
        btnText: "Edit",
        funcRef: () => this.editCase(crmCustomerCase),
      },
    ];
  }

  viewCase(id: number) {
    this.selectedCase = this.cases.find(
      (customerCase) => customerCase.id === id
    );
    this.selectedCase = { ...this.selectedCase, prospectId: this.id };
    this.showAside = !this.showAside;
  }

  editCase(crmCustomerCase: CrmCustomerCase) {
    this.popupTitle = "Edit Case";
    this.selectedCase = crmCustomerCase;
    const caseTypeId = [{id:crmCustomerCase.caseTypeId,text:crmCustomerCase.caseType}]
    const stage = this.caseStages.filter(
      (stage) => stage?.id === crmCustomerCase?.stage
    ) as unknown as string;
    const payload = { ...crmCustomerCase, caseTypeId, stage };
    this.form.get("id").setValue(this.selectedCase.id)
    this.form.patchValue(payload);
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();
    this.togglePopup();
  }

  loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  raiseCase(){
    this.selectedCase = null;
    this.popupTitle = "Raise Case";
    this.togglePopup()
  }

  togglePopup() {
    this.showPopup = !this.showPopup;
    if (!this.showPopup) {
      this.form.reset();
      this.selectedCase = null;
    } else {
      this.showAside = false;
      this.form.get("prospectId").setValue(this.id);
    }
  }

  setDescription(value:string){
    this.form.get('description').setValue(value);
  }

  fetchCaseTypes() {
    this.isLoading = true;
    this.crmService
      .fetchCaseTypes({ pageNumber: 1, pageSize: 50 })
      .pipe(map(res => res.body.items.map(caseType => ({id:caseType.id,text:caseType.name}))),takeUntil(this.unsubscriber$))
      .subscribe({
        next: (caseTypes) => {
          this.caseTypes = caseTypes;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  updateStage(event){
    this.cases = this.cases.map((_case) => {
      if (_case.id === event?.id) {
        _case.stage = event?.stage
      }
      return _case;
    })
    this.setTableData(this.cases)
  }

  submit() {
    this.isProcessing = true;

    let payload = {
      ...this.form.value,
      caseTypeId: (this.form.value?.caseTypeId[0] as unknown as CustomDropDown)?.id,
      stage: (this.form.value?.stage[0] as unknown as CustomDropDown)?.id,
    };

    if (this.form.value.id === 0) {
      delete payload.id;
    }

    this.crmService
      .createEditCase(payload as CrmCustomerCase)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.togglePopup();
          this.fetchInteractions();
          this.isProcessing = false;
          this.showAside = false;
          this.form.reset();
        },
        error: () => {
          this.isProcessing = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
