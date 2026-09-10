import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const SymptomItem = ({ item, isSelected, onToggle, lang = 'mr' }) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        item.isRedFlag && styles.cardRedFlag
      ]}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.leftRow}>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.labelContainer}>
          <Text style={[styles.mainLabel, isSelected && styles.mainLabelSelected]}>
            {lang === 'mr' ? item.labelMr : lang === 'hi' ? item.labelHi : item.labelEn}
          </Text>
          <Text style={styles.subLabel}>
            {item.labelEn} {item.labelHi !== item.labelMr ? •  : ''}
          </Text>
        </View>
      </View>

      {item.isRedFlag && (
        <View style={styles.redFlagBadge}>
          <Text style={styles.redFlagText}>⚠️ RED FLAG</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardSelected: {
    borderColor: '#1D9E75',
    backgroundColor: '#F0FDF4',
  },
  cardRedFlag: {
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  labelContainer: {
    flex: 1,
  },
  mainLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  mainLabelSelected: {
    color: '#0F766E',
  },
  subLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  redFlagBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  redFlagText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
