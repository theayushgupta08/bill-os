-- Remove unused columns from collection_qr_codes and expand qr_image_url to TEXT
ALTER TABLE collection_qr_codes ALTER COLUMN qr_image_url TYPE TEXT;
ALTER TABLE collection_qr_codes DROP COLUMN IF EXISTS payment_provider;
ALTER TABLE collection_qr_codes DROP COLUMN IF EXISTS upi_name;
ALTER TABLE collection_qr_codes DROP COLUMN IF EXISTS upi_id;
ALTER TABLE collection_qr_codes DROP COLUMN IF EXISTS notes;
