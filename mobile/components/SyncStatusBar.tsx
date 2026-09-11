// mobile/components/SyncStatusBar.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getQueue } from '../utils/syncManager';

/**
 * SyncStatusBar – shows sync status at the top of every screen.
 *   • Orange banner when there are pending actions in the queue.
 *   • Green banner that briefly (2 s) appears after all items have synced.
 */
const SyncStatusBar: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [showAllSynced, setShowAllSynced] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const refreshQueue = async () => {
    try {
      const queue = await getQueue();
      const count = queue?.length ?? 0;
      setPendingCount(prev => {
        if (prev > 0 && count === 0) {
          // Queue just emptied – trigger green banner.
          setShowAllSynced(true);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setTimeout(() => {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => setShowAllSynced(false));
            }, 2000);
          });
        }
        return count;
      });
    } catch (e) {
      console.error('SyncStatusBar: error reading queue', e);
    }
  };

  useEffect(() => {
    refreshQueue();
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) refreshQueue();
    });
    const intervalId = setInterval(refreshQueue, 10000);
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  if (pendingCount > 0) {
    return (
      <View style={styles.orangeBar}>
        <Text style={styles.text}>{pendingCount} actions pending sync</Text>
      </View>
    );
  }

  if (showAllSynced) {
    return (
      <Animated.View style={[styles.greenBar, { opacity: fadeAnim }] }>
        <Text style={styles.text}>All synced ✓</Text>
      </Animated.View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  orangeBar: {
    backgroundColor: '#F97316',
    paddingVertical: 6,
    alignItems: 'center',
  },
  greenBar: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SyncStatusBar;
