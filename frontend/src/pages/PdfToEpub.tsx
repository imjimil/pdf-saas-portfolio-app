import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUsageTracking } from '../hooks/useUsageTracking';
import Navigation from '../components/Navigation';
import FileUpload from '../components/FileUpload';
import { pdfAPI } from '../services/api';

const PdfToEpub = () => {
  const { isAuthenticated } = useAuth();
  const { incrementUsage } = useUsageTracking();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');

  const handleFileSelect = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'pdf') {
      setError('Please select a PDF file');
      return;
    }
    setSelectedFile(file);
    setError('');
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Please upload a file first');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadUrl(null);

    try {
      const blob = await pdfAPI.toEpub(selectedFile);
      const url = window.URL.createObjectURL(blob);
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}.epub`;
      
      setDownloadUrl(url);
      setDownloadFileName(fileName);

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

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleProcessAnother = () => {
    setSelectedFile(null);
    setDownloadUrl(null);
    setError('');
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
              <span className="text-3xl md:text-4xl">📚</span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                PDF to EPUB
              </h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Convert your PDF documents to EPUB format for e-readers and devices.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          {!downloadUrl ? (
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
                <div className="mt-6">
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
                        Processing...
                      </>
                    ) : (
                      'Convert to EPUB'
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Conversion Successful!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your PDF has been converted to EPUB format.
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition shadow-md hover:shadow-lg"
                >
                  Download EPUB
                </button>
                <button
                  onClick={handleProcessAnother}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Process Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfToEpub;

