import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export const db = admin.firestore();

export async function getData(collectionName: string, documentId: string) {
  try {
    const docRef = db.collection(collectionName).doc(documentId);
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
      throw new Error(`Document ${documentId} not found in collection ${collectionName}`);
    }
    return docSnapshot.data();
  } catch (error) {
    console.error(`Error fetching document: ${error.message}`);
    throw new Error('Failed to fetch data from the database.');
  }
}

export async function setData(collectionName: string, documentId: string, data: object) {
  try {
    const docRef = db.collection(collectionName).doc(documentId);
    await docRef.set(data, { merge: true });
    return `Document ${documentId} set successfully in collection ${collectionName}`;
  } catch (error) {
    console.error(`Error setting document: ${error.message}`);
    throw new Error('Failed to set data in the database.');
  }
}

export async function deleteData(collectionName: string, documentId: string) {
  try {
    const docRef = db.collection(collectionName).doc(documentId);
    await docRef.delete();
    return `Document ${documentId} deleted successfully from collection ${collectionName}`;
  } catch (error) {
    console.error(`Error deleting document: ${error.message}`);
    throw new Error('Failed to delete data from the database.');
  }
}