# Checkout Flow Integration - Discount Code Implementation

Complete guide for integrating pre-order discount codes into your shop's checkout process.

---

## Table of Contents
1. [Flow Overview](#flow-overview)
2. [Data Flow Diagram](#data-flow-diagram)
3. [Discount Code Structure](#discount-code-structure)
4. [Checkout Integration](#checkout-integration)
5. [API Integration](#api-integration)
6. [Frontend Implementation](#frontend-implementation)
7. [Backend Validation](#backend-validation)
8. [Testing Guide](#testing-guide)

---

## Flow Overview

```
User Pre-Orders → Discount Code Generated → Email Sent → User Visits Shop → 
Enters Code at Checkout → API Validates Code → Discount Applied → Purchase Complete
```

### Complete User Journey

1. **Pre-Order Stage** (silver.expostores.com)
   - User fills reservation form
   - Discount code generated (LAUNCH-xxxxx format)
   - Email sent with code + details
   - Record saved to Supabase

2. **Code Valid Period**
   - Code is valid for 7 days from generation
   - Can be used unlimited times until expiry
   - User can share code via WhatsApp

3. **Checkout Stage** (expostores.com/shop)
   - User enters code at checkout
   - System validates code in Supabase
   - Discount applied (50% off)
   - Original price → Discounted price
   - Order completed

4. **Post-Purchase**
   - Record updated in Supabase with `used_at` timestamp
   - Optional: Mark code as used (to limit one-time use)
   - Email receipt sent with final price

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SILVER PREORDER SITE                      │
│                  (silver.expostores.com)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ User submits form
                       ▼
        ┌──────────────────────────────┐
        │  Pre-Order Form Validation   │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │  /api/generate-discount endpoint     │
        │  (Node.js/Vercel Edge Function)      │
        └──────────────┬───────────────────────┘
                       │
           ┌───────────┼───────────┐
           │           │           │
           ▼           ▼           ▼
    ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │ Supabase │ │  Brevo   │ │  Generate    │
    │ Save     │ │  Email   │ │  Code LAUNCH │
    │ Record   │ │  Sending │ │  -xxxxx      │
    └──────────┘ └──────────┘ └──────────────┘
           │           │           │
           └───────────┼───────────┘
                       │
                       ▼
        ┌───────────────────────────────┐
        │   Success Modal Displayed     │
        │   - Show discount code        │
        │   - Copy to clipboard         │
        │   - Share via WhatsApp        │
        │   - Ready to checkout button  │
        └──────────────┬────────────────┘
                       │
                       │ User clicks checkout
                       │ Redirected to shop
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      SHOP CHECKOUT                           │
│                   (expostores.com/shop)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   User Adds Product to Cart   │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Checkout Page Displayed    │
        │   - Product price            │
        │   - "Have a discount code?"  │
        │   - Code input field         │
        └──────────────┬───────────────┘
                       │
                       │ User enters code
                       ▼
        ┌──────────────────────────────────────┐
        │  /api/validate-discount endpoint     │
        │  (POST - validate code in Supabase)  │
        └──────────────┬───────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
        Valid                   Invalid
           │                       │
           ▼                       ▼
    ┌──────────────┐    ┌──────────────────┐
    │ Return:      │    │ Return:          │
    │ - Discount % │    │ - Error message  │
    │ - New price  │    │ - Invalid code   │
    │ - Savings $  │    │ - Expired code   │
    └──────────────┘    └──────────────────┘
           │                       │
           └───────────┬───────────┘
                       ▼
        ┌──────────────────────────────┐
        │   Frontend Updates:          │
        │   - Show new total price     │
        │   - Highlight savings        │
        │   - Apply discount           │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   User Completes Purchase    │
        │   - Payment processing       │
        │   - Order confirmation       │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │  Backend Updates Supabase             │
        │  - Set used_at timestamp             │
        │  - Or increment usage_count          │
        │  - Create order record with code     │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Email Order Confirmation   │
        │   - Final price with discount│
        │   - Order details            │
        │   - Tracking info            │
        └──────────────────────────────┘
```

---

## Discount Code Structure

### Code Format

```
LAUNCH-[TIMESTAMP]-[RANDOM]

Example: LAUNCH-1775667842290-AUA20B
         └─────┬─────┘ └─────┬────┘ └──┬──┘
          Prefix    Timestamp   Random
```

### Code Properties

| Property | Value | Notes |
|----------|-------|-------|
| Format | LAUNCH-[timestamp]-[random] | Unique, collision-proof |
| Discount % | 50 | Fixed at 50% off |
| Validity | 7 days | From creation date |
| Usage | Unlimited until expiry | Can be shared, used multiple times |
| Case-Sensitive | No | Normalizes to uppercase |
| Reusable | Yes (until expiry) | Same user can use once, different users can share |

### Database Record Structure

```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "city": "Bangalore",
  "discount_code": "LAUNCH-1775667842290-AUA20B",
  "expiry_date": "2026-04-16",
  "source": "product-name",
  "ip_address": "192.168.1.1",
  "email_sent_at": "2026-04-09T10:30:00Z",
  "used_at": "2026-04-09T14:30:00Z",
  "usage_count": 1,
  "order_id": "ORDER-12345",
  "created_at": "2026-04-09T10:30:00Z",
  "updated_at": "2026-04-09T14:30:00Z"
}
```

---

## Checkout Integration

### Step 1: Display Code Input Field

**Location:** Checkout page, after product selection

```html
<div class="discount-code-section">
  <div class="discount-input-group">
    <label for="discountCode">Have a discount code?</label>
    <div style="display: flex; gap: 0.5rem;">
      <input
        type="text"
        id="discountCode"
        placeholder="Enter code (e.g., LAUNCH-...)"
        style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
      />
      <button
        id="applyCodeBtn"
        type="button"
        style="padding: 0.75rem 1.5rem; background: #1a1412; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        Apply
      </button>
    </div>
    <p id="codeMessage" style="margin-top: 0.5rem; font-size: 0.85rem;"></p>
  </div>

  <!-- Pricing Display -->
  <div id="pricingDisplay" style="margin-top: 1rem; padding: 1rem; background: #f9f9f9; border-radius: 4px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span>Original Price:</span>
      <span id="originalPrice">₹12,850</span>
    </div>
    <div id="discountRow" style="display: none; color: #2d7a4f; font-weight: 600; margin-bottom: 0.5rem;">
      <span>Your Price (50% OFF):</span>
      <span id="discountedPrice">₹6,425</span>
    </div>
    <div id="savingsRow" style="display: none; color: #2d7a4f; font-size: 0.9rem;">
      You save: <span id="savingsAmount">₹6,425</span> (50%)
    </div>
    <hr style="margin: 0.75rem 0; border: none; border-top: 1px solid #ddd;" />
    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.1rem;">
      <span>Total:</span>
      <span id="totalPrice">₹12,850</span>
    </div>
  </div>
</div>
```

### Step 2: Order Summary with Discount

```html
<div class="order-summary">
  <h3>Order Summary</h3>
  
  <div style="background: white; padding: 1rem; border: 1px solid #ddd; border-radius: 4px;">
    <!-- Product Details -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
      <div>
        <p style="font-weight: 600; margin: 0;">Silver Butterfly Brooch</p>
        <p style="color: #666; font-size: 0.9rem; margin: 0.25rem 0 0 0;">SKU: AM001</p>
      </div>
      <span id="productPrice">₹12,850</span>
    </div>

    <!-- Discount Row (if applied) -->
    <div id="discountCodeRow" style="display: none; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
      <div style="display: flex; justify-content: space-between; color: #2d7a4f;">
        <span>Discount Code Applied: <span id="appliedCodeDisplay"></span></span>
        <span>-₹<span id="discountAmount">6425</span></span>
      </div>
    </div>

    <!-- Shipping (optional) -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
      <span>Shipping</span>
      <span id="shippingCost">FREE</span>
    </div>

    <!-- Final Total -->
    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.2rem;">
      <span>TOTAL</span>
      <span id="finalTotal">₹12,850</span>
    </div>
  </div>
</div>
```

---

## API Integration

### Validate Discount Code Endpoint

**Create new file:** `/api/validate-discount.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Handle CORS
  const origin = req.headers.origin;
  const allowedOrigins = ['https://expostores.com', 'https://yourshop.com', 'http://localhost:3000'];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { discountCode } = req.body;

    if (!discountCode) {
      return res.status(400).json({
        success: false,
        error: 'Discount code is required'
      });
    }

    // Normalize code (trim, uppercase)
    const normalizedCode = discountCode.trim().toUpperCase();

    // Query Supabase for the code
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('discount_code', normalizedCode)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid discount code'
      });
    }

    // Check if code is expired
    const expiryDate = new Date(data.expiry_date);
    const today = new Date();
    
    if (today > expiryDate) {
      return res.status(400).json({
        success: false,
        error: 'Discount code has expired'
      });
    }

    // Return discount details
    return res.status(200).json({
      success: true,
      discountCode: data.discount_code,
      discountPercent: 50,
      originalPrice: 12850,
      discountedPrice: 6425,
      savings: 6425,
      expiryDate: data.expiry_date,
      userEmail: data.email,
      userName: data.full_name
    });

  } catch (error) {
    console.error('[validate-discount error]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.'
    });
  }
}
```

### Update Order with Code

**Create new file:** `/api/complete-order-with-code.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { discountCode, orderId } = req.body;

    if (!discountCode || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Update reservation record
    const { error } = await supabase
      .from('reservations')
      .update({
        used_at: new Date().toISOString(),
        order_id: orderId,
        updated_at: new Date().toISOString()
      })
      .eq('discount_code', discountCode.toUpperCase());

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Order recorded with discount code'
    });

  } catch (error) {
    console.error('[complete-order error]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to record order'
    });
  }
}
```

---

## Frontend Implementation

### JavaScript for Checkout

```javascript
const applyCodeBtn = document.getElementById('applyCodeBtn');
const discountCodeInput = document.getElementById('discountCode');
const codeMessage = document.getElementById('codeMessage');

