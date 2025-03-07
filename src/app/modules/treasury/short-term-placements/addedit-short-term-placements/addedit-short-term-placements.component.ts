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
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Subject, forkJoin } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ShortTermPlacementService } from "src/app/service/shorttermplacement.service";
import {
  STPInvestmentSchedule,
  STPPreviewDetails,
  ShorTermPlacementDetails,
  ShortTermPlacementType,
} from "../../types/short-term-placement";
import { AppOwnerInformation, User } from "src/app/modules/shared/shared.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { customDateFormat } from "src/app/util/finance/financeHelper";

@Component({
  selector: "addedit-short-term-placement",
  templateUrl: "./addedit-short-term-placements.component.html",
  styleUrls: ["./addedit-short-term-placements.component.scss"],
})
export class AddeditShortTermPlacementsComponent implements OnInit, OnDestroy {
  @Input() user: User;
  @Input() shortTermPlacementId: number;
  @Input() currentTheme: ColorThemeInterface;
  @Output() closeModelEvent = new EventEmitter<string>();

  subs$ = new Subject();
  selectedPlacementType: ShortTermPlacementType;
  isPlacementTypeSelected = false;
  showPopup = false;

  shortTermPlacementForm: UntypedFormGroup;
  shortTermPlacementCycleSchedules: any[];
  isLoading = false;
  gettingData = false;
  stpDetails: ShorTermPlacementDetails;
  orignalPlacementTypes: ShortTermPlacementType[] = [];
  modifiedPlacementTypes: CustomDropDown[] = [];
  currentModal: NgbModalRef;
  accounts: CustomDropDown[];
  appOwner: AppOwnerInformation;
  currencySymbol: string;
  amountTextInfo = "";
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  isEditing = false;
  previewingSchedule = false;
  stpInvestmentSchedules: STPInvestmentSchedule[] = [];
  stpPreviewDetails: STPPreviewDetails;

  constructor(
    private fb: UntypedFormBuilder,
    private stpService: ShortTermPlacementService,
    private configService: ConfigurationService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    if (this.shortTermPlacementId) {
      this.isEditing = true;
    }
    this.initForm();
    this.getData();
  }

  get initialized() {
    if (this.isEditing) {
      return !this.gettingData && this.stpDetails;
    } else {
      return !this.gettingData;
    }
  }

  getData() {
    this.gettingData = true;
    forkJoin([
      this.configService.getAppOwnerInfo(),
      this.stpService.getShortTermPlacementTypes({ pageSize: 100 }),
    ])
      .pipe(
        takeUntil(this.subs$),
        map((res) => {
          const originalPlacementTypes = res[1].body.items;
          const modifiedPlacementTypes = originalPlacementTypes.map((item) => ({
            id: item.shortTermPlacementTypeId,
            text: item.placementName,
          }));

          return {
            appOwner: res[0].body,
            originalPlacementTypes,
            modifiedPlacementTypes,
          };
        })
      )
      .subscribe({
        next: ({
          appOwner,
          originalPlacementTypes,
          modifiedPlacementTypes,
        }) => {
          this.appOwner = appOwner;
          this.currencySymbol = appOwner.currency.currencySymbol;

          this.accounts = appOwner.financeStpInitialAccounts.map((account) => ({
            id: account.accountId,
            text: account.name,
          }));

          if (!appOwner?.financeInteractionData?.stpInitialIsActive) {
            this.shortTermPlacementForm
              .get("financeInteractionCashOrBankAccountId")
              .clearValidators();
          }

          this.orignalPlacementTypes = originalPlacementTypes;
          this.modifiedPlacementTypes = modifiedPlacementTypes;

          if (this.shortTermPlacementId) {
            this.getShortTermPlacement(this.shortTermPlacementId);
          }

          this.gettingData = false;
        },
        error: () => {
          this.gettingData = false;
        },
      });
  }

