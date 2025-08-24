import fs from 'fs';
import path from 'path';

// File-based persistent storage for short links
const STORAGE_FILE = path.join(process.cwd(), 'data', 'links.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load links from file
function loadLinks() {
  try {
    ensureDataDir();
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading links:', error);
  }
  return { linkMap: {}, reverseMap: {} };
}

// Save links to file
function saveLinks(linkMap, reverseMap) {
  try {
    ensureDataDir();
    const data = { linkMap, reverseMap };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving links:', error);
  }
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
