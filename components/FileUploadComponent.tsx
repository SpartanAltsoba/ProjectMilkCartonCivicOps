import React, { useState, ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import useStorage from '../hooks/useStorage';
import { useFirestore } from '../hooks/useFirestore';

interface FileUploadComponentProps {
  onUpload: (fileUrl: string) => void;
  fileTypes: string[];
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({ onUpload, fileTypes }) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { uploadFile } = useStorage();
  const { addDocument } = useFirestore('jobs');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? e.target.files[0] : null;
    if (selected && fileTypes.includes(selected.type)) {
      setFile(selected);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid file type.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      // Only two arguments: file and userId (no setProgress)
      const fileUrl = await uploadFile(file, user?.uid || 'anonymous');
      // Add document to 'jobs' collection (since you did useFirestore('jobs'))
      await addDocument({
        name: file.name,
        url: fileUrl,
        createdAt: new Date(),
        owner: user?.uid || 'anonymous',
      });
      onUpload(fileUrl);
      setFile(null);
      setProgress(0);
    } catch (uploadError) {
      setError('File upload failed. Please try again.');
      console.error('Upload error:', uploadError);
    }
  };

  return (
    <div className="file-upload-component">
      <input type="file" onChange={handleFileChange} />
      {progress > 0 && <p>Uploading: {progress}%</p>}
      {error && <p className="error">{error}</p>}
      <button onClick={handleUpload} disabled={!file}>Upload</button>
      <style jsx>{`
        .file-upload-component {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px;
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .error {
          color: red;
        }
      `}</style>
    </div>
  );
};

export default FileUploadComponent;
