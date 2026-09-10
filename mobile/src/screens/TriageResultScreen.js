import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { evaluateTriage } from '../services/triageEngine';
import { PatientRepository } from '../services/patientRepository';
import { TRANSLATIONS } from '../utils/translations';

export const TriageResultScreen = ({ navigation, route }) => {
  const patient = route?.params?.patient || { nameEn: "Ramesh Kumar", abhaId: "ABHA-1234-5678-9012" };
  const selectedSymptomIds = route?.params?.selectedSymptomIds || ['fever'];
  const duration = route?.params?.duration || 'today';
  const lang = route?.params?.lang || 'mr';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

  const [medicineModalVisible, setMedicineModalVisible] = useState(false);
  const [medicineName, setMedicineName] = useState('Paracetamol 500mg');
  const [quantity, setQuantity] = useState('10 tablets');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(false);

  // Evaluate CDSS Rules
  const result = useMemo(() => {
    return evaluateTriage(selectedSymptomIds, duration);
  }, [selectedSymptomIds, duration]);

  const isReferred = result.decision === 'REFERRED';

  const handleSaveVisit = async (customActionType = 'LOCAL_CARE') => {
    setSaving(true);

    const visitPayload = {
      patientAbhaId: patient.abhaId,
      patientName: patient.nameEn,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      symptoms: selectedSymptomIds,
      symptomsDisplay: result.selectedSymptoms.map(s => ${s.labelEn} ()).join(', '),
      duration,
      decision: result.decision,
      urgency: result.urgency,
      actionTaken: customActionType,
      medicinesDispensed: customActionType === 'MEDICINE_DISPENSED' ? ${medicineName} () : (isReferred ? 'Referred - No kit medicine dispensed' : 'Advised hydration & rest'),
      notes: notes || result.recommendedAction,
      ashaWorkerId: "ASHA_MH_PUNE_042"
    };

    const saveRes = await PatientRepository.saveVisit(visitPayload);
    setSaving(false);

    if (saveRes.isOffline) {
      setOfflineNotice(true);
      Alert.alert(
        "Saved Offline / ऑफलाइन जतन झाले",
        t.savedOfflineBanner,
        [
          {
            text: "OK",
            onPress: () => {
              if (navigation && navigation.navigate) {
                navigation.navigate('PatientProfileScreen', { abhaId: patient.abhaId, lang });
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Visit Recorded / नोंद पूर्ण झाली",
        "Visit successfully written to ABDM records.",
        [
          {
            text: "OK",
            onPress: () => {
              if (navigation && navigation.navigate) {
                navigation.navigate('PatientProfileScreen', { abhaId: patient.abhaId, lang });
              }
            }
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Offline notification banner if triggered */}
        {offlineNotice && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>⚡ {t.savedOfflineBanner}</Text>
          </View>
        )}

        {/* Triage Outcome Banner */}
        <View style={[styles.resultBanner, isReferred ? styles.referredBanner : styles.localCareBanner]}>
          <Text style={styles.resultIcon}>{isReferred ? '🚨' : '✅'}</Text>
          <Text style={[styles.resultTitle, isReferred ? styles.referredTitle : styles.localCareTitle]}>
            {isReferred ? t.referralNeeded : t.localCareRecommended}
          </Text>
          <Text style={styles.resultSubtitle}>
            {isReferred ? t.redFlagAlert : t.localCareAdvice}
          </Text>
        </View>

        {/* Symptoms & Rationale Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardHeader}>{t.summaryTitle}</Text>
          
          <View style={styles.symptomsChipsRow}>
            {result.selectedSymptoms.map(s => (
              <View key={s.id} style={[styles.chip, s.isRedFlag && styles.chipRedFlag]}>
                <Text style={[styles.chipText, s.isRedFlag && styles.chipTextRedFlag]}>
                  {s.labelEn} ({s.labelMr}) {s.isRedFlag ? '⚠️' : ''}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.rationaleContainer}>
            <Text style={styles.rationaleLabel}>Clinical Recommendation:</Text>
            <Text style={styles.rationaleText}>{result.recommendedAction}</Text>
          </View>

          {!isReferred && (
            <View style={styles.medicinesPermittedBox}>
              <Text style={styles.medBoxTitle}>Allowed ASHA Kit Medicines:</Text>
              {result.medicinesPermitted.map((m, idx) => (
                <Text key={idx} style={styles.medItem}>• {m}</Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {!isReferred ? (
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => setMedicineModalVisible(true)}
            activeOpacity={0.8}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color=\"#FFF\" /> : (
              <Text style={styles.actionBtnText}>💊 {t.logMedicine}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.referralActionBtn}
            onPress={() => handleSaveVisit('REFERRAL_ISSUED')}
            activeOpacity={0.8}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color=\"#FFF\" /> : (
              <Text style={styles.actionBtnText}>🏥 {t.issueReferral}</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => handleSaveVisit('ROUTINE_ADVICE')}
          disabled={saving}
        >
          <Text style={styles.secondaryBtnText}>Save Routine Advice & Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Dispensing Medicine */}
      <Modal
        visible={medicineModalVisible}
        transparent={true}
        animationType=\"slide\"
        onRequestClose={() => setMedicineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💊 {t.logMedicine}</Text>
            
            <Text style={styles.inputLabel}>{t.medicineName}:</Text>
            <TextInput
              style={styles.modalInput}
              value={medicineName}
              onChangeText={setMedicineName}
              placeholder=\"e.g. Paracetamol 500mg\"
            />

            <Text style={styles.inputLabel}>{t.quantity}:</Text>
            <TextInput
              style={styles.modalInput}
              value={quantity}
              onChangeText={setQuantity}
              placeholder=\"e.g. 10 tablets / 1 ORS pkt\"
            />

            <Text style={styles.inputLabel}>Additional Notes (Optional):</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder=\"Any specific guidance given to patient...\"
              multiline={true}
              numberOfLines={3}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setMedicineModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={() => {
                  setMedicineModalVisible(false);
                  handleSaveVisit('MEDICINE_DISPENSED');
                }}
              >
                <Text style={styles.modalSaveText}>{t.saveAndFinish}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 130,
  },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEEBA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  offlineBannerText: {
    color: '#856404',
    fontSize: 13,
    fontWeight: '600',
  },
  resultBanner: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  localCareBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  referredBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  resultIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  localCareTitle: {
    color: '#15803D',
  },
  referredTitle: {
    color: '#B91C1C',
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  symptomsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipRedFlag: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextRedFlag: {
    color: '#DC2626',
  },
  rationaleContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1D9E75',
    marginBottom: 12,
  },
  rationaleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  rationaleText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  medicinesPermittedBox: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  medBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
    marginBottom: 6,
  },
  medItem: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  primaryActionBtn: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  referralActionBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#1D9E75',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  }
});
