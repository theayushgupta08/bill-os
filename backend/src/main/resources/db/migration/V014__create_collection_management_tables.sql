-- 1. Collection QR Codes Table
CREATE TABLE collection_qr_codes (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_provider VARCHAR(50) NOT NULL,
    upi_name VARCHAR(150) NOT NULL,
    upi_id VARCHAR(100) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    qr_image_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_qr_org ON collection_qr_codes(organization_id);

-- 2. Collection Payments Table
CREATE TABLE collection_payments (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    qr_code_id UUID NOT NULL REFERENCES collection_qr_codes(id),
    recorded_by_id UUID NOT NULL REFERENCES users(id),
    qr_owner_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(15, 2) NOT NULL,
    place VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    utr_number VARCHAR(100),
    reference_number VARCHAR(100),
    screenshot_url VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    verified_by_id UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_col_org_status ON collection_payments(organization_id, status);

-- 3. Collection Expenses Table
CREATE TABLE collection_expenses (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    vendor VARCHAR(150) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    expense_date DATE NOT NULL,
    notes TEXT,
    attachment_url VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    approved_by_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Settlement Deposits Table
CREATE TABLE settlement_deposits (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    deposit_date DATE NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    notes TEXT,
    attachment_url VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    approved_by_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Collection Ledger Table
CREATE TABLE collection_ledger (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    reference_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_org_user ON collection_ledger(organization_id, user_id);

-- 6. Generic Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_user_read ON notifications(user_id, read_at);
