import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUsageTracking } from '../hooks/useUsageTracking';
import Navigation from '../components/Navigation';
import FileUpload from '../components/FileUpload';
import { pdfAPI } from '../services/api';

const PdfOcr = () => {
  const { isAuthenticated } = useAuth();
  const { incrementUsage } = useUsageTracking();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [textStats, setTextStats] = useState<{ characterCount: number; wordCount: number; fileName: string } | null>(null);
  const [createSearchablePdf, setCreateSearchablePdf] = useState(false);
  const [resultType, setResultType] = useState<'text' | 'searchablePdf'>('text');
  const [fileId, setFileId] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'pdf') {
      setError('Please select a PDF file');
      return;
    }
    setSelectedFile(file);
    setError('');
    setExtractedText('');
    setTextStats(null);
    setResultType('text');
    setFileId(null);
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Please upload a file first');
      return;
    }

    setLoading(true);
    setError('');
    setExtractedText('');
    setTextStats(null);
    setResultType('text');
    setFileId(null);

    try {
      const result = await pdfAPI.ocr(selectedFile, createSearchablePdf);
      
      setResultType(result.type || 'text');
      setExtractedText(result.text || '');
      setTextStats({
        characterCount: result.characterCount || 0,
        wordCount: result.wordCount || 0,
        fileName: result.fileName || (createSearchablePdf ? `${selectedFile.name.replace('.pdf', '_searchable.pdf')}` : `${selectedFile.name.replace('.pdf', '_ocr.txt')}`),
      });
      
      if (result.type === 'searchablePdf' && result.fileId) {
        setFileId(result.fileId);
      }

      if (!isAuthenticated) {
        incrementUsage();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Processing failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!textStats) {
      console.error('No textStats available for download');
      return;
    }

    if (resultType === 'searchablePdf' && fileId) {
      // Download searchable PDF from our backend (avoids CORS)
      try {
        console.log('Downloading searchable PDF from backend, fileId:', fileId);
        const token = localStorage.getItem('token');
        // @ts-ignore - Vite env types
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const url = `${apiUrl}/files/${fileId}/download`;
        
        const response = await fetch(url, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }
        
        console.log('Downloaded blob size:', blob.size);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = textStats.fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        // Clean up after a short delay
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
        }, 100);
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Failed to download searchable PDF: ${err.message || 'Unknown error'}`);
      }
    } else if (extractedText && textStats) {
      // Download text file
      const blob = new Blob([extractedText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = textStats.fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } else {
      console.error('Cannot download: missing extractedText or textStats');
      setError('Cannot download: missing file data');
    }
  };

  const handleProcessAnother = () => {
    setSelectedFile(null);
    setExtractedText('');
    setTextStats(null);
    setError('');
    setCreateSearchablePdf(false);
    setResultType('text');
    setFileId(null);
    navigate('/tools');
  };

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
      <Navigation showAuth={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              <span className="text-3xl md:text-4xl">👁️</span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                PDF OCR
              </h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Extract text from scanned PDFs using advanced OCR technology. Perfect for documents with images or scanned pages.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          {!textStats ? (
            <>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf"
                label="Choose PDF file"
                reset={!selectedFile}
              />

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {selectedFile && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <input
                      type="checkbox"
                      id="createSearchablePdf"
                      checked={createSearchablePdf}
                      onChange={(e) => setCreateSearchablePdf(e.target.checked)}
                      className="w-4 h-4 text-green-primary bg-gray-100 border-gray-300 rounded focus:ring-green-primary focus:ring-2"
                    />
                    <label htmlFor="createSearchablePdf" className="flex-1 cursor-pointer">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Create Searchable PDF
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Convert scanned PDF into a searchable PDF with selectable text
                      </div>
                    </label>
                  </div>
                  
                  <button
                    onClick={handleProcess}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {createSearchablePdf ? 'Creating Searchable PDF...' : 'Processing OCR...'}
                      </>
                    ) : (
                      createSearchablePdf ? 'Create Searchable PDF' : 'Extract Text with OCR'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {resultType === 'searchablePdf' ? 'Searchable PDF Created Successfully!' : 'Text Extracted Successfully!'}
                    </h3>
                    {textStats && (
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{textStats.characterCount.toLocaleString()} characters</span>
                        <span>{textStats.wordCount.toLocaleString()} words</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition shadow-md hover:shadow-lg text-sm"
                    >
                      {resultType === 'searchablePdf' ? 'Download PDF' : 'Download TXT'}
                    </button>
                    <button
                      onClick={handleProcessAnother}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
                    >
                      Process Another
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Preview - Only show for text results */}
              {resultType === 'text' && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Extracted Text Preview</h4>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto bg-white dark:bg-gray-800">
                    {extractedText.trim().length === 0 ? (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-yellow-800 dark:text-yellow-200">
                          ⚠️ No text was extracted. The PDF might be password-protected, corrupted, or contain only images without readable text.
                        </p>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        {extractedText}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Info for searchable PDF */}
              {resultType === 'searchablePdf' && (
                <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-200 mb-1">Searchable PDF Ready!</h4>
                      <p className="text-sm text-green-800 dark:text-green-300">
                        Your PDF has been converted to a searchable format. You can now search, select, and copy text from the document. Click "Download PDF" to get your searchable PDF file.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfOcr;
