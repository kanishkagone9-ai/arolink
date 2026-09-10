import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert
} from 'react-native';
import { PatientRepository, MOCK_DEFAULT_PATIENT } from '../services/patientRepository';
import { StorageService } from '../services/storage';
import { VisitCard } from '../components/VisitCard';
import { OfflineBanner } from '../components/OfflineBanner';
import { TRANSLATIONS } from '../utils/translations';

export const PatientProfileScreen = ({ navigation, abhaId = "ABHA-1234-5678-9012", lang = 'mr' }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

  const [patient, setPatient] = useState(MOCK_DEFAULT_PATIENT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const loadPatientData = async () => {
    setLoading(true);
    const result = await PatientRepository.getPatient(abhaId);
    setPatient(result.data);
    setIsOffline(result.isOffline);

    const pending = await StorageService.getPendingVisits();
    setPendingCount(pending.length);
    setLoading(false);
  };

  useEffect(() => {
    loadPatientData();
  }, [abhaId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  const handleManualSync = async () => {
    const syncRes = await PatientRepository.syncPendingVisits();
    if (syncRes.success) {
      Alert.alert("Sync Complete", ${syncRes.count} );
      await loadPatientData();
    } else {
      Alert.alert("Sync Failed", "Could not reach ABDM backend. Will retry automatically.");
    }
  };

  const filteredVisits = useMemo(() => {
    if (!patient?.pastVisits) return [];
    if (!searchQuery.trim()) return patient.pastVisits;

    const q = searchQuery.toLowerCase();
    return patient.pastVisits.filter(visit => {
      const symptomsMatch = (visit.symptomsDisplay || '').toLowerCase().includes(q) ||
        (Array.isArray(visit.symptoms) && visit.symptoms.some(s => s.toLowerCase().includes(q)));
      const dateMatch = (visit.date || '').includes(q);
      const notesMatch = (visit.notes || '').toLowerCase().includes(q);
      return symptomsMatch || dateMatch || notesMatch;
    });
  }, [patient, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Status & Pending Sync Indicator */}
      <OfflineBanner
        isOffline={isOffline}
        pendingCount={pendingCount}
        onSync={handleManualSync}
        lang={lang}
      />

      {/* Patient Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View>
            <Text style={styles.patientName}>
              {lang === 'mr' ? (patient.nameMr || patient.nameEn) : patient.nameEn}
            </Text>
            <Text style={styles.demographics}>
              {patient.age} Yrs • {patient.gender} • 📍 {patient.village}
            </Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ {t.verified}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.abhaIdLabel}>{t.abhaId}:</Text>
          <Text style={styles.abhaIdValue}>{patient.abhaId}</Text>
        </View>
      </View>

      {/* Search Bar for Filtering Visits */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchVisits}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Visits List */}
      <View style={styles.listHeaderContainer}>
        <Text style={styles.listHeaderTitle}>{t.pastVisits}</Text>
        <Text style={styles.listCountBadge}>{filteredVisits.length}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D9E75" />
          <Text style={styles.loadingText}>Fetching ABDM Records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVisits}
          keyExtractor={(item) => item.id || item.offlineId || Math.random().toString()}
          renderItem={({ item }) => <VisitCard visit={item} lang={lang} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t.noVisits}</Text>
            </View>
          }
        />
      )}

      {/* Bottom Floating Action Button (FAB) to Navigate to Triage */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (navigation && navigation.navigate) {
            navigation.navigate('TriageScreen', { patient, lang });
          } else {
            console.log("Navigating to TriageScreen with patient:", patient.nameEn);
          }
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ {t.newVisit}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  demographics: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  verifiedBadge: {
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    color: '#03543F',
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  abhaIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginRight: 6,
  },
  abhaIdValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D9E75',
    letterSpacing: 0.5,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  listHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  listCountBadge: {
    marginLeft: 8,
    backgroundColor: '#E2E8F0',
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
