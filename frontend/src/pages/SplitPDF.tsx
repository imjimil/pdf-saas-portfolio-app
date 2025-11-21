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
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      a.download = `${baseName}_split.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Track usage for guest users
      if (!isAuthenticated) {
        incrementUsage();
      }

      // Show success message
      setError('');
      alert('PDF split successfully! The selected pages have been combined into a single PDF file.');
      
      // Optionally reset
      // setSelectedFile(null);
      // setPdfUrl(null);
      // setPageRanges('');
    } catch (err: any) {
      console.error('Split error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to split PDF. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
      <Navigation showAuth={true} showBack={true} backPath="/dashboard" backLabel="← Back to Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Back to Dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Split PDF</h1>
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

                <button
                  onClick={handleSplit}
                  disabled={loading || !selectedFile || !pageRanges.trim()}
                  className="w-full px-6 py-3 bg-green-primary text-white rounded-lg hover:bg-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                >
                  {loading ? 'Splitting PDF...' : 'Split PDF'}
                </button>

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

