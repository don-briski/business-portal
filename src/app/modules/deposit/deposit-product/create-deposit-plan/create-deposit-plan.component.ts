import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { DepositService } from 'src/app/service/deposit.service';
import { DepositProduct } from '../../models/deposit-product.model';
import { DepositProductState, getDepositProducts } from '../../store/deposit.reducer';
import { select, Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ColorThemeService } from 'src/app/service/color-theme.service';

@Component({
  selector: 'app-create-deposit-plan',
  templateUrl: './create-deposit-plan.component.html',
  styleUrls: ['./create-deposit-plan.component.scss']
})
export class CreateDepositPlanComponent implements OnInit {
  public productDetails: DepositProduct;
  public interestDetails: DepositProduct;
  public balanceDetails: DepositProduct;

  public depositProduct: DepositProduct;

  public isEditing: boolean;
  private unsubscriber$ = new Subject<void>();

  public loader: boolean;
  public toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: true,
  });

  constructor(
    private service: DepositService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService,
    ) { 
      this.route.url.pipe(takeUntil(this.unsubscriber$)).subscribe((res: any) => {
        if (res[0]?.path === 'edit-product') {
          this.isEditing = true;
        } else {
          this.isEditing = false;
        }
      });
      
      this.route.paramMap.pipe(takeUntil(this.unsubscriber$)).subscribe((params: ParamMap) => {
        if (this.isEditing) {
          this.getDepositProduct(+params.get('id'));
        }
      });
    }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  public save() {
    if (!this.isEditing) {
      this.createProduct();
    } else {
      this.updateProduct();
    }
  }

  private createProduct(): void {
    this.loader = true;
    this.service.createDepositProduct(this.depositProduct).pipe(takeUntil(this.unsubscriber$))
      .subscribe(res => {
        this.loader = false;
        this.toast.fire('Deposit product created successfully');
        this.router.navigateByUrl('/deposits/products');
      }, (err => {
        this.loader = false;
      }))
  }
  private updateProduct(): void {
    this.loader = true;
    this.service.updateDepositProduct(this.depositProduct).pipe(takeUntil(this.unsubscriber$))
      .subscribe(res => {
        this.loader = false;
        this.toast.fire('Deposit product updated successfully');
        this.service.setDepositProductEdit(null);
        this.router.navigateByUrl('/deposits/products');
        this.isEditing = false;
      }, (err => {
        this.loader = false;
      }))
  }


  public setProductDetails(event: any): void  {
    this.productDetails = event;
    this.depositProduct = event;
  }

  public setInterestDetails(event: any): void  {
    this.interestDetails = event;
    this.depositProduct = event;
  }

  public setBalanceDetails(event: any): void  {
    this.balanceDetails = event;
    this.depositProduct = event;
  }
  public setFeeDetails(event: any): void  {
    this.depositProduct = event;
  }

  private getDepositProduct(id: number): void {
    this.service.getDepositProductById(id).pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      this.depositProduct = res.data;
      this.service.setDepositProductEdit(this.depositProduct);
    });
  }

}
