package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// Subscription represents a user's subscription
type Subscription struct {
	bun.BaseModel `bun:"table:subscriptions,alias:s"`

	ID                    uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	UserID                uuid.UUID  `bun:"user_id,type:uuid,notnull" json:"user_id"`
	PlanType              string     `bun:"plan_type,notnull" json:"plan_type"`
	Status                string     `bun:"status,notnull,default:'active'" json:"status"`
	PaymentProvider       *string    `bun:"payment_provider" json:"payment_provider,omitempty"`
	PaymentSubscriptionID *string    `bun:"payment_subscription_id" json:"payment_subscription_id,omitempty"`
	PaymentCustomerID     *string    `bun:"payment_customer_id" json:"payment_customer_id,omitempty"`
	CurrentPeriodStart    *time.Time `bun:"current_period_start" json:"current_period_start,omitempty"`
	CurrentPeriodEnd      *time.Time `bun:"current_period_end" json:"current_period_end,omitempty"`
	CancelAtPeriodEnd     bool       `bun:"cancel_at_period_end,default:false" json:"cancel_at_period_end"`
	CancelledAt           *time.Time `bun:"cancelled_at" json:"cancelled_at,omitempty"`
	TrialEnd              *time.Time `bun:"trial_end" json:"trial_end,omitempty"`
	CreatedAt             time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt             time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`

	// Relationships
	User     *User                 `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
	Invoices []SubscriptionInvoice `bun:"rel:has-many,join:id=subscription_id" json:"invoices,omitempty"`
}

// Coupon represents a discount coupon
type Coupon struct {
	bun.BaseModel `bun:"table:coupons,alias:c"`

	ID              uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	Code            string     `bun:"code,unique,notnull" json:"code"`
	Name            string     `bun:"name,notnull" json:"name"`
	Description     *string    `bun:"description" json:"description,omitempty"`
	DiscountType    string     `bun:"discount_type,notnull" json:"discount_type"`
	DiscountValue   float64    `bun:"discount_value,notnull" json:"discount_value"`
	MaxUses         *int       `bun:"max_uses" json:"max_uses,omitempty"`
	UsedCount       int        `bun:"used_count,default:0" json:"used_count"`
	ValidFrom       time.Time  `bun:"valid_from,nullzero,notnull,default:current_timestamp" json:"valid_from"`
	ValidUntil      *time.Time `bun:"valid_until" json:"valid_until,omitempty"`
	MinAmount       float64    `bun:"min_amount,default:0" json:"min_amount"`
	ApplicablePlans []string   `bun:"applicable_plans,array" json:"applicable_plans"`
	IsActive        bool       `bun:"is_active,default:true" json:"is_active"`
	CreatedAt       time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt       time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`

	// Relationships
	Usages []CouponUsage `bun:"rel:has-many,join:id=coupon_id" json:"usages,omitempty"`
}

// CouponUsage tracks which users used which coupons
type CouponUsage struct {
	bun.BaseModel `bun:"table:coupon_usages,alias:cu"`

	ID             uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	UserID         uuid.UUID  `bun:"user_id,type:uuid,notnull" json:"user_id"`
	CouponID       uuid.UUID  `bun:"coupon_id,type:uuid,notnull" json:"coupon_id"`
	SubscriptionID *uuid.UUID `bun:"subscription_id,type:uuid" json:"subscription_id,omitempty"`
	DiscountAmount float64    `bun:"discount_amount,notnull" json:"discount_amount"`
	UsedAt         time.Time  `bun:"used_at,nullzero,notnull,default:current_timestamp" json:"used_at"`

	// Relationships
	User         *User         `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
	Coupon       *Coupon       `bun:"rel:belongs-to,join:coupon_id=id" json:"coupon,omitempty"`
	Subscription *Subscription `bun:"rel:belongs-to,join:subscription_id=id" json:"subscription,omitempty"`
}

