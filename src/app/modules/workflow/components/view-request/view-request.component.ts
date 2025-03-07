import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from "@angular/core";
import { UntypedFormBuilder, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { ConfigurationService } from "src/app/service/configuration.service";
import { EncryptService } from "src/app/service/encrypt.service";
import { WorkflowService } from "../../services/workflow.service";
import { RequestDetail, Tab, WorkflowRequest } from "../../workflow.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { AuthService } from "src/app/service/auth.service";
import { User, UserToken } from "src/app/modules/shared/shared.types";
import { TabBarService } from "src/app/modules/shared/components/tab-bar/tab-bar.service";

@Component({
  selector: "lnd-view-request",
  templateUrl: "./view-request.component.html",
  styleUrls: ["./view-request.component.scss"],
})
export class ViewRequestComponent implements OnInit, OnDestroy {
  @Input() user?: User;
  @Input() request?: WorkflowRequest;
  @Input() viewing = false;
  @Output() close = new EventEmitter<void>();
  @Output() requestUpdated = new EventEmitter<void>();

  subs$ = new Subject<void>();
  userToken: UserToken;
  currencySymbol: string;
  @Input() colorTheme: ColorThemeInterface;

  gettingReq = false;
  reqDetails?: RequestDetail;

  tabBarId = "child";
  tabs: Tab[] = [
    { id: "req-info", text: "Request Information" },
    { id: "activity", text: "Activity" },
  ];
  currentTabId = "req-info";
  show = true;

  approvalForm = this.fb.group({
    comment: this.fb.control(""),
    transactionPin: this.fb.control("", Validators.required),
  });
  approvalAction: "DECLINED" | "REDRAFT" | "APPROVED";
  showApprovalHistory = true;
  showNoteArea = true;
  submitting = false;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private workflowService: WorkflowService,
    private configService: ConfigurationService,
    private tabBarService: TabBarService,
    private fb: UntypedFormBuilder,
    private encryptService: EncryptService,
    private colorThemeServ: ColorThemeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userToken = this.authService.decodeToken();
    this.loadTheme();
    this.getOwnerInfo();
    this.getRequest();
    this.listenForTabSwitch();
  }

  loadTheme(): void {
    this.colorThemeServ
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  getOwnerInfo() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.currencySymbol = res.body?.currency?.currencySymbol;
        },
      });
  }

  getRequest() {
    this.gettingReq = true;
    this.workflowService
      .getRequest({ id: this.request.requestId })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.reqDetails = res.body;
          this.gettingReq = false;
        },
        error: (_) => {
          this.gettingReq = false;
        },
      });
  }

  listenForTabSwitch() {
    this.tabBarService.tabSwitched.pipe(takeUntil(this.subs$)).subscribe({
      next: (id) => {
        if (id.tabBarId === this.tabBarId) {
          this.currentTabId = id.tabId;
        }
      },
    });
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    this.submitting = true;
    const data = {
      ...this.approvalForm.value,
      requestId: this.request.requestId,
      approvalAction: this.approvalAction,
    };
    const transactionPin = this.encryptService.encrypt(data.transactionPin);

    delete data.transactionPin;

    this.workflowService
      .approveRequest(data, transactionPin)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: () => {
          this.submitting = false;

          this.toast.fire({
            type: "success",
            title: this.submitSuccessMsg,
          });
          this.requestUpdated.emit();
          this.onClose();
        },
        error: () => {
          this.submitting = false;
        },
      });
  }

  get requestDate() {
    if (this.request.requestType === "Payments")
      return this.reqDetails.paymentDate;
    else return this.reqDetails.createdAt;
  }

  get submitSuccessMsg(): string {
    let action: string;

    if (this.approvalAction === "DECLINED") action = "declined";
    else if (this.approvalAction === "REDRAFT") action = "redrafted";
    else action = "approved";

    return `Request ${action} successfully`;
  }

  get hasApproved() {
    return this.reqDetails?.approvals.find(
      (approval) =>
        String(approval.userId) === String(this.userToken.nameid) &&
        approval.approvalAction.toLowerCase() === "approved"
    );
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
