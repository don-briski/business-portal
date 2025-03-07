export interface Asset {
  assetCardId: number;
  assetName: string;
  searchParam: string;
  purchasePrice: number;
  status: string;
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
  sellingPrice: number;
}

export interface DisposeAssetData {
  raiseInvoice: boolean;
  customerPersonId: number;
  invoiceDate: string;
  dueDate: string;
  paymentTermId: number;
  responsiblePersonId: number;
  transactionDate: string;
  depositToAccountId: number;
  cashOrBankAccountId: number;
  lines: LineData[];
  reference?: string;
  note: string;
}
