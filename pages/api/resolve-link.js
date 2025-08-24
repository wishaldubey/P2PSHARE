import { getFullHash } from '../../utils/serverLinkManager';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ message: 'Short code is required' });
  }

  try {
    const linkData = getFullHash(code);
    
    if (!linkData) {
      return res.status(404).json({ message: 'Link not found or expired' });
    }

    res.status(200).json(linkData);
  } catch (error) {
    console.error('Error resolving link:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
