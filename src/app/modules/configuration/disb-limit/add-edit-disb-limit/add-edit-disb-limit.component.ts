import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  AlertThreshold,
  DISBURSEMENT_CATEGORY,
  DisbursementLimitDetail,
  DisbursementLimitGroup,
} from "../../models/disbursement-limit-type";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { AuthService } from "src/app/service/auth.service";
import { DisbursementLimitService } from "../../services/disbursement-limit.service";
import Swal from "sweetalert2";
import { nonZero } from "src/app/util/validators/validators";
import { TablePaginationChange } from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-add-edit-disb-limit",
  templateUrl: "./add-edit-disb-limit.component.html",
  styleUrls: ["./add-edit-disb-limit.component.scss"],
})
export class AddEditDisbLimitComponent implements OnChanges, OnInit {
  private unsubscriber$ = new Subject();

  @Input() showPopup: boolean;
  @Input() selectedResource: DISBURSEMENT_CATEGORY;
  @Input() limitDetail:DisbursementLimitDetail;

  @Output() closePopup = new EventEmitter();
  @Output() reloadLimit = new EventEmitter();

  form = new FormGroup({
    category: new FormControl(""),
    isActive: new FormControl(false),
    preventDisbursement: new FormControl(false),
    limitAmount: new FormControl(0, nonZero.bind(this)),
    entityId: new FormControl([]),
    entityName: new FormControl(null),
    resetFrequency: new FormControl(null),
    alertThresholds: new FormArray([]),
    frequencyStartDate: new FormControl(""),
  });
  selectedResourceList: CustomDropDown[] = [];
  setLimitConstraint = false;
  frequencies = ["Daily","Weekly", "Monthly", "Yearly"];
  isLoading = false;
  thresholdOpts = ["Percentage", "Flat"];
  disableApiSearch: boolean;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  disbursementLimitGroups: DisbursementLimitGroup[] = [];

  constructor(
    private configService: ConfigurationService,
    private authService: AuthService,
    private disbursementLimitService: DisbursementLimitService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedResource?.currentValue) {
      this.form
        .get("category")
        .setValue(changes.selectedResource?.currentValue);
      this.fetchSelectedResourceValues(changes.selectedResource?.currentValue);
    }

