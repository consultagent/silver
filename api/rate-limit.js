const rateLimit = require('express-rate-limit');

// Rate limit: 5 requests per 5 minutes per IP
const preorderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many preorder requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1'
});

module.exports = { preorderLimiter };