// SubscriptionInvoice represents a billing invoice
type SubscriptionInvoice struct {
	bun.BaseModel `bun:"table:subscription_invoices,alias:si"`

	ID               uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	SubscriptionID   uuid.UUID  `bun:"subscription_id,type:uuid,notnull" json:"subscription_id"`
	PaymentInvoiceID *string    `bun:"payment_invoice_id" json:"payment_invoice_id,omitempty"`
	Amount           float64    `bun:"amount,notnull" json:"amount"`
	Currency         string     `bun:"currency,default:'INR'" json:"currency"`
	Status           string     `bun:"status,notnull,default:'pending'" json:"status"`
	DiscountAmount   float64    `bun:"discount_amount,default:0" json:"discount_amount"`
	CouponCode       *string    `bun:"coupon_code" json:"coupon_code,omitempty"`
	BillingDate      time.Time  `bun:"billing_date,nullzero,notnull,default:current_timestamp" json:"billing_date"`
	PaidAt           *time.Time `bun:"paid_at" json:"paid_at,omitempty"`
	PaymentMethod    *string    `bun:"payment_method" json:"payment_method,omitempty"`
	CreatedAt        time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`

	// Relationships
	Subscription *Subscription `bun:"rel:belongs-to,join:subscription_id=id" json:"subscription,omitempty"`
}

// FeatureUsage tracks user's usage of specific features
type FeatureUsage struct {
	bun.BaseModel `bun:"table:feature_usage,alias:fu"`

	ID           uuid.UUID  `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	UserID       uuid.UUID  `bun:"user_id,type:uuid,notnull" json:"user_id"`
	FeatureName  string     `bun:"feature_name,notnull" json:"feature_name"`
	CurrentUsage int        `bun:"current_usage,default:0" json:"current_usage"`
	UsageLimit   int        `bun:"usage_limit,notnull" json:"usage_limit"`
	ResetDate    *time.Time `bun:"reset_date" json:"reset_date,omitempty"`
	CreatedAt    time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt    time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`

	// Relationships
	User *User `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
}

// Plan pricing configuration
type PlanPricing struct {
	Type         string                 `json:"type"`
	Name         string                 `json:"name"`
	Price        float64                `json:"price"`
	BillingCycle string                 `json:"billing_cycle"`
	Features     []string               `json:"features"`
	Limits       map[string]interface{} `json:"limits"`
}

// Available plans with Indian pricing (INR)
var AvailablePlans = map[string]PlanPricing{
	"free": {
		Type:         "free",
		Name:         "Starter (Free)",
		Price:        0.00,
		BillingCycle: "none",
		Features: []string{
			"Up to 5 videos",
			"8 notes per video",
			"Basic AI summaries",
			"Standard support",
			"Basic tag management",
		},
		Limits: map[string]interface{}{
			"videos":          5,
			"notes_per_video": 8,
			"ai_summaries":    true,
			"custom_tags":     false,
			"export":          false,
			"analytics":       false,
			"api_access":      false,
		},
	},
	"monthly": {
		Type:         "monthly",
		Name:         "Monthly Pro",
		Price:        799.00, // ₹799/month
		BillingCycle: "monthly",
		Features: []string{
			"Unlimited videos",
			"Unlimited notes per video",
			"Advanced AI summaries & insights",
			"Custom tags & categories",
			"Export to multiple formats",
			"Advanced analytics",
			"API access",
		},
		Limits: map[string]interface{}{
			"videos":          -1, // unlimited
			"notes_per_video": -1, // unlimited
			"ai_summaries":    true,
			"custom_tags":     true,
			"export":          true,
			"analytics":       true,
			"api_access":      true,
		},
	},
	"quarterly": {
		Type:         "quarterly",
		Name:         "Quarterly Pro",
		Price:        1999.00, // ₹1999/quarter
		BillingCycle: "quarterly",
		Features: []string{
			"Unlimited videos",
			"Unlimited notes per video",
			"Advanced AI summaries & insights",
			"Custom tags & categories",
			"Export to multiple formats",
			"Advanced analytics",
			"API access",
		},
		Limits: map[string]interface{}{
			"videos":          -1, // unlimited
			"notes_per_video": -1, // unlimited
			"ai_summaries":    true,
			"custom_tags":     true,
			"export":          true,
			"analytics":       true,
			"api_access":      true,
		},
	},
	"annual": {
		Type:         "annual",
		Name:         "Annual Pro",
		Price:        5999.00, // ₹5999/year
		BillingCycle: "annual",
		Features: []string{
			"Unlimited videos",
			"Unlimited notes per video",
			"Advanced AI summaries & insights",
			"Custom tags & categories",
			"Export to multiple formats",
			"Advanced analytics",
			"API access",
		},
		Limits: map[string]interface{}{
			"videos":          -1, // unlimited
			"notes_per_video": -1, // unlimited
			"ai_summaries":    true,
			"custom_tags":     true,
			"export":          true,
			"analytics":       true,
			"api_access":      true,
		},
	},
}

// Feature names constants
const (
	FeatureVideos        = "videos"
	FeatureNotesPerVideo = "notes_per_video"
	FeatureAISummaries   = "ai_summaries"
	FeatureCustomTags    = "custom_tags"
	FeatureExport        = "export"
	FeatureAnalytics     = "analytics"
	FeatureAPIAccess     = "api_access"
)
