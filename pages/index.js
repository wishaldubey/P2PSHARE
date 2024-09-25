import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [torrentLink, setTorrentLink] = useState(null);
  const [fileSelected, setFileSelected] = useState(false);
  const clientRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js";
    script.async = true;
    script.onload = () => {
      clientRef.current = new window.WebTorrent();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const onFileChange = (e) => {
    setFileSelected(true);
    fileRef.current = e.target.files[0];
  };

  const shareFile = () => {
    const client = clientRef.current;
    const file = fileRef.current;

    if (client && file) {
      client.seed(
        file,
        {
          announce: [
            "wss://tracker.openwebtorrent.com",
            "wss://tracker.btorrent.xyz",
            "wss://tracker.fastcast.nz",
          ],
        },
        (torrent) => {
          const link = `${window.location.href}receive/${torrent.infoHash}`;
          setTorrentLink(link);
        }
      );
    } else {
      console.error("Client or file not available.");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(torrentLink);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-800">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">
        Peer-to-Peer File Sharing
      </h1>
      <input
        type="file"
        onChange={onFileChange}
        className="mb-4 p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      {fileSelected && (
        <button
          onClick={shareFile}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Share File
        </button>
      )}
      {torrentLink && (
        <div className="mt-4">
          <p className="text-lg mb-2 text-gray-800 dark:text-white">
            Share this link with the receiver:
          </p>
          <div className="flex items-center">
            <input
              type="text"
              value={torrentLink}
              readOnly
              className="p-2 border border-gray-300 rounded-md mr-2 w-64 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={copyLink}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
