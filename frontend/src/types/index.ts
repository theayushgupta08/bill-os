export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface Organization extends BaseEntity {
  name: string;
  gstin?: string;
  pan?: string;
  legalName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  phone: string;
  secondaryPhones?: string[];
  email?: string;
  logoUrl?: string;
  website?: string;
  financialYearStart?: string;
}

export interface TaxSettings extends BaseEntity {
  organizationId: string;
  isRegisteredUnderGst?: boolean;
  gstin?: string;
  compositionScheme?: boolean;
  defaultGstRate?: number;
  taxInclusivePricing?: boolean;
}

export interface PreferencesSettings extends BaseEntity {
  organizationId: string;
  currency: string;
  dateFormat: string;
  timezone: string;
  theme?: string;
  language?: string;
}

export interface InvoiceSettings extends BaseEntity {
  organizationId: string;
  invoicePrefix?: string;
  invoiceNumberFormat?: string;
  invoiceTerms?: string;
  termsAndConditions?: string;
  bankDetails?: string;
  notes?: string;
}

export interface Supplier extends BaseEntity {
  organizationId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  defaultCreditPeriod?: number;
  outstandingBalance?: number;
}

export interface User extends BaseEntity {
  supabaseAuthId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  organizationId?: string;
}

export interface Customer extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  outstandingBalance?: number;
}

export interface Product extends BaseEntity {
  name: string;
  sku: string;
  price?: number;
  basePrice?: number;
  taxRate?: number | string;
  taxRateId?: string;
  type?: string;
  description?: string;
  hsnSac?: string;
  unitOfMeasure?: string;
  categoryId?: string;
}

export interface ProductCategory extends BaseEntity {
  name: string;
  description?: string;
  parentId?: string;
}

export interface TaxRate extends BaseEntity {
  name: string;
  rate: number;
  type?: string;
  isActive?: boolean;
}

export interface Warehouse extends BaseEntity {
  name: string;
  code?: string;
  location?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  isActive?: boolean;
}

export interface LineItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
  taxAmount?: number;
  total?: number;
}

export interface SalesOrder extends BaseEntity {
  orderNumber: string;
  customerId: string;
  date: string;
  status: string;
  totalAmount: number;
  notes?: string;
  terms?: string;
  customer?: Customer;
}

export interface Quotation extends BaseEntity {
  quoteNumber: string;
  customerId: string;
  date: string;
  status: string;
  totalAmount: number;
  notes?: string;
  terms?: string;
  customer?: Customer;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  customerId: string;
  date: string;
  dueDate?: string;
  status: string;
  totalAmount: number;
  notes?: string;
  terms?: string;
  customer?: Customer;
}

export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  orderDate: string;
  status: string;
  totalAmount: number;
}
