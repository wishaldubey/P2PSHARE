import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function Receive() {
  const [fileUrl, setFileUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0); // Progress state
  const [torrent, setTorrent] = useState(null); // Store torrent object
  const [speed, setSpeed] = useState(0); // Speed in KB/sec
  const [fileName, setFileName] = useState(null); // Filename
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const clientRef = useRef(null);
  const router = useRouter();
  const { hash } = router.query;

  // Initialize WebTorrent client
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
          initiateTorrentDownload(); // Start torrent download after script load
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

  // Function to initiate torrent download
  const initiateTorrentDownload = () => {
    if (hash && clientRef.current) {
      const client = clientRef.current;
      const newTorrent = client.add(hash, {
        announce: [
          'wss://tracker.openwebtorrent.com',
          'wss://tracker.btorrent.xyz',
          'wss://tracker.fastcast.nz',
          'wss://tracker.webtorrent.io',
          'wss://tracker.sloppyta.co',
          'wss://tracker.novage.com.ua'
        ]
      });

      setTorrent(newTorrent);
      setDownloading(true);
      setConnectionStatus('Connecting to peers...');

      // When torrent metadata is ready, show the file name
      newTorrent.on('metadata', () => {
        setFileName(newTorrent.files[0].name);
        setConnectionStatus('Connected');
      });

      // Listen for progress updates
      newTorrent.on('download', () => {
        const total = newTorrent.length;
        const downloaded = newTorrent.downloaded;
        const progressPercentage = (downloaded / total) * 100;
        setProgress(progressPercentage);

        // Get download speed in KB/s
        setSpeed(newTorrent.downloadSpeed / 1024);
      });

      // Get the file URL once the download is complete
      newTorrent.on('done', () => {
        const file = newTorrent.files[0]; // Access the first file
        file.getBlobURL((err, url) => {
          if (err) {
            console.error('Error getting blob URL:', err);
            setDownloading(false);
            return;
          }
          setFileUrl(url);
          setDownloading(false);
        });
      });
    } else {
      console.error('No hash or client available.');
    }
  };

  // Retry connecting after WebTorrent client is loaded
  useEffect(() => {
    if (clientRef.current && hash) {
      initiateTorrentDownload();
    }
  }, [clientRef.current, hash]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-4xl font-bold mb-4">Receiving File</h1>
      {fileName && <p className="text-lg mb-4">File: {fileName}</p>}
      {connectionStatus && <p className="text-lg mb-4">{connectionStatus}</p>}

      {downloading && (
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

      {fileUrl && torrent && (
        <div className="mt-4 text-center">
          <p className="text-lg mb-2">Download complete! Click the link below:</p>
          <a
            href={fileUrl}
            download={torrent.files[0].name} // Use the torrent state to set the filename
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 break-all"
          >
            Download {torrent.files[0].name} {/* Display the original filename */}
          </a>
        </div>
      )}
    </div>
  );
}
