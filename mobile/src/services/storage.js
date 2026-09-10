import { CONFIG } from '../config/config';

// In-memory fallback if AsyncStorage is unavailable
let memoryStore = {};

export const LocalStore = {
  async getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStore[key] || null;
    } catch {
      return memoryStore[key] || null;
    }
  },

  async setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      memoryStore[key] = value;
    } catch {
      memoryStore[key] = value;
    }
  },

  async removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      delete memoryStore[key];
    } catch {
      delete memoryStore[key];
    }
  }
};

const PENDING_VISITS_KEY = 'arolink_pending_visits_queue';
const PATIENT_CACHE_KEY_PREFIX = 'arolink_patient_cache_';

export const StorageService = {
  // Get all queued offline visits
  async getPendingVisits() {
    const data = await LocalStore.getItem(PENDING_VISITS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Enqueue a visit logged while offline
  async enqueueVisit(visit) {
    const queue = await this.getPendingVisits();
    const offlineVisit = {
      ...visit,
      offlineId: 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      synced: false,
      queuedAt: new Date().toISOString()
    };
    queue.push(offlineVisit);
    await LocalStore.setItem(PENDING_VISITS_KEY, JSON.stringify(queue));
    return offlineVisit;
  },

  // Clear specific visit or all pending visits after successful backend sync
  async removePendingVisits(syncedOfflineIds = []) {
    const queue = await this.getPendingVisits();
    const remaining = queue.filter(item => !syncedOfflineIds.includes(item.offlineId));
    await LocalStore.setItem(PENDING_VISITS_KEY, JSON.stringify(remaining));
  },

  // Cache patient profile locally
  async cachePatient(patient) {
    if (!patient || !patient.abhaId) return;
    await LocalStore.setItem(PATIENT_CACHE_KEY_PREFIX + patient.abhaId, JSON.stringify(patient));
  },

  // Retrieve cached patient profile
  async getCachedPatient(abhaId) {
    const data = await LocalStore.getItem(PATIENT_CACHE_KEY_PREFIX + abhaId);
    return data ? JSON.parse(data) : null;
  }
};
