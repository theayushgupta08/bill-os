-- V010__fix_purchase_tables_foreign_keys.sql

-- Drop the old constraints that incorrectly point to 'customers'
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_supplier_id_fkey;
ALTER TABLE purchase_bills DROP CONSTRAINT IF EXISTS purchase_bills_supplier_id_fkey;

-- Add the new correct constraints pointing to 'suppliers'
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
ALTER TABLE purchase_bills ADD CONSTRAINT purchase_bills_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
