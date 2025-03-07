export interface TransactionLockContent {
  transactionLockId: number;
  type: string;
  date: string;
  status: string;
  appOwnerKey: string;
  typeInfo: string;
  createdAt: string;
}

export interface TransactionLock {
  Accountant: TransactionLockContent;
  Purchases: TransactionLockContent;
  Sales: TransactionLockContent;
}

export interface selectedTransaction {
  key: string;
  value: TransactionLockContent;
}
