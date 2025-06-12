import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

// Custom hook to handle Firestore interactions (web version)
export function useFirestore(collectionName: string) {
  const [documents, setDocuments] = useState<FirestoreDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const ref = collection(firestore, collectionName);
      const snapshot = await getDocs(ref);
      const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
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
      const ref = collection(firestore, collectionName);
      const docRef = await addDoc(ref, newDoc);
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
      const docRef = doc(firestore, collectionName, id);
      await updateDoc(docRef, updatedData);
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
      const docRef = doc(firestore, collectionName, id);
      await deleteDoc(docRef);
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
