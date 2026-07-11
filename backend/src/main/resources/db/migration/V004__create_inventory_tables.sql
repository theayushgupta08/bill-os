-- V004__create_inventory_tables.sql

-- 1. Warehouses
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_warehouses_org_id ON warehouses(organization_id);

-- 2. Inventory Levels (Current snapshot per product per warehouse)
CREATE TABLE inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    reorder_level DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(warehouse_id, product_id)
);

CREATE INDEX idx_inventory_levels_org_id ON inventory_levels(organization_id);
CREATE INDEX idx_inventory_levels_product_id ON inventory_levels(product_id);

-- 3. Stock Movements (Ledger of all stock changes)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- IN, OUT, ADJUSTMENT, TRANSFER
    quantity DECIMAL(15, 2) NOT NULL, -- Positive or negative
    reference_type VARCHAR(50), -- PO, INV, MANUAL
    reference_id UUID,
    unit_cost DECIMAL(15, 2), -- Used for Weighted Average Cost calculation
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_org_id ON stock_movements(organization_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
