import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const VisitCard = ({ visit, lang = 'mr' }) => {
  const isReferred = visit.decision === 'REFERRED';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.dateText}>📅 {visit.date}</Text>
        <View style={[styles.badge, isReferred ? styles.referredBadge : styles.localCareBadge]}>
          <Text style={[styles.badgeText, isReferred ? styles.referredText : styles.localCareText]}>
            {isReferred ? '🚨 Referred / संदर्भित' : '✅ Local Care / स्थानिक उपचार'}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>Symptoms:</Text>
        <Text style={styles.symptomsText}>
          {visit.symptomsDisplay || (Array.isArray(visit.symptoms) ? visit.symptoms.join(', ') : 'None')}
        </Text>

        {visit.medicinesDispensed && (
          <View style={styles.medicineRow}>
            <Text style={styles.sectionLabel}>Dispensed:</Text>
            <Text style={styles.medicineText}>💊 {visit.medicinesDispensed}</Text>
          </View>
        )}

        {visit.notes && (
          <Text style={styles.notesText}>📝 {visit.notes}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  localCareBadge: {
    backgroundColor: '#DCFCE7',
  },
  referredBadge: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  localCareText: {
    color: '#15803D',
  },
  referredText: {
    color: '#B91C1C',
  },
  body: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  symptomsText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    marginBottom: 4,
  },
  medicineRow: {
    marginTop: 4,
  },
  medicineText: {
    fontSize: 13,
    color: '#0F766E',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  }
});
