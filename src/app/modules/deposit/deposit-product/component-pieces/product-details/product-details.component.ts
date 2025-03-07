import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { constants } from 'node:buffer';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { AuthService } from 'src/app/service/auth.service';
import { DepositService } from 'src/app/service/deposit.service';
import { UserService } from 'src/app/service/user.service';
import Swal from 'sweetalert2';
import { DepositProduct } from '../../../models/deposit-product.model';

@Component({
  selector: 'product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  @Input() isEditing: boolean;
  @Input() currentTheme?: ColorThemeInterface;

  @Output() nextStep: EventEmitter<boolean>;
  @Output() productDetails: EventEmitter<DepositProduct>;

  @ViewChild('branchesModal') branchesModal: ElementRef;
  public productDetailsForm: UntypedFormGroup;
	private unsubscriber$: Subject<void> = new Subject<void>();

  selectedBranches: any[] = [];
  allBranches: any[] = [];
  loggedInUser: any;
  isSearching: boolean;
  depositProduct: DepositProduct;

  constructor(
    private fb: UntypedFormBuilder,
    private modalService: NgbModal,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private service: DepositService
    ) {
    this.nextStep = new EventEmitter<boolean>();
    this.productDetails = new EventEmitter<DepositProduct>();
   }

  ngOnInit(): void {
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl('/account/login');
      Swal.fire('Error', 'Please log in', 'error');
    }
    this.getAllBranches();
    
    this.formInit();
    this.service.getDepositProductEdit().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      if (res) {
        this.depositProduct = res
        this.formEditInit(this.depositProduct);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  public goToNextStep(): void {
    this.nextStep.emit(true);
  }

  private formInit(): void {
    this.productDetailsForm = this.fb.group({
      depositProductName: new UntypedFormControl(null, [Validators.required]),
      depositProductCategory: new UntypedFormControl(null, [Validators.required]),
      depositProductStatus: new UntypedFormControl(null, [Validators.required]),
      depositProductType: new UntypedFormControl(null, [Validators.required]),
      depositProductDescription: new UntypedFormControl(null),
      idType: new UntypedFormControl(null, [Validators.required]),
      randomPatternFormat: new UntypedFormControl(null),
      incrementalNumberStart: new UntypedFormControl(null),
      depositProductAutoSetAccountAsDormant: new UntypedFormControl(false),
      depositProductAutoSetAccountAsDormantDays: new UntypedFormControl(0, [Validators.required]),
      customers: new UntypedFormControl(false),
      groups: new UntypedFormControl(false),
      allBranches: new UntypedFormControl(false),
      branches: new UntypedFormControl([]),
      selectedBranches: new UntypedFormControl([])
    });

    this.watchFormChanges();
  }

  public toggleProductIdValidity(): void {
    const idType = this.productDetailsForm.get('idType').value;
    if (idType === 'IncrementalNumber') {
      this.productDetailsForm.get('incrementalNumberStart').setValidators([Validators.required]);
      this.productDetailsForm.get('incrementalNumberStart').updateValueAndValidity();

      this.productDetailsForm.get('randomPatternFormat').patchValue(null);
      this.productDetailsForm.get('randomPatternFormat').setValidators(null);
      this.productDetailsForm.get('randomPatternFormat').updateValueAndValidity();
    } else if (idType === 'RandomPattern') {

      this.productDetailsForm.get('randomPatternFormat').setValidators([Validators.required]);
      this.productDetailsForm.get('randomPatternFormat').updateValueAndValidity();

      this.productDetailsForm.get('incrementalNumberStart').patchValue(null);
      this.productDetailsForm.get('incrementalNumberStart').setValidators(null);
      this.productDetailsForm.get('incrementalNumberStart').updateValueAndValidity();
    }
  }

  private formEditInit(product: DepositProduct): void {
    this.productDetailsForm = this.fb.group({
      depositProductName: new UntypedFormControl(product?.depositProductName, [Validators.required]),
      depositProductCategory: new UntypedFormControl(product?.depositProductCategory, [Validators.required]),
      depositProductStatus: new UntypedFormControl(product?.depositProductStatus, [Validators.required]),
      depositProductType: new UntypedFormControl(product?.depositProductType.split(' ').join(''), [Validators.required]),
      depositProductDescription: new UntypedFormControl(product?.depositProductDescription),
      idType: new UntypedFormControl(product?.depositProductNewAccountSettings?.idType, [Validators.required]),
      randomPatternFormat: new UntypedFormControl(product?.depositProductNewAccountSettings?.randomPatternFormat),
      incrementalNumberStart: new UntypedFormControl(product?.depositProductNewAccountSettings?.incrementalNumberStart),
      depositProductAutoSetAccountAsDormant: new UntypedFormControl(product?.depositProductInternalControls?.depositProductAutoSetAccountAsDormant),
      depositProductAutoSetAccountAsDormantDays: new UntypedFormControl(product?.depositProductInternalControls?.depositProductAutoSetAccountAsDormantDays, [Validators.required]),
      customers: new UntypedFormControl(product?.depositProductAvailabilitySettings?.customers),
      groups: new UntypedFormControl(product?.depositProductAvailabilitySettings?.groups),
      allBranches: new UntypedFormControl(product?.depositProductAvailabilitySettings?.allBranches),
      branches: new UntypedFormControl(product?.depositProductAvailabilitySettings?.branches),
      selectedBranches: new UntypedFormControl(null)
    });


    const allSelectedBranches: any[] = []
    product?.depositProductAvailabilitySettings?.branches.forEach(id => {
     const fullBranchObj = this.allBranches.find(x => x.id === id);
     if (fullBranchObj) {
      allSelectedBranches.push(fullBranchObj);
     } 
    });

    this.productDetailsForm.get('selectedBranches').patchValue(allSelectedBranches);

    this.watchFormChanges();
  }


  public getAllBranches(): void {
    this.userService.fetchAllBranches().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      this.allBranches = res?.body;
    });
  }

  private watchFormChanges(): void {
    this.productDetailsForm.valueChanges.pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      if (res.allBranches) {
        this.selectedBranches = [];
      }
      this.emitProductDetail(res);
    });
  }
  private emitProductDetail(formData: any): void {
    let deposit: DepositProduct = formData;

    deposit.depositProductNewAccountSettings = {
      idType: formData.idType,
      randomPatternFormat: formData.randomPatternFormat,
      incrementalNumberStart: formData.incrementalNumberStart
    };
    deposit.depositProductAvailabilitySettings = {
      customers: formData.customers,
      groups: formData.groups,
      allBranches: formData.allBranches,
      branches: []
    };
    deposit.depositProductInternalControls = {
      depositProductAutoSetAccountAsDormant: formData.depositProductAutoSetAccountAsDormant,
      depositProductAutoSetAccountAsDormantDays: formData.depositProductAutoSetAccountAsDormantDays
    }

    if (!formData.allBranches) {
      const selectedBranches = formData?.selectedBranches;
      selectedBranches.forEach(branch => {
        deposit.depositProductAvailabilitySettings.branches.push(branch?.id);
      })
    }

    this.productDetails.emit(deposit);


  }

  public checkIfSelected(value: string): boolean {
    return this.selectedBranches.some(branch => branch.branchName === value);
  }

}
