export interface Account {
  accountId: number;
  name: string;
  referenceLowerBoundary: number;
  referenceUpperBoundary: number;
  heirarchyLevel: number;
  isPostingAccount: boolean;
  reference: number;
  displayName: string;
  createdAt: string;
  parentId: number;
  isHeader: boolean;
  groupAccount: string;
}

export interface BankAccount {
  accountCode: number;
  accountId: number;
  class: string;
  createdAt: string;
  id: number;
  name: string;
}
