-- V025__separate_cost_price_and_fix_stock_direction.sql

-- 1. Average purchase cost gets its own column. Until now InventoryService wrote the weighted average cost into
--    products.base_price, which is the SELLING price the invoice form pre-fills.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

-- Initialise it as the weighted average of the purchase costs already recorded against each product
UPDATE products p
SET cost_price = COALESCE((
    SELECT ROUND(SUM(sm.quantity * sm.unit_cost) / NULLIF(SUM(sm.quantity), 0), 2)
    FROM stock_movements sm
    WHERE sm.product_id = p.id
      AND sm.movement_type = 'IN'
      AND sm.quantity > 0
      AND sm.unit_cost IS NOT NULL
      AND sm.reference_type IN ('PURCHASE_BILL', 'OPENING_STOCK', 'PURCHASE_RETURN')
), 0.00);

-- 2. Every OUT movement (issued sales invoices) was ADDED to stock instead of subtracted. Each one therefore left
--    the level 2 x quantity too high; take that back out. ADJUSTMENT/IN movements were applied correctly.
UPDATE inventory_levels il
SET quantity = il.quantity - 2 * COALESCE((
    SELECT SUM(sm.quantity)
    FROM stock_movements sm
    WHERE sm.warehouse_id = il.warehouse_id
      AND sm.product_id = il.product_id
      AND sm.movement_type = 'OUT'
      AND sm.quantity > 0
), 0.00);
