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
  parentOrganizationId?: string;
  isPrimary?: boolean;
  branchCode?: string;
  emailSuffix?: string;
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

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface Customer extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPincode?: string;
  billingCountry?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
  shippingCountry?: string;
  outstandingBalance?: number;
  organizationId?: string;
  isShared?: boolean;
  originatingOrgId?: string;
  originatingBranchName?: string;
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
  organizationId?: string;
  isShared?: boolean;
  isMasterShared?: boolean;
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
  orderNumber?: string;
  soNumber?: string;
  customerId: string;
  customerName?: string;
  date?: string;
  orderDate?: string;
  status: string;
  totalAmount: number;
  notes?: string;
  terms?: string;
  customer?: Customer;
}

export interface Quotation extends BaseEntity {
  quoteNumber: string;
  customerId: string;
  customerName?: string;
  date?: string;
  quoteDate?: string;
  status: string;
  totalAmount: number;
  notes?: string;
  terms?: string;
  customer?: Customer;
}

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  date?: string;
  invoiceDate?: string;
  dueDate?: string;
  status: string;
  totalAmount: number;
  amountPaid?: number;
  notes?: string;
  terms?: string;
  customer?: Customer;
}

export interface PurchaseBill extends BaseEntity {
  billNumber: string;
  supplierId: string;
  supplierName?: string;
  poId?: string;
  poNumber?: string;
  billDate: string;
  dueDate?: string;
  status: string;
  subtotal?: number;
  taxTotal?: number;
  totalAmount: number;
  amountPaid?: number;
  notes?: string;
}

/** Amount still owed on an invoice or bill. */
export function balanceDue(doc: { totalAmount: number; amountPaid?: number }): number {
  return Math.max(0, Number(doc.totalAmount || 0) - Number(doc.amountPaid || 0));
}

export interface PurchaseOrder extends BaseEntity {
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  orderDate: string;
  status: string;
  totalAmount: number;
}
