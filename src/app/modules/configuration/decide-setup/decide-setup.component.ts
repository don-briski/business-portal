import { Component, OnDestroy, OnInit, Input } from "@angular/core";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { map, pluck, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  DecideSetup,
  Trigger,
  Comparator,
} from "../models/decideSetup.interface";
import Swal from "sweetalert2";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

declare var payWithPaystack;
@Component({
  selector: "app-decide-setup",
  templateUrl: "./decide-setup.component.html",
  styleUrls: ["./decide-setup.component.scss"],
})
export class DecideSetupComponent implements OnInit, OnDestroy {
  @Input() currentTheme;
  @Input() currencySymbol;
  @Input() decideInfo: DecideSetup | null = null;

  private _unsubscriber$ = new Subject();
  private _originalCriterias: any[] = [];

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  isLoading: boolean = false;
  decideWalletBalance: number;
  setupForm: UntypedFormGroup;
  activeStates: CustomDropDown[] = [
    { id: 0, text: "Active" },
    { id: 1, text: "Inactive" },
  ];

  triggerStates: CustomDropDown[] = [
    { id: 0, text: Trigger.Manual },
    { id: 1, text: Trigger.Automatic },
  ];

  comparators: CustomDropDown[] = [
    { id: 0, text: Comparator.EqualTo },
    { id: 1, text: Comparator.GreaterThan },
    { id: 2, text: Comparator.LessThan },
  ];

  criterias: CustomDropDown[] = [];
  topupForm: UntypedFormGroup;

  btnText: string = "Processing";

  constructor(
    private _fb: UntypedFormBuilder,
    private _configService: ConfigurationService,
    private _ngbModal: NgbModal
  ) {}

  ngOnInit(): void {
    this._getDecideVariableInfo();
    this._getDecideWalletBalance();
  }

  private _initTopupForm(content): void {
    this.topupForm = this._fb.group({
      key: new UntypedFormControl(null),
      email: new UntypedFormControl(null, Validators.required),
      amount: new UntypedFormControl(0, Validators.required),
    });

    this._ngbModal.open(content, { centered: true });
  }

