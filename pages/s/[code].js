import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ShortLink() {
  const router = useRouter();
  const { code } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) return;

    const handleRedirect = async () => {
      try {
        const response = await fetch(`/api/resolve-link?code=${code}`);
        const linkData = await response.json();
        
        if (!response.ok) {
          setError(linkData.message || 'Link not found or expired');
          setLoading(false);
          return;
        }

        if (linkData.type === 'file') {
          // Redirect to file receive page
          router.replace(`/receive/${linkData.hash}`);
        } else if (linkData.type === 'text') {
          // Redirect to text view page
          router.replace(`/text/${linkData.hash}`);
        } else {
          setError('Invalid link type');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error handling redirect:', err);
        setError('An error occurred while processing the link');
        setLoading(false);
      }
    };

    handleRedirect();
  }, [code, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-300 text-black font-mono">
        <div className="text-center space-y-6">
          <div className="text-8xl mb-4 animate-spin">🔄</div>
          <div className="bg-white px-8 py-4 border-4 border-black shadow-[8px_8px_0px_0px_#000] font-black text-3xl transform -rotate-2">
            REDIRECTING...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-300 text-black font-mono">
        <div className="text-center space-y-8">
          <div className="text-8xl mb-4 transform rotate-12">⚠️</div>
          <h1 className="text-4xl font-black bg-red-500 px-8 py-4 border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-1">
            LINK ERROR!
          </h1>
          <p className="text-xl font-bold bg-white px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] max-w-md transform rotate-1">
            {error.toUpperCase()}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 border-4 border-black shadow-[6px_6px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_#000] font-black text-xl"
          >
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  return null;
}
