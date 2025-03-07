export interface AccountModel {
    name: string;
    accountId: number;
    reference?: number;
    children?: AccountModel[];
}

export interface FlatNode {
    expandable: boolean;
    name: string;
    level: number;
  }