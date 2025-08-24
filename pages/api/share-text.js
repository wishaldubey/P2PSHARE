import { createShortLink } from '../../utils/linkManager';

// Simple in-memory storage for text shares
const textShares = new Map();

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    try {
      // Create a unique ID for the text
      const textId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Store the text
      textShares.set(textId, { text, createdAt: Date.now() });
      
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

    const textData = textShares.get(id);
    if (!textData) {
      return res.status(404).json({ message: 'Text not found' });
    }

    res.status(200).json({ text: textData.text });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
