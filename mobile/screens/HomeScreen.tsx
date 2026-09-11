import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';

export interface PatientTask {
  id: string;
  name: string;
  village: string;
  priority: 'urgent' | 'follow-up' | 'scheduled';
  reason: string;
}

interface HomeScreenProps {
  ashaName?: string;
  onSelectTask?: (task: PatientTask) => void;
}

type FilterTab = 'all' | 'urgent' | 'follow-up';

const TEAL_ACCENT = '#1D9E75';

const MOCK_PATIENTS: PatientTask[] = [
  {
    id: '1',
    name: 'Anita Devi',
    village: 'Chandpur',
    priority: 'urgent',
    reason: 'Missed TB dose',
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    village: 'Madhupur',
    priority: 'follow-up',
    reason: 'Prenatal checkup due',
  },
  {
    id: '3',
    name: 'Pooja Sharma',
    village: 'Kalyanpur',
    priority: 'scheduled',
    reason: 'Childhood vaccination due',
  },
  {
    id: '4',
    name: 'Ramesh Verma',
    village: 'Rampur',
    priority: 'urgent',
    reason: 'High blood pressure follow-up',
  },
];

const PRIORITY_STYLES = {
  urgent: {
    label: 'Urgent',
    bg: '#FEE2E2',
    text: '#991B1B',
    dot: '#EF4444',
  },
  'follow-up': {
    label: 'Follow-up',
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#F59E0B',
  },
  scheduled: {
    label: 'Scheduled',
    bg: '#D1FAE5',
    text: '#065F46',
    dot: '#10B981',
  },
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  ashaName = 'Sunita Devi',
  onSelectTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const getFormattedDate = (): string => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    return today.toLocaleDateString('en-US', options);
  };

  // Filter patients based on active tab and search query
  const filteredPatients = useMemo(() => {
    return MOCK_PATIENTS.filter((patient) => {
      // Name Search Filter
      const matchesSearch = patient.name
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      // Priority Tab Filter
      const matchesTab =
        activeTab === 'all' || patient.priority === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_ACCENT} />

      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning, {ashaName}</Text>
        <Text style={styles.dateText}>{getFormattedDate()}</Text>
      </View>

      {/* Search Bar & Filter Tabs Controls */}
      <View style={styles.controlContainer}>
        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs Header */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.activeTabButton]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'urgent' && styles.activeTabButton]}
            onPress={() => setActiveTab('urgent')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'urgent' && styles.activeTabText]}>
              Urgent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'follow-up' && styles.activeTabButton]}
            onPress={() => setActiveTab('follow-up')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'follow-up' && styles.activeTabText]}>
              Follow-up
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Scroll Area */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Patient Tasks</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredPatients.length}</Text>
          </View>
        </View>

        {/* Patient Task Cards */}
        {filteredPatients.length > 0 ? (
          filteredPatients.map((item) => {
            const badgeStyle = PRIORITY_STYLES[item.priority];

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => onSelectTask && onSelectTask(item)}
              >
                {/* Left Accent Bar */}
                <View style={[styles.cardAccentBar, { backgroundColor: badgeStyle.dot }]} />

                <View style={styles.cardContent}>
                  {/* Top Row: Name and Priority Badge */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.patientName}>{item.name}</Text>
                    <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                      <View style={[styles.badgeDot, { backgroundColor: badgeStyle.dot }]} />
                      <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
                        {badgeStyle.label}
                      </Text>
                    </View>
                  </View>

                  {/* Village Location */}
                  <View style={styles.detailRow}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.villageText}>{item.village}</Text>
                  </View>

                  {/* Reason */}
                  <View style={styles.reasonContainer}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or filter tab</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: TEAL_ACCENT,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#E6F4F0',
    fontWeight: '500',
  },
  controlContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearButton: {
    fontSize: 14,
    color: '#9CA3AF',
    paddingHorizontal: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    flex: 1,
  },
  activeTabButton: {
    borderBottomColor: TEAL_ACCENT,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    fontWeight: '700',
    color: TEAL_ACCENT,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  countBadge: {
    backgroundColor: TEAL_ACCENT,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardAccentBar: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  villageText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginRight: 6,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default HomeScreen;
