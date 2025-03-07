import { DepositProduct } from "../models/deposit-product.model";
import { DepositProductActions, DepositProductActionTypes } from "./deposit.action";
import _ from 'lodash';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ResponseInterface } from "../models/response.interface";

export interface DepositProductState {
    readonly depositProduct: ResponseInterface<DepositProductState>;
}

export const initialDepositProductState: DepositProductState = {
    depositProduct: {
        status: false,
        message: null,
        data: {
            pageNumber: 0,
            pageSize: 0,
            totalCount: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
            items: []
        }
    }
}

const getDepositProductSelector = createFeatureSelector<DepositProductState>('depositProduct');

export const getDepositProducts = createSelector(getDepositProductSelector, state => _.cloneDeep(state.depositProduct.data));

export function depositReducer(
        state = initialDepositProductState,
        action: DepositProductActions
    ) {
    switch (action.type) {
        case DepositProductActionTypes.CreateDepositProductSuccess: {
            const deposit = _.cloneDeep(state.depositProduct)
            return {
                ...state,
                depositProduct: deposit
            };
        }
        case DepositProductActionTypes.LoadDepositProductSuccess: {
            return {
                state,
                depositProduct: action.payload
            }
        }
        default:
            return { ...state };
        
    }
}