import React, { useState, useCallback } from 'react';
import { CitationData } from './types';
import { parseCitation } from './services/geminiService';

const GithubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
    <path d="M9 18c-4.51 2-5-2-7-2"></path>
  </svg>
);

const LoaderIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-spin h-5 w-5 mr-3"
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const DownloadIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="h-5 w-5 mr-3"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);


function App() {
  const [citationText, setCitationText] = useState<string>('');
  const [enwContent, setEnwContent] = useState<string | null>(null);
  const [citationData, setCitationData] = useState<CitationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formatToENW = (data: CitationData): string => {
    let content = '';
    const map: { [key in keyof CitationData]?: string } = {
      referenceType: '%0',
      title: '%T',
      journalName: '%J',
      year: '%D',
      volume: '%V',
      issue: '%N',
      pages: '%P',
      url: '%U',
      publisher: '%I',
      publicationPlace: '%C',
    };

    if(data.referenceType) {
        content += `${map.referenceType} ${data.referenceType}\n`;
    }

    if(data.title) {
        content += `${map.title} ${data.title}\n`;
    }
    
    if (data.authors && data.authors.length > 0) {
      data.authors.forEach(author => {
        content += `%A ${author}\n`;
      });
    }

    Object.keys(data).forEach(key => {
        const enwKey = map[key as keyof CitationData];
        const value = data[key as keyof CitationData];
        if (enwKey && key !== 'referenceType' && key !== 'title' && key !== 'authors' && value) {
            content += `${enwKey} ${value}\n`;
        }
    });

    if (data.accessDate) {
      content += `%Z Accessed on: ${data.accessDate}\n`;
    }

    return content.trim();
  };

  const handleConvert = useCallback(async () => {
    if (!citationText.trim()) {
      setError("Please paste a citation first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEnwContent(null);
    setCitationData(null);

    try {
      const parsedData = await parseCitation(citationText);
      setCitationData(parsedData);
      const formattedContent = formatToENW(parsedData);
      setEnwContent(formattedContent);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [citationText]);

  const generateFilename = (title?: string): string => {
    if (!title) {
      return 'citation.enw';
    }
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .trim()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Truncate to a reasonable length
      
    return `${sanitizedTitle || 'citation'}.enw`;
  };

  const handleDownload = () => {
    if (!enwContent) return;

    const blob = new Blob([enwContent], { type: 'application/x-endnote-refer' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateFilename(citationData?.title);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartOver = () => {
    setCitationText('');
    setEnwContent(null);
    setError(null);
    setIsLoading(false);
    setCitationData(null);
  };
  
  const exampleCitation = `Singh AK, Nagar J, Tandekar A, Singh S, Diwan V, Ravindran GC, Tiwari RR, Mishra PK, Nema RK. The Evolving Landscape of Norovirus GII Genotypes in Asia: A Systematic Review and Meta-Analysis. Journal of Clinical Virology. 2025 May 29:105809.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black text-gray-800 dark:text-gray-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transition-all duration-500">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Citation to .ENW Converter</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Instantly convert any citation text into a downloadable EndNote file.</p>
        </header>

        <main>
          <div className="space-y-6">
            <div>
              <label htmlFor="citation-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste your citation here:
              </label>
              <textarea
                id="citation-input"
                rows={6}
                value={citationText}
                onChange={(e) => setCitationText(e.target.value)}
                placeholder={exampleCitation}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              {!enwContent ? (
                  <button
                    onClick={handleConvert}
                    disabled={isLoading || !citationText.trim()}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600 transition-colors"
                  >
                    {isLoading ? <><LoaderIcon /> Processing...</> : 'Convert to .ENW'}
                  </button>
              ) : (
                <>
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <DownloadIcon /> Download .ENW File
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Start Over
                  </button>
                </>
              )}
            </div>
            {enwContent && (
              <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Generated Content Preview:</h3>
                  <pre className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all">
                      {enwContent}
                  </pre>
              </div>
            )}
          </div>
        </main>
      </div>
      <footer className="text-center mt-8 text-gray-500 dark:text-gray-400 text-sm">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
}

export default App;
