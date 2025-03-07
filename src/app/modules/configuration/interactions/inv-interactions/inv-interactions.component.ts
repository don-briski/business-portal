import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ConfigurationService } from "src/app/service/configuration.service";
import Swal from "sweetalert2";

@Component({
  selector: "inv-interactions",
  templateUrl: "./inv-interactions.component.html",
  styleUrls: ["./inv-interactions.component.scss"],
})
export class InvInteractionsComponent implements OnInit, OnDestroy {
  private _unsubscriber$ = new Subject();

  @Input() selectedModule;
  @Input() statuses;
  @Input() modes;
  @Input() appOwner;
  @Input() isChecked;
  @Input() accounts;
  @Input() user;

  @Output() getNewAppowner = new EventEmitter();

  formName: string;
  parentName: string;
  invInteractionForm: UntypedFormGroup;
  isLoading: boolean = false;
  activeElement:string;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private _fb: UntypedFormBuilder,
    private _configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this._initForm(this.appOwner);
  }

  private _initForm(appOwner): void {
    const investmentAccruedAccountIdsObj =
      appOwner?.financeInvestmentAccruedAccounts.map((account) => ({
        id: account.accountId,
        text: account.name,
      }));

    const investmentAccruedAccountIds =
      appOwner?.financeInvestmentAccruedAccounts.map(
        (account) => account.accountId
      );

    const investmentIntialAccountIdsObj =
      appOwner?.financeInvestmentInitialAccounts.map((account) => ({
        id: account.accountId,
        text: account.name,
      }));

    const investmentIntialAccountIds =
      appOwner?.financeInvestmentInitialAccounts.map(
        (account) => account.accountId
      );

    const investmentInitialAndAccruedAccountIdsObj =
      appOwner?.financeInvestmentInitialAndAccruedAccounts.map((account) => ({
        id: account.accountId,
        text: account.name,
      }));

    const investmentInitialAndAccruedAccountIds =
      appOwner?.financeInvestmentInitialAndAccruedAccounts.map(
        (account) => account.accountId
      );

    this.invInteractionForm = this._fb.group({
      investment: this._fb.group({
        investmentAccruedIsActiveObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentAccruedIsActive
            ? [this.statuses[0]]
            : [this.statuses[1]],
          Validators.required
        ),
        investmentAccruedIsActive: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentAccruedIsActive || false,
          Validators.required
        ),

        investmentAccruedModeObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentAccruedMode ===
          "Automatic"
            ? [this.modes[0]]
            : [this.modes[1]],
          Validators.required
        ),
        investmentAccruedMode: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentAccruedMode ||
            "Automatic",
          Validators.required
        ),

        investmentInitialIsActiveObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentInitialIsActive
            ? [this.statuses[0]]
            : [this.statuses[1]],
          Validators.required
        ),
        investmentInitialIsActive: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentInitialIsActive || false,
          Validators.required
        ),

        investmentInitialModeObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentInitialMode ===
          "Automatic"
            ? [this.modes[0]]
            : [this.modes[1]],
          Validators.required
        ),
        investmentInitialMode: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentInitialMode ||
            "Automatic",
          Validators.required
        ),

        investmentInitialAndAccruedIsActiveObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentInitialAndAccruedIsActive
            ? [this.statuses[0]]
            : [this.statuses[1]],
          Validators.required
        ),
        investmentInitialAndAccruedIsActive: new UntypedFormControl(
          appOwner?.financeInteractionData
            ?.investmentInitialAndAccruedIsActive || false,
          Validators.required
        ),

        investmentInitialAndAccruedModeObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentInitialAndAccruedMode ===
          "Automatic"
            ? [this.modes[0]]
            : [this.modes[1]],
          Validators.required
        ),
        investmentInitialAndAccruedMode: new UntypedFormControl(
          appOwner?.financeInteractionData?.investmentInitialAndAccruedMode ||
            "Automatic",
          Validators.required
        ),

        investmentAccruedAccountIdsObj: new UntypedFormControl(
          investmentAccruedAccountIdsObj || []
        ),
        investmentAccruedAccountIds: new UntypedFormControl(
          investmentAccruedAccountIds || []
        ),

        investmentIntialAccountIdsObj: new UntypedFormControl(
          investmentIntialAccountIdsObj || null
        ),
        investmentIntialAccountIds: new UntypedFormControl(
          investmentIntialAccountIds || null
        ),

        investmentInitialAndAccruedAccountIdsObj: new UntypedFormControl(
          investmentInitialAndAccruedAccountIdsObj || null
        ),
        investmentInitialAndAccruedAccountIds: new UntypedFormControl(
          investmentInitialAndAccruedAccountIds || null
        ),
      }),
    });

    this._watchFormChanges();
  }

  private _updateValidators(addValidator: boolean, controlName: string): void {
    if (addValidator) {
      this.invInteractionForm
        .get(controlName)
        .setValidators(Validators.required);
      this.invInteractionForm
        .get(controlName)
        .updateValueAndValidity({ emitEvent: false });
    } else {
      this.invInteractionForm.get(controlName).clearValidators();
      this.invInteractionForm
        .get(controlName)
        .updateValueAndValidity({ emitEvent: false });
    }
  }

  private _watchFormChanges(): void {
    this._updateValidators(
      this.invInteractionForm.get("investment.investmentAccruedIsActive").value,
      "investment.investmentAccruedAccountIdsObj"
    );

    //Investment Accrued
    this.invInteractionForm
      .get("investment.investmentAccruedIsActiveObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.invInteractionForm
          .get("investment.investmentAccruedIsActive")
          .setValue(res[0]?.id);

        this._updateValidators(
          this.invInteractionForm.get("investment.investmentAccruedIsActive")
            .value,
          "investment.investmentAccruedAccountIdsObj"
        );
      });

    this.invInteractionForm
      .get("investment.investmentAccruedModeObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) =>
        this.invInteractionForm
          .get("investment.investmentAccruedMode")
          .setValue(res[0]?.text)
      );

    this.invInteractionForm
      .get("investment.investmentAccruedAccountIdsObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any[]) => {
        let ids = res.map((item) => item.id);

        this.invInteractionForm
          .get("investment.investmentAccruedAccountIds")
          .setValue(ids);

        this._updateValidators(
          this.invInteractionForm.get("investment.investmentAccruedIsActive")
            .value,
          "investment.investmentAccruedAccountIdsObj"
        );
      });

    //Initial Investment
    this.invInteractionForm
      .get("investment.investmentInitialIsActiveObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.invInteractionForm
          .get("investment.investmentInitialIsActive")
          .setValue(res[0]?.id);
        this._updateValidators(
          this.invInteractionForm.get("investment.investmentInitialIsActive")
            .value,
          "investment.investmentIntialAccountIdsObj"
        );
      });

    this.invInteractionForm
      .get("investment.investmentInitialModeObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) =>
        this.invInteractionForm
          .get("investment.investmentInitialMode")
          .setValue(res[0]?.text)
      );

    this.invInteractionForm
      .get("investment.investmentIntialAccountIdsObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any[]) => {
        let ids = res.map((item) => item.id);

        this.invInteractionForm
          .get("investment.investmentIntialAccountIds")
          .setValue(ids);

        this._updateValidators(
          this.invInteractionForm.get("investment.investmentInitialIsActive")
            .value,
          "investment.investmentIntialAccountIdsObj"
        );
      });

    //Initial + Accrued
    this.invInteractionForm
      .get("investment.investmentInitialAndAccruedIsActiveObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.invInteractionForm
          .get("investment.investmentInitialAndAccruedIsActive")
          .setValue(res[0]?.id);
        this._updateValidators(
          this.invInteractionForm.get(
            "investment.investmentInitialAndAccruedIsActive"
          ).value,
          "investment.investmentInitialAndAccruedAccountIdsObj"
        );
      });

    this.invInteractionForm
      .get("investment.investmentInitialAndAccruedModeObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) =>
        this.invInteractionForm
          .get("investment.investmentInitialAndAccruedMode")
          .setValue(res[0]?.text)
      );

    this.invInteractionForm
      .get("investment.investmentInitialAndAccruedAccountIdsObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any[]) => {
        let ids = res.map((item) => item.id);

        this.invInteractionForm
          .get("investment.investmentInitialAndAccruedAccountIds")
          .setValue(ids);

        this._updateValidators(
          this.invInteractionForm.get(
            "investment.investmentInitialAndAccruedIsActive"
          ).value,
          "investment.investmentInitialAndAccruedAccountIdsObj"
        );
      });
  }

  checkInnerValue(formName: string): void {
    this.formName = formName;
  }

  checkParentValue(parentName: string): void {
    this.parentName = parentName;
    this.formName = null;
  }

  private _cleanUp() {
    const {investmentAccruedAccountIdsObj,investmentAccruedIsActiveObj,investmentAccruedModeObj,investmentInitialAndAccruedAccountIdsObj,investmentInitialAndAccruedIsActiveObj,investmentInitialAndAccruedModeObj,investmentInitialIsActiveObj,investmentInitialModeObj,investmentIntialAccountIdsObj,...rest} = this.invInteractionForm.value.investment;

    return {investment:rest};
  }

  toggleSwitch(value:boolean,control:string,element?:string){
    element ? this.activeElement = element : null;
    this.invInteractionForm.get(control).setValue([{id:value}]);
    this.save();
  }

  save(): void {
    const payload = this._cleanUp();
    this.isLoading = true;
    this._configService
      .updateFinanceInteractions(payload)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(
        (res) => {
          this.getNewAppowner.emit();

          this.isLoading = false;

          this.toast.fire({
            title: "Settings Saved Successfully",
            type: "success",
          });
        },
        (error) => (this.isLoading = false)
      );
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
