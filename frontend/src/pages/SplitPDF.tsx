import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUsageTracking } from '../hooks/useUsageTracking';
import Navigation from '../components/Navigation';
import FileUpload from '../components/FileUpload';
import { pdfAPI } from '../services/api';

const SplitPDF = () => {
  const { isAuthenticated } = useAuth();
  const { incrementUsage } = useUsageTracking();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageRanges, setPageRanges] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate it's a PDF
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'pdf') {
      setError('Please select a PDF file');
      return;
    }

    setSelectedFile(file);
    setError('');
    setPageRanges('');

    // Create object URL for preview
    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    // Try to get page count (this is approximate, actual count will be from backend)
    // For now, we'll let users specify ranges and validate on backend
  };

  const parsePageRanges = (input: string): { start: number; end: number }[] => {
    const ranges: { start: number; end: number }[] = [];
    
    // Remove whitespace and split by comma
    const parts = input.split(',').map(p => p.trim()).filter(p => p);
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Range like "1-5"
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0 && start <= end) {
          ranges.push({ start, end });
        }
      } else {
        // Single page like "3"
        const page = parseInt(part.trim());
        if (!isNaN(page) && page > 0) {
          ranges.push({ start: page, end: page });
        }
      }
    }
    
    return ranges;
  };

  const handleSplit = async () => {
    if (!selectedFile) {
      setError('Please upload a PDF file first');
      return;
    }

    if (!pageRanges.trim()) {
      setError('Please specify page ranges (e.g., "1-5" or "1,3,5" or "1-3,5-7")');
      return;
    }

    const parsedRanges = parsePageRanges(pageRanges);
    if (parsedRanges.length === 0) {
      setError('Invalid page range format. Use formats like "1-5", "1,3,5", or "1-3,5-7"');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const blob = await pdfAPI.split(selectedFile, parsedRanges);
      
      // Create download URL and store it
      const url = window.URL.createObjectURL(blob);
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}_split.pdf`;
      
      setDownloadUrl(url);
      setDownloadFileName(fileName);
      setError('');

      // Track usage for guest users
      if (!isAuthenticated) {
        incrementUsage();
      }
    } catch (err: any) {
      console.error('Split error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to split PDF. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [pdfUrl, downloadUrl]);

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
      <Navigation showAuth={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/tools')}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Back to Tools"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-3 flex-1">
              <span className="text-3xl md:text-4xl">✂️</span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Split PDF
              </h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Extract specific pages from your PDF by entering page ranges (e.g., 1-5, 7, 10-15) or individual page numbers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: PDF Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">PDF Preview</h2>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Upload a PDF file to preview</p>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  accept=".pdf"
                  label="Choose PDF file"
                />
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    File: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (pdfUrl) {
                        URL.revokeObjectURL(pdfUrl);
                        setPdfUrl(null);
                      }
                      setPageRanges('');
                    }}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    Remove file
                  </button>
                </div>
                
                {pdfUrl && (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <iframe
                      ref={iframeRef}
                      src={pdfUrl}
                      className="w-full h-[600px] bg-white dark:bg-gray-900"
                      title="PDF Preview"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Page Range Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Specify Pages to Split</h2>
            
            {!selectedFile ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Upload a PDF file first to specify page ranges</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Ranges
                  </label>
                  <input
                    type="text"
                    value={pageRanges}
                    onChange={(e) => setPageRanges(e.target.value)}
                    placeholder="e.g., 1-5 or 1,3,5 or 1-3,5-7"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-primary focus:border-green-primary dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Examples:
                    <br />• <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">1-5</code> - Pages 1 through 5
                    <br />• <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">1,3,5</code> - Pages 1, 3, and 5
                    <br />• <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">1-3,5-7</code> - Pages 1-3 and 5-7
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {downloadUrl ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-primary dark:border-green-light rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-green-primary dark:text-green-light flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                          Processing Complete!
                        </h3>
                        <p className="text-green-700 dark:text-green-300 mb-3">
                          Your PDF has been split successfully. Click below to download.
                        </p>
                        <div className="flex gap-3">
                          <a
                            href={downloadUrl}
                            download={downloadFileName}
                            className="px-4 py-2 bg-green-primary dark:bg-green-dark text-white rounded-lg hover:bg-green-dark dark:hover:bg-green-primary transition font-semibold inline-flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download {downloadFileName}
                          </a>
                          <button
                            onClick={() => {
                              if (downloadUrl) {
                                URL.revokeObjectURL(downloadUrl);
                              }
                              setDownloadUrl(null);
                              setDownloadFileName('');
                            }}
                            className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition font-semibold border border-gray-300 dark:border-gray-600"
                          >
                            Split Another
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleSplit}
                    disabled={loading || !selectedFile || !pageRanges.trim()}
                    className="w-full px-6 py-3 bg-green-primary text-white rounded-lg hover:bg-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Splitting PDF...
                      </>
                    ) : (
                      'Split PDF'
                    )}
                  </button>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">How it works:</h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Upload your PDF file on the left</li>
                    <li>Specify which pages you want to extract</li>
                    <li>Use ranges (1-5) or individual pages (1,3,5) or both</li>
                    <li>Click "Split PDF" to download the extracted pages</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPDF;

