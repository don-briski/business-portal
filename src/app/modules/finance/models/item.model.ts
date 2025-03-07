export interface CreateItemModel {
  itemName: string;
  sku: string;
  itemType: FinanceItemType;
  unitId?: number;
  stockOnHand: number;

  hasSalesInformation: boolean;
  sellingPrice?: number;
  salesAccountId?: number;
  salesDescription: string;
  salesTaxId: number;

  hasPurchasesInformation: boolean;
  costPrice?: number;
  purchaseAccountId?: number;
  purchaseDescription: string;
  purchaseTaxId: number;
}

export interface UpdateItemModel {
  itemId: number;
  itemName: string;
  sku: string;
  itemType: FinanceItemType;
  unitId?: number;
  stockOnHand: number;

  hasSalesInformation: boolean;
  sellingPrice?: number;
  salesAccountId?: number;
  salesDescription: string;
  salesTaxId: number;

  hasPurchasesInformation: boolean;
  costPrice?: number;
  purchaseAccountId?: number;
  purchaseDescription: string;
  purchaseTaxId: number;
}

export interface ItemFetchModel {
  searchTerm?: string;
  itemType?: FinanceItemType;
  pageNumber: number;
  pageSize: number;
}

export interface ItemLimitedViewModel {
  searchTerm: string;
}

export enum FinanceItemType {
  Goods = "Goods",
  Service = "Service",
}
