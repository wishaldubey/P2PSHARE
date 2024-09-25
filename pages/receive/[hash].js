import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";

export default function Receive() {
  const [fileUrl, setFileUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [torrent, setTorrent] = useState(null);
  const clientRef = useRef(null);
  const router = useRouter();
  const { hash } = router.query;

  useEffect(() => {
    // Load WebTorrent
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

  useEffect(() => {
    console.log("Hash received:", hash);

    // Ensure the client is initialized
    if (hash && clientRef.current) {
      const client = clientRef.current;

      // Create a new torrent from the hash
      const newTorrent = client.add(hash, {
        announce: [
          "wss://tracker.openwebtorrent.com",
          "wss://tracker.btorrent.xyz",
          "wss://tracker.uwot.me",
          "wss://tracker.fastcast.nz",
        ],
      });

      setTorrent(newTorrent);

      // Handle download progress
      newTorrent.on("download", (bytes) => {
        const total = newTorrent.length;
        const downloaded = newTorrent.downloaded;
        const progressPercentage = (downloaded / total) * 100;
        setProgress(progressPercentage);
        setDownloading(true);
      });

      // Handle when the download is complete
      newTorrent.on("done", () => {
        const file = newTorrent.files[0];
        file.getBlobURL((err, url) => {
          if (err) {
            console.error("Error getting blob URL:", err);
            return;
          }
          setFileUrl(url);
          setDownloading(false);
        });
      });

      return () => {
        client.remove(hash); // Clean up the client on unmount
      };
    } else {
      console.error("No hash or client available.", {
        hash,
        client: clientRef.current,
      });
    }
  }, [hash]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-8">Receiving File...</h1>
      {downloading && (
        <>
          <p className="text-lg">Downloading file, please wait...</p>
          <div className="w-2/3 h-4 bg-gray-300 rounded-full mt-4">
            <div
              className="bg-blue-500 h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center">{progress.toFixed(2)}%</p>
        </>
      )}
      {fileUrl && torrent && (
        <div className="mt-4 text-center">
          <p className="text-lg mb-2">
            Download complete! Click the link below:
          </p>
          <a
            href={fileUrl}
            download={torrent.files[0].name}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Download {torrent.files[0].name}
          </a>
        </div>
      )}
    </div>
  );
}
