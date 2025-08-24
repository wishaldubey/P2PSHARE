import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

export default function Home() {
  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [copyMessage, setCopyMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
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

  const generateQRCode = async (url) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const createShortLink = async (hash, type) => {
    try {
      const response = await fetch('/api/create-short-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash, type }),
      });
      
      const data = await response.json();
      if (response.ok) {
        const shortUrl = `${window.location.origin}/s/${data.shortCode}`;
        setShareLink(shortUrl);
        await generateQRCode(shortUrl);
        return shortUrl;
      }
    } catch (error) {
      console.error('Error creating short link:', error);
    }
    return null;
  };

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

    setSeeding(true);
    setIsSharing(true);

    client.seed(file, { announce: [
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.btorrent.xyz',
      'wss://tracker.fastcast.nz',
      'wss://tracker.webtorrent.io',
      'wss://tracker.sloppyta.co',
      'wss://tracker.novage.com.ua'
    ]}, async (torrent) => {
      await createShortLink(torrent.infoHash, 'file');

      torrent.on('upload', () => {
        const total = torrent.length;
        const uploaded = torrent.uploaded;
        const progressPercentage = (uploaded / total) * 100;
        setProgress(progressPercentage);
        setSpeed(torrent.uploadSpeed / 1024);
      });

      torrent.on('done', () => {
        setSeeding(false);
      });
    });
  };

  const handleTextShare = async () => {
    if (!text.trim()) return;
    
    setIsSharing(true);
    
    try {
      const response = await fetch('/api/share-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      if (response.ok) {
        await createShortLink(data.textId, 'text');
      }
    } catch (error) {
      console.error('Error sharing text:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopyMessage('Copied!');
    setTimeout(() => setCopyMessage(''), 2000);
  };

  const handleCloseConnection = () => {
    if (clientRef.current) {
      clientRef.current.destroy();
      window.location.reload();
    }
  };

  const resetShare = () => {
    setShareLink('');
    setQrCodeUrl('');
    setFile(null);
    setText('');
    setSeeding(false);
    setProgress(0);
    setSpeed(0);
    setIsSharing(false);
    setCopyMessage('');
  };

  return (
    <div className="min-h-screen bg-yellow-300 text-black font-mono">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-black mb-4 text-black transform -rotate-1 inline-block bg-red-500 px-6 py-2 border-4 border-black shadow-[8px_8px_0px_0px_#000]">
              VISHARE
            </h1>
            <p className="text-2xl font-bold bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] inline-block transform rotate-1">
              SHARE FILES & TEXT INSTANTLY!
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] p-8">
            {!shareLink ? (
              <>
                {/* Tab Navigation */}
                <div className="flex mb-8 gap-4">
                  <button
                    onClick={() => setActiveTab('file')}
                    className={`flex-1 py-4 px-6 font-black text-xl border-4 border-black transform transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                      activeTab === 'file'
                        ? 'bg-blue-500 text-white shadow-[6px_6px_0px_0px_#000] -translate-x-1 -translate-y-1'
                        : 'bg-pink-400 text-black shadow-[6px_6px_0px_0px_#000]'
                    }`}
                  >
                    <span className="text-3xl mr-2">📁</span>
                    FILES
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 py-4 px-6 font-black text-xl border-4 border-black transform transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                      activeTab === 'text'
                        ? 'bg-blue-500 text-white shadow-[6px_6px_0px_0px_#000] -translate-x-1 -translate-y-1'
                        : 'bg-pink-400 text-black shadow-[6px_6px_0px_0px_#000]'
                    }`}
                  >
                    <span className="text-3xl mr-2">📝</span>
                    TEXT
                  </button>
                </div>

                {/* File Sharing Tab */}
                {activeTab === 'file' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="border-4 border-black border-dashed bg-cyan-200 p-12 hover:bg-cyan-300 transition-colors shadow-[8px_8px_0px_0px_#000] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#000]">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-input"
                          disabled={isSharing}
                        />
                        <label
                          htmlFor="file-input"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <div className="text-8xl mb-4">📁</div>
                          <p className="text-2xl font-black mb-2 text-black">
                            {file ? file.name.toUpperCase() : 'DROP YOUR FILE HERE!'}
                          </p>
                          <p className="text-lg font-bold text-black">
                            CLICK TO BROWSE OR DRAG & DROP
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Sharing Tab */}
                {activeTab === 'text' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-2xl font-black mb-4 text-black bg-yellow-400 px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] inline-block transform -rotate-1">
                        TYPE YOUR TEXT HERE!
                      </label>
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="PASTE YOUR TEXT HERE AND SHARE IT WITH THE WORLD!"
                        className="w-full h-40 p-4 bg-lime-200 border-4 border-black text-black placeholder-gray-700 focus:outline-none focus:bg-lime-300 resize-none font-mono text-lg font-bold shadow-[6px_6px_0px_0px_#000]"
                        disabled={isSharing}
                      />
                    </div>
                    <button
                      onClick={handleTextShare}
                      disabled={!text.trim() || isSharing}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-black font-black py-6 px-6 border-4 border-black shadow-[8px_8px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[8px_8px_0px_0px_#000] disabled:cursor-not-allowed text-2xl"
                    >
                      {isSharing ? 'CREATING LINK...' : 'SHARE THIS TEXT!'}
                    </button>
                  </div>
                )}

                {/* Progress for file upload */}
                {seeding && (
                  <div className="mt-8 space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-black bg-orange-400 px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] inline-block transform rotate-1">
                        PREPARING FILE...
                      </p>
                    </div>
                    <div className="w-full bg-gray-300 border-4 border-black h-8 shadow-[4px_4px_0px_0px_#000]">
                      <div
                        className="bg-red-500 h-full border-r-4 border-black transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-lg font-black">
                      <span className="bg-white px-2 py-1 border-2 border-black">{progress.toFixed(1)}% UPLOADED</span>
                      <span className="bg-white px-2 py-1 border-2 border-black">{speed.toFixed(1)} KB/s</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Share Results */
              <div className="text-center space-y-8">
                <div className="text-8xl mb-4 transform rotate-12">🎉</div>
                <h2 className="text-4xl font-black bg-green-400 px-6 py-3 border-4 border-black shadow-[8px_8px_0px_0px_#000] inline-block transform -rotate-2">
                  LINK CREATED!
                </h2>
                
                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_#000] transform rotate-3">
                      <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
                      <p className="text-black font-black text-lg mt-2">SCAN ME!</p>
                    </div>
                  </div>
                )}

                {/* Share Link */}
                <div className="bg-purple-300 p-6 border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-1">
                  <p className="text-xl font-black mb-4 text-black">YOUR SHARE LINK:</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 bg-white text-black p-4 border-4 border-black focus:outline-none font-mono text-lg font-bold"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-4 border-4 border-black shadow-[4px_4px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none flex items-center gap-2 font-black"
                    >
                      <span className="text-2xl">📋</span>
                      COPY
                    </button>
                  </div>
                  {copyMessage && (
                    <p className="text-green-600 mt-3 text-xl font-black bg-white px-3 py-1 border-2 border-black inline-block">{copyMessage}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-6 justify-center">
                  <button
                    onClick={resetShare}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 border-4 border-black shadow-[6px_6px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_#000] font-black text-xl"
                  >
                    SHARE ANOTHER
                  </button>
                  {seeding && (
                    <button
                      onClick={handleCloseConnection}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 border-4 border-black shadow-[6px_6px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_#000] font-black text-xl"
                    >
                      STOP SHARING
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <div className="bg-black text-white px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_#fff] inline-block font-black transform rotate-1">
              SECURE P2P • NO LIMITS • 24HR EXPIRY
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
