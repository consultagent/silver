# Pre-Order Modal Implementation Guide

Complete guide to implement the "Pre-Order Now" modal with discount code generation on any e-commerce site.

---

## Table of Contents
1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Database Setup](#database-setup)
4. [Environment Variables](#environment-variables)
5. [API Endpoints](#api-endpoints)
6. [HTML Structure](#html-structure)
7. [JavaScript Logic](#javascript-logic)
8. [CSS Styling](#css-styling)
9. [Integration Checklist](#integration-checklist)

---

## Overview

This implementation provides:
- ✅ Reusable modal form for pre-orders
- ✅ Automatic discount code generation (LAUNCH-xxxxx format)
- ✅ Email confirmation with Brevo
- ✅ Database storage in Supabase
- ✅ 7-day code expiry
- ✅ WhatsApp sharing functionality
- ✅ Copy-to-clipboard code button

---

## Requirements

### External Services
1. **Supabase** (PostgreSQL database)
   - Create project at https://app.supabase.com
   - Get: SUPABASE_URL, SUPABASE_ANON_KEY

2. **Brevo** (Email service)
   - Create account at https://app.brevo.com
   - Get: BREVO_API_KEY
   - Verify sender email (use your valid email like sales@yoursite.com)

### Local Environment
- Node.js (for API development)
- npm or yarn (package manager)
- Git (version control)

---

## Database Setup

### Step 1: Create Reservations Table

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text,
  discount_code text NOT NULL UNIQUE,
  expiry_date date NOT NULL,
  source text DEFAULT 'product-name',
  ip_address text,
  email_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint on email
ALTER TABLE public.reservations ADD CONSTRAINT unique_email UNIQUE (email);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Allow public insert for form submissions
CREATE POLICY "Allow public insert" ON public.reservations
  FOR INSERT WITH CHECK (true);

-- Allow public select
CREATE POLICY "Allow public select" ON public.reservations
  FOR SELECT USING (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_reservations_email ON public.reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_discount_code ON public.reservations(discount_code);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at DESC);
```

### Step 2: Verify Table

1. Go to Supabase → Table Editor
2. Should see `reservations` table with all columns visible
3. Click on table - should be empty with insert button available

---

## Environment Variables

### Local (.env file)

```env
# Brevo Configuration
BREVO_API_KEY=xkeysib-[YOUR_API_KEY]

# Supabase Configuration
SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
SUPABASE_ANON_KEY=sb_publishable_[YOUR_KEY]
SUPABASE_SERVICE_KEY=[YOUR_SERVICE_KEY]

# Database
DATABASE_URL=postgresql://[CONNECTION_STRING]

# Environment
NODE_ENV=production
```

### Vercel/Production Deployment

Set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your public Supabase key |
| `BREVO_API_KEY` | Your Brevo API key |

---

## API Endpoints

### POST /api/generate-discount

**Purpose:** Generate discount code, save to database, send email

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "city": "Bangalore",
  "heardFrom": "Instagram"
}
```

**Response (Success):**
```json
{
  "success": true,
  "discountCode": "LAUNCH-1775667842290-AUA20B",
  "discountedPrice": 6425,
  "expiryDate": "2026-04-16"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Email already has an active discount code"
}
```

**Implementation:** See `api/generate-discount.js` in Silver Fresh repo

---

## HTML Structure

### Navigation Button

```html
<nav class="nav" role="navigation" aria-label="Site navigation">
  <a href="#" class="nav-brand">Your Brand</a>
  <a href="#order" class="nav-cta" aria-label="Unlock Early Access">
    UNLOCK EARLY ACCESS
  </a>
</nav>
```

### Hero Section Button

```html
<div class="hero-cta-row">
  <button
    id="preorderBtn"
    class="btn-cta"
    aria-label="Join pre-order waitlist"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
    Pre-Order Now
  </button>
</div>
```

### Modal Structure

```html
<div id="preorderModal" class="modal">
  <div class="modal-content">
    <button class="modal-close" id="preorderClose">&times;</button>
    
    <h2 style="text-align: center; margin-bottom: 1rem;">
      Reserve Your Product
    </h2>
    <p style="text-align: center; color: #666; margin-bottom: 1.5rem;">
      Join our exclusive waitlist and be first to own this masterpiece at 50% off
    </p>

    <form id="preorderForm" style="max-width: 500px; margin: 0 auto;">
      <!-- Full Name -->
      <div style="margin-bottom: 1rem;">
        <label for="fullName" style="display: block; font-weight: 500; margin-bottom: 0.5rem;">
          Full Name <span style="color: red;">*</span>
        </label>
        <input
          type="text"
          id="fullName"
          required
          style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
        />
      </div>

      <!-- Email -->
      <div style="margin-bottom: 1rem;">
        <label for="email" style="display: block; font-weight: 500; margin-bottom: 0.5rem;">
          Email Address <span style="color: red;">*</span>
        </label>
        <input
          type="email"
          id="email"
          required
          style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
        />
      </div>

      <!-- WhatsApp -->
      <div style="margin-bottom: 1rem;">
        <label for="phone" style="display: block; font-weight: 500; margin-bottom: 0.5rem;">
          WhatsApp Number <span style="color: red;">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          placeholder="+91..."
          required
          style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
        />
      </div>

      <!-- City -->
      <div style="margin-bottom: 1rem;">
        <label for="city" style="display: block; font-weight: 500; margin-bottom: 0.5rem;">
          City
        </label>
        <input
          type="text"
          id="city"
          style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
        />
      </div>

      <!-- How did you hear -->
      <div style="margin-bottom: 1.5rem;">
        <label for="heardFrom" style="display: block; font-weight: 500; margin-bottom: 0.5rem;">
          How did you hear about us?
        </label>
        <select
          id="heardFrom"
          style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
        >
          <option value="">Select...</option>
          <option value="Instagram">Instagram</option>
          <option value="Facebook">Facebook</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Friend">Friend/Referral</option>
          <option value="Search">Google Search</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <!-- Form Message -->
      <div id="formMessage" style="display: none; margin-bottom: 1rem; padding: 0.75rem; border-radius: 4px;"></div>

      <!-- Submit Button -->
      <button
        type="submit"
        id="submitBtn"
        style="width: 100%; padding: 0.75rem; background: #1a1412; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;"
      >
        RESERVE MY SPOT NOW
      </button>
    </form>
  </div>
</div>
```

### Success Modal

```html
<div id="successModal" class="modal">
  <div class="modal-content" style="max-width: 600px;">
    <button class="modal-close" id="closeSuccessModal">&times;</button>

    <h2 style="text-align: center; margin-bottom: 0.5rem;">Your Code Is Ready!</h2>
    <p style="text-align: center; color: #666; margin-bottom: 1.5rem;">
      Your 50% discount code has been generated. Copy it below or check your email.
    </p>

    <!-- Discount Code Box -->
    <div style="background: #f0e6d3; border: 2px dashed #c9a96e; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; text-align: center;">
      <p style="color: #999; font-size: 0.75rem; text-transform: uppercase; margin: 0 0 0.75rem 0;">Your Discount Code</p>
      <p id="displayCode" style="font-family: 'Courier New', monospace; font-size: 1.75rem; font-weight: 600; color: #1a1412; word-break: break-all; margin: 0; padding: 0.75rem 0;">CODE</p>
      <button id="copyCodeButton" style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: #c9a96e; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; width: 100%;">
        📋 Copy Code
      </button>
    </div>

    <!-- Pricing Info -->
    <div style="background: rgba(201, 169, 110, 0.1); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
        <span>Original Price:</span>
        <span style="text-decoration: line-through;">₹12,850</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: #2d7a4f; font-weight: 600; margin-bottom: 0.75rem;">
        <span>Your Price (50% OFF):</span>
        <span id="displayPrice">₹6,425</span>
      </div>
      <div style="padding-top: 0.75rem; border-top: 1px solid #c9a96e; color: #666; font-size: 0.85rem;">
        You save: ₹6,425 (50%)
      </div>
    </div>

    <!-- Expiry Notice -->
    <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 0.75rem; margin-bottom: 1.5rem; border-radius: 4px;">
      <p style="color: #991b1b; font-size: 0.85rem; margin: 0;">
        ⏰ Valid until <strong id="displayExpiry">2026-04-16</strong> (7 days)
      </p>
    </div>

    <!-- Email Confirmation -->
    <p style="color: #666; font-size: 0.85rem; margin-bottom: 1.5rem; text-align: center;">
      📧 A confirmation email with your code has been sent. Check your inbox (and spam folder just in case).
    </p>

    <!-- Action Buttons -->
    <button id="whatsappShareButton" style="width: 100%; padding: 0.75rem; background: #25d366; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; margin-bottom: 0.75rem;">
      💬 Share via WhatsApp
    </button>
    <button id="proceedToCheckout" style="width: 100%; padding: 0.75rem; background: #1a1412; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
      Ready to Checkout? →
    </button>
  </div>
</div>
```

---

## JavaScript Logic

### Modal Toggle

```javascript
const preorderBtn = document.getElementById('preorderBtn');
const preorderModal = document.getElementById('preorderModal');
const preorderClose = document.getElementById('preorderClose');
const preorderForm = document.getElementById('preorderForm');

// Open modal
preorderBtn.addEventListener('click', (e) => {
  e.preventDefault();
  preorderModal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

// Close modal
preorderClose.addEventListener('click', () => {
  preorderModal.classList.remove('active');
  document.body.style.overflow = 'auto';
});

// Close on backdrop click
preorderModal.addEventListener('click', (e) => {
  if (e.target === preorderModal) {
    preorderModal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});
```

### Form Submission

```javascript
preorderForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const formMessage = document.getElementById('formMessage');

  submitBtn.disabled = true;
  submitBtn.textContent = "Generating your code...";
  formMessage.style.display = 'none';

  const formData = {
    fullName: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    city: document.getElementById('city').value.trim() || "Not provided",
    heardFrom: document.getElementById('heardFrom').value
  };

  try {
    const response = await fetch('/api/generate-discount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      // Show success modal
      showSuccessModal(result);
      preorderModal.classList.remove('active');
      document.body.style.overflow = 'auto';
      preorderForm.reset();
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    formMessage.textContent = '❌ Something went wrong. Please try again.';
    formMessage.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'RESERVE MY SPOT NOW';
  }
});
```

### Success Modal Display

```javascript
function showSuccessModal(result) {
  const successModal = document.getElementById('successModal');
  document.getElementById('displayCode').textContent = result.discountCode;
  document.getElementById('displayPrice').textContent = '₹' + result.discountedPrice.toLocaleString('en-IN');
  document.getElementById('displayExpiry').textContent = result.expiryDate;
  successModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}
```

### Copy Code Button

```javascript
const copyCodeButton = document.getElementById('copyCodeButton');
if (copyCodeButton) {
  copyCodeButton.addEventListener('click', function() {
    const code = document.getElementById('displayCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
      copyCodeButton.textContent = '✓ Copied!';
      setTimeout(() => {
        copyCodeButton.textContent = '📋 Copy Code';
      }, 2000);
    });
  });
}
```

### WhatsApp Share

```javascript
const whatsappShareButton = document.getElementById('whatsappShareButton');
if (whatsappShareButton) {
  whatsappShareButton.addEventListener('click', function() {
    const code = document.getElementById('displayCode').textContent;
    const message = `🦋 I just reserved the Silver Butterfly Brooch with 50% discount! 🎉\n\nMy code: ${code}\n\nJoin me: [YOUR_SITE_URL]`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  });
}
```

### Checkout Button

```javascript
const proceedToCheckoutBtn = document.getElementById('proceedToCheckout');
if (proceedToCheckoutBtn) {
  proceedToCheckoutBtn.addEventListener('click', function() {
    window.location.href = 'https://yourshop.com/shop';
  });
}
```

---

## CSS Styling

### Modal CSS

```css
.modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.7);
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal.active {
  display: flex;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-close:hover {
  color: #333;
}

.form-message {
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
}

.form-message.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.form-message.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}
```

---

## Integration Checklist

- [ ] Create Supabase project and reservations table
- [ ] Get Supabase credentials (URL, ANON_KEY)
- [ ] Create Brevo account and verify sender email
- [ ] Get Brevo API key
- [ ] Add environment variables to .env
- [ ] Deploy generate-discount API endpoint
- [ ] Add HTML modal structure to page
- [ ] Add JavaScript logic (modal toggle, form submission)
- [ ] Add CSS styling for modal
- [ ] Update pricing in email template (if different)
- [ ] Update checkout URL in proceedToCheckout button
- [ ] Test form submission on staging
- [ ] Verify email delivery
- [ ] Check Supabase database for records
- [ ] Deploy to production
- [ ] Monitor Brevo email logs

---

## API Endpoint Code (generate-discount.js)

See `/api/generate-discount.js` in the Silver Fresh repository for the complete Node.js/Vercel implementation.

Key features:
- CORS handling
- Input validation
- Supabase integration
- Brevo email sending
- Error logging

---

## Support & Debugging

### Email not sending?
1. Check Brevo API key is valid
2. Verify sender email is confirmed in Brevo
3. Check Brevo email logs for errors
4. Review API console error logs

### Form not submitting?
1. Check browser console for JS errors
2. Verify API endpoint is accessible
3. Check network tab for API response
4. Confirm environment variables in deployment

### Database not saving?
1. Verify Supabase credentials
2. Check table exists and is accessible
3. Review RLS policies
4. Check Supabase API logs

---

## Files to Copy

From Silver Fresh repo, copy these files to your project:
- `/api/generate-discount.js` - Main API endpoint
- HTML modal structure from `/index.html`
- JavaScript logic from `/index.html` (preorder functions)
- CSS from `/index.html` (modal styles)
- `.env.example` - Reference for environment variables

Customize for your product (pricing, names, URLs).
