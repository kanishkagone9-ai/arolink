import { CONFIG } from '../config/config';

export const ApiService = {
  async getPatient(abhaId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS || 5000);

    try {
      const response = await fetch(${CONFIG.BASE_URL}/api/v1/patients/, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(Server returned HTTP );
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  async postVisit(visitPayload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS || 5000);

    try {
      const response = await fetch(${CONFIG.BASE_URL}/api/v1/visits, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(Server returned HTTP );
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  async syncBatchVisits(visitsArray) {
    const response = await fetch(${CONFIG.BASE_URL}/api/v1/visits/sync, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visits: visitsArray })
    });
    if (!response.ok) {
      throw new Error(Sync failed with HTTP );
    }
    return await response.json();
  }
};
