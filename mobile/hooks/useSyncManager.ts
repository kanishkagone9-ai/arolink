// src/hooks/useSyncManager.ts
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getQueue, clearItem } from '../utils/syncManager';

// Base URL for the backend – adjust as needed for the environment
const API_BASE_URL = 'http://localhost:8000';

/**
 * useSyncManager – runs once on app launch and attempts to flush the offline
 * sync queue when an internet connection is available.
 *
 * The queue items have the shape:
 *   {
 *     id: string;          // timestamp identifier
 *     type: 'visit' | 'dispense' | 'referral';
 *     data: any;           // payload to be sent to the backend
 *     created_at: string;
 *   }
 *
 * Depending on the `type` the request is POSTed to the appropriate endpoint.
 * On a successful response (status 2xx) the item is removed from the queue.
 * Failures keep the item for the next attempt.
 */
export default function useSyncManager() {
  useEffect(() => {
    // Helper that performs the sync when we have connectivity
    const runSync = async () => {
      try {
        const queue = await getQueue();
        if (!queue || queue.length === 0) return;

        // Process each queued item sequentially – this avoids race conditions on the storage.
        for (const item of queue) {
          const endpointMap: Record<string, string> = {
            visit: '/visits',
            dispense: '/stock/dispense',
            referral: '/referrals',
          };

          const endpoint = endpointMap[item.type];
          if (!endpoint) {
            // Unknown type – skip it but keep it for manual inspection.
            console.warn(`useSyncManager: unknown sync type "${item.type}"`);
            continue;
          }

          try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(item.data),
            });

            if (response.ok) {
              // Successfully synced – remove from the queue.
              await clearItem(item.id);
            } else {
              // Server responded with an error – leave the item for later retry.
              console.warn(
                `useSyncManager: failed to sync ${item.type} (id=${item.id}), status=${response.status}`
              );
            }
          } catch (err) {
            // Network or unexpected error – keep the item.
            console.warn(`useSyncManager: network error while syncing ${item.type} (id=${item.id})`, err);
          }
        }
      } catch (e) {
        console.error('useSyncManager: error reading sync queue', e);
      }
    };

    // Subscribe to connection changes.
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        runSync();
      }
    });

    // Also check the current connectivity immediately on mount.
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        runSync();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
