export interface Asset {
  assetCardId: number;
  assetName: string;
  assetCode: string;
  status: string;
  purchasePrice: number;
  netBookValue?: number;
  lastPostedDepreciationDate?: string;
}

export interface GetAssetsData {
  pageSize: number;
  pageNumber: number;
  searchParam: string | null;
  status?: string;
}

interface LineData {
  assetCardId: number;
  description: number;
  amount: number;
}

export interface AddToAssetData {
  raiseBill: boolean;
  vendorId: number;
  billDate: string;
  billDueDate: string;
  paymentTermId: number;
  responsiblePersonId: number;
  transactionDate: string;
  paidThroughAccountId: number;
  reference?: string;
  lines: LineData[];
}
