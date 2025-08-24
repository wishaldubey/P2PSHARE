import { createShortLink } from '../../utils/serverLinkManager';
import fs from 'fs';
import path from 'path';

// File-based persistent storage for text shares
const TEXT_STORAGE_FILE = path.join(process.cwd(), 'data', 'texts.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(TEXT_STORAGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load texts from file
function loadTexts() {
  try {
    ensureDataDir();
    if (fs.existsSync(TEXT_STORAGE_FILE)) {
      const data = fs.readFileSync(TEXT_STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading texts:', error);
  }
  return {};
}

// Save texts to file
function saveTexts(textShares) {
  try {
    ensureDataDir();
    fs.writeFileSync(TEXT_STORAGE_FILE, JSON.stringify(textShares, null, 2));
  } catch (error) {
    console.error('Error saving texts:', error);
  }
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
