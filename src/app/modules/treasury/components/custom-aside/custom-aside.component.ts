import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { Validators,AbstractControl, ValidationErrors, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ColorThemeInterface } from 'src/app/model/color-theme.interface';
import { InvestmentService } from 'src/app/service/investment.service';
import { Investor } from '../../types/Investor';
import { SelectedInvestor } from '../../types/selectedInvestor';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { Investment } from '../../types/investment.type';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { map, pluck, takeUntil } from 'rxjs/operators';
import { ConfigurationService } from 'src/app/service/configuration.service';

@Component({
  selector: 'app-custom-aside',
  templateUrl: './custom-aside.component.html',
  styleUrls: ['./custom-aside.component.scss']
})
export class CustomAsideComponent implements OnInit, OnDestroy {
  @Input() currentTheme:ColorThemeInterface;
  @Input() investmentTypeList = [];
  @Output() closeChildAside:EventEmitter<any> = new EventEmitter();

  public mergeInvestmentForm:UntypedFormGroup;
  public searchInvestorForm:UntypedFormGroup;
  public unsubscriber$ = new Subject<void>();
  public focused:boolean = false;
  public loading:boolean = false;
  public masterChecked:boolean = false;
  public msg:string = '';
  public StartDateNotification = '';
  public investors:Investor[] = [];
  public selectedInvestor:SelectedInvestor;
  public selectedInvestorInv:Investment[] = [];
  public selectedInvestmentsIds:number[] = [];
  public selectedInvestments:Investment[] = [];
  public mergeState:number;
  private accumulatedInvestmentAmt:number = 0;
  public invTypeSelected: any;
  public amountTextInfo = '';
  public outOfRange:boolean = false;
  public ownerInformation;
  currencySymbol: string;

  constructor(private invService:InvestmentService, private router:Router, private fb:UntypedFormBuilder, private configurationService:ConfigurationService) { }

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.initSearchForm();
    this.initMergeForm();
    this.getConstants();
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configurationService.currencySymbol;
    if (!this.currencySymbol) {
      this.configurationService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
}

  closeAside(): void {
    this.changeInvestor();
    this.closeChildAside.emit();
  }

  initSearchForm():void{
    this.searchInvestorForm = this.fb.group({searchValue:['',Validators.required]});
  }

