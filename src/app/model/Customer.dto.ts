export interface Customer {
  fullName: string;
  phoneNumber?: string;
  branchId: number;
  isOrganisation: boolean;
  id?: number;
  bankDetails?: [
    {
      accountName: string;
      bankName: string;
      accountNumber: string;
    }
  ];
  contactDetails?: [
    {
      salutation?: string;
      firsName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
    }
  ];
  emailAddress: string;
  isActive?: boolean;
  addresses: [
    {
      attention?: string;
      countryId?: number;
      country?: string;
      address?: string;
      street1?: string;
      street2?: string;
      city?: string;
      state?: string;
      stateId?: number;
      zipCode?: string;
      phone?: string;
      fax?: string;
    }
  ];
}
