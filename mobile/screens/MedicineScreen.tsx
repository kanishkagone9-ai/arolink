import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  StatusBar,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MedicineItem {
  id: string;
  name: string;
  quantity: number;
}

export interface PendingDispenseRecord {
  id: string;
  medicine_name: string;
  quantity_dispensed: number;
  patient_id: string;
  asha_id: string;
  timestamp: string;
}

interface MedicineScreenProps {
  ashaId?: string;
  patientId?: string;
  apiBaseUrl?: string;
  onStockUpdated?: (updatedList: MedicineItem[]) => void;
}

const TEAL_ACCENT = '#1D9E75';
const ASYNC_STORAGE_KEY = 'pending_dispense';

const INITIAL_STOCK: MedicineItem[] = [
  { id: '1', name: 'Paracetamol 500mg', quantity: 40 },
  { id: '2', name: 'ORS Sachets', quantity: 25 },
  { id: '3', name: 'Iron tablets', quantity: 60 },
  { id: '4', name: 'Amoxicillin 250mg', quantity: 30 },
];

export const MedicineScreen: React.FC<MedicineScreenProps> = ({
  ashaId = 'ASHA-101',
  patientId = '1',
  apiBaseUrl = 'http://localhost:8000',
  onStockUpdated,
}) => {
  const [medicines, setMedicines] = useState<MedicineItem[]>(INITIAL_STOCK);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineItem | null>(null);
  const [dispenseAmount, setDispenseAmount] = useState<string>('1');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toast Notification State
  const [toastConfig, setToastConfig] = useState<{
    message: string;
    type: 'success' | 'offline';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'offline') => {
    setToastConfig({ message, type });
    setTimeout(() => {
      setToastConfig(null);
    }, 3500);
  };

  const handleOpenDispenseModal = (medicine: MedicineItem) => {
    setSelectedMedicine(medicine);
    setDispenseAmount('1');
    setErrorMsg('');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMedicine(null);
    setDispenseAmount('1');
    setErrorMsg('');
    setIsSubmitting(false);
  };

  // Helper to save offline record in AsyncStorage under 'pending_dispense'
  const saveOfflineDispenseRecord = async (record: PendingDispenseRecord) => {
    try {
      const existingRaw = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      const existingRecords: PendingDispenseRecord[] = existingRaw
        ? JSON.parse(existingRaw)
        : [];

      const updatedRecords = [...existingRecords, record];
      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEY,
        JSON.stringify(updatedRecords)
      );
      console.log('Saved offline dispense record to AsyncStorage:', record);
    } catch (e) {
      console.warn('Error saving offline dispense record to AsyncStorage:', e);
    }
  };

  const handleConfirmDispense = async () => {
    if (!selectedMedicine) return;

    const num = parseInt(dispenseAmount.trim(), 10);

    if (isNaN(num) || num <= 0) {
      setErrorMsg('Please enter a valid number greater than 0.');
      return;
    }

    if (num > selectedMedicine.quantity) {
      setErrorMsg(
        `Cannot dispense more than available stock (${selectedMedicine.quantity}).`
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      medicine_name: selectedMedicine.name,
      quantity_dispensed: num,
      patient_id: patientId,
      asha_id: ashaId,
    };

    // Deduct quantity immediately in UI state
    const updatedList = medicines.map((med) =>
      med.id === selectedMedicine.id
        ? { ...med, quantity: med.quantity - num }
        : med
    );

    setMedicines(updatedList);
    if (onStockUpdated) {
      onStockUpdated(updatedList);
    }

    try {
      // Attempt API POST /stock/dispense call
      const response = await fetch(`${apiBaseUrl}/stock/dispense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // API Call Succeeded -> Show green success toast
      handleCloseModal();
      showToast('Dispensed successfully', 'success');
    } catch (error) {
      console.log('Network API call failed, falling back to offline storage:', error);

      // API Call Failed / No Connection -> Save record to AsyncStorage
      const offlineRecord: PendingDispenseRecord = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...payload,
        timestamp: new Date().toISOString(),
      };

      await saveOfflineDispenseRecord(offlineRecord);

      // Show orange offline warning banner
      handleCloseModal();
      showToast('Saved offline — will sync when connected', 'offline');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_ACCENT} />

      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medicine Inventory</Text>
        <Text style={styles.headerSubtitle}>Stock & Dispensing Log</Text>
      </View>

      {/* Toast Notification Banner */}
      {toastConfig && (
        <View
          style={[
            styles.toastContainer,
            toastConfig.type === 'offline'
              ? styles.offlineToastContainer
              : styles.successToastContainer,
          ]}
        >
          <Text style={styles.toastIcon}>
            {toastConfig.type === 'offline' ? '📶' : '✓'}
          </Text>
          <Text style={styles.toastText}>{toastConfig.message}</Text>
        </View>
      )}

      {/* Main Stock List */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Stock</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{medicines.length} Items</Text>
          </View>
        </View>

        {medicines.map((item) => {
          // Low stock condition: strictly below 5 units
          const isLowStock = item.quantity < 5;

          return (
            <View
              key={item.id}
              style={[
                styles.medicineRow,
                isLowStock && styles.lowStockMedicineRow,
              ]}
            >
              {/* Left Accent Bar */}
              <View
                style={[
                  styles.cardAccentBar,
                  isLowStock ? styles.lowStockAccentBar : styles.normalAccentBar,
                ]}
              />

              {/* Left Medicine Info */}
              <View style={styles.medicineInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.medicineName}>{item.name}</Text>
                  {isLowStock && (
                    <View style={styles.lowStockBadge}>
                      <Text style={styles.lowStockBadgeText}>Low stock</Text>
                    </View>
                  )}
                </View>

                <View style={styles.stockBadgeContainer}>
                  <Text style={styles.stockLabel}>In Stock:</Text>
                  <Text
                    style={[
                      styles.stockCountText,
                      isLowStock && styles.lowStockCountText,
                    ]}
                  >
                    {item.quantity} units
                  </Text>
                </View>
              </View>

              {/* Dispense Action Button */}
              <TouchableOpacity
                style={[
                  styles.dispenseButton,
                  isLowStock && styles.lowStockDispenseButton,
                  item.quantity === 0 && styles.disabledButton,
                ]}
                activeOpacity={0.7}
                onPress={() => handleOpenDispenseModal(item)}
                disabled={item.quantity === 0}
              >
                <Text style={styles.dispenseButtonText}>
                  {item.quantity === 0 ? 'Out of Stock' : 'Dispense'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Dispense Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Dispense Medicine</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  disabled={isSubmitting}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Target Medicine Name */}
              {selectedMedicine && (
                <Text style={styles.targetMedicineName}>
                  {selectedMedicine.name}
                </Text>
              )}

              {/* Modal Question & Input */}
              <Text style={styles.modalQuestionText}>How many units?</Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.numberInput}
                  value={dispenseAmount}
                  onChangeText={setDispenseAmount}
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus={true}
                  editable={!isSubmitting}
                  selectTextOnFocus={true}
                />
                <Text style={styles.unitSuffix}>units</Text>
              </View>

              {/* Validation Error Message */}
              {errorMsg.length > 0 && (
                <Text style={styles.errorText}>{errorMsg}</Text>
              )}

              {/* Modal Action Buttons */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCloseModal}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    isSubmitting && styles.disabledButton,
                  ]}
                  onPress={handleConfirmDispense}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E6F4F0',
    fontWeight: '500',
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  successToastContainer: {
    backgroundColor: '#10B981',
  },
  offlineToastContainer: {
    backgroundColor: '#F97316',
  },
  toastIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  medicineRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    paddingLeft: 0,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  lowStockMedicineRow: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  cardAccentBar: {
    width: 6,
    height: '100%',
    marginRight: 12,
  },
  normalAccentBar: {
    backgroundColor: TEAL_ACCENT,
  },
  lowStockAccentBar: {
    backgroundColor: '#EF4444',
  },
  medicineInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  lowStockBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  lowStockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  stockBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 6,
  },
  stockCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  lowStockCountText: {
    color: '#DC2626',
  },
  dispenseButton: {
    backgroundColor: TEAL_ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  lowStockDispenseButton: {
    backgroundColor: '#DC2626',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  dispenseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  targetMedicineName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEAL_ACCENT,
    marginBottom: 16,
  },
  modalQuestionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  numberInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  unitSuffix: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 12,
    fontWeight: '500',
  },
  modalActionRow: {
    flexDirection: 'row',
    justify.content: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: TEAL_ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default MedicineScreen;
