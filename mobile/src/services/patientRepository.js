import { ApiService } from './api';
import { StorageService } from './storage';

// Default mock patient for instant dev testing (Ramesh Kumar)
export const MOCK_DEFAULT_PATIENT = {
  abhaId: "ABHA-1234-5678-9012",
  nameEn: "Ramesh Kumar",
  nameHi: "रमेश कुमार",
  nameMr: "रमेश कुमार",
  age: 45,
  gender: "Male",
  village: "Dharampur (धरमपूर)",
  subCentre: "Dharampur SC",
  phcAssigned: "Warud PHC",
  isAbhaVerified: true,
  pastVisits: [
    {
      id: "v_101",
      date: "2026-08-15",
      symptoms: ["fever", "cough"],
      symptomsDisplay: "Fever (ताप), Cough (खोकला)",
      decision: "LOCAL_CARE",
      medicinesDispensed: "Paracetamol 500mg (10 tabs), ORS (2 pkts)",
      notes: "Routine seasonal viral fever. Advised hydration."
    },
    {
      id: "v_102",
      date: "2026-07-02",
      symptoms: ["vomiting"],
      symptomsDisplay: "Vomiting / Dehydration (उलट्या)",
      decision: "LOCAL_CARE",
      medicinesDispensed: "ORS Packets (4 pkts), Zinc 20mg",
      notes: "Mild gastroenteritis. Recovered well."
    },
    {
      id: "v_103",
      date: "2026-05-18",
      symptoms: ["chest_pain", "breathlessness"],
      symptomsDisplay: "Chest pain (छातीत दुखणे), Breathlessness (श्वास घेण्यास त्रास)",
      decision: "REFERRED",
      medicinesDispensed: "Referred to Sub-District Hospital",
      notes: "Emergency cardiology referral triggered."
    }
  ]
};

export const PatientRepository = {
  /**
   * Loads patient data: tries API first, then falls back to local cache or seed mock
   */
  async getPatient(abhaId = "ABHA-1234-5678-9012") {
    try {
      const liveData = await ApiService.getPatient(abhaId);
      // Cache for offline usage
      await StorageService.cachePatient(liveData);
      return { data: liveData, isOffline: false };
    } catch (networkError) {
      console.warn("Network request failed, checking offline cache:", networkError.message);
      const cached = await StorageService.getCachedPatient(abhaId);
      if (cached) {
        return { data: cached, isOffline: true };
      }
      // Return seed mock if no cache yet
      await StorageService.cachePatient(MOCK_DEFAULT_PATIENT);
      return { data: MOCK_DEFAULT_PATIENT, isOffline: true };
    }
  },

  /**
   * Logs a visit: tries API; if offline, enqueues to AsyncStorage
   */
  async saveVisit(visitPayload) {
    try {
      const result = await ApiService.postVisit(visitPayload);
      return { success: true, isOffline: false, data: result };
    } catch (networkError) {
      console.warn("Saving visit offline due to network error:", networkError.message);
      const queued = await StorageService.enqueueVisit(visitPayload);
      return { success: true, isOffline: true, data: queued };
    }
  },

  /**
   * Flushes all queued offline visits to backend
   */
  async syncPendingVisits() {
    const queue = await StorageService.getPendingVisits();
    if (!queue || queue.length === 0) return { count: 0, success: true };

    try {
      const syncResult = await ApiService.syncBatchVisits(queue);
      const syncedIds = queue.map(q => q.offlineId);
      await StorageService.removePendingVisits(syncedIds);
      return { count: queue.length, success: true, data: syncResult };
    } catch (error) {
      console.error("Batch sync failed:", error);
      return { count: queue.length, success: false, error };
    }
  }
};
