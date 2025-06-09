import { db } from "../lib/firebase";
import { logger } from "../lib/logger";

export class Firestore {
  async getCollection(collectionName: string) {
    try {
      const snapshot = await db.collection(collectionName).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      logger.error(`Error getting collection ${collectionName}:`, error);
      throw error;
    }
  }

  async addDocument(collectionName: string, data: any) {
    try {
      const docRef = await db.collection(collectionName).add(data);
      logger.info(`Document added to ${collectionName}`, { id: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      await db.collection(collectionName).doc(docId).update(data);
      logger.info(`Document updated in ${collectionName}`, { id: docId });
    } catch (error) {
      logger.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, docId: string) {
    try {
      await db.collection(collectionName).doc(docId).delete();
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
