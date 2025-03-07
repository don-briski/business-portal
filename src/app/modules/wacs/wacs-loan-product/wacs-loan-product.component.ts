import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { WacsService } from '../services/wacs.service';
import { takeUntil } from 'rxjs/operators';
import { LoanProduct } from '../types/loan-products';
import { toNGNFormat } from '../../shared/helpers/generic.helpers';

@Component({
  selector: 'lnd-wacs-loan-product',
  templateUrl: './wacs-loan-product.component.html',
  styleUrls: ['./wacs-loan-product.component.scss']
})
export class WacsLoanProductComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  loanProductId: number;
  isLoading = false;
  loanProduct:LoanProduct;
  fees:string[] = [];

  constructor(private route:ActivatedRoute, private wacsService:WacsService){
    this.loanProductId = this.route.snapshot.params["id"];
  }

  ngOnInit(): void {
    this.getLoanProductDetails();
  }

  private getLoanProductDetails(){
    this.isLoading = true;
    this.wacsService.getLoanProduct(this.loanProductId).pipe(takeUntil(this.unsubscriber$)).subscribe({
      next:(res) => {
        this.loanProduct = res.body.data;
        if (this.loanProduct.applicableFees.length > 0) {
          this.fees = this.loanProduct.applicableFees.map(fee => `${fee.feeName} - ${fee.feeType === "Percentage" ? fee?.feeAmount +'%' : toNGNFormat(fee?.feeAmount)}`);
        }
        this.isLoading = false;
      },
      error:() => {
        this.isLoading = false;
      }
    })
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