    if (changes.limitDetail?.currentValue) {
      this.patchForm()
    }
  }

  ngOnInit(): void {
    this.addThreshold();
    this.watchFormChanges();
    this.initializeFrequencyStartDate();
  }

  private initializeFrequencyStartDate(){
    const today = new Date().toISOString().split("T")[0];
    this.form.get("frequencyStartDate").setValue(today);
  }

  private watchFormChanges() {
    this.form
      .get("entityId")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((entity) => {
        if (entity) {
          this.form.get("entityName").setValue(entity[0]?.text);
        }
      });
  }

  private fetchSelectedResourceValues(selectedResource: DISBURSEMENT_CATEGORY) {
    this.isLoading = true;
    this.disableApiSearch = false;
    if (selectedResource === DISBURSEMENT_CATEGORY.Employer) {
      this.getEmployers();
    } else if (selectedResource === DISBURSEMENT_CATEGORY.ProductType) {
      this.getProductTypes();
    } else if (selectedResource === DISBURSEMENT_CATEGORY.State) {
      this.disableApiSearch = true;
      this.getCountries();
    } else if (selectedResource === DISBURSEMENT_CATEGORY.Branch) {
      this.getBranches();
    } else if (selectedResource === DISBURSEMENT_CATEGORY.Group) {
      this.getGroups();
    }
  }

  getSearchService(): Select2SearchApi {
    if (this.selectedResource === DISBURSEMENT_CATEGORY.Employer) {
      return {
        search: (searchParam: string) => {
          const model = {
            filter: searchParam,
            pageNumber: 1,
            pageSize: 10,
          };
          return this.configService.spoolEmployers(model);
        },
      };
    }

    if (this.selectedResource === DISBURSEMENT_CATEGORY.ProductType) {
      return {
        search: (searchParam: string) => {
          const model = {
            filter: searchParam,
            pageNumber: 1,
            pageSize: 10,
          };
          return this.configService.spoolLoanTypes(model);
        },
      };
    }
  }

  updateSearchDropdown(response) {
    if (
      this.selectedResource === DISBURSEMENT_CATEGORY.Employer ||
      this.selectedResource === DISBURSEMENT_CATEGORY.ProductType
    ) {
      this.selectedResourceList = this.transformResponse(response.value.data);
    }
  }

  private getEmployers() {
    this.configService
      .spoolEmployers({ pageNumber: 1, pageSize: 10 })
      .pipe(
        map((response) => this.transformResponse(response.body.value.data)),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (employees) => {
          this.selectedResourceList = employees;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private transformResponse(response) {
    if (this.selectedResource === DISBURSEMENT_CATEGORY.Employer) {
      return response.map((employee) => ({
        id: employee?.employerId,
        text: employee?.employerName,
      }));
    } else if (this.selectedResource === DISBURSEMENT_CATEGORY.ProductType) {
      return response.map((loanType) => ({
        id: loanType.loanTypeId,
        text: loanType.loanName,
      }));
    }
  }

  private getProductTypes() {
    this.configService
      .spoolLoanTypes({ pageNumber: 1, pageSize: 10 })
      .pipe(
        map((response) => this.transformResponse(response.body.value.data)),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (productTypes) => {
          this.selectedResourceList = productTypes;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private getCountries() {
    this.configService.spoolCountries().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      const countryIdForNigeria = res.body.find(country => country?.name?.toLowerCase() === "nigeria")?.id;
      if (countryIdForNigeria) {
        this.getStates(countryIdForNigeria)
      }
    })
  }


  private getStates(id:number) {
    this.configService
      .spoolStatesByCountry(id)
      .pipe(
        map((res) =>
          res.body.map((state) => ({ id: state.id, text: state.name }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (states) => {
          this.selectedResourceList = states;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private getBranches() {
    const model = {
      userId: this.authService.decodeToken().nameid,
      pageNumber: 1,
      pageSize: 10,
    };

    this.configService
      .spoolAccessibleBranches(model)
      .pipe(
        map((branches) =>
          branches.body.map((branch) => ({
            id: branch?.branchId,
            text: branch?.branchName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (branches) => {
          this.selectedResourceList = branches;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private getGroups(extras?: TablePaginationChange) {
      this.isLoading = true;

      let payload = {
        pageNumber: 1,
        pageSize: 50,
      };

      if (extras) {
        payload = { ...payload, ...extras };
      }

      this.disbursementLimitService
        .getDisbursementLimitGroups(payload)
        .pipe(map(res => res.body.items.map(group => ({id:group.id,text:group.name}))),takeUntil(this.unsubscriber$))
        .subscribe({
          next: (groups) => {
            this.selectedResourceList = groups;
            this.isLoading = false;
          },
          error: () => (this.isLoading = false),
        });
    }

  toggleActiveState(isActive: boolean) {
    this.form.get("isActive").setValue(isActive);
  }

  alertThresholds(): FormArray {
    return this.form.get("alertThresholds") as FormArray;
  }

  addThreshold(alertThreshold?:AlertThreshold) {
    const type = alertThreshold?.type ? [alertThreshold?.type] : ""
    const threshold = new FormGroup({
      type: new FormControl(type, Validators.required),
      amount: new FormControl(alertThreshold?.amount || 0, [Validators.required,nonZero.bind(this)]),
    });

    this.alertThresholds().push(threshold);
  }

  removeThreshold(index: number) {
    this.alertThresholds().removeAt(index);
  }

  toggleLimitConstraint(value: boolean) {
    this.setLimitConstraint = value;
    this.form.get("preventDisbursement").setValue(this.setLimitConstraint);
  }

  closeLimitPopup() {
    this.closePopup.emit();
    this.reloadLimit.emit(true);
    this.alertThresholds().clear();
    this.addThreshold();
    this.form.reset({ entityId: [], limitAmount: 0 });
  }

  patchForm(){
    this.form.patchValue({
      category:this.limitDetail?.category,
      isActive:this.limitDetail?.isActive,
      preventDisbursement:this.limitDetail?.preventDisbursement,
      limitAmount:this.limitDetail?.limitAmount,
      entityId:[{id:this.limitDetail?.entityId,text:this.limitDetail?.entityName}],
      entityName:this.limitDetail?.entityName,
      resetFrequency:[this.limitDetail?.resetFrequency],
      frequencyStartDate: this.limitDetail?.frequencyStartDate.split("T")[0]
    })
    this.alertThresholds().clear();
    this.limitDetail.alertThresholds.forEach(threshold => this.addThreshold(threshold))
  }

  private onSuccess(){
    this.toast.fire({
      type: "success",
      title: `Limit ${this.limitDetail ? 'updated' : 'created'} successfully!`,
    });
    this.closeLimitPopup();
    this.isLoading = false;
  }

  submit() {
    this.isLoading = true;
    const alertThresholds: AlertThreshold[] = this.form
      .get("alertThresholds")
      .value.map((alertThreshold) => ({
        type: alertThreshold?.type[0],
        amount: alertThreshold?.amount,
      }));

    const payload = {
      ...this.form.getRawValue(),
      entityId: this.form.value.entityId[0]?.id,
      resetFrequency: this.form.value?.resetFrequency[0],
      alertThresholds,
    };

    if (!this.limitDetail) {
      this.disbursementLimitService
        .createDisbursementLimit(payload)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => {
            this.onSuccess();
          },
          error: () => (this.isLoading = false),
        });
    } else{
      this.disbursementLimitService
        .updateDisbursementLimit({...payload,id:this.limitDetail.id})
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: () => {
            this.onSuccess();
            this.limitDetail = null;
          },
          error: () => (this.isLoading = false),
        });
    }
  }
}
