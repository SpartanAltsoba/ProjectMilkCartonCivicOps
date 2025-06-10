import { db } from "../../lib/firebase";
import { logger } from "../../lib/logger";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

export class Firestore {
  async getCollection(collectionName: string) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error(`Error getting collection ${collectionName}:`, error);
      throw error;
    }
  }

  async addDocument(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      logger.info(`Document added to ${collectionName}`, { id: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      await updateDoc(doc(db, collectionName, docId), data);
      logger.info(`Document updated in ${collectionName}`, { id: docId });
    } catch (error) {
      logger.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, docId: string) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      logger.info(`Document deleted from ${collectionName}`, { id: docId });
    } catch (error) {
      logger.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  async storeStatesAndCounties(data: any) {
    try {
      await this.addDocument("states-counties", {
        ...data,
        timestamp: new Date(),
      });
      logger.info("States and counties data stored successfully");
    } catch (error) {
      logger.error("Error storing states and counties data:", error);
      throw error;
    }
  }
}