applyCodeBtn.addEventListener('click', async () => {
  const code = discountCodeInput.value.trim();

  if (!code) {
    codeMessage.textContent = '❌ Please enter a code';
    codeMessage.style.color = '#dc2626';
    return;
  }

  applyCodeBtn.disabled = true;
  applyCodeBtn.textContent = 'Validating...';
  codeMessage.textContent = '';

  try {
    const response = await fetch('/api/validate-discount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ discountCode: code }),
    });

    const result = await response.json();

    if (result.success) {
      // Apply discount to UI
      document.getElementById('discountRow').style.display = 'flex';
      document.getElementById('savingsRow').style.display = 'block';
      document.getElementById('discountedPrice').textContent = '₹' + result.discountedPrice.toLocaleString('en-IN');
      document.getElementById('savingsAmount').textContent = '₹' + result.savings.toLocaleString('en-IN');
      document.getElementById('totalPrice').textContent = '₹' + result.discountedPrice.toLocaleString('en-IN');
      
      // Update order summary
      document.getElementById('discountCodeRow').style.display = 'block';
      document.getElementById('appliedCodeDisplay').textContent = result.discountCode;
      document.getElementById('discountAmount').textContent = result.savings.toLocaleString('en-IN');
      document.getElementById('finalTotal').textContent = '₹' + result.discountedPrice.toLocaleString('en-IN');

      codeMessage.textContent = '✅ Discount applied successfully!';
      codeMessage.style.color = '#16a34a';
      
      // Disable code input after successful application
      discountCodeInput.disabled = true;
      applyCodeBtn.disabled = true;
      applyCodeBtn.textContent = '✓ Code Applied';

      // Store code for order submission
      window.appliedDiscountCode = code;

    } else {
      codeMessage.textContent = '❌ ' + result.error;
      codeMessage.style.color = '#dc2626';
    }
  } catch (error) {
    console.error('Error validating code:', error);
    codeMessage.textContent = '❌ Error validating code. Please try again.';
    codeMessage.style.color = '#dc2626';
  } finally {
    applyCodeBtn.disabled = false;
    applyCodeBtn.textContent = 'Apply';
  }
});
```

### Payment Processing with Code

```javascript
const checkoutForm = document.getElementById('checkoutForm');

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const code = window.appliedDiscountCode;

  // Process payment (Razorpay, Stripe, etc.)
  // Then update order with code

  if (code) {
    try {
      await fetch('/api/complete-order-with-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discountCode: code,
          orderId: orderResponse.orderId // From payment gateway
        }),
      });
    } catch (error) {
      console.error('Error recording discount code with order:', error);
    }
  }

  // Continue with order confirmation...
});
```

---

## Backend Validation

### Supabase RLS Policies

Ensure these policies exist on the `reservations` table:

```sql
-- Allow reading reservations for code validation
CREATE POLICY "Allow public read for validation" ON public.reservations
  FOR SELECT USING (true);

