import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from './firebase';

// Utility class for handling Firebase Storage operations
export default class StorageService {
    private storage;

    constructor() {
        this.storage = getStorage();
    }

    /**
     * Uploads a file to Firebase Storage and saves metadata to Firestore.
     * 
     * @param {File} file The file to upload.
     * @param {string} path The storage path.
     * @param {Object} metadataMetadata to save alongside the file.
     * @returns {Promise<string>} The download URL of the uploaded file.
     */
    async uploadFile(file: File, path: string, metadata: object): Promise<string> {
        return new Promise((resolve, reject) => {
            // Create a storage reference from the file path
            const storageRef = ref(this.storage, path);

            // Start the file upload
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Attach progress, pause, and resume handlers
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Handle progress
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload is ${progress}% done`);
                },
                (error) => {
                    // Handle errors
                    switch (error.code) {
                        case 'storage/unauthorized':
                            reject('User doesn’t have permission to access the object');
                            break;
                        case 'storage/canceled':
                            reject('User canceled the upload');
                            break;
                        case 'storage/unknown':
                        default:
                            reject('Unknown error occurred, inspect error.serverResponse');
                            break;
                    }
                },
                () => {
                    // Upload completed successfully, get the download URL
                    getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                        try {
                            // Save metadata to Firestore
                            await addDoc(collection(firestore, 'files'), { ...metadata, downloadURL });
                            resolve(downloadURL);
                        } catch (firestoreError) {
                            reject('Failed to save metadata to Firestore: ' + firestoreError);
                        }
                    }).catch(downloadURLError => {
                        reject('Failed to get download URL: ' + downloadURLError);
                    });
                }
            );
        });
    }
}