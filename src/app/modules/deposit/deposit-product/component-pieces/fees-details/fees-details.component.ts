import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DepositService } from 'src/app/service/deposit.service';
import { DepositFee, DepositProduct } from '../../../models/deposit-product.model';

@Component({
  selector: 'fees-details',
  templateUrl: './fees-details.component.html',
  styleUrls: ['./fees-details.component.scss']
})
export class FeesDetailsComponent implements OnInit {
  @Input() isloading: boolean;
  @Input() currentDepositProduct: DepositProduct;
  @Input() isEditing: boolean;
  
  @Output() saveProduct: EventEmitter<void> = new EventEmitter<void>();
  @Output() feeDetails: EventEmitter<DepositProduct> = new EventEmitter<DepositProduct>();
  public productDetailsForm: UntypedFormGroup;
	private unsubscriber$: Subject<void> = new Subject<void>();

  public newFeeForm: UntypedFormGroup;

  allowArbitraryFee: boolean;

  public isData = true;
  public allFees: any[] = [];

  public selectedFees: DepositFee[] = [];

  constructor(private fb: UntypedFormBuilder, private depositService: DepositService, private modalService: NgbModal) {
   }

  public ngOnInit(): void {
    this.getFees();
  }

  public ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }


  private initNewFeeForm(): void {
    this.newFeeForm = this.fb.group({
      feeName: new UntypedFormControl(null, [Validators.required]),
      feeDescription: new UntypedFormControl(null, [Validators.required]),
      amount: new UntypedFormControl(0, [Validators.required]),
      depositProductFeeType: new UntypedFormControl(null, [Validators.required]),
      depositProductFeeApplyDateMethod: new UntypedFormControl(null, [Validators.required]),
    })
  }

  private getFees():void {
    this.depositService.getAllFees().pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      this.allFees = res?.data?.items;
    })
  }
  toggleFeeSelection(data: any): void {
    const index = this.selectedFees.findIndex(x => x.depositProductFeeId === data?.depositProductFeeId);
    if (index === -1) {
      this.selectedFees.push(data)
    } else {
      this.removeFee(data?.depositProductFeeId);
      return;
    }

    this.emitDetails();
  }

  isFeeSelected(item: any): boolean {
    return this.selectedFees.some(x => x.depositProductFeeId === item?.depositProductFeeId);
  }

  removeFee(feeId: any): void {
    const index = this.selectedFees.findIndex(x => x.depositProductFeeId === feeId);
    if (index > -1) this.selectedFees.splice(index, 1);

    this.emitDetails();
  }

  saveCustomFee(): void {
    const newFee = this.newFeeForm.value;
    this.selectedFees.push(newFee);
    this.closeModal();

    this.emitDetails()
  }

  openModal(content: any): void {
    this.initNewFeeForm();
    this.modalService.open(content, {centered: true});
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  submit(): void {
    this.saveProduct.emit();
  }

  protected emitDetails() {
    const deposit = this.currentDepositProduct;
    deposit.depositProductAllowArbitraryFees = this.allowArbitraryFee;
    deposit.depositProductFees = this.selectedFees;
    this.feeDetails.emit(deposit);
  }

}
