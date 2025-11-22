import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import FileUpload from '../components/FileUpload';
import { pdfAPI } from '../services/api';

const WatermarkPDF = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [position, setPosition] = useState('center');
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(50);
  const [rotation, setRotation] = useState(-45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError('');
    setDownloadUrl(null);
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Please upload a PDF file first');
      return;
    }

    if (!watermarkText.trim()) {
      setError('Please enter watermark text');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadUrl(null);

    try {
      const blob = await pdfAPI.watermark(selectedFile, watermarkText, {
        position,
        opacity,
        fontSize,
        rotation,
      });

      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFileName(selectedFile.name.replace('.pdf', '_watermarked.pdf'));
    } catch (err: any) {
      console.error('Watermark error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add watermark';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setWatermarkText('');
    setPosition('center');
    setOpacity(0.3);
    setFontSize(50);
    setRotation(-45);
    setError('');
    setDownloadUrl(null);
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
              <span className="text-3xl md:text-4xl">💧</span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Watermark PDF
              </h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Add text watermarks to your PDF documents with customizable position, opacity, and font size.
          </p>
        </div>

        {/* Upload File */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
            Step 1: Upload PDF File
          </h2>
          <FileUpload
            onFileSelect={handleFileSelect}
            accept=".pdf"
            label="Choose PDF file"
          />
          {selectedFile && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}
        </div>

        {/* Watermark Settings */}
        {selectedFile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
              Step 2: Configure Watermark
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Watermark Text *
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Enter watermark text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="center">Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opacity: {opacity.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Font Size: {fontSize}
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rotation: {rotation}°
                  </label>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Process Button */}
        {selectedFile && !downloadUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <button
              onClick={handleProcess}
              disabled={loading || !watermarkText.trim()}
              className="w-full px-6 py-3 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Add Watermark'
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-800 rounded-lg shadow-md p-4 md:p-6 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Success Message with Download */}
        {downloadUrl && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-primary dark:border-green-light rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                ✓ Watermark added successfully!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition"
                >
                  Download Watermarked PDF
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Watermark Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatermarkPDF;

