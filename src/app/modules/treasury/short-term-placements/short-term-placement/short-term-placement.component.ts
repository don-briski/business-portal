import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AppOwnerInformation, User } from "src/app/modules/shared/shared.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ShortTermPlacementService } from "src/app/service/shorttermplacement.service";
import Swal from "sweetalert2";
import {
  STPInvestmentSchedule,
  STPPreviewDetails,
  ShorTermPlacementDetails,
  ShortTermPlacement,
} from "../../types/short-term-placement";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "short-term-placement",
  templateUrl: "./short-term-placement.component.html",
  styleUrls: ["./short-term-placement.component.scss"],
})
export class ShortTermPlacementComponent implements OnInit, OnDestroy {
  private subs$ = new Subject();

  @Input() shortTermPlacementId: number;
  @Input() currentTheme: ColorThemeInterface;
  @Input() user: User;
  @Output() closeModal = new EventEmitter();

  isLoading: boolean = false;
  fetchingActivities = false;
  approvalForm: UntypedFormGroup;
  liquidateForm: UntypedFormGroup;
  liquidationParams;
  activities: any[] = [];
  accounts: CustomDropDown[] = [];

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  ownerInformation: AppOwnerInformation;
  currencySymbol: string;
  stpDetails: ShorTermPlacementDetails;
  isFetchingDetails = false;
  loadingCert = false;
  investmentIsActive = false;
  previewingSchedule = false;
  stpInvestmentSchedules: STPInvestmentSchedule[] = [];
  stpPreviewDetails: STPPreviewDetails;

  constructor(
    private _fb: UntypedFormBuilder,
    private _shortTermPlacementService: ShortTermPlacementService,
    private configService: ConfigurationService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this._initForm();
    this._getAccounts();
    this.getApplicationownerinformation();
    this.getShortTermPlacement(this.shortTermPlacementId);
  }

  getShortTermPlacement(stpId: number) {
    this.isFetchingDetails = true;
    this._shortTermPlacementService
      .getShortTermPlacementById(stpId)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.stpDetails = res.body.data;
          if (
            this.stpDetails?.status !== "SentForApproval" &&
            this.stpDetails?.status !== "Draft" &&
            this.stpDetails?.status !== "Redraft"
          ) {
            this.investmentIsActive = true;
          } else {
            this.investmentIsActive = false;
          }
          this.isFetchingDetails = false;
        },
        error: () => {
          this.isFetchingDetails = false;
        },
      });
  }

  previewSTPInvestmentSchedule(template: TemplateRef<any>) {
    const {
      shortTermPlacementId,
      shortTermPlacementTypeId,
      startDate,
      principal,
      interestRate,
      tenor,
    } = this.stpDetails;

    this.previewingSchedule = true;

    this._shortTermPlacementService
      .previewSTPInvestmentSchedule({
        shortTermPlacementId,
        shortTermPlacementTypeId,
        startDate,
        principal,
        interestRate,
        tenor,
      })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.stpInvestmentSchedules = res.body?.data?.cycleSchedules;
          this.previewingSchedule = false;
          this.showSTPInvestmentScheduleModal(template);
        },
        error: () => {
          this.previewingSchedule = false;
        },
      });
  }

  showSTPInvestmentScheduleModal(template: TemplateRef<any>): void {
    this.stpPreviewDetails = {
      investmentAmount: this.stpDetails.principal,
      investmentRate: this.stpDetails.interestRate,
      investmentTenor: this.stpDetails.tenor,
      tenorType: this.stpDetails.tenorType,
      startDate: this.stpDetails.startDate,
    };

    this.modalService.open(template, {
      centered: true,
      size: "lg",
      windowClass: "myModal",
    });
  }

  closeSTPPreviewModal() {
    this.modalService.dismissAll();
  }

  private _getLiquidationDetails(id: number): void {
    this.isLoading = true;
    this._shortTermPlacementService
      .getShortTermPlacementLiquidationParams(id)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          if (res.status === 200) {
            this._initLiquidationForm(id);
            this.liquidationParams = res.body.data;
            this.isLoading = false;
          }
        },
        (error) => (this.isLoading = false)
      );
  }

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
        this.currencySymbol = this.ownerInformation.currency.currencySymbol;
      });
  }

  private _getAccounts(): void {
    this.configService
      .spoolInteractionAccounts("ShortTermPlacementLiquidation")
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe((res) => {
        this.accounts = res.map((account) => ({
          id: account.accountId,
          text: account.name,
        }));
      });
  }

  toggleLiquidate(id?: number): void {
    $(".liquidate").toggle();
    if (id) {
      this.liquidationParams = null;
      this._getLiquidationDetails(id);
    }
  }

  toggleTerminate(): void {
    $(".terminate-modal").toggle();
  }

  private _initForm(): void {
    this.approvalForm = this._fb.group({
      shortTermPlacementId: new UntypedFormControl(null),
      comment: new UntypedFormControl(null),
      status: new UntypedFormControl(null),
      transactionPin: new UntypedFormControl(null, Validators.required),
    });
  }

  private _initLiquidationForm(id: number): void {
    this.liquidateForm = this._fb.group({
      shortTermPlacementId: new UntypedFormControl(id),
      financeInteractionCashOrBankAccountIdObj: new UntypedFormControl(null),
      financeInteractionCashOrBankAccountId: new UntypedFormControl(null),
      transactionPin: new UntypedFormControl(null, Validators.required),
    });

    this.liquidateForm
      .get("financeInteractionCashOrBankAccountIdObj")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        if (res) {
          this.liquidateForm
            .get("financeInteractionCashOrBankAccountId")
            .setValue(res[0]?.id);
        }
      });
  }

  toggleAside(state?: string): void {
    this.closeModal.emit(state);
    this.toggleLiquidate();
  }

  getActivities(id: number): void {
    this.fetchingActivities = true;
    this._shortTermPlacementService
      .getActivities(id)
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.fetchingActivities = true;
          this.activities = res;
        },
        (error) => (this.fetchingActivities = false)
      );
  }

  deactivate(shortTermPlacement: ShortTermPlacement, pin: string): void {
    const data = {
      shortTermPlacementId: shortTermPlacement.shortTermPlacementId,
      transactionPin: pin,
    };

    this.isLoading = true;

    this._shortTermPlacementService
      .terminateShortTermPlacement(data)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            title: "Termination Was Successful!",
          });

          this.isLoading = false;
          this.toggleTerminate();
          this.toggleAside("refresh");
        },
        (error) => (this.isLoading = false)
      );
  }

  liquidate(): void {
    this.liquidateForm.removeControl(
      "financeInteractionCashOrBankAccountIdObj"
    );

    this.isLoading = true;
    this._shortTermPlacementService
      .liquidateShortTermPlacement(this.liquidateForm.value)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            title: "Liquidation Was Successful!",
          });
          this.isLoading = false;
          this.toggleLiquidate();
          this.toggleAside("refresh");
        },
        (error) => (this.isLoading = false)
      );
  }

  submit(status: "Approved" | "Rejected" | "Redraft "): void {
    this.isLoading = true;
    this.approvalForm.get("status").setValue(status);
    this.approvalForm
      .get("shortTermPlacementId")
      .setValue(this.shortTermPlacementId);

    this._shortTermPlacementService
      .reviewShortTermPlacement(this.approvalForm.value)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.isLoading = false;
          this.toggleAside("refresh");
        },
        (error) => (this.isLoading = false)
      );
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
