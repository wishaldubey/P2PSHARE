import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Basic Meta Tags */}
        <meta name="description" content="ViShare - Share files securely and quickly via peer-to-peer connections" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph Meta Tags (for social media) */}
        <meta property="og:title" content="ViShare - Secure P2P File Sharing" />
        <meta property="og:description" content="Easily share files directly between devices without storing them on a server." />
        <meta property="og:url" content="https://vishare.vercel.app" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://vishare.vercel.app/favicon.ico" /> {/* Replace with your image URL */}
        
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ViShare - Secure P2P File Sharing" />
        <meta name="twitter:description" content="Share files directly between devices via secure peer-to-peer connections." />
        <meta name="twitter:image" content="https://vishare.vercel.app/preview-image.png" /> {/* Replace with your image URL */}

      </Head>
      <body className="bg-gray-900 text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
