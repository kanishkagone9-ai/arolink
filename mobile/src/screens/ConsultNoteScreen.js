import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { PatientRepository } from '../services/patientRepository';
import { CONFIG } from '../config/config';

const ADVICE_CHIPS = [
  { id: 'a1', label: 'Complete bed rest (????? ?????????)' },
  { id: 'a2', label: 'Drink 3L fluids & ORS daily (????? ???? ? ?????)' },
  { id: 'a3', label: 'Tepid spongeing for fever (??? ?????????? ?????)' },
  { id: 'a4', label: 'Visit PHC if vomiting persists (?????? ? ????????? ???????? ??)' }
];

const MED_CHIPS = [
  { id: 'm1', label: 'Paracetamol 650mg TDS' },
  { id: 'm2', label: 'ORS Packets (4 sachets)' },
  { id: 'm3', label: 'Zinc Sulphate 20mg OD' },
  { id: 'm4', label: 'Amoxicillin 500mg BD (Doctor ordered)' }
];

export const ConsultNoteScreen = ({ navigation, route }) => {
  const patient = route?.params?.patient || { nameEn: 'Ramesh Kumar', abhaId: 'ABHA-1234-5678-9012' };
  const doctorName = route?.params?.doctorName || 'Dr. Priya Sharma';
  const doctorSpecialty = route?.params?.doctorSpecialty || 'General Physician';
  const duration = route?.params?.duration || '03:45';
  const callId = route?.params?.callId || 'call_101';

  const [selectedAdvices, setSelectedAdvices] = useState(['Complete bed rest (????? ?????????)']);
  const [selectedMeds, setSelectedMeds] = useState(['Paracetamol 650mg TDS']);
  const [customAdvice, setCustomAdvice] = useState('');
  const [customMed, setCustomMed] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(true);
  const [followUpDays, setFollowUpDays] = useState(3);
  const [saving, setSaving] = useState(false);
  const [smsModalVisible, setSmsModalVisible] = useState(false);
  const [smsText, setSmsText] = useState('');

  const toggleAdvice = (label) => {
    setSelectedAdvices(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };

  const toggleMed = (label) => {
    setSelectedMeds(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const handleSaveConsult = async () => {
    setSaving(true);
    const combinedAdvice = [...selectedAdvices, customAdvice].filter(Boolean).join('; ');
    const combinedMeds = [...selectedMeds, customMed].filter(Boolean).join('; ');

    const payload = {
      patient_id: patient.abhaId,
      patient_name: patient.nameEn,
      doctor_name: doctorName,
      doctor_specialty: doctorSpecialty,
      duration: duration,
      advice: combinedAdvice,
      medicine_prescribed: combinedMeds,
      follow_up_required: followUpRequired,
      follow_up_days: followUpDays,
      call_id: callId,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/v1/consult/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await response.json();

      if (followUpRequired) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + followUpDays);
        await fetch(`${CONFIG.BASE_URL}/api/v1/followup/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.abhaId,
            reason: `Post-teleconsult review with ${doctorName}: ${combinedAdvice.slice(0, 50)}`,
            due_date: dueDate.toISOString().split('T')[0],
            priority: 'HIGH'
          })
        });
      }

      setSaving(false);
      const generatedSms = `?????????? (ABDM): ??. ${doctorName} ????????? ?????????????? ???????. ?????: ${combinedAdvice.slice(0, 70)}... ???: ${combinedMeds.slice(0, 40)}. ????? ???: ${followUpDays} ???????.`;
      setSmsText(generatedSms);
      setSmsModalVisible(true);
    } catch (err) {
      setSaving(false);
      await PatientRepository.saveVisit({
        patientAbhaId: patient.abhaId,
        patientName: patient.nameEn,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        symptoms: ['teleconsult_post_note'],
        symptomsDisplay: `Teleconsult with ${doctorName}`,
        duration,
        decision: 'TELECONSULT_COMPLETED',
        urgency: followUpRequired ? 'HIGH' : 'LOW',
        actionTaken: 'TELECONSULT_NOTE',
        medicinesDispensed: combinedMeds,
        notes: combinedAdvice
      });
      Alert.alert(
        'Offline Mode Active (?????? ???)',
        'Consult note queued locally in AsyncStorage. Will sync to ABDM when online.',
        [{ text: 'OK', onPress: () => navigation?.navigate('PatientProfileScreen', { abhaId: patient.abhaId }) }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Teleconsultation Summary</Text>
          <Text style={styles.summaryDoctor}>????? {doctorName} ({doctorSpecialty})</Text>
          <Text style={styles.summaryDuration}>?? Call Duration: {duration} mins ? HPR Encrypted</Text>
          <Text style={styles.summaryPatient}>Patient: {patient.nameEn} ({patient.abhaId})</Text>
        </View>

        <Text style={styles.sectionHeader}>Doctor's Clinical Advice (?????????? ?????):</Text>
        <View style={styles.chipsRow}>
          {ADVICE_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, selectedAdvices.includes(chip.label) && styles.chipSelected]}
              onPress={() => toggleAdvice(chip.label)}
            >
              <Text style={[styles.chipText, selectedAdvices.includes(chip.label) && styles.chipTextSelected]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.textInput}
          placeholder="Type additional advice or voice-dictated notes..."
          value={customAdvice}
          onChangeText={setCustomAdvice}
        />

        <Text style={styles.sectionHeader}>Prescribed Medicines (?????? ????):</Text>
        <View style={styles.chipsRow}>
          {MED_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, selectedMeds.includes(chip.label) && styles.chipSelected]}
              onPress={() => toggleMed(chip.label)}
            >
              <Text style={[styles.chipText, selectedMeds.includes(chip.label) && styles.chipTextSelected]}>
                ?? {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.textInput}
          placeholder="Additional medicine or dosage instructions..."
          value={customMed}
          onChangeText={setCustomMed}
        />

        <View style={styles.followUpBox}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.followUpTitle}>Follow-up Required?</Text>
              <Text style={styles.followUpSub}>Adds to ASHA Morning Task List automatically</Text>
            </View>
            <Switch
              value={followUpRequired}
              onValueChange={setFollowUpRequired}
              trackColor={{ false: '#CBD5E1', true: '#1D9E75' }}
            />
          </View>

          {followUpRequired && (
            <View style={styles.daysRow}>
              {[2, 3, 7].map(days => (
                <TouchableOpacity
                  key={days}
                  style={[styles.dayChip, followUpDays === days && styles.dayChipActive]}
                  onPress={() => setFollowUpDays(days)}
                >
                  <Text style={[styles.dayText, followUpDays === days && styles.dayTextActive]}>
                    In {days} Days {days === 3 ? '(Recommended)' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveConsult}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>? Save Consult Note to ABHA</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={smsModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalBadge}>?? SIMULATED PATIENT SMS</Text>
            <Text style={styles.modalTitle}>Message Sent via Twilio / Govt Gateway</Text>
            <View style={styles.smsBubble}>
              <Text style={styles.smsText}>{smsText}</Text>
            </View>
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => {
                setSmsModalVisible(false);
                navigation?.navigate('PatientProfileScreen', { abhaId: patient.abhaId });
              }}
            >
              <Text style={styles.modalDoneText}>Return to Patient Records</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 110 },
  summaryCard: { backgroundColor: '#F0FDFA', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#CCFBF1', marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#0F766E', marginBottom: 4 },
  summaryDoctor: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  summaryDuration: { fontSize: 12, color: '#0284C7', marginTop: 2 },
  summaryPatient: { fontSize: 12, color: '#64748B', marginTop: 4 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#334155', marginTop: 12, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  chipSelected: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  chipText: { fontSize: 12, color: '#334155', fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  textInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 8 },
  followUpBox: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, marginTop: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  followUpTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  followUpSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  daysRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dayChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', alignItems: 'center' },
  dayChipActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  dayText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  dayTextActive: { color: '#FFFFFF', fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#1D9E75', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  modalBadge: { alignSelf: 'flex-start', backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  smsBubble: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  smsText: { fontSize: 13, color: '#1E293B', lineHeight: 19 },
  modalDoneBtn: { backgroundColor: '#1D9E75', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalDoneText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 }
});
