import { Action } from '@ngrx/store';
import { DepositProduct } from "../models/deposit-product.model";
import { GetRequestInterface } from '../models/get-request.interface';
import { ResponseInterface } from '../models/response.interface';


export enum DepositProductActionTypes {
    // Create Action
    CreateDepositProduct = '[DepositProduct] Create',
    CreateDepositProductSuccess = '[DepositProduct] Create Success',
    CreateDepositProductFailure = '[DepositProduct] Create Failure',

    // Load Action
    LoadDepositProduct = '[DepositProduct] Load',
    LoadDepositProductSuccess = '[DepositProduct] Load Success',
    LoadDepositProductFailure = '[DepositProduct] Load Failure',
} 

export class LoadDepositProduct implements Action {
    public readonly type = DepositProductActionTypes.LoadDepositProduct;

    constructor (public payload: GetRequestInterface) {}
}
export class LoadDepositProductSuccess implements Action {
    public readonly type = DepositProductActionTypes.LoadDepositProductSuccess;

    constructor(public payload: ResponseInterface<DepositProduct>) {}
}
export class LoadDepositProductFailure implements Action {
    public readonly type = DepositProductActionTypes.LoadDepositProductFailure;
}

export class CreateDepositProduct implements Action {
    public readonly type = DepositProductActionTypes.CreateDepositProduct;

    constructor(public payload: DepositProduct) {}
}
export class CreateDepositProductSuccess implements Action {
    public readonly type = DepositProductActionTypes.CreateDepositProductSuccess;

    constructor(public payload: DepositProduct) {}
}
export class CreateDepositProductFailure implements Action {
    public readonly type = DepositProductActionTypes.CreateDepositProductFailure;
    
    constructor (public payload: any) {}
}

export type DepositProductActions = 
| LoadDepositProduct
| LoadDepositProductSuccess
| LoadDepositProductFailure
| CreateDepositProduct
| CreateDepositProductSuccess
| CreateDepositProductFailure;