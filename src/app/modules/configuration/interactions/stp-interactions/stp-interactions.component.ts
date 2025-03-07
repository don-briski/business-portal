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
  selector: "stp-interactions",
  templateUrl: "./stp-interactions.component.html",
  styleUrls: ["./stp-interactions.component.scss"],
})
export class StpInteractionsComponent implements OnInit, OnDestroy {
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
  stpInteractionForm: UntypedFormGroup;
  isLoading: boolean = false;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  activeElement:string;

  constructor(
    private _fb: UntypedFormBuilder,
    private _configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this._initForm(this.appOwner);
  }

  private _initForm(appOwner): void {
    const stpAccruedAccountIdsObj = appOwner?.financeStpAccruedAccounts.map(
      (account) => ({
        id: account.accountId,
        text: account.name,
      })
    );

    const stpAccruedAccountIds = appOwner?.financeStpAccruedAccounts.map(
      (account) => account.accountId
    );

    const stpIntialAccountIdsObj = appOwner?.financeStpInitialAccounts.map(
      (account) => ({
        id: account.accountId,
        text: account.name,
      })
    );

    const stpIntialAccountIds = appOwner?.financeStpInitialAccounts.map(
      (account) => account.accountId
    );

    const stpInitialAndAccruedAccountIdsObj =
      appOwner?.financeStpInitialAndAccruedAccounts.map((account) => ({
        id: account.accountId,
        text: account.name,
      }));

    const stpInitialAndAccruedAccountIds =
      appOwner?.financeStpInitialAndAccruedAccounts.map(
        (account) => account.accountId
      );

    this.stpInteractionForm = this._fb.group({
      stp: this._fb.group({
        stpAccruedIsActiveObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpAccruedIsActive
            ? [this.statuses[0]]
            : [this.statuses[1]],
          Validators.required
        ),
        stpAccruedIsActive: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpAccruedIsActive || false,
          Validators.required
        ),

        stpAccruedModeObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpAccruedMode === "Automatic"
            ? [this.modes[0]]
            : [this.modes[1]],
          Validators.required
        ),
        stpAccruedMode: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpAccruedMode || "Automatic",
          Validators.required
        ),

        stpInitialIsActiveObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpInitialIsActive
            ? [this.statuses[0]]
            : [this.statuses[1]],
          Validators.required
        ),
        stpInitialIsActive: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpInitialIsActive || false,
          Validators.required
        ),

        stpInitialModeObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpInitialMode === "Automatic"
            ? [this.modes[0]]
            : [this.modes[1]],
          Validators.required
        ),
        stpInitialMode: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpInitialMode || "Automatic",
          Validators.required
        ),

        stpInitialAndAccruedIsActiveObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpInitialAndAccruedIsActive
            ? [this.statuses[0]]
            : [this.statuses[1]],
          Validators.required
        ),
        stpInitialAndAccruedIsActive: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpInitialAndAccruedIsActive ||
            false,
          Validators.required
        ),

        stpInitialAndAccruedModeObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpInitialAndAccruedMode ===
          "Automatic"
            ? [this.modes[0]]
            : [this.modes[1]],
          Validators.required
        ),
        stpInitialAndAccruedMode: new UntypedFormControl(
          appOwner?.financeInteractionData?.stpInitialAndAccruedMode ||
            "Automatic",
          Validators.required
        ),

        stpAccruedAccountIdsObj: new UntypedFormControl(stpAccruedAccountIdsObj || []),
        stpAccruedAccountIds: new UntypedFormControl(stpAccruedAccountIds || []),

        stpIntialAccountIdsObj: new UntypedFormControl(stpIntialAccountIdsObj || []),
        stpIntialAccountIds: new UntypedFormControl(stpIntialAccountIds || []),

        stpInitialAndAccruedAccountIdsObj: new UntypedFormControl(
          stpInitialAndAccruedAccountIdsObj || []
        ),
        stpInitialAndAccruedAccountIds: new UntypedFormControl(
          stpInitialAndAccruedAccountIds || []
        ),
      }),
    });

    this._watchFormChanges();
  }

  private _updateValidators(addValidator: boolean, controlName: string): void {
    if (addValidator) {
      this.stpInteractionForm
        .get(controlName)
        .setValidators(Validators.required);
      this.stpInteractionForm
        .get(controlName)
        .updateValueAndValidity({ emitEvent: false });
    } else {
      this.stpInteractionForm.get(controlName).clearValidators();
      this.stpInteractionForm
        .get(controlName)
        .updateValueAndValidity({ emitEvent: false });
    }
  }

  private _watchFormChanges(): void {
    this._updateValidators(
      this.stpInteractionForm.get("stp.stpAccruedIsActive").value,
      "stp.stpAccruedAccountIdsObj"
    );

    //stp Accrued
    this.stpInteractionForm
      .get("stp.stpAccruedIsActiveObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.stpInteractionForm
          .get("stp.stpAccruedIsActive")
          .setValue(res[0]?.id);

        this._updateValidators(
          this.stpInteractionForm.get("stp.stpAccruedIsActive").value,
          "stp.stpAccruedAccountIdsObj"
        );
      });

    this.stpInteractionForm
      .get("stp.stpAccruedModeObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) =>
        this.stpInteractionForm.get("stp.stpAccruedMode").setValue(res[0]?.text)
      );

    this.stpInteractionForm
      .get("stp.stpAccruedAccountIdsObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any[]) => {
        let ids = res.map((item) => item.id);

        this.stpInteractionForm.get("stp.stpAccruedAccountIds").setValue(ids);

        this._updateValidators(
          this.stpInteractionForm.get("stp.stpAccruedIsActive").value,
          "stp.stpAccruedAccountIdsObj"
        );
      });

    //Initial stp
    this.stpInteractionForm
      .get("stp.stpInitialIsActiveObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.stpInteractionForm
          .get("stp.stpInitialIsActive")
          .setValue(res[0]?.id);

        this._updateValidators(
          this.stpInteractionForm.get("stp.stpInitialIsActive").value,
          "stp.stpIntialAccountIdsObj"
        );
      });

    this.stpInteractionForm
      .get("stp.stpInitialModeObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) =>
        this.stpInteractionForm.get("stp.stpInitialMode").setValue(res[0]?.text)
      );

    this.stpInteractionForm
      .get("stp.stpIntialAccountIdsObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any[]) => {
        let ids = res.map((item) => item.id);

        this.stpInteractionForm.get("stp.stpIntialAccountIds").setValue(ids);

        this._updateValidators(
          this.stpInteractionForm.get("stp.stpInitialIsActive").value,
          "stp.stpIntialAccountIdsObj"
        );
      });

    //Initial + Accrued
    this.stpInteractionForm
      .get("stp.stpInitialAndAccruedIsActiveObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.stpInteractionForm
          .get("stp.stpInitialAndAccruedIsActive")
          .setValue(res[0]?.id);

        this._updateValidators(
          this.stpInteractionForm.get("stp.stpInitialAndAccruedIsActive").value,
          "stp.stpInitialAndAccruedAccountIdsObj"
        );
      });

    this.stpInteractionForm
      .get("stp.stpInitialAndAccruedModeObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) =>
        this.stpInteractionForm
          .get("stp.stpInitialAndAccruedMode")
          .setValue(res[0]?.text)
      );

    this.stpInteractionForm
      .get("stp.stpInitialAndAccruedAccountIdsObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any[]) => {
        let ids = res.map((item) => item.id);

        this.stpInteractionForm
          .get("stp.stpInitialAndAccruedAccountIds")
          .setValue(ids);

        this._updateValidators(
          this.stpInteractionForm.get("stp.stpInitialAndAccruedIsActive").value,
          "stp.stpInitialAndAccruedAccountIdsObj"
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
    const {stpAccruedIsActiveObj,stpAccruedModeObj,stpAccruedAccountIdsObj,stpInitialIsActiveObj,stpInitialModeObj,stpIntialAccountIdsObj,stpInitialAndAccruedIsActiveObj,stpInitialAndAccruedModeObj,stpInitialAndAccruedAccountIdsObj,...rest} = this.stpInteractionForm.value.stp;

    return {stp:rest};
  }

  toggleSwitch(value:boolean,control:string,element?:string){
    element ? this.activeElement = element : null;
    this.stpInteractionForm.get(control).setValue([{id:value}]);
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
