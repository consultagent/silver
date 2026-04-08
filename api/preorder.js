const { preorderLimiter } = require('./rate-limit');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9\s\-\+\(\)]{7,}$/;

function validateInput(data) {
  const errors = [];
  if (!data.fullName || data.fullName.trim().length < 2) errors.push('Full name required');
  if (!data.email || !emailRegex.test(data.email)) errors.push('Valid email required');
  if (!data.phone || !phoneRegex.test(data.phone)) errors.push('Valid phone required');
  if (!data.city || data.city.trim().length === 0) errors.push('City required');
  return { valid: errors.length === 0, errors };
}

async function createBrevoContact(contactData) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not configured');

  const payload = {
    email: contactData.email,
    attributes: {
      FIRSTNAME: contactData.fullName.split(' ')[0],
      LASTNAME: contactData.fullName.split(' ').slice(1).join(' ') || '',
      SMS: contactData.phone,
      CITY: contactData.city,
      HEARD_FROM: contactData.heardFrom || 'Not specified',
      PRODUCT_INTEREST: 'Butterfly Brooch AM001',
      SIGNUP_DATE: new Date().toISOString(),
      DISCOUNT_ELIGIBLE: '50%'
    },
    listIds: [2],
    updateEnabled: true
  };

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok && response.status !== 201 && response.status !== 204) {
    throw new Error(`Brevo failed: ${response.status}`);
  }
}

async function sendWelcomeEmail(contactData) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const emailPayload = {
    sender: { name: 'Silver By Expostores', email: 'sales@expostores.com' },
    to: [{ email: contactData.email, name: contactData.fullName }],
    subject: '🦋 Your Butterfly Brooch is Reserved - 50% OFF Confirmed!',
    htmlContent: `<html><body><h1>🦋 Reservation Confirmed!</h1><p>Dear ${contactData.fullName},</p><p>Your Butterfly Brooch is reserved at ₹6,425 (50% OFF)!</p><p>Our team will WhatsApp you within 24 hours.</p></body></html>`
  };

  fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify(emailPayload)
  }).catch(() => {});
}

module.exports = preorderLimiter(async (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://silver.expostores.com', 'http://localhost:3000', 'http://localhost:4321', 'http://localhost:5173', 'http://localhost:5432'];
  
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ success: false, message: 'Method not allowed' }); return; }

  try {
    const { fullName, email, phone, city, heardFrom } = req.body;
    const validation = validateInput({ fullName, email, phone, city });
    
    if (!validation.valid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const contactData = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city: city.trim(),
      heardFrom: heardFrom || 'Not specified'
    };

    await createBrevoContact(contactData);
    sendWelcomeEmail(contactData).catch(() => {});

    res.status(201).json({
      success: true,
      message: '🦋 Reservation Confirmed! Check your email for details.',
      email: contactData.email
    });
  } catch (error) {
    console.error('[Preorder Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Reservation failed. Try again or WhatsApp: +91 82828 16919'
    });
  }
});
