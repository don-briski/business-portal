import { createAction, props } from "@ngrx/store";
import { ConfigurationHero, Filters } from "./models";
import { CRMCustomerDetail, SharedInvestorData } from "../modules/crm/crm.types";

export const setFilters = createAction(
  "[App] Set Filters Selection",
  props<Filters>()
);

export const clearFilters = createAction(
  "[App] Clear Filters Selection"
);


export const setConfigHero = createAction(
  "[App] Set Configuration Hero Section Selection",
  props<ConfigurationHero>()
);

export const clearConfigHero = createAction(
  "[App] Clear Configuration Hero Section Selection"
);

export const setCrmCustomer = createAction(
  "[App] Set CRM Customer",
  props<CRMCustomerDetail>()
);

export const clearCrmCustomer = createAction(
  "[App] Clear CRM Customer Detail"
);
