// Simple in-memory storage for short links
const linkMap = new Map();
const reverseMap = new Map();

// Generate a random 4-5 character string
function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a short link for a hash
export function createShortLink(fullHash, type = 'file') {
  // Check if we already have a short code for this hash
  if (reverseMap.has(fullHash)) {
    return reverseMap.get(fullHash);
  }
  
  let shortCode;
  do {
    shortCode = generateShortCode();
  } while (linkMap.has(shortCode));
  
  linkMap.set(shortCode, { hash: fullHash, type, createdAt: Date.now() });
  reverseMap.set(fullHash, shortCode);
  
  return shortCode;
}

// Get full hash from short code
export function getFullHash(shortCode) {
  const data = linkMap.get(shortCode);
  return data ? data : null;
}

// Clean up old entries (optional - for memory management)
export function cleanupOldEntries(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
  const now = Date.now();
  for (const [shortCode, data] of linkMap.entries()) {
    if (now - data.createdAt > maxAge) {
      linkMap.delete(shortCode);
      reverseMap.delete(data.hash);
    }
  }
}
