import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { useDarkMode } from '../contexts/DarkModeContext';
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
  const { isDark } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOperation, setSelectedOperation] = useState<Feature | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

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
    setProcessing(selectedOperation.endpoint);

    try {
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
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      a.download = `${baseName}_${selectedOperation.endpoint}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Track usage for guest users
      if (!isAuthenticated) {
        incrementUsage();
      }

      // Reset after successful processing
      setSelectedFile(null);
      setSelectedOperation(null);
    } catch (err: any) {
      console.error('Processing error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Processing failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream-light dark:bg-gray-900 transition-colors">
      <Navigation showAuth={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

        {/* Step 1: Select Operation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Step 1: Choose an Operation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <button
                key={feature.title}
                onClick={() => handleOperationSelect(feature)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  selectedOperation?.endpoint === feature.endpoint
                    ? 'border-green-primary bg-green-50 dark:bg-green-900/20 dark:border-green-light'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-primary dark:hover:border-green-light hover:bg-green-50 dark:hover:bg-green-900/10'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Upload File */}
        {selectedOperation && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Step 2: Upload {selectedOperation.requires} File
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
        {selectedOperation && selectedFile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Step 3: Process File
            </h2>
            <button
              onClick={handleProcess}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-primary text-white rounded-lg hover:bg-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
            >
              {loading
                ? `Processing ${selectedOperation.title}...`
                : `Process ${selectedOperation.title}`}
            </button>
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

