const { createClient } = require('@supabase/supabase-js');
const { catalogueLimiter } = require('./rate-limit');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const SITE_URL = 'https://silver.expostores.com';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

module.exports = catalogueLimiter(async (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['https://silver.expostores.com', 'http://localhost:3000', 'http://localhost:4321', 'http://localhost:5173', 'http://localhost:5432'];

  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ success: false, error: 'Method not allowed' }); return; }

  if (!resendApiKey) {
    console.error('[send-catalogue] RESEND_API_KEY not configured');
    res.status(500).json({ success: false, error: 'Email service not configured' });
    return;
  }

  try {
    const { email, name } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanName = typeof name === 'string' ? name.trim().slice(0, 100) : '';

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, error: 'Valid email required' });
      return;
    }

    // Each request gets its own token so a click on the emailed link can be
    // traced back to the specific buyer, the same way a manual/website link
    // is tagged by source instead.
    let token = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('catalogue_requests')
        .insert({ email: cleanEmail, name: cleanName || null })
        .select('token')
        .single();
      if (error) console.error('[send-catalogue] insert failed:', error.message);
      else token = data.token;
    }

    const tokenParam = token ? `&token=${token}` : '';
    const artefactsLink = `${SITE_URL}/api/catalogue?file=artefacts&src=email${tokenParam}`;
    const jewelleryLink = `${SITE_URL}/api/catalogue?file=jewellery&src=email${tokenParam}`;
    const greeting = cleanName ? escapeHtml(cleanName) : 'there';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Silver By Expostores <catalogue@mail.expostores.com>',
        reply_to: 'sales@expostores.com',
        to: [cleanEmail],
        subject: 'Your Silver Filigree Catalogues',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1412;">Your Catalogues Are Here</h2>
            <p>Hi ${greeting},</p>
            <p>Thank you for your interest in our handcrafted silver filigree jewellery. Here are your two catalogues:</p>
            <p style="margin: 24px 0;">
              <a href="${artefactsLink}" style="display: inline-block; background: #1a1412; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 4px;">View Silver Filigree Artefacts Catalogue</a>
            </p>
            <p style="margin: 24px 0;">
              <a href="${jewelleryLink}" style="display: inline-block; background: #1a1412; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 4px;">View Silver Filigree Jewellery Catalogue</a>
            </p>
            <p style="color: #666; font-size: 0.9rem;">Questions? Reply to this email or WhatsApp us at +91 82828 16919.</p>
            <p>With gratitude,<br><strong>The Silver By Expostores Team</strong></p>
          </div>
        `
      })
    });

    if (!resendResponse.ok) {
      const errBody = await resendResponse.text();
      console.error('[send-catalogue] Resend error:', resendResponse.status, errBody);
      res.status(502).json({ success: false, error: 'Failed to send email. Please try again.' });
      return;
    }

    if (supabase && token) {
      await supabase.from('catalogue_requests').update({ email_sent_at: new Date().toISOString() }).eq('token', token);
    }

    res.status(200).json({ success: true, message: 'Catalogues sent! Check your inbox.' });
  } catch (error) {
    console.error('[send-catalogue] error:', error.message);
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});
