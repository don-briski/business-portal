import { createReducer, on } from "@ngrx/store";
import { AppWideState } from "./models";
import { clearConfigHero, clearCrmCustomer, clearFilters, setConfigHero, setCrmCustomer, setFilters, } from "./actions";

const initialState: AppWideState = {
  filters: null,
  configHero: null,
  crmCustomer:null,
};


export const filtersReducer = createReducer(
  initialState.filters,
  on(setFilters, (state, filters) => {
    return { ...state, ...filters };
  }),
  on(clearFilters, (state) => {
    return null;
  })
);

export const configHeroReducer = createReducer(
  initialState.configHero,
  on(setConfigHero, (state, config) => {
    return { ...state, ...config };
  }),
  on(clearConfigHero, (state, config) => {
    return null;
  })
);

export const crmCustomerReducer = createReducer(
  initialState.crmCustomer,
  on(setCrmCustomer, (state, crmCustomer) => {
    return { ...state, ...crmCustomer };
  }),
  on(clearCrmCustomer, (state) => {
    return null;
  })
);




