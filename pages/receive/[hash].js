import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function Receive() {
  const [fileUrl, setFileUrl] = useState(null);
  const [downloading, setDownloading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fileName, setFileName] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
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
        'wss://tracker.novage.com.ua'
      ]
    });

    torrent.on('metadata', () => {
      setFileName(torrent.files[0].name);
      setConnectionStatus(null);
    });

    torrent.on('download', () => {
      const total = torrent.length;
      const downloaded = torrent.downloaded;
      setProgress((downloaded / total) * 100);
      setSpeed(torrent.downloadSpeed / 1024); // Speed in KB/s
      setDownloading(true);
    });

    torrent.on('done', () => {
      const file = torrent.files[0];
      file.getBlobURL((err, url) => {
        if (err) {
          setDownloading(false);
          return;
        }
        setFileUrl(url);
        setDownloading(false);
      });
    });

    torrent.on('error', () => {
      setConnectionStatus('Failed to connect. Please try again.');
    });
  };

  const handleCloseConnection = () => {
    if (clientRef.current) {
      clientRef.current.destroy();
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Receiving File</h1>
      {fileName && (
        <p className="text-lg mb-4">
          File: {fileName.length > 20 ? `${fileName.slice(0, 20)}...` : fileName}
        </p>
      )}
      {connectionStatus && <p className="text-lg mb-4">{connectionStatus}</p>}
      {downloading && !fileUrl && (
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
      {fileUrl && (
        <a
          href={fileUrl}
          download={fileName}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-4"
        >
          Download {fileName.length > 20 ? `${fileName.slice(0, 20)}...` : fileName}
        </a>
      )}
      {fileUrl && (
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
