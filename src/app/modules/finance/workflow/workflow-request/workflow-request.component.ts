import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import {
  RequestItem,
  RequestDetail,
} from "src/app/modules/workflow/workflow.types";
import { WorkflowService } from "src/app/service/workflow.service";
import Swal from "sweetalert2";
import { ModifiedRequestItem } from "../../types/workflow";
@Component({
  selector: "lnd-workflow-request",
  templateUrl: "./workflow-request.component.html",
  styleUrls: ["./workflow-request.component.scss"],
})
export class WorkflowRequestComponent implements OnInit, OnDestroy {
  @Input() requestId: number;
  @Input() currentTheme: ColorThemeInterface;
  @Output() closeModelEvent = new EventEmitter();
  @Output() navToJournal = new EventEmitter();

  private _unsubscriber$ = new Subject();

  request: RequestDetail;
  isLoading = false;
  masterInputValue = false;
  items: ModifiedRequestItem[] = [];
  selectedItems: RequestItem[] = [];

  constructor(private workflowService: WorkflowService) {}

  ngOnInit(): void {
    this.getRequest();
  }

  onCheckMaster(checked: boolean): void {
    this.masterInputValue = checked;
    this.modifyItems(checked);

    if (checked) {
      this.selectedItems = this.items.map((item) => {
        const { selected, ...originalItem } = item;
        return originalItem;
      });
    } else {
      this.selectedItems = [];
    }
  }

  modifyItems(checked: boolean) {
    this.items = this.items.map((item: any) => ({
      ...item,
      selected: checked,
    }));
  }

  onCheckChild(checked: boolean, item: ModifiedRequestItem): void {
    this.modifyItem(item, checked);
  }

  modifyItem(item: ModifiedRequestItem, checked: boolean) {
    const itemIndex = this.items.findIndex((i) => i.itemId === item.itemId);
    const modifiedItem = this.items[itemIndex];
    modifiedItem.selected = checked;
    this.items[itemIndex] = modifiedItem;

    if (checked) {
      const { selected, ...originalItem } = item;
      this.selectedItems.push(originalItem);
    } else {
      this.selectedItems = this.selectedItems.filter(
        (i) => i.itemId !== item.itemId
      );
    }

    if (this.items.every((item: ModifiedRequestItem) => item.selected)) {
      this.masterInputValue = true;
    } else {
      this.masterInputValue = false;
    }
  }

  goToJournal(): void {
    const msg =
      "You are about to create a journal from this request. We will populate some fields for you and highlight the ones you need to complete.";
    Swal.fire({
      type: "question",
      title: "Create Journal",
      text: msg,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      cancelButtonColor: "",
      showConfirmButton: true,
      confirmButtonText: "Confirm",
      confirmButtonColor: "#6faa8f",
    }).then((result) => {
      if (result.value) {
        this.toggleAside();
        const payload = {
          requestItems: this.selectedItems,
          requestCode: this.request.requestCode,
        };
        this.navToJournal.emit(payload);
      }
    });
  }

  getRequest(): void {
    this.isLoading = true;
    this.workflowService
      .getRequest(this.requestId)
      .pipe(pluck("body"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.request = res;
        this.items = this.request.requestItems.map((item: RequestItem) => ({
          ...item,
          selected: false,
        }));
        this.isLoading = false;
      });
  }

  toggleAside(): void {
    this.closeModelEvent.emit();
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
