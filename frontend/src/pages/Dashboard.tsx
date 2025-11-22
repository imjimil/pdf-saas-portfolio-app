import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUsageTracking } from '../hooks/useUsageTracking';
import Navigation from '../components/Navigation';
import FileUpload from '../components/FileUpload';
import { pdfAPI } from '../services/api';

interface Feature {
  title: string;
  description: string;
  endpoint: string;
  icon: string;
  requires: 'PDF' | 'Image';
  accept: string;
}

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const { incrementUsage } = useUsageTracking();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOperation, setSelectedOperation] = useState<Feature | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');

  // Define features array before useEffect
  const features: Feature[] = [
    {
      title: 'PDF to Word',
      description: 'Convert PDF to editable Word document',
      endpoint: 'word',
      icon: '📄',
      requires: 'PDF',
      accept: '.pdf',
    },
    {
      title: 'Image to PDF',
      description: 'Convert images to PDF format',
      endpoint: 'pdf',
      icon: '🖼️',
      requires: 'Image',
      accept: '.jpg,.jpeg,.png,.gif',
    },
    {
      title: 'Split PDF',
      description: 'Split PDF into multiple files',
      endpoint: 'split',
      icon: '✂️',
      requires: 'PDF',
      accept: '.pdf',
    },
    {
      title: 'PDF to Text',
      description: 'Extract text from PDF',
      endpoint: 'txt',
      icon: '📝',
      requires: 'PDF',
      accept: '.pdf',
    },
    {
      title: 'PDF to EPUB',
      description: 'Convert PDF to EPUB format',
      endpoint: 'epub',
      icon: '📚',
      requires: 'PDF',
      accept: '.pdf',
    },
    {
      title: 'PDF OCR',
      description: 'Extract text using OCR',
      endpoint: 'ocr',
      icon: '👁️',
      requires: 'PDF',
      accept: '.pdf',
    },
    {
      title: 'Merge PDF',
      description: 'Combine multiple PDFs into one',
      endpoint: 'merge',
      icon: '🔗',
      requires: 'PDF',
      accept: '.pdf',
    },
    {
      title: 'Compress PDF',
      description: 'Reduce PDF file size',
      endpoint: 'compress',
      icon: '🗜️',
      requires: 'PDF',
      accept: '.pdf',
    },
  ];

  // Handle preselected endpoint from navigation
  useEffect(() => {
    const state = location.state as { selectedEndpoint?: string } | null;
    if (state?.selectedEndpoint) {
      const feature = features.find(f => f.endpoint === state.selectedEndpoint);
      if (feature) {
        setSelectedOperation(feature);
      }
      // Clear the state to avoid re-selecting on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Cleanup download URL on unmount
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleOperationSelect = (feature: Feature) => {
    // If Split PDF or Merge PDF is selected, navigate to dedicated page
    if (feature.endpoint === 'split') {
      navigate('/split-pdf');
      return;
    }
    if (feature.endpoint === 'merge') {
      navigate('/merge-pdf');
      return;
    }
    
    setSelectedOperation(feature);
    setSelectedFile(null); // Reset file when operation changes
    setError('');
  };

  const handleFileSelect = (file: File) => {
    if (!selectedOperation) {
      setError('Please select an operation first');
      return;
    }

    // Validate file type based on operation
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isPDF = fileExtension === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');

    if (selectedOperation.requires === 'PDF' && !isPDF) {
      setError('This operation requires a PDF file. Please select a PDF.');
      return;
    }

    if (selectedOperation.requires === 'Image' && !isImage) {
      setError('This operation requires an image file. Please select an image (JPG, PNG, or GIF).');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleProcess = async () => {
    console.log('handleProcess called', { selectedOperation, selectedFile });
    
    if (!selectedOperation) {
      setError('Please select an operation first');
      return;
    }

    if (!selectedFile) {
      setError('Please upload a file first');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadUrl(null); // Clear any previous download URL

    try {
      console.log('Starting API call for:', selectedOperation.endpoint);
      let blob: Blob;
      
      // Call the appropriate API function based on the endpoint
      switch (selectedOperation.endpoint) {
        case 'word':
          blob = await pdfAPI.toWord(selectedFile);
          break;
        case 'pdf':
          blob = await pdfAPI.imageToPdf(selectedFile);
          break;
        case 'split':
          blob = await pdfAPI.split(selectedFile);
          break;
        case 'txt':
          blob = await pdfAPI.toTxt(selectedFile);
          break;
        case 'epub':
          blob = await pdfAPI.toEpub(selectedFile);
          break;
        case 'ocr':
          blob = await pdfAPI.ocr(selectedFile);
          break;
        case 'compress':
          blob = await pdfAPI.compress(selectedFile);
          break;
        default:
          throw new Error('Unknown operation');
      }
      
      // Determine file extension based on endpoint
      let extension = 'txt';
      if (selectedOperation.endpoint === 'pdf') extension = 'pdf';
      else if (selectedOperation.endpoint === 'epub') extension = 'epub';
      else if (selectedOperation.endpoint === 'word') extension = 'txt';
      else if (selectedOperation.endpoint === 'txt') extension = 'txt';
      else if (selectedOperation.endpoint === 'ocr') extension = 'txt';
      else if (selectedOperation.endpoint === 'split') extension = 'pdf';
      else if (selectedOperation.endpoint === 'compress') extension = 'pdf';
      
      // Create download URL and store it
      const url = window.URL.createObjectURL(blob);
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}_${selectedOperation.endpoint}.${extension}`;
      
      setDownloadUrl(url);
      setDownloadFileName(fileName);
      console.log('Processing complete, download URL created');

      // Track usage for guest users
      if (!isAuthenticated) {
        incrementUsage();
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
      const errorMessage = err.response?.data?.message || err.message || 'Processing failed. Please try again.';
      setError(errorMessage);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
      <Navigation showAuth={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {selectedOperation ? (
          <>
            {/* Header with selected tool and back button */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => {
                  setSelectedOperation(null);
                  setSelectedFile(null);
                  setDownloadUrl(null);
                  setError('');
                  navigate('/tools');
                }}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedOperation.icon} {selectedOperation.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedOperation.description}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8">Dashboard</h1>
            
            {/* Step 1: Select Operation - Only show if no operation selected */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
                Choose an Operation
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {features.map((feature) => (
                  <button
                    key={feature.title}
                    onClick={() => handleOperationSelect(feature)}
                    className={`p-3 md:p-4 rounded-lg border-2 transition text-left ${
                      selectedOperation?.endpoint === feature.endpoint
                        ? 'border-green-primary bg-green-50 dark:bg-green-900/20 dark:border-green-light'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-green-primary dark:hover:border-green-light hover:bg-green-50 dark:hover:bg-green-900/10'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2 md:flex-row md:items-start md:space-x-3 md:space-y-0">
                      <span className="text-2xl md:text-2xl">{feature.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white mb-0.5 md:mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 md:line-clamp-none">{feature.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 2: Upload File */}
        {selectedOperation && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
              Upload {selectedOperation.requires} File
            </h2>
            <FileUpload
              key={selectedOperation.endpoint}
              onFileSelect={handleFileSelect}
              accept={selectedOperation.accept}
              label={`Choose ${selectedOperation.requires} file`}
            />
            {selectedFile && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
            {error && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Process */}
        {selectedOperation && selectedFile && !downloadUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
              Process File
            </h2>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                console.log('Button clicked!');
                handleProcess();
              }}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-primary text-white rounded-lg hover:bg-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing {selectedOperation.title}...
                </>
              ) : (
                `Process ${selectedOperation.title}`
              )}
            </button>
          </div>
        )}

        {/* Success Message with Download */}
        {downloadUrl && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-primary dark:border-green-light rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-primary dark:text-green-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  Processing Complete!
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  Your file has been processed successfully. Click the button below to download.
                </p>
                <div className="flex gap-3">
                  <a
                    href={downloadUrl}
                    download={downloadFileName}
                    className="px-6 py-2 bg-green-primary dark:bg-green-dark text-white rounded-lg hover:bg-green-dark dark:hover:bg-green-primary transition font-semibold inline-flex items-center gap-2"
                    onClick={() => {
                      // Allow multiple downloads by keeping the URL
                    }}
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
                      setSelectedFile(null);
                      setSelectedOperation(null);
                      navigate('/tools');
                    }}
                    className="px-6 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition font-semibold border border-gray-300 dark:border-gray-600"
                  >
                    Process Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedOperation && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              How to use:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
              <li>Select an operation from the options above</li>
              <li>Upload the required file type (PDF or Image)</li>
              <li>Click the process button to convert your file</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

