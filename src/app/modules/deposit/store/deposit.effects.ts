import { select, Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { DepositProductState, getDepositProducts } from './deposit.reducer';
import { DepositService } from 'src/app/service/deposit.service';
import { CreateDepositProduct, CreateDepositProductFailure, CreateDepositProductSuccess, DepositProductActionTypes, LoadDepositProduct, LoadDepositProductFailure, LoadDepositProductSuccess } from './deposit.action';
import { DepositProduct } from '../models/deposit-product.model';
import { catchError, exhaustMap, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { ResponseDataInterface, ResponseInterface } from '../models/response.interface';

@Injectable()
export class DepositProductEffects {
    constructor(
        private actions$: Actions,
        private service: DepositService,
        private store: Store<DepositProductState>
    ) {}

    createDepositProduct$ = createEffect(() => 
        this.actions$.pipe(
            ofType<CreateDepositProduct>(DepositProductActionTypes.CreateDepositProduct),
            map(action => action.payload),
            exhaustMap(payload => 
                this.service.createDepositProduct(payload).pipe(
                    map(result => {
                        return new CreateDepositProductSuccess(result);
                    }),
                    catchError(error => {
                        return of(new CreateDepositProductFailure(error));
                    })
                )    
            )
        )
    );

    loadDeposits$ = createEffect(() => 
        this.actions$.pipe(
            ofType<LoadDepositProduct>(DepositProductActionTypes.LoadDepositProduct),
            withLatestFrom(this.store.pipe(select(getDepositProducts))),
            switchMap(([action, latest]) => {
                if (latest === undefined || latest.totalCount === 0) {
                    return this.service.getAllDepositProduct(action.payload).pipe(
						map((res: any) => {
                            const deposit: ResponseInterface<DepositProduct> = res.body
                            this.store.dispatch(new LoadDepositProductSuccess(deposit));
							return new LoadDepositProductSuccess(deposit);
						}),
						catchError(err => {
							return of(new LoadDepositProductFailure());
						})
					);
                } else {
                    this.store.dispatch(new LoadDepositProductSuccess(latest));
                    return of(new LoadDepositProductSuccess(latest))
                }
            })
        )
    )
}