  getConstants() {
    this.configurationService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    }
    );
  }


  initMergeForm():void{
    this.mergeInvestmentForm = this.fb.group({
      investmentTypeId:[{value:'', disabled:true},[Validators.required,this.checkAccInvAmount.bind(this)]],
      accumulatedAmount:[{value:'',disabled:true}, Validators.required],
      investmentTenor:[{value:'', disabled:true}, [Validators.required, this.checkInvTenor.bind(this)]],
      investmentRate:[{value:'', disabled:true}, [Validators.required, this.checkInvRate.bind(this)]],
      collectionPeriod: [ { value:'', disabled:true }, [Validators.required, this.checkCollectionPeriod.bind(this) ] ],
      startDate:[{value:'', disabled:true}, [Validators.required, this.notifyAgent.bind(this)]],
      transactionPin:[{value:'', disabled:true}, Validators.required]
    });
  }
  onFocus(): void {
    this.focused = true;
  }

  onFocusOut(): void {
    this.focused = false;
  }

  searchInvestor(): void {
    this.loading = true;
    this.msg = 'Searching...';
    const payload = {
      selectedSearchColumn: "Email Address",  
      keyword:this.searchInvestorForm.value.searchValue
    }
    this.invService.getInvestorsByFullName(payload).pipe(pluck("body","items"),takeUntil(this.unsubscriber$)).subscribe(res =>{
      this.investors = res;
      this.msg = '';
      if(this.investors.length === 0){
        this.msg = 'No Investor Found';
      }
      this.loading = false;
    })
  }

  changeInvestor():void {
    this.mergeState = null
    this.searchInvestorForm.reset();
    this.selectedInvestorInv = [];
    this.selectedInvestmentsIds = [];
    this.selectedInvestments = [];
    this.accumulatedInvestmentAmt = 0;
    this.investors = [];

    if(this.mergeInvestmentForm.dirty){
      this.mergeInvestmentForm.reset();
      this.mergeInvestmentForm.patchValue({
        investmentTypeId:'',
        accumulatedAmount:'',
        investmentTenor:'',
        investmentRate:'',
        collectionPeriod:'',
        startDate:'',
        transactionPin:''
      })
    }
  }

  fetchInvestments(id:number,index:number){

    const {firstName,lastName,personId} = this.investors[index];
    this.selectedInvestor = {firstName,lastName,personId};

    this.loading = true;
    this.msg = 'Retrieving Investments...';

    this.invService.getInvestorsInvestments(id).pipe(takeUntil(this.unsubscriber$)).subscribe(res=>{
      this.selectedInvestorInv = res.body.data.items;
      if(this.selectedInvestorInv.length < 2){
        Swal.fire({ type: 'info', text: `${firstName} ${lastName} must have at least two(2) APPROVED investments, for a merge to be possible` , title: 'Requirements not met'})
      }else{
        this.mergeState = 1;
      }
      this.loading = false;
      this.msg = '';
    })
  }

  onMasterSelect(checked:boolean){
    this.selectedInvestmentsIds = [];
    this.selectedInvestments = [];
    if (checked) {
      this.masterChecked = true;
      this.selectedInvestorInv.forEach(investment => {
        this.selectedInvestmentsIds.push(investment.investmentId);
        this.selectedInvestments.push(investment)
        this.accumulatedInvestmentAmt = this.accumulatedInvestmentAmt + investment.totalInvestmentEarning;

      });
    } else {
      this.accumulatedInvestmentAmt = 0;
      this.masterChecked = false;
    }

    this.mergeInvestmentForm.controls['investmentTypeId'].enable();
    this.mergeInvestmentForm.controls['investmentRate'].enable();
    this.mergeInvestmentForm.controls['investmentTenor'].enable();
    this.mergeInvestmentForm.controls['startDate'].enable();
    this.mergeInvestmentForm.controls['transactionPin'].enable();
    this.mergeInvestmentForm.controls['accumulatedAmount'].patchValue(this.accumulatedInvestmentAmt);
  }

  onSelectInv(investment:Investment,checked:boolean){
    if(checked){
      this.selectedInvestmentsIds.push(investment.investmentId);
      this.selectedInvestments.push(investment)
      this.accumulatedInvestmentAmt = this.accumulatedInvestmentAmt + investment.totalInvestmentEarning;
    }else{
      this.selectedInvestmentsIds = this.selectedInvestmentsIds.filter(id => id != investment.investmentId);
      this.selectedInvestments = this.selectedInvestments.filter(value => value.investmentId != investment.investmentId);
      this.accumulatedInvestmentAmt = this.accumulatedInvestmentAmt - investment.totalInvestmentEarning;
    }


    this.mergeInvestmentForm.controls['investmentTypeId'].enable();
    this.mergeInvestmentForm.controls['investmentRate'].enable();
    this.mergeInvestmentForm.controls['investmentTenor'].enable();
    this.mergeInvestmentForm.controls['startDate'].enable();
    this.mergeInvestmentForm.controls['transactionPin'].enable();
    this.mergeInvestmentForm.controls['accumulatedAmount'].patchValue(this.accumulatedInvestmentAmt);
  }

  checkAccInvAmount(control: AbstractControl): ValidationErrors | null {
    this.invTypeSelected = this.investmentTypeList.find(x => x.investmentTypeId === parseInt(control.value, 0));
    if (this.invTypeSelected) {
      this.amountTextInfo = `(${this.currencySymbol}` + this.invTypeSelected.minAmount.toLocaleString() + ` - ${this.currencySymbol}` + this.invTypeSelected.maxAmount.toLocaleString() + ')';
      this.checkInvAmount(this.invTypeSelected.minAmount,this.invTypeSelected.maxAmount,this.accumulatedInvestmentAmt)
    } else {
      this.amountTextInfo = '';
    }
    return null;
  }

  checkInvAmount(minAmt:number,maxAmt:number,accAmt:number) {
    if (accAmt < minAmt || accAmt > maxAmt) {
      this.outOfRange = true;
    }else{
      this.outOfRange = false;
    }
  }


  checkInvTenor(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      if (this.invTypeSelected.minInvestmentTenor <= parseInt(control.value, 0) && parseInt(control.value, 0) <= this.invTypeSelected.maxInvestmentTenor) {
        return null;
      } else {
        return { OutOfRange: `Min: ${this.invTypeSelected.minInvestmentTenor} - Max: ${this.invTypeSelected.maxInvestmentTenor}` };
      }
    } else {
      return null;
    }
  }

  checkInvRate(control: AbstractControl): ValidationErrors | null {
    if (this.invTypeSelected) {
      if (this.invTypeSelected.minInterestRate <= parseInt(control.value, 0) && parseInt(control.value, 0) <= this.invTypeSelected.maxInterestRate) {
        return null;
      } else {
        return  { OutOfRange: `Min: ${this.invTypeSelected.minInterestRate} - Max: ${this.invTypeSelected.maxInterestRate}` };
      }
    } else {
      return  { OutOfRange: `This field is required.` };
    }

  }

  notifyAgent(control: AbstractControl): ValidationErrors | null {
    if (control.value !== '' && moment(control.value).isBefore(moment(), 'days')) {
      this.StartDateNotification = 'This investment start date is in the PAST.';
      return null;
    } else if (control.value !== '' && moment(control.value).isAfter(moment(), 'days')) {
      this.StartDateNotification = 'This investment start date is in the FUTURE.';
      return null;
    } else {
      this.StartDateNotification = '';
      return null;
    }
  }

  checkCollectionPeriod(control: AbstractControl): ValidationErrors | null {
    const investmentTenor = this.mergeInvestmentForm.get('investmentTenor');
    if (investmentTenor) {

    if(control.value > investmentTenor.value) {
      return { OutOfRange: 'Collection period must be less than or equal to Investment Tenor' }
    }else{
      return null;
    }
    }
  }
  onTenorChange(): void {
    const collectionPeriod = this.mergeInvestmentForm.get('collectionPeriod');
    collectionPeriod.enable();
  }

  mergeInvestments(){
    let payload = {
      investmentIds:this.selectedInvestmentsIds,
      investmentTypeId:this.invTypeSelected.investmentTypeId,
      investmentTenor:this.mergeInvestmentForm.controls['investmentTenor'].value,
      investmentRate:this.mergeInvestmentForm.controls['investmentRate'].value,
      collectionPeriod:this.mergeInvestmentForm.controls['collectionPeriod'].value,
      startDate:this.mergeInvestmentForm.controls['startDate'].value,
      transactionPin:this.mergeInvestmentForm.controls['transactionPin'].value
    }
    Swal.fire({ type: 'info', text: "You are about to merge " + this.selectedInvestmentsIds.length + " investments!" , title: 'Merge Investments', showCancelButton: true, cancelButtonColor: '#B85353', cancelButtonText: 'Abort', confirmButtonText: 'Proceed', confirmButtonColor: `${this.currentTheme.primaryColor}` }).then(result => {
      if(result.value){
        this.loading = true;
        this.invService.mergeInvestment(payload).pipe(takeUntil(this.unsubscriber$)).subscribe(res=>{
          this.loading = false;
          Swal.fire({ type: 'success', title: 'Merging Successful!', showCancelButton: true, cancelButtonColor: '#B85353', cancelButtonText: 'Continue Merging', confirmButtonText: 'View Merged Investment', confirmButtonColor: `${this.currentTheme.primaryColor}` }).then(res=>{
            if(res.value){
              this.router.navigate(["treasury/investment-pool"])
            }

            if(res.dismiss){
              this.changeInvestor();
              this.router.navigate(["treasury/running-investment"])
            }
          })
        },error=>{
          this.loading = false;
        })
      }
    })
  }

  ngOnDestroy(){
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
