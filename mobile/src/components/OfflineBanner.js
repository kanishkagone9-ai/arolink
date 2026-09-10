import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TRANSLATIONS } from '../utils/translations';

export const OfflineBanner = ({ isOffline, pendingCount = 0, onSync, lang = 'mr' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

  if (!isOffline && pendingCount === 0) return null;

  return (
    <View style={[styles.container, isOffline ? styles.offlineBg : styles.pendingBg]}>
      <View style={styles.textRow}>
        <Text style={styles.icon}>{isOffline ? '⚡' : '🔄'}</Text>
        <Text style={styles.text}>
          {isOffline ? t.offlineNotice : ${pendingCount} }
        </Text>
      </View>
      {pendingCount > 0 && onSync && (
        <TouchableOpacity style={styles.syncBtn} onPress={onSync}>
          <Text style={styles.syncBtnText}>{t.syncNow}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  offlineBg: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEEBA',
  },
  pendingBg: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: '#BEE5EB',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '600',
  },
  syncBtn: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  }
});
