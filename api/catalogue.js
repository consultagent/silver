const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Every catalogue link buyers/sales ever hand out points here first, so every
// open gets logged before redirecting to the actual PDF.
const CATALOGUES = {
  artefacts: '/jewellery/catalogue/silver-filigree-artefacts-catalogue.pdf',
  jewellery: '/jewellery/catalogue/silver-filigree-jewellery-catalogue.pdf'
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sourceRegex = /^[a-zA-Z0-9_-]{1,40}$/;

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const file = typeof req.query.file === 'string' ? req.query.file : '';
  const target = CATALOGUES[file];

  if (!target) {
    res.status(404).send('Catalogue not found');
    return;
  }

  const rawSource = typeof req.query.src === 'string' ? req.query.src : 'unknown';
  const source = sourceRegex.test(rawSource) ? rawSource : 'unknown';
  const rawToken = typeof req.query.token === 'string' ? req.query.token : '';
  const token = uuidRegex.test(rawToken) ? rawToken : null;

  if (supabase) {
    try {
      const { error } = await supabase.from('catalogue_events').insert({
        file,
        source,
        token,
        ip_address: req.headers['x-forwarded-for'] || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
        referrer: req.headers['referer'] || null
      });
      if (error) console.error('[catalogue] event log failed:', error.message);
    } catch (error) {
      console.error('[catalogue] event log failed:', error.message);
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: target });
  res.end();
};
