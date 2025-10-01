// frontend/src/config.js
// Central API base used by frontend. Works locally and in production (Vercel).
// Use REACT_APP_API_BASE env var to override in production.
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
export default API_BASE;
