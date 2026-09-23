-- V024__add_amount_paid_to_invoices_and_bills.sql
-- Track the running total paid against each invoice/bill so partial payments accumulate correctly
-- (previously each payment was compared to the full total in isolation).

ALTER TABLE sales_invoices
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE purchase_bills
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

-- Backfill from existing allocations of non-deleted payments
UPDATE sales_invoices si
SET amount_paid = COALESCE((
    SELECT SUM(pa.allocated_amount)
    FROM payment_allocations pa
    JOIN payments p ON p.id = pa.payment_id
    WHERE pa.sales_invoice_id = si.id AND p.deleted_at IS NULL
), 0.00);

UPDATE purchase_bills pb
SET amount_paid = COALESCE((
    SELECT SUM(pa.allocated_amount)
    FROM payment_allocations pa
    JOIN payments p ON p.id = pa.payment_id
    WHERE pa.purchase_bill_id = pb.id AND p.deleted_at IS NULL
), 0.00);
