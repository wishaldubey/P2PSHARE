import { useState, useRef } from 'react';
import WebTorrent from 'webtorrent';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [torrentId, setTorrentId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fileName, setFileName] = useState('');
  const clientRef = useRef(null);
  const inputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const client = new WebTorrent();
    clientRef.current = client;

    const torrent = client.seed(file, (torrent) => {
      setTorrentId(torrent.magnetURI);
    });

    torrent.on('upload', () => {
      const uploaded = torrent.uploaded;
      const total = torrent.length;
      setProgress((uploaded / total) * 100);
      setSpeed(torrent.uploadSpeed / 1024); // Speed in KB/s
      setFileName(torrent.files[0].name);
    });

    torrent.on('done', () => {
      console.log('File sharing done!');
    });
  };

  const copyToClipboard = () => {
    if (!torrentId) return;
    navigator.clipboard.writeText(`${window.location.href}receive/${torrentId}`);
    // Inform user that the link was copied, without using an alert
    const infoBox = document.getElementById('copy-info');
    infoBox.classList.remove('hidden');
    setTimeout(() => {
      infoBox.classList.add('hidden');
    }, 2000);
  };

  const handleCloseConnection = () => {
    if (clientRef.current) {
      clientRef.current.destroy();
      window.location.reload(); // Redirect back to the index page
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">P2P File Sharing</h1>
      <input type="file" ref={inputRef} onChange={handleFileSelect} className="mb-4" />
      {torrentId && (
        <>
          <div className="mb-2">
            <span className="bg-gray-700 px-4 py-2 rounded">
              {fileName.length > 20 ? `${fileName.slice(0, 20)}...` : fileName}
            </span>
          </div>
          <div className="w-2/3 h-4 bg-gray-300 rounded-full mt-2 mb-4">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-center mb-4">{progress.toFixed(2)}% uploaded</p>
          <p className="text-center mb-4">Speed: {speed.toFixed(2)} KB/s</p>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            onClick={copyToClipboard}
          >
            Copy Link
          </button>
          <div id="copy-info" className="hidden text-green-500 mt-2">
            Link copied to clipboard!
          </div>
          <button
            className="bg-red-500 text-white px-4 py-2 mt-4 rounded-md hover:bg-red-600"
            onClick={handleCloseConnection}
          >
            Close Connection
          </button>
        </>
      )}
    </div>
  );
}
