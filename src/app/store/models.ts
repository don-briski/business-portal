import { CustomDropDown } from "../model/CustomDropdown"
import { CRMCustomerDetail, } from "../modules/crm/crm.types"

export type AppWideState = {
  filters?:Filters,
  configHero?:ConfigurationHero
  crmCustomer?:CRMCustomerDetail
}

export type Filters = {
  [key: string]:CustomDropDown[]
}

export type ConfigurationHero = {
  title: string;
  subTitle: string;
  tabs: string[];
};

