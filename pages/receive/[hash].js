import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";

export default function Receive() {
  const [fileUrl, setFileUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const clientRef = useRef(null);
  const router = useRouter();
  const { hash } = router.query;

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

  useEffect(() => {
    if (hash && clientRef.current) {
      const client = clientRef.current;
      setDownloading(true);

      client.add(
        hash,
        {
          announce: [
            "wss://tracker.openwebtorrent.com",
            "wss://tracker.btorrent.xyz",
            "wss://tracker.fastcast.nz",
          ],
        },
        (torrent) => {
          torrent.files[0].getBlobURL((err, url) => {
            if (err) {
              console.error("Error getting blob URL:", err);
              return;
            }
            setFileUrl(url);
            setDownloading(false);
          });
        }
      );
    } else {
      console.error("No hash or client available.");
    }
  }, [hash]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-800">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">
        Receiving File...
      </h1>
      {downloading && (
        <p className="text-lg text-gray-800 dark:text-white">
          Downloading file, please wait...
        </p>
      )}
      {fileUrl && (
        <div className="mt-4 text-center">
          <p className="text-lg mb-2 text-gray-800 dark:text-white">
            Download complete! Click the link below:
          </p>
          <a
            href={fileUrl}
            download
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Download File
          </a>
        </div>
      )}
    </div>
  );
}
