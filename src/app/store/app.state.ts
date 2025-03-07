import { DepositProductState, initialDepositProductState } from "../modules/deposit/store/deposit.reducer";

export interface AppState {
    depositsProduct: DepositProductState;
}

export const initialAppState: AppState = {
    depositsProduct: initialDepositProductState
}

export enum AppStateSlices {
    DepositProduct = 'DepositProduct'
}