const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5432;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Mock API endpoints for local testing
// In production, these are Vercel Edge Functions

// Mock generate-discount endpoint
app.post('/api/generate-discount', (req, res) => {
  const { fullName, email, phone, city, heardFrom } = req.body;

  // Basic validation
  if (!fullName || !email || !phone) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: fullName, email, phone'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }

  // Generate mock discount code
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7).toUpperCase();
  const discountCode = `LAUNCH-${timestamp}-${random}`;

  // Calculate expiry date (7 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  const expiryDateString = expiryDate.toISOString().split('T')[0];

  console.log(`[Local Testing] Reservation received:`, {
    fullName,
    email,
    phone,
    city,
    heardFrom,
    discountCode,
    expiryDate: expiryDateString
  });

  // Log email sending (in production, this is done via Brevo API)
  console.log(`\n📧 [EMAIL] Would send to: ${email}`);
  console.log(`   Subject: 🦋 Your Butterfly Brooch Discount Code - 50% OFF`);
  console.log(`   Body: Discount Code: ${discountCode}`);
  console.log(`   Original Price: ₹12,850 | Your Price: ₹6,425 (50% off)`);
  console.log(`   Valid Until: ${expiryDate.toDateString()}\n`);

  res.status(200).json({
    success: true,
    discountCode: discountCode,
    discountedPrice: 6425,
    expiryDate: expiryDateString
  });
});

// Mock preorder endpoint
app.post('/api/preorder', (req, res) => {
  const { fullName, email, phone, city, heardFrom } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9\s\-\+\(\)]{7,}$/;

  // Validation
  const errors = [];
  if (!fullName || fullName.trim().length < 2) errors.push('Full name required');
  if (!email || !emailRegex.test(email)) errors.push('Valid email required');
  if (!phone || !phoneRegex.test(phone)) errors.push('Valid phone required');
  if (!city || city.trim().length === 0) errors.push('City required');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  console.log(`[Local Testing] Preorder received:`, {
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    city: city.trim(),
    heardFrom
  });

  res.status(201).json({
    success: true,
    message: '🦋 Reservation Confirmed! Check your email for details.',
    email: email.trim().toLowerCase()
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Silver-Fresh Development Server running on http://localhost:${PORT}`);
  console.log(`\n📍 Pages:`);
  console.log(`   • Main site: http://localhost:${PORT}/index.html`);
  console.log(`   • Butterfly Brooch: http://localhost:${PORT}/butterfly-brooch.html`);
  console.log(`\n🔌 API Endpoints (Local Mock):`);
  console.log(`   • POST /api/generate-discount`);
  console.log(`   • POST /api/preorder`);
  console.log(`\n⚠️  Note: This uses mock APIs for local testing. Production uses Vercel Edge Functions.\n`);
});
