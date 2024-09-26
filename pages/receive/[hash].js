import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function Receive() {
  const [fileUrl, setFileUrl] = useState(null);
  const [downloading, setDownloading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fileName, setFileName] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [connectionClosed, setConnectionClosed] = useState(false);
  const clientRef = useRef(null);
  const router = useRouter();
  const { hash } = router.query;

  useEffect(() => {
    const loadWebTorrent = () => {
      if (window.WebTorrent) {
        clientRef.current = new window.WebTorrent();
        initiateTorrentDownload();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js';
        script.async = true;
        script.onload = () => {
          clientRef.current = new window.WebTorrent();
          initiateTorrentDownload();
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
  }, [hash]);

  const initiateTorrentDownload = () => {
    if (!hash || !clientRef.current) return;

    const client = clientRef.current;
    const torrent = client.add(hash, {
      announce: [
        'wss://tracker.openwebtorrent.com',
        'wss://tracker.btorrent.xyz',
        'wss://tracker.fastcast.nz',
        'wss://tracker.webtorrent.io',
        'wss://tracker.sloppyta.co',
        'wss://tracker.novage.com.ua',
      ]
    });

    setConnectionStatus('Connecting to peers...');

    torrent.on('metadata', () => {
      setFileName(torrent.files[0].name);
      setConnectionStatus(null);
    });

    torrent.on('download', (bytes) => {
      const total = torrent.length;
      const downloaded = torrent.downloaded;
      const progressPercentage = (downloaded / total) * 100;
      setProgress(progressPercentage);
      setSpeed(torrent.downloadSpeed / 1024);
      setDownloading(true);
    });

    torrent.on('done', () => {
      const file = torrent.files[0];
      file.getBlobURL((err, url) => {
        if (err) {
          console.error('Error getting blob URL:', err);
          setDownloading(false);
          return;
        }
        setFileUrl(url);
        setDownloading(false); // Set downloading to false once done
      });
    });

    torrent.on('error', (err) => {
      console.error('Torrent error:', err);
      setConnectionStatus('Failed to connect. Please try again.');
    });
  };

  const handleCloseConnection = () => {
    if (clientRef.current) {
      clientRef.current.destroy(); // Close the WebTorrent client
      setConnectionClosed(true);
      fetch(`/api/close-torrent?hash=${hash}`, { method: 'POST' }); // Notify the server to close sender connection
      setTimeout(() => {
        router.push('/'); // Redirect to home page after a delay to ensure closure
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Receiving File</h1>

      {fileName && (
        <p className="text-lg mb-4">
          File: {fileName.length > 15 ? `${fileName.slice(0, 15)}...` : fileName}
        </p>
      )}

      {connectionStatus && !connectionClosed && (
        <p className="text-lg mb-4">{connectionStatus}</p>
      )}

      {downloading && !fileUrl && !connectionClosed && (
        <>
          <p className="text-lg">Downloading file, please wait...</p>
          <div className="w-2/3 h-4 bg-gray-300 rounded-full mt-4">
            <div
              className="bg-blue-500 h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center">{progress.toFixed(2)}% downloaded</p>
          <p className="mt-2 text-center">Speed: {speed.toFixed(2)} KB/s</p>
        </>
      )}

      {fileUrl && !connectionClosed && (
        <a
          href={fileUrl}
          download={fileName}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-4"
        >
          Download {fileName.length > 15 ? `${fileName.slice(0, 15)}...` : fileName}
        </a>
      )}

      {/* Ensure the Close Connection button is visible when not downloading and fileUrl is available */}
      {fileUrl && !downloading && !connectionClosed && (
        <button
          onClick={handleCloseConnection}
          className="bg-red-500 text-white px-4 py-2 mt-4 rounded-md hover:bg-red-600"
        >
          Close Connection
        </button>
      )}

      {connectionClosed && (
        <p className="mt-4 text-center text-red-400">Connection closed. Redirecting...</p>
      )}
    </div>
  );
          }
