import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function Receive() {
  const [fileUrl, setFileUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [fileName, setFileName] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [connectionClosed, setConnectionClosed] = useState(false);
  const clientRef = useRef(null);
  const router = useRouter();
  const { hash } = router.query;

  // Replace this with the path to your GIF or the URL
  const amongUsGif = '/images/among-us.gif'; // Replace with your GIF path

  useEffect(() => {
    if (!hash) return;

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
      // No need to destroy the client here.
    };
  }, [hash]);

  const initiateTorrentDownload = () => {
    if (!hash || !clientRef.current) return;

    const client = clientRef.current;
    const torrent = client.add(hash, {
      announce: [
        'wss://tracker.openwebtorrent.com',
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
        setDownloading(false);
      });
    });

    torrent.on('error', (err) => {
      console.error('Torrent error:', err);
      setConnectionStatus('Failed to connect. Please try again.');
    });
  };

  const handleCloseConnection = async () => {
    try {
      await fetch('/api/notify-sender-to-close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash }),
      });
      router.push('https://vishare.vercel.app');
    } catch (error) {
      console.error('Error notifying sender:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-6xl font-black text-white mb-2 sm:mb-4 transform -rotate-2 bg-black px-4 sm:px-8 py-2 sm:py-4 border-4 border-white shadow-[6px_6px_0px_0px_#fff] sm:shadow-[12px_12px_0px_0px_#fff] inline-block">
            P2P SHARE
          </h1>
          <p className="text-lg sm:text-2xl font-bold text-white bg-yellow-400 text-black px-3 sm:px-6 py-1 sm:py-2 border-4 border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] inline-block transform rotate-1">
            DOWNLOAD YOUR FILE!
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] sm:shadow-[12px_12px_0px_0px_#000] p-4 sm:p-8">
          <div className="text-center space-y-4 sm:space-y-8">
            <div className="text-4xl sm:text-8xl mb-2 sm:mb-4 transform rotate-12">📥</div>
            <h2 className="text-2xl sm:text-4xl font-black bg-yellow-400 px-3 sm:px-6 py-2 sm:py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-[8px_8px_0px_0px_#000] inline-block transform -rotate-2">
              FILE DOWNLOAD
            </h2>

            {fileName && (
              <div className="bg-lime-300 p-3 sm:p-6 border-4 border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transform rotate-1">
                <p className="text-lg sm:text-2xl font-black text-black break-words">
                  📁 {fileName.length > 25 ? `${fileName.slice(0, 25).toUpperCase()}...` : fileName.toUpperCase()}
                </p>
              </div>
            )}

            {connectionStatus && !connectionClosed && (
              <div className="bg-blue-400 border-4 border-black p-3 sm:p-6 shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transform -rotate-1">
                <p className="text-lg sm:text-xl font-black text-black">{connectionStatus.toUpperCase()}</p>
              </div>
            )}

            {downloading && !fileUrl && !connectionClosed && (
              <div className="space-y-3 sm:space-y-6">
                <p className="text-lg sm:text-2xl font-black bg-orange-400 px-3 sm:px-4 py-1 sm:py-2 border-4 border-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] inline-block transform rotate-1">
                  DOWNLOADING...
                </p>
                <div className="relative w-full h-6 sm:h-8 bg-gray-300 border-4 border-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] overflow-hidden">
                  <img
                    src={amongUsGif}
                    alt="Among Us Character"
                    className="absolute z-10"
                    style={{
                      left: `${progress}%`,
                      transform: 'translate(-50%, -50%)',
                      top: '50%',
                      width: '30px',
                      height: '30px',
                    }}
                  />
                  <div
                    className="bg-red-500 h-full border-r-4 border-black transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm sm:text-lg font-black gap-2 sm:gap-4">
                  <span className="bg-white px-2 sm:px-3 py-1 sm:py-2 border-2 border-black text-xs sm:text-base">{progress.toFixed(1)}% DONE</span>
                  <span className="bg-white px-2 sm:px-3 py-1 sm:py-2 border-2 border-black text-xs sm:text-base">{speed.toFixed(1)} KB/s</span>
                </div>
              </div>
            )}

            {fileUrl && !connectionClosed && (
              <div className="space-y-3 sm:space-y-6">
                <div className="text-4xl sm:text-8xl transform -rotate-12">✅</div>
                <p className="text-xl sm:text-3xl font-black bg-green-400 px-3 sm:px-6 py-2 sm:py-3 border-4 border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] inline-block transform rotate-2">
                  READY TO DOWNLOAD!
                </p>
                <a
                  href={fileUrl}
                  download={fileName}
                  className="inline-block bg-green-500 hover:bg-green-600 text-black font-black py-3 sm:py-6 px-4 sm:px-8 border-4 border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-[8px_8px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000] sm:hover:shadow-[4px_4px_0px_0px_#000] text-lg sm:text-2xl text-center"
                >
                  📥 DOWNLOAD {fileName && fileName.length > 15 ? `${fileName.slice(0, 15).toUpperCase()}...` : fileName?.toUpperCase()}
                </a>
              </div>
            )}

            {(downloading || connectionStatus) && !connectionClosed && (
              <button
                onClick={handleCloseConnection}
                className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-8 py-3 sm:py-4 border-4 border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[1px_1px_0px_0px_#000] sm:hover:shadow-[3px_3px_0px_0px_#000] font-black text-lg sm:text-xl"
              >
                CANCEL DOWNLOAD
              </button>
            )}

            {connectionClosed && (
              <div className="bg-red-400 border-4 border-black p-3 sm:p-6 shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transform rotate-1">
                <p className="text-lg sm:text-xl font-black text-black">CONNECTION CLOSED! REDIRECTING...</p>
              </div>
            )}
            </div>
          </div>

        {/* Footer */}
        <div className="text-center mt-4 sm:mt-8">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 border-4 border-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none font-black text-base sm:text-lg"
          >
            ← BACK TO VISHARE
          </button>
        </div>
      </div>
    </div>
  );
}
