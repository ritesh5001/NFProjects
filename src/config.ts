// Base URL of the NextGen Fusion website backend (Express API).
// Set EXPO_PUBLIC_API_BASE_URL in a .env / EAS env to the deployed backend URL,
// e.g. https://api.nextgenfusion.in  (NOT the Next.js proxy — the app calls the
// backend directly with a Bearer token). Falls back to localhost for dev.
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000'
).replace(/\/$/, '')
