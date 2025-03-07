import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CaseType } from '../../../crm.types';
import { CrmService } from '../../../crm.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'lnd-add-edit-case',
  templateUrl: './add-edit-case.component.html',
  styleUrls: ['./add-edit-case.component.scss']
})
export class AddEditCaseComponent implements OnChanges, OnDestroy {
  private unsubscriber$ = new Subject<void>();

  @Input() caseType:CaseType;

  @Input() showPopup:boolean;

  @Output() togglePopup = new EventEmitter<void>();

  @Output() fetchCaseTypes = new EventEmitter<void>();


  form = new FormGroup({
    name: new FormControl("", Validators.required),
    description: new FormControl("", Validators.required),
    isActive: new FormControl(false, Validators.required)
  });
  isProcessing = false;

  constructor(private crmService:CrmService){}


  ngOnChanges(changes: SimpleChanges): void {
    if (changes.caseType?.currentValue) {
      this.caseType = changes.caseType?.currentValue;
      this.patchForm();
    }
  }

  private patchForm(){
    this.form.patchValue({
      name:this.caseType.name,
      description:this.caseType?.description,
      isActive: this.caseType.isActive
    })
  }

  setIsActive(value:boolean){
    this.form.get("isActive").setValue(value);
  }

  closePopup(){
    this.togglePopup.emit();
    this.form.reset({
      isActive:false
    });
    this.caseType = null;
  }

  save(){
    let payload:CaseType = {...this.form.getRawValue()}

    if (this.caseType) {
      payload = {...payload,id:this.caseType.id}
    }
    this.isProcessing = true;
    this.crmService.setCaseType(payload).pipe(takeUntil(this.unsubscriber$)).subscribe({
      next:() => {
        this.fetchCaseTypes.emit();
        this.closePopup();
        this.isProcessing = false;
      },
      error:() => this.isProcessing = false
    })
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
