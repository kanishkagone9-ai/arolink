// mobile/screens/StockScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';

// Base URL – adjust if your backend runs elsewhere
const API_BASE_URL = 'http://localhost:8000';

type Medicine = {
  id: string; // unique identifier (could be name)
  name: string;
  current_stock: number;
  last_dispensed: string; // ISO date string or formatted text
};

// Placeholder types for other endpoints – stored for future use
type QueueItem = any;
type ReferralItem = any;

const StockScreen: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [queueToday, setQueueToday] = useState<QueueItem[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockRes, queueRes, referralsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stock/summary`),
        fetch(`${API_BASE_URL}/queue/today`),
        fetch(`${API_BASE_URL}/referrals/incoming`),
      ]);

      if (!stockRes.ok) throw new Error('Failed to fetch stock summary');
      const stockData: Medicine[] = await stockRes.json();
      setMedicines(stockData);

      if (queueRes.ok) {
        const qData = await queueRes.json();
        setQueueToday(qData);
      }

      if (referralsRes.ok) {
        const rData = await referralsRes.json();
        setIncomingReferrals(rData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30_000); // 30 seconds
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleRequestRestock = (id: string) => {
    setRequested((prev) => new Set(prev).add(id));
    // In a real app you would POST to a restock endpoint here.
  };

  const renderItem = ({ item }: { item: Medicine }) => {
    const isRequested = requested.has(item.id);
    const statusColor =
      item.current_stock > 20
        ? '#10B981' // green
        : item.current_stock >= 10
        ? '#F59E0B' // yellow (amber)
        : '#EF4444'; // red
    return (
      <View style={styles.row}>
        <Text style={styles.cell}>{item.name}</Text>
        <Text style={styles.cell}>{item.current_stock}</Text>
        <Text style={styles.cell}>{item.last_dispensed}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>●</Text>
        </View>
        <TouchableOpacity
          style={[styles.requestButton, isRequested && styles.requestedButton]}
          onPress={() => handleRequestRestock(item.id)}
          disabled={isRequested}
        >
          <Text style={styles.requestButtonText}>
            {isRequested ? 'Requested ✓' : 'Request restock'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medicine Stock</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Medicine</Text>
        <Text style={styles.headerCell}>Current Stock</Text>
        <Text style={styles.headerCell}>Last Dispensed</Text>
        <Text style={styles.headerCell}>Status</Text>
        <Text style={styles.headerCell}> </Text>
      </View>
      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1D9E75', // teal accent
    marginBottom: 12,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  headerCell: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  statusBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
    paddingVertical: 2,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
  requestButton: {
    flex: 1,
    backgroundColor: '#1D9E75',
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  requestedButton: {
    backgroundColor: '#9CA3AF',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
});

export default StockScreen;
