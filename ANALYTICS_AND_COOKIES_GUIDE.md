# Analytics & Cookies Implementation Guide

Complete documentation for Google Analytics, tracking events, and GDPR-compliant cookie consent on silver.expostores.com

---

## Table of Contents
1. [Overview](#overview)
2. [Google Analytics Setup](#google-analytics-setup)
3. [Tracking Events](#tracking-events)
4. [Meta Pixel Integration](#meta-pixel-integration)
5. [Cookie Consent Banner](#cookie-consent-banner)
6. [Privacy Compliance](#privacy-compliance)
7. [Monitoring & Reporting](#monitoring--reporting)

---

## Overview

The site currently implements:
- ✅ **Google Analytics 4 (GA4)** - Tracking user behavior and conversions
- ✅ **Event Tracking** - Pre-order form interactions
- ✅ **Meta Pixel** - Facebook audience tracking and retargeting
- ⚠️ **Cookie Consent** - Should be added for GDPR compliance

### Current Tracking ID
- **Google Analytics:** `G-D241BR034Y`
- **Property Name:** Silver Fresh / Silver Expostores
- **Type:** GA4 (Google Analytics 4)

---

## Google Analytics Setup

### Installation Status: ✅ COMPLETE

**Location in Code:** `index.html` lines 53-61

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-D241BR034Y"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-D241BR034Y');
</script>
```

### Verify Installation

1. **Go to Google Analytics Dashboard:**
   - URL: https://analytics.google.com
   - Select property: Silver Fresh

2. **Check Real-time Data:**
   - Admin → Property Settings → Verification status
   - Should show: ✅ Connected

3. **View Tracking Code:**
   - Admin → Data Streams → Web
   - Verify Measurement ID: G-D241BR034Y

---

## Tracking Events

### Current Events Implemented

#### 1. **Pre-Order Interest Click**

**Trigger:** User clicks "PRE-ORDER NOW" or "UNLOCK EARLY ACCESS" button

**Code Location:** Line 2429

```javascript
if (typeof gtag !== 'undefined') {
  gtag('event', 'preorder_interest_click', {
    product: 'Silver Butterfly Brooch',
    product_id: 'AM001'
  });
}
```

**GA4 Event Name:** `preorder_interest_click`

**Parameters:**
- `product` - Product name
- `product_id` - SKU/Product ID

**What It Tracks:**
- When user shows interest in pre-order
- How many times form is opened
- User funnel from view → interest → conversion

---

#### 2. **Pre-Order Submission**

**Trigger:** User successfully submits pre-order form

**Code Location:** Line 2571

```javascript
if (typeof gtag !== 'undefined') {
  gtag('event', 'preorder_submission', {
    product: 'Silver Butterfly Brooch',
    product_id: 'AM001',
    email: formData.email
  });
}
```

**GA4 Event Name:** `preorder_submission`

**Parameters:**
- `product` - Product name
- `product_id` - SKU
- `email` - User email

**What It Tracks:**
- Actual conversions (form submissions)
- User demographics
- Email for retargeting
- Conversion rate metrics

---

### Additional Events to Add

#### **Waitlist Join**
```javascript
gtag('event', 'waitlist_joined', {
  value: 6425,  // Discount price in paisa
  currency: 'INR',
  product: 'Silver Butterfly Brooch',
  email: userEmail
});
```

#### **Discount Code Generated**
```javascript
gtag('event', 'discount_code_generated', {
  discount_code: 'LAUNCH-xxxxx-xxxxx',
  discount_percent: 50,
  product: 'Silver Butterfly Brooch'
});
```

#### **Ready to Checkout Clicked**
```javascript
gtag('event', 'checkout_click', {
  product: 'Silver Butterfly Brooch',
  discount_code: code
});
```

---

## Meta Pixel Integration

### Installation Status: ✅ IMPLEMENTED

**Purpose:** Facebook/Instagram audience tracking and retargeting

**What It Does:**
- Tracks user interactions on your site
- Creates custom audiences for retargeting
- Measures Facebook ad ROI
- Builds pixel data for optimization

### Current Implementation

**Code Location:** Line 2435-2437

```javascript
if (typeof fbq !== 'undefined') {
  fbq('trackCustom', 'PreorderInterestClick');
}
```

### How to Add Meta Pixel

1. **Get Pixel ID:**
   - Facebook Business Manager → Events Manager
   - Create/Select pixel
   - Copy Pixel ID (usually 17-18 digits)

2. **Add to Head Section:**
   ```html
   <!-- Meta Pixel Code -->
   <script>
     !function(f,b,e,v,n,t,s)
     {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
     n.callMethod.apply(n,arguments):n.queue.push(arguments)};
     if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
     n.queue=[];t=b.createElement(e);t.async=!0;
     t.src=v;s=b.getElementsByTagName(e)[0];
     s.parentNode.insertBefore(t,s)}(window, document,'script',
     'https://connect.facebook.net/en_US/fbevents.js');
     fbq('init', 'YOUR_PIXEL_ID');
     fbq('track', 'PageView');
   </script>
   <noscript><img height="1" width="1" style="display:none"
     src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
   /></noscript>
   <!-- End Meta Pixel Code -->
   ```

3. **Replace:** `YOUR_PIXEL_ID` with your actual ID

---

## Cookie Consent Banner

### Why It's Needed: ⚠️ GDPR/CCPA Compliance

**Legal Requirement:**
- EU (GDPR) - Explicit consent required
- California (CCPA) - Right to opt-out
- India - Privacy policy disclosure
- Most countries - Transparency about tracking

### Recommended Solution

#### Option 1: **Termly Cookie Banner** (Recommended)

1. **Sign up:** https://termly.io
2. **Features:**
   - Auto-generated cookie policy
   - Consent banner
   - Automatic consent tracking
   - GDPR/CCPA compliant
   - Cookie categorization

3. **Implementation:**
   - Add 1 line of code to head
   - Termly handles everything else
   - Cost: Free-$99/month

#### Option 2: **Simple Custom Banner**

```html
<!-- Cookie Consent Banner -->
<div id="cookieBanner" style="
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1412;
  color: white;
  padding: 1.5rem;
  z-index: 998;
  display: none;
">
  <div style="max-width: 1200px; margin: 0 auto;">
    <p style="margin: 0 0 1rem 0; font-size: 0.95rem;">
      We use cookies to analyze site performance and enhance your experience. 
      By using this site, you consent to our use of cookies.
      <a href="/privacy-policy" style="color: #c9a96e; text-decoration: none;">
        Learn more
      </a>
    </p>
    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
      <button id="cookieAccept" style="
        padding: 0.5rem 1rem;
        background: #c9a96e;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">Accept All</button>
      <button id="cookieReject" style="
        padding: 0.5rem 1rem;
        background: transparent;
        color: white;
        border: 1px solid white;
        border-radius: 4px;
        cursor: pointer;
      ">Reject</button>
    </div>
  </div>
</div>

<script>
// Check if user has already made a choice
if (!localStorage.getItem('cookieConsent')) {
  document.getElementById('cookieBanner').style.display = 'block';
}

// Accept all cookies
document.getElementById('cookieAccept').addEventListener('click', () => {
  localStorage.setItem('cookieConsent', 'accepted');
  document.getElementById('cookieBanner').style.display = 'none';
  // Enable all tracking
  window.dataLayer = window.dataLayer || [];
  gtag('consent', 'update', {
    'analytics_storage': 'granted',
    'ad_storage': 'granted'
  });
});

// Reject non-essential cookies
document.getElementById('cookieReject').addEventListener('click', () => {
  localStorage.setItem('cookieConsent', 'rejected');
  document.getElementById('cookieBanner').style.display = 'none';
  // Disable advertising storage
  gtag('consent', 'update', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied'
  });
});
</script>
```

### Implementation Steps

1. **Add Privacy Policy Page**
   - Create `/privacy-policy` page
   - Document what cookies are used
   - Explain how data is used
   - Link from banner

2. **Update Terms of Service**
   - Add cookie disclosure
   - Explain tracking
   - Get legal review

3. **Add Consent Banner**
   - Use Termly or custom banner
   - Show on first visit
   - Store user preference
   - Respect user choice

---

## Privacy Compliance

### Required Documents

- **Privacy Policy** ✅ Should have
  - What cookies are used
  - How data is collected
  - How data is used
  - User rights
  - Contact info

- **Cookie Policy** ✅ Should have
  - List of cookies
  - Purpose of each
  - Retention period
  - How to manage cookies

- **Terms of Service** ✅ Should have
  - Site usage rules
  - Liability disclaimers
  - Dispute resolution

### GDPR/CCPA Compliance Checklist

- [ ] Privacy Policy created and linked
- [ ] Cookie Policy created
- [ ] Consent banner implemented
- [ ] Explicit consent before analytics
- [ ] Reject option available
- [ ] Consent stored and logged
- [ ] Right to withdraw consent
- [ ] Data processing agreement with vendors
- [ ] 30-day retention policy documented
- [ ] CCPA data deletion process

---

## Analytics Data to Monitor

### Key Metrics

#### **Pre-Order Funnel**
```
Page Views
    ↓
Pre-Order Interest Clicks (preorder_interest_click)
    ↓
Form Opens
    ↓
Form Submissions (preorder_submission)
    ↓
Conversion Rate = Submissions / Interest Clicks
```

#### **Conversion Tracking**

**In Google Analytics:**
1. Go to: Admin → Conversions
2. Create conversion for: `preorder_submission`
3. Track as: Primary conversion
4. View reports: Conversions → Overview

#### **Audience Insights**

**Analyze:**
- Geographic locations
- Device types (mobile vs desktop)
- Traffic sources
- User behavior paths
- Top landing pages
- Exit pages

### Reports to Create

#### **1. Funnel Analysis Report**
```
Metric | Value
-------|-------
Page Views | X
Interest Clicks | Y
Form Submissions | Z
Conversion Rate | Z/Y %
Avg Time to Convert | T minutes
```

#### **2. Traffic Source Report**
```
Source | Sessions | Conversions | Conv Rate
-------|----------|-------------|----------
Direct | X | Y | %
Organic | X | Y | %
Social | X | Y | %
Referral | X | Y | %
```

#### **3. Device Report**
```
Device | Users | Conversions | Conv Rate
-------|-------|-------------|----------
Mobile | X | Y | %
Desktop | X | Y | %
Tablet | X | Y | %
```

---

## Monitoring & Reporting

### Daily Monitoring

**Check Daily:**
1. Real-time active users
2. Form submissions count
3. Technical issues (check for errors)
4. Conversion rate trends

**In Google Analytics:**
- Reports → Real time → Overview
- Watch for spikes or drops

### Weekly Reporting

**Every Monday:**
1. Total conversions last week
2. Conversion rate (vs previous week)
3. Top traffic sources
4. Mobile vs desktop split
5. Geographic breakdown

### Monthly Analysis

**First of each month:**
1. Month-over-month growth
2. Funnel analysis (interest → conversion)
3. Cost per conversion (if running ads)
4. Audience demographics
5. Device performance
6. Traffic quality

### Google Analytics Dashboard Setup

**Create Custom Dashboard:**

1. Go to: Google Analytics → Customization → Dashboards
2. Add cards for:
   - Conversions (preorder_submission)
   - Conversion Rate
   - Traffic by Source
   - Device Category
   - Geographic Location
   - User Engagement

---

## Event Tracking Code Locations

### All gtag Events in Code

| Line | Event | Trigger |
|------|-------|---------|
| 2429 | `preorder_interest_click` | Button click |
| 2571 | `preorder_submission` | Form submission |
| - | `waitlist_joined` | (Recommended to add) |
| - | `discount_code_generated` | (Recommended to add) |
| - | `checkout_click` | (Recommended to add) |

### Meta Pixel Events

| Event | Code Location | Purpose |
|-------|---|---|
| `PreorderInterestClick` | Line 2436 | Track interest |
| `ViewContent` | - | (Recommended to add) |
| `AddToCart` | - | Prepare for checkout |
| `Purchase` | - | Order completion |

---

## Testing Analytics

### Verify Google Analytics

1. **Check Real-Time:**
   - Go to Google Analytics
   - Reports → Real time → Overview
   - Refresh page on site
   - Should see "1 user in the last minute"

2. **Test Events:**
   - Click "PRE-ORDER NOW"
   - Check GA → Events → preorder_interest_click
   - Should appear in real-time

3. **Test Conversions:**
   - Submit form
   - Check GA → Conversions → preorder_submission
   - Should be recorded

### Debug with Browser Tools

**Check in Browser Console:**
```javascript
// Verify gtag is loaded
typeof gtag !== 'undefined' // Should return: true

// Check data layer
window.dataLayer // Should show events

// Manually fire event (for testing)
gtag('event', 'test_event', {
  'test_param': 'test_value'
});
```

### Use Google Analytics Debugger

1. **Install Extension:**
   - Chrome: "Google Analytics Debugger"
   - Open DevTools → Google Analytics tab
   - Refresh page

2. **View:**
   - All pageviews
   - All events fired
   - Parameters sent
   - Debug issues

---

## Troubleshooting

### Analytics Not Tracking

**Problem:** Events not showing in GA

**Solution:**
1. Check tracking ID is correct (G-D241BR034Y)
2. Verify gtag script is in HEAD
3. Check browser console for errors
4. Wait 24 hours for data to process
5. Check GDPR consent settings

### Cookie Banner Not Showing

**Problem:** Banner appears every visit

**Solution:**
1. Check localStorage is working
2. Verify cookie name (cookieConsent)
3. Check expiry date
4. Clear browser cache and retry

### Low Conversion Rate

**Problem:** Few form submissions tracked

**Solution:**
1. Check form is working (test submission)
2. Verify API endpoint is live
3. Check for JavaScript errors
4. Review form field requirements
5. Test on mobile devices

---

## Best Practices

### ✅ DO:
- ✅ Get explicit consent before tracking
- ✅ Provide privacy policy link
- ✅ Make reject button equally visible
- ✅ Document all cookies used
- ✅ Monitor compliance regularly
- ✅ Respect user preferences
- ✅ Use HTTPS for all tracking
- ✅ Test events regularly

### ❌ DON'T:
- ❌ Track without consent (GDPR violation)
- ❌ Hide privacy policy
- ❌ Make reject hard to find
- ❌ Repurpose data without disclosure
- ❌ Retain data longer than needed
- ❌ Share data with unauthorized parties
- ❌ Use dark patterns
- ❌ Ignore user requests

---

## Resources

### Google Analytics
- Setup: https://support.google.com/analytics
- GA4 Guide: https://support.google.com/analytics/answer/10089681
- Events: https://support.google.com/analytics/answer/9322688

### Meta Pixel
- Setup: https://www.facebook.com/business/help/952192354843755
- Events: https://www.facebook.com/business/help/402791146561655

### Privacy/Compliance
- GDPR: https://gdpr.eu/
- CCPA: https://oag.ca.gov/privacy/ccpa
- Cookie Policy: https://www.termly.io/resources/templates/cookie-policy-template/

### Tools
- Termly: https://termly.io
- Cookie Bot: https://www.cookiebot.com
- Consent Tools: https://consentcookie.com

---

## Next Steps

1. **Add Cookie Consent Banner** (Priority: HIGH)
   - Choose Termly or custom implementation
   - Update privacy policy
   - Deploy and test

2. **Create Privacy Policy** (Priority: HIGH)
   - Document all cookies
   - Explain tracking
   - Link from site

3. **Monitor Analytics** (Priority: MEDIUM)
   - Set up custom dashboard
   - Track daily metrics
   - Create weekly reports

4. **Add More Events** (Priority: MEDIUM)
   - Discount code generation
   - Checkout clicks
   - Facebook pixel improvements

5. **Legal Review** (Priority: HIGH)
   - Have lawyer review policies
   - Ensure GDPR compliance
   - Document consent process

---

## Questions?

For implementation help, refer to:
- Google Analytics: https://analytics.google.com (Help)
- Meta Business: https://business.facebook.com (Support)
- Legal: Consult privacy lawyer for compliance

**Current Status Summary:**
- ✅ Google Analytics: Installed and tracking
- ✅ Meta Pixel: Ready to integrate with ID
- ⚠️ Cookie Consent: **NEEDS IMPLEMENTATION**
- ⚠️ Privacy Policy: **NEEDS CREATION**
- ✅ Event Tracking: Basic events implemented
