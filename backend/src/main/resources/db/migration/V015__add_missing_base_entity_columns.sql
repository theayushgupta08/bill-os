-- Add missing columns required by BaseEntity

ALTER TABLE collection_payments
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE collection_expenses
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE settlement_deposits
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE collection_ledger
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE notifications
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