-- Allow updating used_at field
CREATE POLICY "Allow update used_at" ON public.reservations
  FOR UPDATE USING (true)
  WITH CHECK (true);
```

### Additional Database Columns (Optional)

If implementing one-time-use codes, add these columns:

```sql
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS max_usage integer DEFAULT NULL;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS used_at timestamp with time zone;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS order_id text;
```

### Validation Logic Checklist

- ✅ Code exists in database
- ✅ Code has not expired
- ✅ Code format is valid (uppercase normalization)
- ✅ Code matches product (if multi-product system)
- ✅ Code usage limit not exceeded (if applicable)
- ✅ Email associated with code can be logged

---

## Testing Guide

### Test Case 1: Valid Code

```javascript
// Test data
const validCode = "LAUNCH-1775667842290-AUA20B";

// Expected result
{
  "success": true,
  "discountCode": "LAUNCH-1775667842290-AUA20B",
  "discountPercent": 50,
  "originalPrice": 12850,
  "discountedPrice": 6425,
  "savings": 6425
}
```

### Test Case 2: Expired Code

```javascript
// Code with expiry_date < today
const expiredCode = "LAUNCH-1775000000000-OLD12";

// Expected result
{
  "success": false,
  "error": "Discount code has expired"
}
```

### Test Case 3: Invalid Code

```javascript
const invalidCode = "INVALID-CODE-12345";

