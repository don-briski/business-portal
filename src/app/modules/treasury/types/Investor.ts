
export type Investor = {
  personId: number;
  firstName: string;
  middleName: null | string;
  lastName: string;
  dateOfBirth: null | string;
  phoneNumber: string;
  emailAddress: string;
  bvn: null | string;
  personCode: string;
  createdAt: string;
  address: string;
  residentialInfo: null | string;
};

export type GetInvestorsByFullNameReq = {
  selectedSearchColumn: string;
  keyword: string;
};

export type GetInvestorsByFullNameRes = {
  items: Investor[];
};

export enum InvestorType {
  individual = "individual",
  corporate = "corporate"
}
