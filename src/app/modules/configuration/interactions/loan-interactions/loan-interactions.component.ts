import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  FormArray,
  FormGroup,
  FormControl,
} from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ConfigurationService } from "src/app/service/configuration.service";
import Swal from "sweetalert2";
import { PaystackInfo } from "../../models/configuration";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";

@Component({
  selector: "loan-interactions",
  templateUrl: "./loan-interactions.component.html",
  styleUrls: ["./loan-interactions.component.scss"],
})
export class LoanInteractionsComponent implements OnInit, OnChanges, OnDestroy {
  private subs$ = new Subject();

  @Input() selectedModule;
  @Input() statuses;
  @Input() modes;
  @Input() accounts;
  @Input() appOwner;
  @Input() isChecked;
  @Input() user;
  @Output() getAppowner = new EventEmitter();

  loanInteractionForm: UntypedFormGroup;
  isLoading: boolean = false;
  formName: string;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  activeElement:string;
  paystackInfo:PaystackInfo;
  disbursementPartners = [];
  allPartners:string[];
  currentTheme:ColorThemeInterface

  constructor(
    private _fb: UntypedFormBuilder,
    private _configService: ConfigurationService,
    private colorThemeService:ColorThemeService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this._initForm(this.appOwner);
    this.getPaystackInfo();
    this.getAllPartners();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.appOwner && !changes.appOwner.firstChange) {
      this._showSubMsg();
    }
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private getPaystackInfo(){
    this._configService.getPaystackInfo().pipe(takeUntil(this.subs$)).subscribe(res => {
      this.paystackInfo = res.body.data;
    })
  }

  private getAllPartners(){
    this._configService.getAllPartners().pipe(takeUntil(this.subs$)).subscribe(res => {
      this.allPartners = res.body.data;
      this.fetchDisbursementAccountInfo();
    })
  }

  private fetchDisbursementAccountInfo(){
    this._configService.fetchDisbursementAccountInfo({pageNumber:1,pageSize:10}).pipe(takeUntil(this.subs$)).subscribe(res => {
      const partnerIntegrations = res.body.items;
      this.allPartners.forEach(partner => {
        const partnerIntegration = partnerIntegrations.find(partnerIntegration => partnerIntegration?.integrationName === partner);
        this.addPartnerLinkedAccount({
          integrationName:partner,
          financeAccountName:partnerIntegration?.financeAccount?.name || null,
          financeAccountId:partnerIntegration?.financeAccountId || null,
          isActive: partnerIntegration ? true : false
        })
      })
    });
  }


