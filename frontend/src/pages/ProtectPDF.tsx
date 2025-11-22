import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import FileUpload from '../components/FileUpload';
import { pdfAPI } from '../services/api';

const ProtectPDF = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [allowPrinting, setAllowPrinting] = useState('high');
  const [allowModifying, setAllowModifying] = useState('true');
  const [allowCopying, setAllowCopying] = useState('true');
  const [allowAnnotating, setAllowAnnotating] = useState('true');
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

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadUrl(null);

    try {
      const blob = await pdfAPI.protect(selectedFile, password, {
        ownerPassword: ownerPassword || undefined,
        allowPrinting,
        allowModifying,
        allowCopying,
        allowAnnotating,
      });

      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadFileName(selectedFile.name.replace('.pdf', '_protected.pdf'));
    } catch (err: any) {
      console.error('Protect error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to protect PDF';
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
    setPassword('');
    setConfirmPassword('');
    setOwnerPassword('');
    setAllowPrinting('high');
    setAllowModifying('true');
    setAllowCopying('true');
    setAllowAnnotating('true');
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Protect PDF
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Add password protection to your PDF files and control permissions for printing, copying, and modifying.
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

        {/* Protection Settings */}
        {selectedFile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
              Step 2: Set Password & Permissions
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password to open PDF"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Owner Password (Optional)
                </label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Optional: Different password for full access"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  If set, owner password allows full access regardless of permissions
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Permissions
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Printing
                    </label>
                    <select
                      value={allowPrinting}
                      onChange={(e) => setAllowPrinting(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="high">High Resolution</option>
                      <option value="low">Low Resolution</option>
                      <option value="false">Not Allowed</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={allowModifying === 'true'}
                          onChange={(e) => setAllowModifying(e.target.checked ? 'true' : 'false')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Allow Modifying</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={allowCopying === 'true'}
                          onChange={(e) => setAllowCopying(e.target.checked ? 'true' : 'false')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Allow Copying</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={allowAnnotating === 'true'}
                          onChange={(e) => setAllowAnnotating(e.target.checked ? 'true' : 'false')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Allow Annotating</span>
                      </label>
                    </div>
                  </div>
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
              disabled={loading || !password || password !== confirmPassword}
              className="w-full px-6 py-3 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Protect PDF'
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
                ✓ PDF protected successfully!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                Remember to save your password. You'll need it to open the PDF.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-green-primary dark:bg-green-dark text-white rounded-lg font-semibold hover:bg-green-dark dark:hover:bg-green-primary transition"
                >
                  Download Protected PDF
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Protect Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProtectPDF;

