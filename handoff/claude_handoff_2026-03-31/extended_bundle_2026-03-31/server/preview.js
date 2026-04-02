const express = require('express');
const path = require('path');
const apiApp = require('./index');

const app = express();
const PORT = Number(process.env.PREVIEW_PORT || 3001);
const buildDir = path.join(process.cwd(), 'build');
const ENABLE_PREVIEW_SECURITY_HEADERS =
  String(process.env.ENABLE_PREVIEW_SECURITY_HEADERS || 'true').toLowerCase() !== 'false';

app.disable('x-powered-by');

if (ENABLE_PREVIEW_SECURITY_HEADERS) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.secure || String(req.headers['x-forwarded-proto']).includes('https')) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
  });
}

// Route only /api traffic into backend app to avoid API CSP headers on static assets.
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return apiApp(req, res, next);
  }
  return next();
});

app.use(express.static(buildDir));
app.use((_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Preview server ready: http://localhost:${PORT}`);
});