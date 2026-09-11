// mobile/screens/QueueScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

// Mock queue data – you can replace with real API later
const initialQueue = [
  {
    id: '1',
    token: '001',
    patientName: 'Anita Sharma',
    abhaId: 'ABHA12345',
    arrivalTime: '09:15 AM',
    status: 'Waiting',
  },
  {
    id: '2',
    token: '002',
    patientName: 'Rohit Kumar',
    abhaId: 'ABHA67890',
    arrivalTime: '09:30 AM',
    status: 'Waiting',
  },
  {
    id: '3',
    token: '003',
    patientName: 'Sita Devi',
    abhaId: 'ABHA54321',
    arrivalTime: '09:45 AM',
    status: 'In consultation',
  },
  {
    id: '4',
    token: '004',
    patientName: 'Manoj Verma',
    abhaId: 'ABHA98765',
    arrivalTime: '10:00 AM',
    status: 'Waiting',
  },
];

type QueueItem = typeof initialQueue[0];

const QueueScreen: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);

  const handleMarkDone = (itemId: string) => {
    // Update status of the selected item to 'Done'
    const updated = queue.map((it) =>
      it.id === itemId ? { ...it, status: 'Done' } : it
    );
    // Move all Done items to the bottom while preserving order of others
    const notDone = updated.filter((it) => it.status !== 'Done');
    const done = updated.filter((it) => it.status === 'Done');
    setQueue([...notDone, ...done]);
  };

  const waitingCount = queue.filter((it) => it.status === 'Waiting').length;

  const renderItem = ({ item }: { item: QueueItem }) => {
    const isDone = item.status === 'Done';
    return (
      <View style={[styles.row, isDone && styles.rowDone]}>
        <Text style={[styles.cell, isDone && styles.textDone]}>{item.token}</Text>
        <Text style={[styles.cell, isDone && styles.textDone]}>{item.patientName}</Text>
        <Text style={[styles.cell, isDone && styles.textDone]}>{item.abhaId}</Text>
        <Text style={[styles.cell, isDone && styles.textDone]}>{item.arrivalTime}</Text>
        <Text style={[styles.cell, isDone && styles.textDone]}>{item.status}</Text>
        {item.status !== 'Done' && (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => handleMarkDone(item.id)}
          >
            <Text style={styles.doneButtonText}>Mark done</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Currently waiting: {waitingCount} patients</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Token</Text>
        <Text style={styles.headerCell}>Patient</Text>
        <Text style={styles.headerCell}>ABHA ID</Text>
        <Text style={styles.headerCell}>Arrival</Text>
        <Text style={styles.headerCell}>Status</Text>
        <Text style={styles.headerCell}> </Text>
      </View>
      <FlatList
        data={queue}
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
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D9E75', // teal accent
    marginBottom: 12,
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
    color: '#374151',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowDone: {
    backgroundColor: '#F3F4F6',
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  textDone: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  doneButton: {
    backgroundColor: '#1D9E75', // teal
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  doneButtonText: {
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

export default QueueScreen;
