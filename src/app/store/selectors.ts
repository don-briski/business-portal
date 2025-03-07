import { createSelector } from "@ngrx/store";
import { AppWideState, ConfigurationHero, Filters } from "./models";
import { CRMCustomerDetail, SharedInvestorData } from "../modules/crm/crm.types";

export const selectFiltersFeature = (state: AppWideState) => state.filters;

export const selectConfigHeroFeature = (state: AppWideState) => state.configHero;

export const selectCrmCustomerFeature = (state: AppWideState) => state.crmCustomer;


export const filtersSelector = createSelector(
  selectFiltersFeature,
  (filters: Filters) => filters
);

export const configurationHeroSelector = createSelector(
  selectConfigHeroFeature,
  (config: ConfigurationHero) => config
);

export const crmCustomerSelector = createSelector(
  selectCrmCustomerFeature,
  (crmCustomer: CRMCustomerDetail) => crmCustomer
);


