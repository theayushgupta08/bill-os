-- V011__add_gst_columns_to_lines.sql

-- Add GST breakdown columns to sales invoice lines
ALTER TABLE sales_invoice_lines ADD COLUMN cgst_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE sales_invoice_lines ADD COLUMN sgst_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE sales_invoice_lines ADD COLUMN igst_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

-- Add GST breakdown columns to purchase bill lines
ALTER TABLE purchase_bill_lines ADD COLUMN cgst_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE purchase_bill_lines ADD COLUMN sgst_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE purchase_bill_lines ADD COLUMN igst_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
