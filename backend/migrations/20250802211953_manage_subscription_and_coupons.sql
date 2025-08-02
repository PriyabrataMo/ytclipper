-- +goose Up
-- +goose StatementBegin

-- Create subscriptions table (payment provider agnostic)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'monthly', 'quarterly', 'annual')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'pending')),
    payment_provider VARCHAR(50), -- 'stripe', 'razorpay', 'paypal', etc.
    payment_subscription_id VARCHAR(255), -- Generic field for any payment provider
    payment_customer_id VARCHAR(255), -- Generic field for any payment provider
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create coupons table
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    min_amount DECIMAL(10,2) DEFAULT 0,
    applicable_plans VARCHAR(100)[], -- Array of plan types this coupon applies to
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create coupon_usages table to track which users used which coupons
CREATE TABLE coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, coupon_id)
);

-- Create subscription_invoices table (payment provider agnostic)
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    payment_invoice_id VARCHAR(255), -- Generic field for any payment provider
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    coupon_code VARCHAR(50),
    billing_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(50), -- 'card', 'upi', 'netbanking', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create feature_usage table to track user feature usage
CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(50) NOT NULL, -- 'videos', 'notes', 'ai_summaries', etc.
    current_usage INTEGER DEFAULT 0,
    usage_limit INTEGER NOT NULL, -- -1 for unlimited
    reset_date TIMESTAMP WITH TIME ZONE, -- When usage resets (monthly, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, feature_name)
);

-- Add indexes for better performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_payment_subscription_id ON subscriptions(payment_subscription_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);
CREATE INDEX idx_coupon_usages_user_id ON coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX idx_subscription_invoices_subscription_id ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_payment_invoice_id ON subscription_invoices(payment_invoice_id);
CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature_name ON feature_usage(feature_name);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_usage_updated_at BEFORE UPDATE ON feature_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default free subscription for existing users
INSERT INTO subscriptions (user_id, plan_type, status, current_period_start, current_period_end)
SELECT 
    id as user_id,
    'free' as plan_type,
    'active' as status,
    CURRENT_TIMESTAMP as current_period_start,
    CURRENT_TIMESTAMP + INTERVAL '100 years' as current_period_end
FROM users
WHERE id NOT IN (SELECT user_id FROM subscriptions);

-- Insert default feature usage for existing users
INSERT INTO feature_usage (user_id, feature_name, current_usage, usage_limit, reset_date)
SELECT 
    id as user_id,
    'videos' as feature_name,
    0 as current_usage,
    5 as usage_limit,
    DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month' as reset_date
FROM users
WHERE id NOT IN (SELECT user_id FROM feature_usage WHERE feature_name = 'videos');

INSERT INTO feature_usage (user_id, feature_name, current_usage, usage_limit, reset_date)
SELECT 
    id as user_id,
    'notes_per_video' as feature_name,
    0 as current_usage,
    8 as usage_limit,
    DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month' as reset_date
FROM users
WHERE id NOT IN (SELECT user_id FROM feature_usage WHERE feature_name = 'notes_per_video');

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TRIGGER IF EXISTS update_feature_usage_updated_at ON feature_usage;
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP INDEX IF EXISTS idx_feature_usage_feature_name;
DROP INDEX IF EXISTS idx_feature_usage_user_id;
DROP INDEX IF EXISTS idx_subscription_invoices_payment_invoice_id;
DROP INDEX IF EXISTS idx_subscription_invoices_subscription_id;
DROP INDEX IF EXISTS idx_coupon_usages_coupon_id;
DROP INDEX IF EXISTS idx_coupon_usages_user_id;
DROP INDEX IF EXISTS idx_coupons_is_active;
DROP INDEX IF EXISTS idx_coupons_code;
DROP INDEX IF EXISTS idx_subscriptions_payment_subscription_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_user_id;

DROP TABLE IF EXISTS feature_usage;
DROP TABLE IF EXISTS subscription_invoices;
DROP TABLE IF EXISTS coupon_usages;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS subscriptions;

-- +goose StatementEnd
