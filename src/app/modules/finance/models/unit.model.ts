export interface CreateUnitModel {
  name: string;
  symbol: string;
}

export interface UpdateUnitModel {
  unitId: number;
  name: string;
  symbol: string;
}

export interface UnitFetchModel {
  searchTerm?: string;
  pageNumber: number;
  pageSize: number;
}

export interface UnitLimitedViewModel {
  searchTerm: string;
}