  private _initForm(appOwner): void {
    const loanDisbursementAccountIds =
      appOwner?.financeDisbursementAccounts.map((account) => account.accountId);
    const loanDisbursementAccountIdsObj =
      appOwner?.financeDisbursementAccounts.map((account) => ({
        id: account.accountId,
        text: account.name,
      }));

    const loanPaymentAccountIds = appOwner?.financePaymentAccounts.map(
      (account) => account.accountId
    );
    const loanPaymentAccountIdsObj = appOwner?.financePaymentAccounts.map(
      (account) => ({ id: account.accountId, text: account.name })
    );

    this.loanInteractionForm = this._fb.group({
      loan: this._fb.group({
        disbursementIsActive: new UntypedFormControl(
          appOwner?.financeInteractionData?.disbursementIsActive || false,
          Validators.required
        ),
        disbursementMode: new UntypedFormControl(
          appOwner?.financeInteractionData?.disbursementMode || "Automatic",
          Validators.required
        ),
        paymentIsActive: new UntypedFormControl(
          appOwner?.financeInteractionData?.paymentIsActive || false,
          Validators.required
        ),
        paymentMode: new UntypedFormControl(
          appOwner?.financeInteractionData?.paymentMode || "Automatic",
          Validators.required
        ),

        disbursementIsActiveObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.disbursementIsActive
            ? [this.statuses[0]]
            : [this.statuses[1]],
          Validators.required
        ),
        disbursementModeObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.disbursementMode === "Automatic"
            ? [this.modes[0]]
            : [this.modes[1]],
          Validators.required
        ),
        paymentIsActiveObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.paymentIsActive
            ? [this.statuses[0]]
            : [this.statuses[1]],
          Validators.required
        ),
        paymentModeObj: new UntypedFormControl(
          appOwner?.financeInteractionData?.paymentMode === "Automatic"
            ? [this.modes[0]]
            : [this.modes[1]],
          Validators.required
        ),
        loanDisbursementAccountIds: new UntypedFormControl(
          loanDisbursementAccountIds || []
        ),
        loanPaymentAccountIds: new UntypedFormControl(loanPaymentAccountIds || []),

        loanDisbursementAccountIdsObj: new UntypedFormControl(
          loanDisbursementAccountIdsObj || []
        ),
        loanPaymentAccountIdsObj: new UntypedFormControl(
          loanPaymentAccountIdsObj || []
        )
      }),
      partnersLinkedAccounts: this._fb.array([])
    });

    this._watchFormChanges();
  }

  get partnersLinkedAccounts(){
    return this.loanInteractionForm.get("partnersLinkedAccounts") as FormArray;
  }

  private _watchFormChanges(): void {
    this._updateValidators(
      this.loanInteractionForm.get("loan.disbursementIsActive").value,
      "loan.loanDisbursementAccountIdsObj"
    );

    this.loanInteractionForm
      .get("loan.disbursementIsActiveObj")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.loanInteractionForm
          .get("loan.disbursementIsActive")
          .setValue(res[0]?.id);

        this._updateValidators(
          this.loanInteractionForm.get("loan.disbursementIsActive").value,
          "loan.loanDisbursementAccountIdsObj"
        );
      });

    this.loanInteractionForm
      .get("loan.disbursementModeObj")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) =>
        this.loanInteractionForm
          .get("loan.disbursementMode")
          .setValue(res[0]?.text)
      );

    this.loanInteractionForm
      .get("loan.loanDisbursementAccountIdsObj")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res: any[]) => {
        let ids = res.map((item) => item.id);

        this.loanInteractionForm
          .get("loan.loanDisbursementAccountIds")
          .setValue(ids);

        this._updateValidators(
          this.loanInteractionForm.get("loan.disbursementIsActive").value,
          "loan.loanDisbursementAccountIdsObj"
        );
      });

    this.loanInteractionForm
      .get("loan.paymentIsActiveObj")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.loanInteractionForm
          .get("loan.paymentIsActive")
          .setValue(res[0]?.id);

        this._updateValidators(
          this.loanInteractionForm.get("loan.paymentIsActive").value,
          "loan.loanPaymentAccountIdsObj"
        );
      });

    this.loanInteractionForm
      .get("loan.paymentModeObj")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res) =>
        this.loanInteractionForm.get("loan.paymentMode").setValue(res[0]?.text)
      );

    this.loanInteractionForm
      .get("loan.loanPaymentAccountIdsObj")
      .valueChanges.pipe(takeUntil(this.subs$))
      .subscribe((res: any[]) => {
        let ids = res.map((item) => item.id);
        this.loanInteractionForm
          .get("loan.loanPaymentAccountIds")
          .setValue(ids);

        this._updateValidators(
          this.loanInteractionForm.get("loan.paymentIsActive").value,
          "loan.loanPaymentAccountIdsObj"
        );
      });
  }

  private _updateValidators(addValidator: boolean, controlName: string): void {
    if (addValidator) {
      this.loanInteractionForm
        .get(controlName)
        .setValidators(Validators.required);
      this.loanInteractionForm
        .get(controlName)
        .updateValueAndValidity({ emitEvent: false });
    } else {
      this.loanInteractionForm.get(controlName).clearValidators();
      this.loanInteractionForm
        .get(controlName)
        .updateValueAndValidity({ emitEvent: false });
    }
  }

  checkInnerValue(formName: string): void {
    this.formName = formName;
  }

  private _cleanUp() {
    const {disbursementIsActiveObj,disbursementModeObj,paymentIsActiveObj,paymentModeObj,loanDisbursementAccountIdsObj,loanPaymentAccountIdsObj,...rest} = this.loanInteractionForm.value.loan;

    const accounts = {};
    this.loanInteractionForm.value?.partnersLinkedAccounts.forEach(value => {
      if (value?.partner === "Kuda") {
        accounts["kudaAccountId"] = value?.linkedAccount[0]?.id
      } else if (value?.partner === "Paystack"){
        accounts["paystackCOAccountId"] = value?.linkedAccount[0]?.id
      } else if (value?.partner === "Seerbit"){
        accounts["seerbitCOAAccountId"] = value?.linkedAccount[0]?.id
      }
    })
    return {loan:rest,...accounts};
  }

  private _showSubMsg(): void {
    this.isLoading = false;
    this.toast.fire({
      title: "Settings Saved Successfully",
      type: "success",
    });
  }

  toggleSwitch(value:boolean,control:string,element?:string){
    element ? this.activeElement = element : null;
    this.loanInteractionForm.get(control).setValue([{id:value}]);
    this.save();
  }

  addPartnerLinkedAccount(payload){
    const partnerAccount = new FormGroup({
      partner: new FormControl<string>(payload?.integrationName || null, Validators.required),
      linkedAccount: new FormControl<any>(payload?.financeAccountId ? [{id:payload?.financeAccountId,text:payload?.financeAccountName}] : [], payload?.financeAccountId ? Validators.required : null),
      isActive: new FormControl<boolean>(payload?.isActive)
    });

    this.partnersLinkedAccounts.push(partnerAccount);
  }


  save(): void {
    const payload = this._cleanUp();

    this.isLoading = true;
    this._configService
      .updateFinanceInteractions(payload)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.getAppowner.emit();
          this.partnersLinkedAccounts.clear();
          this.fetchDisbursementAccountInfo();
        },
        (error) => (this.isLoading = false)
      );
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