  private _getDecideWalletBalance(): void {
    this._configService
      .getDecideWalletBalance()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => (this.decideWalletBalance = res.body.data));
  }

  topupDecideWallet(): void {
    this.isLoading = true;
    this._configService
      .getPaystackPublicKey()
      .pipe(pluck("body"), takeUntil(this._unsubscriber$))
      .subscribe(
        (res) => {
          this.topupForm.get("key").setValue(res.data);
          this.isLoading = false;
          payWithPaystack(this.topupForm.value).then((res) => {
            this.isLoading = true;
            this.btnText = "Verifying Transaction";

            this._configService
              .verifyDecideTopUp(res)
              .pipe(takeUntil(this._unsubscriber$))
              .subscribe(
                (res) => {
                  this._getDecideWalletBalance();
                  this.isLoading = false;
                  this._ngbModal.dismissAll();
                  this.toast.fire({
                    type: "success",
                    title: res.body.message,
                    timer: 4000,
                  });
                },
                (error) => (this.isLoading = false)
              );
          });
        },
        (error) => (this.isLoading = false)
      );
  }

  initiateDecideTopupProcess(content): void {
    this._initTopupForm(content);
  }

  closeModal(): void {
    this._ngbModal.dismissAll();
  }

  private _getDecideVariableInfo(): void {
    this._configService
      .getDecideVariableInfo()
      .pipe(
        pluck("body", "data"),
        map((response) => {
          let index = 0;
          let newArray: CustomDropDown[] = [];
          this._originalCriterias = response;
          for (const [key, value] of Object.entries(response)) {
            index += 1;
            const newObject = this.modifyResponse(key, index);

            newArray.push(newObject);
          }
          return newArray;
        }),
        takeUntil(this._unsubscriber$)
      )
      .subscribe((res) => {
        this.criterias = res;
        this._initForm();
      });
  }

  private _getAppOwnerInfo(): void {
    this._configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.decideInfo = res.body.decideInfo;
        this.isLoading = false;

        this._initForm();
      });
  }

  private _initForm(): void {
    this.setupForm = this._fb.group({
      autoapprove: new UntypedFormControl(
        this.decideInfo?.autoApprove || false,
        Validators.required
      ),
      autoApprove: new UntypedFormControl(false, Validators.required),
      triggerObj: new UntypedFormControl(
        this.decideInfo.trigger === Trigger.Automatic
          ? [this.triggerStates[1]]
          : [this.triggerStates[0]],
        Validators.required
      ),
      trigger: new UntypedFormControl(
        this.decideInfo.trigger === Trigger.Automatic
          ? this.triggerStates[1].text
          : this.triggerStates[0].text,
        Validators.required
      ),
      isactive: new UntypedFormControl(
        this.decideInfo?.isActive
          ? [this.activeStates[0]]
          : [this.activeStates[1]],
        Validators.required
      ),
      isActive: new UntypedFormControl(
        this.decideInfo.isActive ? true : false,
        Validators.required
      ),
      autoApproveCriteria: this._fb.array([]),
    });

    if (this.decideInfo) {
      this.decideInfo.autoApproveCriteria.forEach((criteria) =>
        this.addCriteria(criteria)
      );
    } else {
      this.addCriteria();
    }

    this._watchFormChanges();
  }

  private _watchFormChanges(): void {
    this.setupForm
      .get("isactive")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        res[0].text === "Active"
          ? this.setupForm.get("isActive").setValue(true)
          : this.setupForm.get("isActive").setValue(false);
      });

    this.setupForm
      .get("triggerObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => this.setupForm.get("trigger").setValue(res[0].text));

    this.setupForm
      .get("autoapprove")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => this.setupForm.get("autoApprove").setValue(res));

    this.setupForm
      .get("autoApproveCriteria")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: any[]) => {
        res.forEach((criteria, index: number) => {
          let splitedValues;
          let valuePrefix;
          if (criteria.keyVal) {
            splitedValues = criteria?.keyVal[0]?.text.split("-");
            switch (splitedValues[0]) {
              case "(BA)":
                valuePrefix = "BehavouralAnalysis";
                break;
              case "(CA)":
                valuePrefix = "CashFlowAnalysis";
                break;

              case "(IA)":
                valuePrefix = "IncomeAnalysis";
                break;

              case "(SA)":
                valuePrefix = "SpendAnalysis";
                break;

              default:
                break;
            }
            this.criteriaLines()
              .at(index)
              .get("key")
              .setValue(`${valuePrefix}_${splitedValues[1]}`, {
                emitEvent: false,
              });
          }

          if (criteria.comparatorVal) {
            this.criteriaLines()
              .at(index)
              .get("comparator")
              .setValue(criteria?.comparatorVal[0]?.text, {
                emitEvent: false,
              });
          }

          if (criteria.key) {
            for (const [key, value] of Object.entries(
              this._originalCriterias
            )) {
              if (key === `${valuePrefix}_${splitedValues[1]}`) {
                const type = value;

                if (type === "Integer" && criteria.value % 1 !== 0) {
                  this.toast.fire({
                    type: "error",
                    title: "Value must be of type " + type,
                    timer: 4000,
                  });
                  this.criteriaLines().at(index).get("value").reset(0);
                }
              }
            }
          }
        });
      });
  }

  modifyResponse(key: string, index?: number): any {
    let keyPrefix;
    const splitedValues = key.split("_");

    const start = splitedValues[0];
    const end = splitedValues[1];

    switch (start) {
      case "BehavouralAnalysis":
        keyPrefix = "(BA)";
        break;

      case "CashFlowAnalysis":
        keyPrefix = "(CA)";
        break;

      case "IncomeAnalysis":
        keyPrefix = "(IA)";
        break;

      case "SpendAnalysis":
        keyPrefix = "(SA)";
        break;

      default:
        break;
    }

    const newValue = `${keyPrefix}-${end}`;
    return { id: index || null, text: newValue };
  }

  criteriaLines(): UntypedFormArray {
    return this.setupForm.get("autoApproveCriteria") as UntypedFormArray;
  }

  addCriteria(data?: any): void {
    let selectedCriteria;
    if (data?.key) {
      const response = this.modifyResponse(data.key);
      selectedCriteria = this.criterias.filter(
        (criteria) => criteria.text === response.text
      );
    }

    const comparator = this.comparators.filter(
      (comparator) => comparator.text === data?.comparator
    );
    const criteria = this._fb.group({
      key: new UntypedFormControl(data?.key ? data?.key : null, Validators.required),
      keyVal: new UntypedFormControl(
        data?.key ? selectedCriteria : null,
        Validators.required
      ),
      comparator: new UntypedFormControl(
        data?.comparator ? comparator[0]?.text : null,
        Validators.required
      ),
      comparatorVal: new UntypedFormControl(
        data?.comparator ? comparator : null,
        Validators.required
      ),
      value: new UntypedFormControl(data?.value || 0, Validators.required),
    });

    this.criteriaLines().push(criteria);
  }

  removeCriteria(controlIndex: number): void {
    if (this.criteriaLines().length > 1) {
      this.criteriaLines().removeAt(controlIndex);
    }
  }

  private _removeControls(): void {
    this.setupForm.removeControl("triggerObj");
    this.setupForm.removeControl("isactive");
    this.setupForm.removeControl("autoapprove");

    this.setupForm.get("autoApproveCriteria").value.forEach((criteria) => {
      delete criteria.comparatorVal;
      delete criteria.keyVal;
    });
  }

  submit(): void {
    this.isLoading = true;
    this._removeControls();

    this._configService
      .updateDecideSettings(this.setupForm.value)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        if (res.status === 200) {
          this.toast.fire({
            type: "success",
            title: "Update Successful",
            timer: 4000,
          });

          this._getAppOwnerInfo();
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
