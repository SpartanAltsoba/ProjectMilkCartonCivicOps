import { db } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { CPSData, City } from "../types";

export class FirebaseAdmin {
  async fetchCPSData(city: City): Promise<CPSData> {
    try {
      // Query the database for CPS data related to the city
      const cpsQuery = query(collection(db, "cps_data"), where("city", "==", city));

      const snapshot = await getDocs(cpsQuery);

      if (snapshot.empty) {
        throw new Error(`No CPS data found for city: ${city}`);
      }

      // Get the first document (assuming one record per city)
      const doc = snapshot.docs[0];
      const data = doc.data();

      // Transform the data to match CPSData interface
      return {
        id: doc.id,
        city: data.city,
        state: data.state,
        county: data.county,
        caseCount: data.caseCount || 0,
        riskScore: data.riskScore || 0,
        agencies: data.agencies || [],
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
        ...data,
      } as CPSData;
    } catch (error) {
      console.error("Error fetching CPS data:", error);
      throw error;
    }
  }

  async saveCPSData(data: CPSData): Promise<void> {
    try {
      // Implementation for saving CPS data
      // This would use addDoc or setDoc to save to Firestore
      console.log("Saving CPS data:", data);
      // TODO: Implement actual save logic
    } catch (error) {
      console.error("Error saving CPS data:", error);
      throw error;
    }
  }
}
