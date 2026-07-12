CREATE TABLE organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    default_gst_rate DECIMAL(5, 2),
    tax_inclusive_pricing BOOLEAN DEFAULT FALSE,
    invoice_prefix VARCHAR(50),
    invoice_number_format VARCHAR(100),
    invoice_terms TEXT,
    bank_details TEXT,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(20) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT uk_org_settings UNIQUE (organization_id)
);
