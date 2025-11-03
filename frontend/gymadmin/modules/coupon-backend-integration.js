/**
 * Coupon Backend Integration Module
 * Handles all backend API calls for coupon management
 */

const CouponBackendAPI = {
  // Get API base URL from global config or use default
  getApiBaseUrl() {
    return window.API_BASE_URL || 'http://localhost:5000';
  },

  /**
   * Get all coupons for a gym from backend
   */
  async getCoupons(gymId, adminToken, filters = {}) {
    try {
      const params = new URLSearchParams({
        gymId,
        ...filters
      });

      const apiUrl = `${this.getApiBaseUrl()}/api/offers/coupons?${params}`;
      console.log('🔄 Fetching coupons from backend:', { gymId, filters, apiUrl });
      console.log('🔑 Using token:', adminToken ? `${adminToken.substring(0, 20)}...` : 'NO TOKEN');
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorData;
        try {
          const errorText = await response.text();
          errorData = JSON.parse(errorText);
          console.error('❌ Error response body:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response');
          errorData = { message: 'Unknown error' };
        }
        
        if (response.status === 401) {
          // Check if it's a token type mismatch (should be resolved with gymadminAuth middleware)
          if (errorData.message && errorData.message.includes('Invalid token type')) {
            console.error('❌ Token type error. This should not happen with proper gym authentication.');
            console.error('💡 If you see this, the backend routes may need to use gymadminAuth middleware.');
            // Return empty list to prevent UI crash
            return { coupons: [], pagination: null };
          }
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 404) {
          return { coupons: [], pagination: null };
        } else if (response.status === 400) {
          throw new Error(errorData.message || 'Bad request');
        }
        throw new Error(`Failed to fetch coupons (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Coupons fetched successfully:', data);
      
      return {
        coupons: data.coupons || [],
        pagination: data.pagination || null
      };

    } catch (error) {
      console.error('❌ Error fetching coupons:', error);
      throw error;
    }
  },

  /**
   * Create a new coupon
   */
  async createCoupon(couponData, adminToken) {
    try {
      console.log('🔄 Creating coupon:', couponData);
      
      const response = await fetch(`${this.getApiBaseUrl()}/api/offers/coupons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(couponData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create coupon (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Coupon created successfully:', data);
      
      return data.coupon;

    } catch (error) {
      console.error('❌ Error creating coupon:', error);
      throw error;
    }
  },

  /**
   * Update an existing coupon
   */
  async updateCoupon(couponId, updates, adminToken) {
    try {
      console.log('🔄 Updating coupon:', couponId, updates);
      
      const response = await fetch(`${this.getApiBaseUrl()}/api/offers/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update coupon (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Coupon updated successfully:', data);
      
      return data.coupon;

    } catch (error) {
      console.error('❌ Error updating coupon:', error);
      throw error;
    }
  },

  /**
   * Delete a coupon (soft delete)
   */
  async deleteCoupon(couponId, adminToken) {
    try {
      console.log('🔄 Deleting coupon:', couponId);
      
      const response = await fetch(`${this.getApiBaseUrl()}/api/offers/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete coupon (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Coupon deleted successfully:', data);
      
      return data;

    } catch (error) {
      console.error('❌ Error deleting coupon:', error);
      throw error;
    }
  },

  /**
   * Toggle coupon status (activate/deactivate)
   */
  async toggleCouponStatus(couponId, newStatus, adminToken) {
    try {
      console.log('🔄 Toggling coupon status:', couponId, newStatus);
      
      const response = await fetch(`${this.getApiBaseUrl()}/api/offers/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          isActive: newStatus === 'active'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to toggle coupon status (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Coupon status toggled successfully:', data);
      
      return data.coupon;

    } catch (error) {
      console.error('❌ Error toggling coupon status:', error);
      throw error;
    }
  },

  /**
   * Validate a coupon code
   */
  async validateCoupon(couponCode, gymId, options = {}) {
    try {
      const { userId, purchaseAmount, category } = options;
      const params = new URLSearchParams({
        gymId,
        ...(userId && { userId }),
        ...(purchaseAmount && { purchaseAmount }),
        ...(category && { category })
      });

      console.log('🔄 Validating coupon:', couponCode, options);
      
      const response = await fetch(`${this.getApiBaseUrl()}/api/offers/coupons/validate/${couponCode}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          valid: false,
          message: data.message || 'Invalid coupon'
        };
      }

      console.log('✅ Coupon validation result:', data);
      
      return data;

    } catch (error) {
      console.error('❌ Error validating coupon:', error);
      return {
        valid: false,
        message: 'Failed to validate coupon'
      };
    }
  },

  /**
   * Use a coupon (record usage)
   */
  async useCoupon(couponCode, usageData, userId = null) {
    try {
      console.log('🔄 Using coupon:', couponCode, usageData);
      
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add user token if available
      if (userId) {
        const userToken = localStorage.getItem('userToken') || localStorage.getItem('token');
        if (userToken) {
          headers['Authorization'] = `Bearer ${userToken}`;
        }
      }
      
      const response = await fetch(`${this.getApiBaseUrl()}/api/offers/coupons/use/${couponCode}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(usageData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to use coupon (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Coupon used successfully:', data);
      
      return data;

    } catch (error) {
      console.error('❌ Error using coupon:', error);
      throw error;
    }
  },

  /**
   * Get coupon analytics
   */
  async getCouponAnalytics(gymId, adminToken, dateRange = {}) {
    try {
      const params = new URLSearchParams({
        gymId,
        ...dateRange
      });

      console.log('🔄 Fetching coupon analytics:', { gymId, dateRange });
      
      const response = await fetch(`${this.getApiBaseUrl()}/api/offers/coupons/analytics?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Analytics fetched successfully:', data);
      
      return data;

    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      throw error;
    }
  },

  /**
   * Export coupons data
   */
  async exportCoupons(gymId, adminToken) {
    try {
      console.log('🔄 Exporting coupons:', gymId);
      
      const response = await fetch(`${this.getApiBaseUrl()}/api/offers/coupons/export?gymId=${gymId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to export coupons (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Coupons exported successfully:', data);
      
      return data;

    } catch (error) {
      console.error('❌ Error exporting coupons:', error);
      throw error;
    }
  },

  /**
   * Get user's claimed coupons
   */
  async getUserCoupons(userId, gymId) {
    try {
      console.log('🔄 Fetching user coupons:', { userId, gymId });
      
      const params = new URLSearchParams();
      if (gymId) params.append('gymId', gymId);

      const response = await fetch(`${this.getApiBaseUrl()}/api/offers/user/${userId}/coupons?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch user coupons (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ User coupons fetched:', data);
      
      return Array.isArray(data) ? data : data.coupons || [];

    } catch (error) {
      console.error('❌ Error fetching user coupons:', error);
      return [];
    }
  }
};

// Make it available globally
window.CouponBackendAPI = CouponBackendAPI;
