import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_QUEUE_KEY = 'sync_queue';

/**
 * Save an action to AsyncStorage under 'sync_queue'
 * @param {('visit'|'dispense'|'referral')} type - Type of payload
 * @param {Object} data - Payload data
 * @returns {Promise<Object>} The saved queue item
 */
export const saveToQueue = async (type, data) => {
  try {
    const item = {
      id: String(Date.now()),
      type,
      data,
      created_at: new Date().toISOString(),
    };

    const existingRaw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const existingQueue = existingRaw ? JSON.parse(existingRaw) : [];
    const updatedQueue = [...existingQueue, item];

    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
    return item;
  } catch (error) {
    console.error('Error in saveToQueue:', error);
    throw error;
  }
};

/**
 * Returns all pending items from 'sync_queue'
 * @returns {Promise<Array>} List of pending items
 */
export const getQueue = async () => {
  try {
    const queueRaw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return queueRaw ? JSON.parse(queueRaw) : [];
  } catch (error) {
    console.error('Error in getQueue:', error);
    return [];
  }
};

/**
 * Removes a synced item from 'sync_queue' by ID
 * @param {string|number} id - Item ID (timestamp)
 * @returns {Promise<Array>} Remaining items in the queue
 */
export const clearItem = async (id) => {
  try {
    const existingRaw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const existingQueue = existingRaw ? JSON.parse(existingRaw) : [];
    const updatedQueue = existingQueue.filter(
      (item) => String(item.id) !== String(id)
    );

    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
    return updatedQueue;
  } catch (error) {
    console.error('Error in clearItem:', error);
    throw error;
  }
};

export default {
  saveToQueue,
  getQueue,
  clearItem,
};
