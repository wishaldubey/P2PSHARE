import { createShortLink } from '../../utils/linkManager';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { hash, type = 'file' } = req.body;
  
  if (!hash) {
    return res.status(400).json({ message: 'Hash is required' });
  }

  try {
    const shortCode = createShortLink(hash, type);
    res.status(200).json({ shortCode });
  } catch (error) {
    console.error('Error creating short link:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
