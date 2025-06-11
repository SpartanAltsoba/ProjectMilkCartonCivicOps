import { useState, useCallback } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, StorageError } from 'firebase/storage';

const useStorage = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  /**
   * Uploads a file to Firebase Storage and updates state with progress and resulting file URL.
   * @param file The file to be uploaded.
   * @param path The path in the storage bucket where the file should be saved.
   */
  const uploadFile = useCallback((file: File, path: string) => {
    setUploadProgress(0);
    setError(null);
    setUrl(null);
    
    const storage = getStorage();
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error: StorageError) => {
        switch (error.code) {
          case 'storage/unauthorized':
            setError('User doesn’t have permission to access the object');
            break;
          case 'storage/canceled':
            setError('User canceled the upload');
            break;
          default:
            setError('An unknown error occurred');
            break;
        }
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setUrl(downloadURL);
        }).catch((err) => {
          setError('Failed to retrieve download URL');
        });
      }
    );
  }, []);

  return { uploadProgress, error, url, uploadFile };
};

export default useStorage;