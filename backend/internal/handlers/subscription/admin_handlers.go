package subscription

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
	"github.com/shubhamku044/ytclipper/internal/services"
)

type AdminSubscriptionHandlers struct {
	subscriptionService *services.SubscriptionService
}

func NewAdminSubscriptionHandlers(subscriptionService *services.SubscriptionService) *AdminSubscriptionHandlers {
	return &AdminSubscriptionHandlers{
		subscriptionService: subscriptionService,
	}
}

// CreateCoupon creates a new coupon
func (h *AdminSubscriptionHandlers) CreateCoupon(c *gin.Context) {
	var req struct {
		Code            string     `json:"code" binding:"required"`
		Name            string     `json:"name" binding:"required"`
		Description     *string    `json:"description"`
		DiscountType    string     `json:"discount_type" binding:"required"`
		DiscountValue   float64    `json:"discount_value" binding:"required"`
		MaxUses         *int       `json:"max_uses"`
		ValidFrom       time.Time  `json:"valid_from"`
		ValidUntil      *time.Time `json:"valid_until"`
		MinAmount       float64    `json:"min_amount"`
		ApplicablePlans []string   `json:"applicable_plans"`
		IsActive        bool       `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	// Validate discount type
	if req.DiscountType != "percentage" && req.DiscountType != "fixed_amount" {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_DISCOUNT_TYPE", "Discount type must be 'percentage' or 'fixed_amount'", nil)
		return
	}

	// Validate discount value
	if req.DiscountType == "percentage" && (req.DiscountValue <= 0 || req.DiscountValue > 100) {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_DISCOUNT_VALUE", "Percentage discount must be between 0 and 100", nil)
		return
	}

	if req.DiscountType == "fixed_amount" && req.DiscountValue <= 0 {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_DISCOUNT_VALUE", "Fixed amount discount must be greater than 0", nil)
		return
	}

	// Set default valid_from if not provided
	if req.ValidFrom.IsZero() {
		req.ValidFrom = time.Now().UTC()
	}

	coupon := &models.Coupon{
		Code:            req.Code,
		Name:            req.Name,
		Description:     req.Description,
		DiscountType:    req.DiscountType,
		DiscountValue:   req.DiscountValue,
		MaxUses:         req.MaxUses,
		ValidFrom:       req.ValidFrom,
		ValidUntil:      req.ValidUntil,
		MinAmount:       req.MinAmount,
		ApplicablePlans: req.ApplicablePlans,
		IsActive:        req.IsActive,
	}

	ctx := context.Background()
	if err := h.subscriptionService.DB.Create(ctx, coupon); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to create coupon", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Coupon created successfully",
		"coupon":  coupon,
	})
}

// GetCoupons returns all coupons
func (h *AdminSubscriptionHandlers) GetCoupons(c *gin.Context) {
	ctx := context.Background()
	var coupons []models.Coupon

	err := h.subscriptionService.DB.DB.NewSelect().
		Model(&coupons).
		Order("created_at DESC").
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch coupons", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"coupons": coupons,
	})
}

// UpdateCoupon updates an existing coupon
func (h *AdminSubscriptionHandlers) UpdateCoupon(c *gin.Context) {
	couponID := c.Param("id")
	if couponID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_ID", "Coupon ID is required", nil)
		return
	}

	id, err := uuid.Parse(couponID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_ID", "Invalid coupon ID", nil)
		return
	}

	var req struct {
		Name            *string    `json:"name"`
		Description     *string    `json:"description"`
		DiscountType    *string    `json:"discount_type"`
		DiscountValue   *float64   `json:"discount_value"`
		MaxUses         *int       `json:"max_uses"`
		ValidFrom       *time.Time `json:"valid_from"`
		ValidUntil      *time.Time `json:"valid_until"`
		MinAmount       *float64   `json:"min_amount"`
		ApplicablePlans []string   `json:"applicable_plans"`
		IsActive        *bool      `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request payload", err.Error())
		return
	}

	ctx := context.Background()
	var coupon models.Coupon
	err = h.subscriptionService.DB.DB.NewSelect().
		Model(&coupon).
		Where("id = ?", id).
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusNotFound, "COUPON_NOT_FOUND", "Coupon not found", nil)
		return
	}

	// Update fields if provided
	if req.Name != nil {
		coupon.Name = *req.Name
	}
	if req.Description != nil {
		coupon.Description = req.Description
	}
	if req.DiscountType != nil {
		if *req.DiscountType != "percentage" && *req.DiscountType != "fixed_amount" {
			middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_DISCOUNT_TYPE", "Discount type must be 'percentage' or 'fixed_amount'", nil)
			return
		}
		coupon.DiscountType = *req.DiscountType
	}
	if req.DiscountValue != nil {
		if coupon.DiscountType == "percentage" && (*req.DiscountValue <= 0 || *req.DiscountValue > 100) {
			middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_DISCOUNT_VALUE", "Percentage discount must be between 0 and 100", nil)
			return
		}
		if coupon.DiscountType == "fixed_amount" && *req.DiscountValue <= 0 {
			middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_DISCOUNT_VALUE", "Fixed amount discount must be greater than 0", nil)
			return
		}
		coupon.DiscountValue = *req.DiscountValue
	}
	if req.MaxUses != nil {
		coupon.MaxUses = req.MaxUses
	}
	if req.ValidFrom != nil {
		coupon.ValidFrom = *req.ValidFrom
	}
	if req.ValidUntil != nil {
		coupon.ValidUntil = req.ValidUntil
	}
	if req.MinAmount != nil {
		coupon.MinAmount = *req.MinAmount
	}
	if req.ApplicablePlans != nil {
		coupon.ApplicablePlans = req.ApplicablePlans
	}
	if req.IsActive != nil {
		coupon.IsActive = *req.IsActive
	}

	if err := h.subscriptionService.DB.Update(ctx, &coupon); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to update coupon", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Coupon updated successfully",
		"coupon":  coupon,
	})
}

// DeleteCoupon deletes a coupon
func (h *AdminSubscriptionHandlers) DeleteCoupon(c *gin.Context) {
	couponID := c.Param("id")
	if couponID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_ID", "Coupon ID is required", nil)
		return
	}

	id, err := uuid.Parse(couponID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_ID", "Invalid coupon ID", nil)
		return
	}

	ctx := context.Background()
	var coupon models.Coupon
	err = h.subscriptionService.DB.DB.NewSelect().
		Model(&coupon).
		Where("id = ?", id).
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusNotFound, "COUPON_NOT_FOUND", "Coupon not found", nil)
		return
	}

	if err := h.subscriptionService.DB.Delete(ctx, &coupon); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to delete coupon", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Coupon deleted successfully",
	})
}

// GetCouponUsage returns usage statistics for a coupon
func (h *AdminSubscriptionHandlers) GetCouponUsage(c *gin.Context) {
	couponID := c.Param("id")
	if couponID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_ID", "Coupon ID is required", nil)
		return
	}

	id, err := uuid.Parse(couponID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_ID", "Invalid coupon ID", nil)
		return
	}

	ctx := context.Background()
	var usages []models.CouponUsage
	err = h.subscriptionService.DB.DB.NewSelect().
		Model(&usages).
		Where("coupon_id = ?", id).
		Order("used_at DESC").
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch coupon usage", err.Error())
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"usages": usages,
	})
}
