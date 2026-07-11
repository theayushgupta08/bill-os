-- V007__create_payments_tables.sql

-- 1. Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payment_number VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- RECEIPT (from Customer), PAYMENT (to Supplier)
    reference_number VARCHAR(100), -- Check/Transaction ID
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_org_id ON payments(organization_id);

-- 2. Payment Allocations (Links Payment to Invoices or Bills)
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    sales_invoice_id UUID REFERENCES sales_invoices(id),
    purchase_bill_id UUID REFERENCES purchase_bills(id),
    allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pa_payment_id ON payment_allocations(payment_id);
CREATE INDEX idx_pa_invoice_id ON payment_allocations(sales_invoice_id);
CREATE INDEX idx_pa_bill_id ON payment_allocations(purchase_bill_id);

-- 3. Update Customers/Suppliers to track Outstanding Balance (Optional but useful for V1)
ALTER TABLE customers ADD COLUMN outstanding_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE suppliers ADD COLUMN outstanding_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
