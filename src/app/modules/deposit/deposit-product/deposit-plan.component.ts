import { Component, OnDestroy, OnInit } from '@angular/core';
import { DepositProductState, getDepositProducts } from '../store/deposit.reducer';
import { select, Store } from '@ngrx/store';
import { ResponseInterface } from '../models/response.interface';
import { DepositProduct } from '../models/deposit-product.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoadDepositProduct } from '../store/deposit.action';
import { GetRequestInterface } from '../models/get-request.interface';
import { DepositService } from 'src/app/service/deposit.service';
import { UntypedFormBuilder } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-deposit-plan',
  templateUrl: './deposit-plan.component.html',
  styleUrls: ['./deposit-plan.component.scss']
})
export class DepositPlanComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  allProducts: any[] = [];
  loader: boolean;
  requestInterface: GetRequestInterface = {
    pageNumber: 1,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false,
    totalCount: 0,
    totalPages: 0,
    jumpArray: []
  };
  public toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: true,
  });

  constructor(private store: Store<DepositProductState>, private service: DepositService, private fb: UntypedFormBuilder) { }

  ngOnInit(): void {
    this.getAllProducts();
    this.service.setDepositProductEdit(null);
  }

  public ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  public getAllProducts(): void {
    this.loader = true;
    this.service.getAllDepositProduct(this.requestInterface)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.allProducts = res.data.items;
        this.requestInterface = res.data;
        this.requestInterface.jumpArray = [];
        this.requestInterface.jumpArray = this.createJumpArray(this.requestInterface?.totalPages);
        this.loader = false;
      }, err => {
        this.loader = false;
      })
  }
  public changeResults(): void {
    this.loader = true;
    this.service.changePage(this.requestInterface)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.allProducts = res.data.items;
        this.requestInterface = res.data;
        this.loader = false;
      }, err => {
        this.loader = false;
      })
  }

  public attemptDelete(id: any): void {
    Swal.fire({
      type: "info",
      text: "Are you sure you want to delete this deposit product ?",
      title: "Delete Prodoct?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete Product",
      confirmButtonColor: "#558E90",
    })
    .then((result) => {
      if (result.value) {
        this.deleteProduct(id);
      }
    });
  }

  public filterProducts(): void {}

  private deleteProduct(id: any): void {
    this.loader = true;
    this.service.deleteDepositProduct(id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.loader = false;
        this.toast.fire('Product deleted successfully.');
        this.getAllProducts();
      }, (err: any) => {
          this.loader = false;
      })
  }

  getItemsPaginatedPageJumpModal() {
    $('.pagination-menu').toggle();
  }

  protected createJumpArray(totalPage: number): number[] {
    const result: number[] = [];
    for (let i = 1; i <= totalPage; i++) {
      result.push(i);
    }
    return result;
  }

}
