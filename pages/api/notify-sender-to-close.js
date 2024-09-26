// pages/api/notify-sender-to-close.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    const { hash } = req.body;

    // Here you would implement logic to notify the sender, such as sending a WebSocket message.
    // For demonstration, we can assume the sender is informed through any suitable method.

    res.status(200).json({ message: 'Sender notified to close connection.' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
