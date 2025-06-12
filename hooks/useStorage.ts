import { getStorage, ref, uploadBytesResumable, getDownloadURL, StorageError } from 'firebase/storage';
import { useState, useCallback } from 'react';

const useStorage = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Uploads a file to Firebase Storage and returns the download URL.
   * @param file The file to be uploaded.
   * @param path The path in the storage bucket where the file should be saved.
   * @returns Promise<string> The download URL of the uploaded file.
   */
  const uploadFile = useCallback((file: File, path: string): Promise<string> => {
    setUploadProgress(0);
    setError(null);

    const storage = getStorage();
    const storageRef = ref(storage, path);

    return new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
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
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              resolve(downloadURL);
            })
            .catch((err) => {
              setError('Failed to retrieve download URL');
              reject(err);
            });
        }
      );
    });
  }, []);

  return { uploadProgress, error, uploadFile };
};

export default useStorage;