  getShortTermPlacement(stpId: number) {
    this.stpService
      .getShortTermPlacementById(stpId)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.stpDetails = res.body.data;
          this.initForm(this.stpDetails);

          if (this.isEditing) {
            this.onSelectPlacementType({
              id: this.stpDetails.shortTermPlacementTypeId,
              text: null,
            });

            if (!this.appOwner?.financeInteractionData?.stpInitialIsActive) {
              this.shortTermPlacementForm
                .get("financeInteractionCashOrBankAccountId")
                .clearValidators();
            }
          }
        },
      });
  }

  dismissModal(): void {
    this.currentModal?.close();
    this.isLoading = false;
  }

  private initForm(stp?: ShorTermPlacementDetails): void {
    let startDate: string;
    let activePlacementTypeArray: CustomDropDown[];
    let activeBankAccountArray: CustomDropDown[];

    if (stp) {
      startDate = customDateFormat(stp?.startDate);
      activePlacementTypeArray = this.modifiedPlacementTypes?.filter(
        (item) => item.id === stp.shortTermPlacementTypeId
      );
      activeBankAccountArray = this.accounts?.filter(
        (item) => item.id === stp.financeInteractionCashOrBankAccountId
      );

      this.selectedPlacementType = this.orignalPlacementTypes.find(
        (item) => stp.shortTermPlacementTypeId === item.shortTermPlacementTypeId
      );
    }

    this.shortTermPlacementForm = this.fb.group({
      amount: new UntypedFormControl(stp?.principal || null, [
        Validators.required,
      ]),
      interestRate: new UntypedFormControl(
        stp?.interestRate || null,
        Validators.required
      ),
      tenor: new UntypedFormControl(stp?.tenor || null, Validators.required),
      startDate: new UntypedFormControl(startDate || null, Validators.required),
      shortTermPlacementTypeArray: new UntypedFormControl(
        activePlacementTypeArray
      ),
      shortTermPlacementTypeId: new UntypedFormControl(
        stp?.shortTermPlacementTypeId || null,
        Validators.required
      ),
      status: new UntypedFormControl(stp?.status || null),
      hasFinanceInteraction: new UntypedFormControl(
        stp?.hasFinanceInteraction || false
      ),
      financeInteractionCashOrBankAccountId: new UntypedFormControl(
        stp?.financeInteractionCashOrBankAccountId || null,
        Validators.required
      ),
      financeInteractionCashOrBankAccountArray: new UntypedFormControl(
        activeBankAccountArray
      ),
    });

    const form = this.shortTermPlacementForm;

    if (stp?.financeInteractionCashOrBankAccountId) {
      form.get("hasFinanceInteraction").setValue(true);
    }

    form
      .get("shortTermPlacementTypeArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe({
        next: (value) => {
          if (value[0]) {
            form.get("shortTermPlacementTypeId").setValue(value[0].id);
          } else {
            form.get("shortTermPlacementTypeId").setValue(null);
          }
        },
      });

    form
      .get("financeInteractionCashOrBankAccountArray")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe({
        next: (value) => {
          if (value[0]) {
            form
              .get("financeInteractionCashOrBankAccountId")
              .setValue(value[0].id);
            form.get("hasFinanceInteraction").setValue(true);
          } else {
            form.get("financeInteractionCashOrBankAccountId").setValue(null);
            form.get("hasFinanceInteraction").setValue(false);
          }
        },
      });
  }

  onSelectPlacementType(value: CustomDropDown) {
    this.selectedPlacementType = this.orignalPlacementTypes.find(
      (item) => value.id === item.shortTermPlacementTypeId
    );

    this.setValidators(this.selectedPlacementType);
  }

  setValidators(placementType: ShortTermPlacementType) {
    const form = this.shortTermPlacementForm;
    form
      .get("amount")
      .setValidators([
        Validators.required,
        Validators.min(placementType.minAmount),
        Validators.max(placementType.maxAmount),
      ]);
    form.get("amount").markAsDirty();
    form.get("amount").updateValueAndValidity();

    form
      .get("interestRate")
      .setValidators([
        Validators.required,
        Validators.min(placementType.minInterestRate),
        Validators.max(placementType.maxInterestRate),
      ]);
    form.get("interestRate").markAsDirty();
    form.get("interestRate").updateValueAndValidity();

    form
      .get("tenor")
      .setValidators([
        Validators.required,
        Validators.min(placementType.minTenor),
        Validators.max(placementType.maxTenor),
      ]);
    form.get("tenor").markAsDirty();
    form.get("tenor").updateValueAndValidity();
  }

  closeModal(state?: string): void {
    this.closeModelEvent.emit(state);
  }

  previewSTPInvestmentSchedule(template: TemplateRef<any>) {
    const {
      shortTermPlacementId,
      shortTermPlacementTypeId,
      startDate,
      amount: principal,
      interestRate,
      tenor,
    } = this.shortTermPlacementForm.value;

    this.previewingSchedule = true;

    this.stpService
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
    const formValue = this.shortTermPlacementForm.value;
    this.stpPreviewDetails = {
      investmentAmount: formValue?.amount,
      investmentRate: formValue?.interestRate,
      investmentTenor: formValue.tenor,
      tenorType:
        this.stpDetails?.tenorType || this.selectedPlacementType?.tenorType,
      startDate: formValue.startDate,
    };

    this.currentModal = this.modalService.open(template, {
      centered: true,
      size: "lg",
      windowClass: "myModal",
    });
  }

  closeSTPPreviewModal() {
    this.currentModal.dismiss();
  }

  checkApprovalStatus() {
    if (this.selectedPlacementType?.requireApproval) {
      this.onSubmit();
    } else {
      Swal.fire({
        type: "info",
        title: "Activate Short Term Placement",
        text: "This short term placement will not go through approval process. It will be set to active automatically. Do you want to continue?",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "No",
        confirmButtonText: "Yes, activate it",
        confirmButtonColor: "#558E90",
      }).then((result) => {
        if (result.value) {
          this.onSubmit();
        }
      });
    }
  }

  onSubmit(): void {
    this.dismissModal();
    this.isLoading = true;

    const formValue = this.shortTermPlacementForm.value;
    delete formValue["financeInteractionCashOrBankAccountArray"];
    delete formValue["shortTermPlacementTypeArray"];

    if (!this.shortTermPlacementId) {
      this.stpService
        .addShortTermPlacement(formValue)
        .pipe(takeUntil(this.subs$))
        .subscribe(
          () => {
            this.toast.fire({
              type: "success",
              title: "Short term placement added successfully!",
            });
            this.isLoading = false;
            this.closeModal("refresh");
          },
          () => (this.isLoading = false)
        );
    } else {
      this.stpService
        .updateShortTermPlacement({
          ...formValue,
          shortTermPlacementId: this.shortTermPlacementId,
        })
        .pipe(takeUntil(this.subs$))
        .subscribe(
          (res) => {
            if (res.status === 200) {
              this.toast.fire({
                type: "success",
                title: "Short term placement updated successfully!",
              });
              this.isLoading = false;
              this.closeModal("refresh");
            }
          },
          (error) => (this.isLoading = false)
        );
    }
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
