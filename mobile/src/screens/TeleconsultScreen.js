import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { TRANSLATIONS } from '../utils/translations';

const HPR_DOCTORS = [
  {
    id: 'doc_01',
    name: 'Dr. Priya Sharma',
    nameMr: '??. ?????? ?????',
    specialty: 'General Physician',
    specialtyMr: '??????? ????????',
    hospital: 'Warud Rural Hospital',
    regNo: 'MCI-MH-2018-0912',
    avatar: '?????',
    available: true,
  },
  {
    id: 'doc_02',
    name: 'Dr. Arjun Mehta',
    nameMr: '??. ?????? ?????',
    specialty: 'Paediatrician (Child Specialist)',
    specialtyMr: '????????????',
    hospital: 'District Hospital Amravati',
    regNo: 'MCI-MH-2015-4421',
    avatar: '?????',
    available: true,
  },
  {
    id: 'doc_03',
    name: 'Dr. Sunita Rao',
    nameMr: '??. ?????? ???',
    specialty: 'Gynaecologist (High-Risk Maternal)',
    specialtyMr: '????????? ? ??????? ??????',
    hospital: 'District Hospital Nagpur',
    regNo: 'MCI-MH-2012-7710',
    avatar: '?????',
    available: true,
  }
];

export const TeleconsultScreen = ({ navigation, route }) => {
  const patient = route?.params?.patient || {
    nameEn: 'Ramesh Kumar',
    nameMr: '???? ?????',
    abhaId: 'ABHA-1234-5678-9012',
    village: 'Dharampur (??????)'
  };
  const lang = route?.params?.lang || 'mr';

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [callState, setCallState] = useState('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [bandwidthWarning, setBandwidthWarning] = useState(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (callState === 'CONNECTED' || callState === 'AUDIO_ONLY') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const handleStartCall = () => {
    if (!selectedDoctor) return;
    setCallState('CONNECTING');
    setCallDuration(0);
    setBandwidthWarning(false);

    setTimeout(() => {
      setCallState('CONNECTED');
    }, 2000);

    setTimeout(() => {
      setCallState(curr => {
        if (curr === 'CONNECTED') {
          setBandwidthWarning(true);
          return 'AUDIO_ONLY';
        }
        return curr;
      });
    }, 8000);
  };

  const handleEndCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const mins = Math.floor(callDuration / 60);
    const secs = callDuration % 60;
    const formattedDuration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    setCallState('IDLE');
    if (navigation && navigation.navigate) {
      navigation.navigate('ConsultNoteScreen', {
        patient,
        doctorName: selectedDoctor?.name || 'Dr. Priya Sharma',
        doctorSpecialty: selectedDoctor?.specialty || 'General Physician',
        duration: formattedDuration,
        callId: `call_${Date.now()}`,
        lang
      });
    }
  };

  const formatTimer = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState === 'CONNECTING' || callState === 'CONNECTED' || callState === 'AUDIO_ONLY') {
    return (
      <SafeAreaView style={styles.callContainer}>
        <View style={styles.callHeader}>
          <View>
            <Text style={styles.callDoctorName}>{selectedDoctor?.name}</Text>
            <Text style={styles.callDoctorSpecialty}>{selectedDoctor?.specialty}</Text>
            <Text style={styles.callPatientBadge}>?? {patient.nameEn} ({patient.abhaId})</Text>
          </View>
          <View style={styles.callTimerBadge}>
            <Text style={styles.callTimerText}>
              {callState === 'CONNECTING' ? 'Connecting...' : `?? ${formatTimer(callDuration)}`}
            </Text>
          </View>
        </View>

        {bandwidthWarning && (
          <View style={styles.bandwidthBanner}>
            <Text style={styles.bandwidthBannerText}>
              ?? 2G Low Bandwidth: Switched to audio-only (??? ??????? - ???? ??? ????)
            </Text>
          </View>
        )}

        <View style={styles.videoStage}>
          {callState === 'AUDIO_ONLY' ? (
            <View style={styles.audioOnlyPlaceholder}>
              <Text style={styles.audioAvatar}>{selectedDoctor?.avatar}</Text>
              <Text style={styles.audioModeText}>Audio Consultation Active</Text>
              <Text style={styles.audioModeSub}>Doctor is connected ? HD Audio Stream</Text>
            </View>
          ) : callState === 'CONNECTING' ? (
            <View style={styles.connectingPlaceholder}>
              <ActivityIndicator size="large" color="#1D9E75" />
              <Text style={styles.connectingText}>Establishing WebRTC Session via HPR Gateway...</Text>
            </View>
          ) : (
            <View style={styles.remoteVideoMock}>
              <Text style={styles.doctorVideoAvatar}>{selectedDoctor?.avatar}</Text>
              <Text style={styles.doctorVideoLabel}>Doctor's Remote Feed (Live HD)</Text>
              <View style={styles.pipLocalCamera}>
                <Text style={styles.pipText}>?? ASHA Camera</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.emergencyNoteBtn, voiceNoteRecorded && styles.emergencyNoteBtnDone]}
          onPress={() => {
            setVoiceNoteRecorded(true);
            Alert.alert('Voice Memo Attached', '30s patient symptom audio recorded for doctor offline review.');
          }}
        >
          <Text style={styles.emergencyNoteText}>
            {voiceNoteRecorded ? '? 30s Voice Note Attached' : '??? Emergency: Record 30s Voice Memo'}
          </Text>
        </TouchableOpacity>

        <View style={styles.callControlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Text style={styles.controlIcon}>{isMuted ? '??' : '???'}</Text>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <Text style={styles.endCallIcon}>??</Text>
            <Text style={styles.endCallLabel}>End Call</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {lang === 'mr' ? '?????????????? (?-???????)' : 'Teleconsultation (ABDM HPR)'}
        </Text>
        <Text style={styles.subtitle}>Connect ASHA & Patient with verified Medical Officers</Text>
        <View style={styles.patientInfoCard}>
          <Text style={styles.patientInfoName}>?? {lang === 'mr' ? patient.nameMr : patient.nameEn}</Text>
          <Text style={styles.patientInfoMeta}>ABHA: {patient.abhaId} ? ?? {patient.village}</Text>
        </View>
      </View>

      <Text style={styles.listSectionTitle}>Select an Available HPR Doctor:</Text>
      <FlatList
        data={HPR_DOCTORS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.doctorList}
        renderItem={({ item }) => {
          const isSelected = selectedDoctor?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}
              onPress={() => setSelectedDoctor(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.doctorAvatar}>{item.avatar}</Text>
              <View style={styles.doctorDetails}>
                <View style={styles.nameRow}>
                  <Text style={[styles.docName, isSelected && styles.docNameSelected]}>
                    {lang === 'mr' ? item.nameMr : item.name}
                  </Text>
                  <View style={styles.onlineBadge}>
                    <Text style={styles.onlineText}>? Available</Text>
                  </View>
                </View>
                <Text style={styles.docSpecialty}>{lang === 'mr' ? item.specialtyMr : item.specialty}</Text>
                <Text style={styles.docHospital}>?? {item.hospital}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startCallBtn, !selectedDoctor && styles.startCallBtnDisabled]}
          onPress={handleStartCall}
          disabled={!selectedDoctor}
        >
          <Text style={styles.startCallText}>
            ?? {selectedDoctor ? `Start Call with ${selectedDoctor.name}` : 'Select a Doctor to Call'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 10 },
  patientInfoCard: { backgroundColor: '#F0FDFA', padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#1D9E75' },
  patientInfoName: { fontSize: 14, fontWeight: '700', color: '#0F766E' },
  patientInfoMeta: { fontSize: 12, color: '#475569', marginTop: 2 },
  listSectionTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginHorizontal: 16, marginTop: 14, marginBottom: 8 },
  doctorList: { paddingHorizontal: 16, paddingBottom: 90 },
  doctorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1.5, borderColor: '#E2E8F0' },
  doctorCardSelected: { borderColor: '#1D9E75', backgroundColor: '#F0FDF4' },
  doctorAvatar: { fontSize: 36, marginRight: 12 },
  doctorDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  docNameSelected: { color: '#0F766E' },
  onlineBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  onlineText: { color: '#15803D', fontSize: 10, fontWeight: '700' },
  docSpecialty: { fontSize: 13, fontWeight: '600', color: '#0284C7', marginTop: 2 },
  docHospital: { fontSize: 12, color: '#64748B', marginTop: 3 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  startCallBtn: { backgroundColor: '#1D9E75', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  startCallBtnDisabled: { backgroundColor: '#94A3B8' },
  startCallText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  callContainer: { flex: 1, backgroundColor: '#0F172A' },
  callHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(30, 41, 59, 0.8)' },
  callDoctorName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  callDoctorSpecialty: { color: '#94A3B8', fontSize: 12 },
  callPatientBadge: { color: '#2DD4BF', fontSize: 11, fontWeight: '600', marginTop: 2 },
  callTimerBadge: { backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  callTimerText: { color: '#F87171', fontWeight: '700', fontSize: 14 },
  bandwidthBanner: { backgroundColor: '#FEF3C7', padding: 8, alignItems: 'center' },
  bandwidthBannerText: { color: '#92400E', fontSize: 12, fontWeight: '700' },
  videoStage: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  remoteVideoMock: { width: '100%', height: '100%', backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  doctorVideoAvatar: { fontSize: 80 },
  doctorVideoLabel: { color: '#CBD5E1', fontSize: 16, fontWeight: '600', marginTop: 12 },
  pipLocalCamera: { position: 'absolute', bottom: 20, right: 20, width: 110, height: 140, backgroundColor: '#334155', borderRadius: 10, borderWidth: 2, borderColor: '#1D9E75', justifyContent: 'center', alignItems: 'center' },
  pipText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  connectingPlaceholder: { alignItems: 'center' },
  connectingText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginTop: 16 },
  audioOnlyPlaceholder: { alignItems: 'center', padding: 20 },
  audioAvatar: { fontSize: 70 },
  audioModeText: { color: '#34D399', fontSize: 18, fontWeight: '700', marginTop: 12 },
  audioModeSub: { color: '#CBD5E1', fontSize: 13, marginTop: 4 },
  emergencyNoteBtn: { backgroundColor: 'rgba(255, 255, 255, 0.1)', marginHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#475569' },
  emergencyNoteBtnDone: { backgroundColor: 'rgba(29, 158, 117, 0.25)', borderColor: '#1D9E75' },
  emergencyNoteText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600' },
  callControlsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 20, backgroundColor: '#0F172A' },
  controlBtn: { alignItems: 'center', padding: 10 },
  controlBtnActive: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 50 },
  controlIcon: { fontSize: 26 },
  controlLabel: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  endCallBtn: { backgroundColor: '#DC2626', width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center' },
  endCallIcon: { fontSize: 28 },
  endCallLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' }
});
