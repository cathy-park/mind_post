const crypto = require('crypto');
const header = { alg: "HS256", typ: "JWT" };
const payload = {
  role: "authenticated",
  sub: "123e4567-e89b-12d3-a456-426614174000",
  iss: "supabase",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

const headerB64 = base64url(JSON.stringify(header));
const payloadB64 = base64url(JSON.stringify(payload));
// We need the JWT secret to sign it, but we don't have the secret!
// Supabase JWT secret is not in the environment variables.
