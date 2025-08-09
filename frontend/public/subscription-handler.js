// Subscription Plan Handler
class SubscriptionHandler {
    constructor() {
        this.selectedPlan = null;
        this.selectedPaymentMethod = null;
        this.planPrices = {
            '1month': 999,
            '3month': 1699,
            '6month': 3299,
            '12month': 5999
        };
        this.planNames = {
            '1month': 'Monthly Plan',
            '3month': 'Quarterly Plan (3 Months)',
            '6month': 'Half-Yearly Plan (6 Months)',
            '12month': 'Annual Plan (12 Months)'
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupValidation();
    }

    bindEvents() {
        // Plan selection
        document.addEventListener('change', (e) => {
            if (e.target.name === 'subscriptionPlan') {
                this.handlePlanSelection(e.target.value);
            }
            if (e.target.name === 'paymentMethod') {
                this.handlePaymentMethodSelection(e.target.value);
            }
        });

        // Plan card click (not just radio button)
        document.querySelectorAll('.subscription-plan-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.type !== 'radio') {
                    const radio = card.querySelector('input[type="radio"]');
                    radio.checked = true;
                    this.handlePlanSelection(radio.value);
                }
            });
        });

        // Payment method option click
        document.querySelectorAll('.payment-method-option').forEach(option => {
            option.addEventListener('click', (e) => {
                if (e.target.type !== 'radio') {
                    const radio = option.querySelector('input[type="radio"]');
                    radio.checked = true;
                    this.handlePaymentMethodSelection(radio.value);
                }
            });
        });
    }

    handlePlanSelection(planValue) {
        this.selectedPlan = planValue;
        
        // Update UI
        this.updatePlanSelection();
        this.showPaymentSection();
        this.updatePlanSummary();
        
        // Hide plan error if visible
        document.getElementById('planError').style.display = 'none';
    }

    updatePlanSelection() {
        // Remove selected class from all cards
        document.querySelectorAll('.subscription-plan-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selected class to chosen card
        const selectedCard = document.querySelector(`[data-plan="${this.selectedPlan}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }

    showPaymentSection() {
        const paymentSection = document.getElementById('paymentSection');
        if (paymentSection) {
            paymentSection.style.display = 'block';
            // Smooth scroll to payment section
            setTimeout(() => {
                paymentSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }

    updatePlanSummary() {
        const planSummary = document.getElementById('planSummary');
        if (!planSummary || !this.selectedPlan) return;

        const price = this.planPrices[this.selectedPlan];
        const planName = this.planNames[this.selectedPlan];
        const monthlyEquivalent = this.calculateMonthlyEquivalent(this.selectedPlan, price);
        const savings = this.calculateSavings(this.selectedPlan);

        planSummary.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: #1976d2; font-size: 1.1em;">${planName}</h4>
                    <p style="margin: 0; color: #666; font-size: 0.9em;">
                        Includes 1-month free trial • ${monthlyEquivalent}
                        ${savings ? `<span style="color: #4CAF50; font-weight: 600;"> • ${savings}</span>` : ''}
                    </p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.8em; font-weight: 800; color: #333;">₹${price.toLocaleString()}</div>
                    <div style="font-size: 0.8em; color: #666;">After trial period</div>
                </div>
            </div>
        `;
    }

    calculateMonthlyEquivalent(plan, price) {
        const months = parseInt(plan.replace('month', ''));
        const monthly = Math.round(price / months);
        return `₹${monthly}/month equivalent`;
    }

    calculateSavings(plan) {
        const basePrice = this.planPrices['1month'];
        const currentPrice = this.planPrices[plan];
        const months = parseInt(plan.replace('month', ''));
        
        if (months === 1) return null;
        
        const totalWithoutDiscount = basePrice * months;
        const savings = totalWithoutDiscount - currentPrice;
        const percentage = Math.round((savings / totalWithoutDiscount) * 100);
        
        return `Save ₹${savings.toLocaleString()} (${percentage}% off)`;
    }

    handlePaymentMethodSelection(paymentMethod) {
        this.selectedPaymentMethod = paymentMethod;
        this.loadPaymentGateway(paymentMethod);
        
        // Update UI for selected payment method
        document.querySelectorAll('.payment-method-option').forEach(option => {
            option.style.borderColor = '#e9ecef';
            option.style.backgroundColor = 'transparent';
        });
        
        const selectedOption = document.querySelector(`input[value="${paymentMethod}"]`).closest('.payment-method-option');
        selectedOption.style.borderColor = 'var(--primary)';
        selectedOption.style.backgroundColor = '#e3eafc';
    }

    loadPaymentGateway(paymentMethod) {
        const container = document.getElementById('paymentGatewayContainer');
        if (!container) return;

        // Show loading state
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; color: #1976d2;">
                <i class="fas fa-spinner fa-spin"></i>
                Loading ${paymentMethod} payment gateway...
            </div>
        `;

        // Simulate loading and show placeholder for actual integration
        setTimeout(() => {
            container.innerHTML = this.getPaymentGatewayPlaceholder(paymentMethod);
        }, 1500);
    }

    getPaymentGatewayPlaceholder(paymentMethod) {
        const placeholders = {
            razorpay: `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: #f9f9f9; text-align: center;">
                    <div style="color: #3395ff; font-size: 1.5em; margin-bottom: 10px;">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <h4 style="margin: 0 0 10px 0; color: #333;">Razorpay Integration</h4>
                    <p style="margin: 0; color: #666; font-size: 0.9em;">
                        Secure payment processing with cards, UPI, wallets & banking
                    </p>
                    <div style="margin-top: 15px; padding: 10px; background: #fff; border-radius: 5px; border: 1px dashed #ccc;">
                        <code style="color: #666; font-size: 0.8em;">
                            // Razorpay.js will be initialized here<br>
                            // Payment form and processing logic
                        </code>
                    </div>
                </div>
            `,
            stripe: `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: #f9f9f9; text-align: center;">
                    <div style="color: #635bff; font-size: 1.5em; margin-bottom: 10px;">
                        <i class="fab fa-stripe"></i>
                    </div>
                    <h4 style="margin: 0 0 10px 0; color: #333;">Stripe Integration</h4>
                    <p style="margin: 0; color: #666; font-size: 0.9em;">
                        Global payment processing with advanced security
                    </p>
                    <div style="margin-top: 15px; padding: 10px; background: #fff; border-radius: 5px; border: 1px dashed #ccc;">
                        <code style="color: #666; font-size: 0.8em;">
                            // Stripe Elements will be mounted here<br>
                            // Card input and payment processing
                        </code>
                    </div>
                </div>
            `,
            paypal: `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: #f9f9f9; text-align: center;">
                    <div style="color: #0070ba; font-size: 1.5em; margin-bottom: 10px;">
                        <i class="fab fa-paypal"></i>
                    </div>
                    <h4 style="margin: 0 0 10px 0; color: #333;">PayPal Integration</h4>
                    <p style="margin: 0; color: #666; font-size: 0.9em;">
                        Quick and secure PayPal payments
                    </p>
                    <div style="margin-top: 15px; padding: 10px; background: #fff; border-radius: 5px; border: 1px dashed #ccc;">
                        <code style="color: #666; font-size: 0.8em;">
                            // PayPal SDK will be loaded here<br>
                            // PayPal button and payment flow
                        </code>
                    </div>
                </div>
            `
        };

        return placeholders[paymentMethod] || 'Payment gateway integration placeholder';
    }

    setupValidation() {
        // Add plan validation to form submission
        const form = document.getElementById('gymRegisterForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                if (!this.validateSubscription()) {
                    e.preventDefault();
                }
            });
        }
    }

    validateSubscription() {
        const planError = document.getElementById('planError');
        
        if (!this.selectedPlan) {
            planError.style.display = 'block';
            planError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }

        if (!this.selectedPaymentMethod) {
            alert('Please select a payment method');
            return false;
        }

        planError.style.display = 'none';
        return true;
    }

    getSubscriptionData() {
        return {
            plan: this.selectedPlan,
            price: this.planPrices[this.selectedPlan],
            paymentMethod: this.selectedPaymentMethod,
            planName: this.planNames[this.selectedPlan]
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.subscriptionHandler = new SubscriptionHandler();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubscriptionHandler;
}
