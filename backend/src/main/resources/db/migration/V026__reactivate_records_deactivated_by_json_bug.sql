-- V026__reactivate_records_deactivated_by_json_bug.sql
-- TaxRateDto / WarehouseDto / AccountDto exposed their `isActive` flag to JSON as "active", so the "isActive" the
-- frontend sent was ignored: records created from the UI were stored inactive, and every warehouse/account edit
-- deactivated the record. The flag was never actually settable through the API, so every inactive row is a
-- product of the bug — restore them.
UPDATE tax_rates SET is_active = TRUE WHERE is_active = FALSE;
UPDATE warehouses SET is_active = TRUE WHERE is_active = FALSE;
UPDATE accounts SET is_active = TRUE WHERE is_active = FALSE;
