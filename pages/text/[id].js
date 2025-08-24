import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function TextView() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      try {
        const response = await fetch(`/api/share-text?id=${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setText(data.text);
        } else {
          setError(data.message || 'Text not found');
        }
      } catch (err) {
        console.error('Error fetching text:', err);
        setError('Failed to load text');
      } finally {
        setLoading(false);
      }
    };

    fetchText();
  }, [id]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lime-300 text-black font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-4 animate-bounce">📝</div>
          <div className="bg-white px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_#000] font-black text-2xl">
            LOADING TEXT...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lime-300 text-black font-mono flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="text-8xl mb-4 transform rotate-12">⚠️</div>
          <h1 className="text-4xl font-black bg-red-500 px-6 py-3 border-4 border-black shadow-[8px_8px_0px_0px_#000] transform -rotate-2">
            TEXT NOT FOUND!
          </h1>
          <p className="text-xl font-bold bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] max-w-md">{error.toUpperCase()}</p>
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

  return (
    <div className="min-h-screen bg-lime-300 text-black font-mono">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-black mb-4 text-black transform -rotate-1 inline-block bg-red-500 px-6 py-2 border-4 border-black shadow-[8px_8px_0px_0px_#000]">
              VISHARE
            </h1>
            <p className="text-2xl font-bold bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000] inline-block transform rotate-1">
              SHARED TEXT
            </p>
          </div>

          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black bg-yellow-400 px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_#000] transform -rotate-1">
                📝 YOUR TEXT
              </h2>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-none font-black text-lg"
              >
                NEW SHARE
              </button>
            </div>
            
            <div className="bg-cyan-200 border-4 border-black p-6 mb-6 min-h-[200px] shadow-[6px_6px_0px_0px_#000] transform rotate-1">
              <pre className="whitespace-pre-wrap text-black font-mono text-lg font-bold leading-relaxed">
                {text}
              </pre>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={copyToClipboard}
                className="bg-green-500 hover:bg-green-600 text-black px-8 py-4 border-4 border-black shadow-[6px_6px_0px_0px_#000] transition-all transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_#000] flex items-center gap-3 font-black text-xl"
              >
                <span className="text-2xl">📋</span>
                {copied ? 'COPIED!' : 'COPY TEXT'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
