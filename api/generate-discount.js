import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const brevoApiKey = process.env.BREVO_API_KEY;

// Validate required environment variables at startup
if (!supabaseUrl || !supabaseKey || !brevoApiKey) {
  console.error('[STARTUP] Missing environment variables:', {
    SUPABASE_URL: !!supabaseUrl,
    SUPABASE_ANON_KEY: !!supabaseKey,
    BREVO_API_KEY: !!brevoApiKey
  });
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, BREVO_API_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Utility function to escape HTML and prevent XSS vulnerabilities
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export default async function handler(req, res) {
  // Handle CORS
  const origin = req.headers.origin;
  const allowedOrigins = ['https://silver.expostores.com', 'http://localhost:3000', 'http://localhost:4321', 'http://localhost:5173', 'http://localhost:5432'];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fullName, email, phone, city, heardFrom } = req.body;

  try {
    // Step 1: Validate required fields
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

    // Step 2: Check for duplicate email
    const { data: existing, error: checkError } = await supabase
      .from('reservations')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Email already has an active discount code'
      });
    }

    // Step 3: Generate unique discount code
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7).toUpperCase();
    const discountCode = `LAUNCH-${timestamp}-${random}`;

    // Step 4: Calculate expiry date (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    const expiryDateString = expiryDate.toISOString().split('T')[0];

    // Step 5: Insert into Supabase
    const { data: record, error: dbError } = await supabase
      .from('reservations')
      .insert({
        full_name: fullName,
        email: email,
        phone: phone,
        city: city || null,
        discount_code: discountCode,
        expiry_date: expiryDateString,
        source: 'silver',
        ip_address: req.headers['x-forwarded-for'] || req.ip || 'unknown'
      })
      .select()
      .single();

    if (dbError) {
      console.error(`[${req.headers['x-request-id'] || 'unknown'}] Supabase insert failed:`, dbError.code);
      throw dbError;
    }

    // Step 6: Send Brevo email
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'Silver By Expostores',
          email: 'orders@silverbyexpostores.com'
        },
        to: [
          {
            email: email,
            name: escapeHtml(fullName)
          }
        ],
        subject: '🦋 Your Butterfly Brooch Discount Code - 50% OFF',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1412;">Reservation Confirmed! 🦋</h2>

            <p>Dear ${escapeHtml(fullName)},</p>

            <p>Thank you for reserving the Butterfly Brooch! Your exclusive 50% discount code is ready:</p>

            <div style="background: #f0e6d3; padding: 2rem; border-radius: 8px; text-align: center; margin: 2rem 0;">
              <p style="color: #666; font-size: 0.9rem; margin: 0 0 0.5rem 0;">YOUR DISCOUNT CODE</p>
              <p style="font-size: 1.8rem; font-weight: bold; letter-spacing: 2px; color: #1a1412; margin: 0; font-family: 'Courier New', monospace;">
                ${discountCode}
              </p>
            </div>

            <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 4px; margin: 1.5rem 0;">
              <p><strong>Original Price:</strong> ₹5,850</p>
              <p><strong>Your Price:</strong> <span style="color: #2d7a4f; font-weight: bold;">₹2,925 (50% off)</span></p>
              <p><strong>Valid Until:</strong> ${expiryDate.toDateString()}</p>
            </div>

            <p>Use this code at checkout on our main site to claim your 50% discount.</p>

            <p style="color: #666; font-size: 0.9rem;">
              Questions? Reply to this email or WhatsApp us at +91 82828 16919
            </p>

            <p>With gratitude,<br><strong>The Silver By Expostores Team</strong></p>
          </div>
        `
      })
    });

    if (!brevoResponse.ok) {
      const brevoError = await brevoResponse.json();
      console.error(`[${req.headers['x-request-id'] || 'unknown'}] Brevo API error:`, brevoError.code);
      console.warn('Email send failed but code was created');
    }

    // Step 7: Update email_sent_at timestamp
    if (brevoResponse.ok) {
      await supabase
        .from('reservations')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', record.id);
    }

    // Step 8: Return success response
    return res.status(200).json({
      success: true,
      discountCode: discountCode,
      discountedPrice: 6425,
      expiryDate: expiryDateString
    });

  } catch (error) {
    console.error(`[${req.headers['x-request-id'] || 'unknown'}] generate-discount error:`, {
      message: error.message,
      code: error.code,
      details: error.details
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error. Please try again later.'
    });
  }
}
