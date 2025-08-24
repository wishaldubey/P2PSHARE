import { createShortLink } from '../../utils/serverLinkManager';

// Vercel-compatible in-memory storage for text shares
// Initialize global storage if it doesn't exist
if (!global.textStorage) {
  global.textStorage = {
    textShares: {},
    lastCleanup: Date.now()
  };
}

// Load texts from global storage
function loadTexts() {
  // Auto cleanup on load if it's been more than 1 hour since last cleanup
  const now = Date.now();
  if (now - global.textStorage.lastCleanup > 60 * 60 * 1000) { // 1 hour
    cleanupOldTexts();
    global.textStorage.lastCleanup = now;
  }
  
  return global.textStorage.textShares;
}

// Save texts to global storage
function saveTexts(textShares) {
  global.textStorage.textShares = textShares;
}

// Clean up old texts
function cleanupOldTexts() {
  const textShares = global.textStorage.textShares;
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [id, data] of Object.entries(textShares)) {
    if (now - data.createdAt > maxAge) {
      delete textShares[id];
    }
  }
  
  global.textStorage.textShares = textShares;
}

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    try {
      // Create a unique ID for the text
      const textId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Load existing texts and add new one
      const textShares = loadTexts();
      textShares[textId] = { text, createdAt: Date.now() };
      
      // Save to file
      saveTexts(textShares);
      
      // Create short link
      const shortCode = createShortLink(textId, 'text');
      
      res.status(200).json({ shortCode, textId });
    } catch (error) {
      console.error('Error sharing text:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Text ID is required' });
    }

    try {
      const textShares = loadTexts();
      const textData = textShares[id];
      
      if (!textData) {
        return res.status(404).json({ message: 'Text not found' });
      }

      // Check if text hasn't expired (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - textData.createdAt > maxAge) {
        // Text expired, clean it up
        delete textShares[id];
        saveTexts(textShares);
        return res.status(404).json({ message: 'Text expired' });
      }

      res.status(200).json({ text: textData.text });
    } catch (error) {
      console.error('Error retrieving text:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