// Expected result
{
  "success": false,
  "error": "Invalid discount code"
}
```

### Test Case 4: Case Insensitivity

```javascript
// Both should work
const code1 = "launch-1775667842290-aua20b";
const code2 = "LAUNCH-1775667842290-AUA20B";

// Both return success with same details
```

### End-to-End Test Steps

1. **Pre-Order**
   - [ ] Fill pre-order form
   - [ ] Receive email with code
   - [ ] Copy code from modal
   - [ ] Verify code in Supabase

2. **Checkout**
   - [ ] Add product to cart
   - [ ] Go to checkout
   - [ ] Paste discount code
   - [ ] Click "Apply"
   - [ ] Verify prices updated
   - [ ] Complete payment

3. **Post-Purchase**
   - [ ] Verify order created
   - [ ] Verify code marked as used
   - [ ] Check order record in Supabase
   - [ ] Receive order confirmation email

---

## Pricing Configuration

### Current Setup (Silver Butterfly Brooch)

```javascript
const PRODUCT_CONFIG = {
  name: "Silver Butterfly Brooch",
  sku: "AM001",
  originalPrice: 12850,        // ₹12,850
  discountPercent: 50,          // 50%
  discountedPrice: 6425,        // ₹6,425
  currency: "INR"
};

// Calculation
discountedPrice = originalPrice * (1 - discountPercent / 100)
// 12850 * (1 - 50/100) = 12850 * 0.5 = 6425
```

To change for different products:

```javascript
// For different discount percent
const DISCOUNT_PERCENT = 40; // 40% off
const discountedPrice = originalPrice * (1 - DISCOUNT_PERCENT / 100);

// For different products with different prices
const PRODUCTS = {
  'AM001': { name: 'Butterfly Brooch', price: 12850, discount: 50 },
  'AM002': { name: 'Diamond Ring', price: 25000, discount: 30 },
  'AM003': { name: 'Silver Necklace', price: 8500, discount: 40 }
};
```

---

## Integration Checklist

### Pre-Order Side (silver.expostores.com)
- ✅ Pre-order form working
- ✅ Discount codes generating
- ✅ Emails sending
- ✅ Supabase records creating

### Checkout Side (expostores.com/shop)
- [ ] Discount code input field added
- [ ] `/api/validate-discount` endpoint deployed
- [ ] `/api/complete-order-with-code` endpoint deployed
- [ ] Frontend JavaScript implemented
- [ ] Price display updates working
- [ ] Order summary shows discount
- [ ] Payment integration handles codes
- [ ] Order confirmation reflects discount

### Testing
- [ ] Valid code accepted
- [ ] Expired code rejected
- [ ] Invalid code rejected
- [ ] Price calculation correct
- [ ] Email confirmation sent
- [ ] Supabase records updated
- [ ] Cross-domain testing (pre-order to shop)

---

## Troubleshooting

### Code not validating?
- Check code format (should be LAUNCH-xxxxx-xxxxx)
- Verify code exists in Supabase
- Check expiry date is in future
- Test API endpoint directly with Postman

### Price not updating on checkout?
- Check JavaScript console for errors
- Verify API response format
- Confirm DOM element IDs match JavaScript
- Test API endpoint returns correct pricing

### Email not sent after order?
- Configure email template in checkout process
- Verify Brevo SMTP credentials
- Check order confirmation email function
- Review Brevo email logs

### Supabase not saving order with code?
- Verify RLS policies allow updates
- Check order_id field exists
- Confirm API key has write permissions
- Review Supabase query editor for errors

---

## Files to Deploy

From Silver Fresh repo, copy/adapt:
- `/api/generate-discount.js` → Reference for API structure
- `/api/validate-discount.js` → New endpoint for checkout
- `/api/complete-order-with-code.js` → New endpoint for order update
- Checkout HTML from your shop template
- Modified JavaScript with discount handling

---

## Deployment Steps

1. **Create API endpoints** in your hosting (Vercel, Node.js, etc.)
2. **Add environment variables** (SUPABASE_URL, SUPABASE_ANON_KEY, BREVO_API_KEY)
3. **Add discount field** to checkout page
4. **Implement frontend validation** JavaScript
5. **Test thoroughly** with sample codes
6. **Deploy to staging** first
7. **Verify end-to-end flow** (pre-order → checkout → payment)
8. **Deploy to production**

---

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Brevo API: https://developers.brevo.com/reference
- Vercel Deployment: https://vercel.com/docs

---

## Contact & Support

For implementation questions, refer to:
- Silver Fresh repo: PREORDER_MODAL_IMPLEMENTATION.md
- Database schema: Database Setup section
- API examples: API endpoints section
