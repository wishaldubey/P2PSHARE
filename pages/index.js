import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [file, setFile] = useState(null);
  const [fileLink, setFileLink] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const clientRef = useRef(null);

  useEffect(() => {
    const loadWebTorrent = () => {
      if (window.WebTorrent) {
        clientRef.current = new window.WebTorrent();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js';
        script.async = true;
        script.onload = () => {
          clientRef.current = new window.WebTorrent();
        };
        document.body.appendChild(script);
      }
    };

    loadWebTorrent();

    return () => {
      if (clientRef.current) {
        clientRef.current.destroy();
      }
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      createTorrent(selectedFile);
    }
  };

  const createTorrent = (file) => {
    const client = clientRef.current;
    if (!client) return;

    const uniqueHash = uuidv4(); // Unique hash for file sharing
    setSeeding(true);

    client.seed(file, { announce: [
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.btorrent.xyz',
      'wss://tracker.fastcast.nz',
      'wss://tracker.webtorrent.io',
      'wss://tracker.sloppyta.co',
      'wss://tracker.novage.com.ua'
    ]}, (torrent) => {
      const link = `${window.location.origin}/receive/${torrent.infoHash}`;
      setFileLink(link);

      torrent.on('upload', () => {
        const total = torrent.length;
        const uploaded = torrent.uploaded;
        const progressPercentage = (uploaded / total) * 100;
        setProgress(progressPercentage);
        setSpeed(torrent.uploadSpeed / 1024); // Speed in KB/s
      });

      torrent.on('done', () => {
        setSeeding(false);
      });
    });
  };

  // Function to copy link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(fileLink);
    alert("Link copied to clipboard!");
  };

  const handleCloseConnection = () => {
    if (clientRef.current) {
      clientRef.current.destroy(); // Close WebTorrent connection
      window.location.reload(); // Refresh the page
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">P2P File Share</h1>
      <input
        type="file"
        onChange={handleFileChange}
        className="mb-4"
      />

      {fileLink && (
        <div className="flex flex-col items-center">
          <p className="text-lg mb-4">Share this link to receive the file:</p>
          <div className="break-all bg-gray-800 p-2 rounded-md">
            <a
              href={fileLink}
              target="_blank"
              className="text-blue-400 hover:underline"
            >
              {fileLink}
            </a>
          </div>
          <button
            onClick={copyToClipboard}
            className="bg-green-500 text-white px-4 py-2 mt-4 rounded-md hover:bg-green-600"
          >
            Copy Link
          </button>
        </div>
      )}

      {seeding && (
        <div className="flex flex-col items-center mt-4">
          <p className="text-lg">Seeding file, please wait...</p>
          <div className="w-2/3 h-4 bg-gray-300 rounded-full mt-4">
            <div
              className="bg-green-500 h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center">{progress.toFixed(2)}% uploaded</p>
          <p className="mt-2 text-center">Speed: {speed.toFixed(2)} KB/s</p>
        </div>
      )}

      {fileLink && !seeding && (
        <button
          onClick={handleCloseConnection}
          className="bg-red-500 text-white px-4 py-2 mt-4 rounded-md hover:bg-red-600"
        >
          Close Connection
        </button>
      )}
    </div>
  );
}
