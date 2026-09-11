// mobile/screens/ReferralTrackerScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

// Mock referral data – one entry for each possible status
const mockReferrals = [
  {
    id: '1',
    patientName: 'Anita Sharma',
    facilityName: 'Primary Health Center - A',
    dateRaised: '2026-09-01',
    status: 'Sent', // grey
  },
  {
    id: '2',
    patientName: 'Rohit Kumar',
    facilityName: 'Community Clinic - B',
    dateRaised: '2026-09-03',
    status: 'Received', // blue
  },
  {
    id: '3',
    patientName: 'Sita Devi',
    facilityName: 'District Hospital - C',
    dateRaised: '2026-09-05',
    status: 'Attended', // green
  },
  {
    id: '4',
    patientName: 'Manoj Verma',
    facilityName: 'Sub‑Center - D',
    dateRaised: '2026-09-07',
    status: 'Missed', // red
  },
];

// Helper to map status to colors and labels
const statusMap: Record<string, { label: string; color: string }> = {
  Sent: { label: 'Sent', color: '#9CA3AF' }, // grey
  Received: { label: 'Received by facility', color: '#3B82F6' }, // blue
  Attended: { label: 'Appointment attended', color: '#10B981' }, // green
  Missed: { label: 'Missed', color: '#EF4444' }, // red
};

const ReferralTrackerScreen: React.FC = () => {
  const renderItem = ({ item }: { item: typeof mockReferrals[0] }) => {
    const { label, color } = statusMap[item.status] || statusMap['Sent'];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: color }] }>
            <Text style={styles.statusText}>{label}</Text>
          </View>
        </View>
        <Text style={styles.facility}>Referred to: {item.facilityName}</Text>
        <Text style={styles.date}>Date raised: {item.dateRaised}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Referral Tracker</Text>
      <FlatList
        data={mockReferrals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1D9E75', // teal accent (consistent with other screens)
    marginBottom: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  facility: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ReferralTrackerScreen;
