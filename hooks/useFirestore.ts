import { useState, useEffect, useCallback } from 'react';
import { firestore } from '../lib/firebase';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Custom hook to handle Firestore interactions
export function useFirestore(collectionName: string) {
  const [documents, setDocuments] = useState<FirebaseFirestoreTypes.DocumentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await firestore().collection(collectionName).get();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const addDocument = async (newDoc: object) => {
    setLoading(true);
    try {
      const docRef = await firestore().collection(collectionName).add(newDoc);
      setDocuments(prevDocs => [...prevDocs, { id: docRef.id, ...newDoc }]);
    } catch (err) {
      console.error('Error adding document:', err);
      setError('Failed to add document. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (id: string, updatedData: object) => {
    setLoading(true);
    try {
      await firestore().collection(collectionName).doc(id).update(updatedData);
      setDocuments(prevDocs => prevDocs.map(doc => (doc.id === id ? { ...doc, ...updatedData } : doc)));
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update document. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setLoading(true);
    try {
      await firestore().collection(collectionName).doc(id).delete();
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return { documents, loading, error, fetchDocuments, addDocument, updateDocument, deleteDocument };
}