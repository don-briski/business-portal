export interface Vendor {
  currencyName?: string;
  currencyId?: number;
  paymentTermName?: string;
  paymentTermId?: string;
  vendorId?: number;
  id?: number;
  name: string;
  address: string;
  isActive?: boolean;
  status?: string;
  taxIdNumber: string;
  contactDetails?: [
    {
      id?: string;
      salutation?: string;
      firsName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
    }
  ];
  bankDetails?: [
    {
      id?: string;
      accountName?: string;
      bankName?: string;
      accountNumber?: string;
    }
  ];
  emailAddress: string;
  primaryContact?: {
    id?: string;
    salutation?: string;
    firsName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  billingAddress?: {
    attention?: string;
    country?: string;
    address?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    fax?: string;
  };
  shippingAddress?: {
    attention?: string;
    country?: string;
    address?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    fax?: string;
  };
  websiteUrl?: string;
  socialMedia?: {
    twitterUrl?: string;
    facebookUrl?: string;
  };
}
