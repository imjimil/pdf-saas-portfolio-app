import { useState, useRef, useEffect } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  reset?: boolean;
}

const FileUpload = ({ onFileSelect, accept, label = 'Choose file', reset = false }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset file when reset prop changes
  useEffect(() => {
    if (reset && fileInputRef.current) {
      setFile(null);
      fileInputRef.current.value = '';
    }
  }, [reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        className="w-full px-4 py-3 border-2 border-dashed border-green-primary dark:border-green-light rounded-lg text-green-primary dark:text-green-light hover:bg-green-primary dark:hover:bg-green-dark hover:text-white transition cursor-pointer"
      >
        {file ? file.name : label}
      </button>
      {file && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
    </div>
  );
};

export default FileUpload;
