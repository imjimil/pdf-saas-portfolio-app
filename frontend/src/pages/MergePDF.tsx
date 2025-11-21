import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUsageTracking } from '../hooks/useUsageTracking';
import Navigation from '../components/Navigation';
import { pdfAPI } from '../services/api';

interface FileWithPreview extends File {
  preview?: string;
}

const MergePDF = () => {
  const { isAuthenticated } = useAuth();
  const { incrementUsage } = useUsageTracking();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validate all are PDFs
    const invalidFiles = files.filter(
      (file) => file.name.split('.').pop()?.toLowerCase() !== 'pdf'
    );
    
    if (invalidFiles.length > 0) {
      setError('Please select PDF files only');
      return;
    }

    // Add new files (avoid duplicates)
    const newFiles = files.filter(
      (file) => !selectedFiles.some((f) => f.name === file.name && f.size === file.size)
    );

    // Create preview URLs for new files
    const filesWithPreviews: FileWithPreview[] = newFiles.map((file) => {
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.preview = URL.createObjectURL(file);
      return fileWithPreview;
    });

    setSelectedFiles([...selectedFiles, ...filesWithPreviews]);
    setError('');

    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    // Revoke preview URL to free memory
    if (selectedFiles[index].preview) {
      URL.revokeObjectURL(selectedFiles[index].preview);
    }
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...selectedFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);
    setSelectedFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (selectedFiles.length < 2) {
      setError('Please select at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await pdfAPI.merge(selectedFiles);
      
      // Check if response is a blob
      if (!(response instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      // Track usage for guest users
      if (!isAuthenticated) {
        incrementUsage();
      }

      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setError('');
      alert('PDFs merged successfully! The merged file has been downloaded.');
      
      // Cleanup preview URLs
      selectedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      
      // Reset
      setSelectedFiles([]);
    } catch (err: any) {
      console.error('Merge error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to merge PDFs. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Merge PDF</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Select PDF Files to Merge
          </h2>

          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-green-primary dark:border-green-light rounded-lg text-green-primary dark:text-green-light hover:bg-green-primary dark:hover:bg-green-dark hover:text-white transition cursor-pointer"
            >
              Choose PDF files (multiple selection allowed)
            </button>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You can select multiple PDF files at once
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Selected Files ({selectedFiles.length}) - Drag to reorder
              </h3>
              <div className="space-y-3">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg cursor-move transition ${
                      draggedIndex === index ? 'opacity-50 border-green-400 dark:border-green-600' : 'hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    <div className="flex-shrink-0 text-gray-500 dark:text-gray-400 font-bold text-lg">
                      {index + 1}
                    </div>
                    
                    {/* PDF Preview */}
                    <div className="flex-shrink-0 w-24 h-32 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 overflow-hidden">
                      {file.preview ? (
                        <iframe
                          src={file.preview}
                          className="w-full h-full"
                          title={`Preview ${file.name}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition"
                        title="Remove file"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleMerge}
            disabled={loading || selectedFiles.length < 2}
            className="w-full px-6 py-3 bg-green-primary text-white rounded-lg hover:bg-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {loading ? 'Merging PDFs...' : `Merge ${selectedFiles.length} PDF${selectedFiles.length !== 1 ? 's' : ''}`}
          </button>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Select multiple PDF files at once (minimum 2)</li>
              <li>Drag and drop files to reorder them as needed</li>
              <li>Files will be merged in the order shown (top to bottom)</li>
              <li>Click "Merge PDFs" to combine them into a single file</li>
              <li>The merged PDF will be downloaded automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergePDF;

