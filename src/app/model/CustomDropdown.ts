export interface CustomDropDown {
  id: number | string;
  text: string;
  disabled?:boolean;
  additionalInfo?:string;
}

export type PillFilter = CustomDropDown & {
  type?: string;
};

export interface PillFilters {
  filters: PillFilter[][];
  action?: string;
  headers?: string[];
}
