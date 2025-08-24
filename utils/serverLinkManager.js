// Vercel-compatible in-memory storage with global persistence
// Using global variables that persist across serverless function calls

// Initialize global storage if it doesn't exist
if (!global.linkStorage) {
  global.linkStorage = {
    linkMap: {},
    reverseMap: {},
    lastCleanup: Date.now()
  };
}

// Load links from global storage
function loadLinks() {
  // Auto cleanup on load if it's been more than 1 hour since last cleanup
  const now = Date.now();
  if (now - global.linkStorage.lastCleanup > 60 * 60 * 1000) { // 1 hour
    cleanupOldEntries();
    global.linkStorage.lastCleanup = now;
  }
  
  return {
    linkMap: global.linkStorage.linkMap,
    reverseMap: global.linkStorage.reverseMap
  };
}

// Save links to global storage
function saveLinks(linkMap, reverseMap) {
  global.linkStorage.linkMap = linkMap;
  global.linkStorage.reverseMap = reverseMap;
}

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
  const { linkMap, reverseMap } = loadLinks();
  
  // Check if we already have a short code for this hash
  if (reverseMap[fullHash]) {
    return reverseMap[fullHash];
  }
  
  let shortCode;
  do {
    shortCode = generateShortCode();
  } while (linkMap[shortCode]);
  
  linkMap[shortCode] = { hash: fullHash, type, createdAt: Date.now() };
  reverseMap[fullHash] = shortCode;
  
  saveLinks(linkMap, reverseMap);
  return shortCode;
}

// Get full hash from short code
export function getFullHash(shortCode) {
  const { linkMap } = loadLinks();
  const data = linkMap[shortCode];
  
  // Check if link exists and hasn't expired (24 hours)
  if (data) {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - data.createdAt < maxAge) {
      return data;
    } else {
      // Link expired, clean it up
      cleanupExpiredLink(shortCode);
    }
  }
  
  return null;
}

// Clean up a specific expired link
function cleanupExpiredLink(shortCode) {
  const { linkMap, reverseMap } = loadLinks();
  const data = linkMap[shortCode];
  
  if (data) {
    delete linkMap[shortCode];
    delete reverseMap[data.hash];
    saveLinks(linkMap, reverseMap);
  }
}

// Clean up old entries (optional - for memory management)
export function cleanupOldEntries(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
  const { linkMap, reverseMap } = loadLinks();
  const now = Date.now();
  let hasChanges = false;
  
  for (const [shortCode, data] of Object.entries(linkMap)) {
    if (now - data.createdAt > maxAge) {
      delete linkMap[shortCode];
      delete reverseMap[data.hash];
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    saveLinks(linkMap, reverseMap);
  }
}
