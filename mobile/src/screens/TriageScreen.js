import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert
} from 'react-native';
import { SYMPTOMS_LIST, TRANSLATIONS } from '../utils/translations';
import { SymptomItem } from '../components/SymptomItem';

export const TriageScreen = ({ navigation, route }) => {
  const patient = route?.params?.patient || { nameEn: "Ramesh Kumar", abhaId: "ABHA-1234-5678-9012" };
  const lang = route?.params?.lang || 'mr';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [duration, setDuration] = useState('today');
  const [isListening, setIsListening] = useState(false);

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  // Voice Input Simulation / Keyword Recognition
  const handleVoiceInputSimulate = (spokenUtterance) => {
    setIsListening(true);
    setTimeout(() => {
      const lower = (spokenUtterance || "मरीज को ताप आणि खोकला आहे").toLowerCase();
      const matched = [];

      SYMPTOMS_LIST.forEach(s => {
        if (s.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
          matched.push(s.id);
        }
      });

      if (matched.length > 0) {
        setSelectedSymptoms(prev => Array.from(new Set([...prev, ...matched])));
        Alert.alert(
          "Voice Detected / आवाज ओळखला",
          Detected:  from ""
        );
      } else {
        Alert.alert("Voice Input", "No matching symptoms recognized. Please select manually.");
      }
      setIsListening(false);
    }, 1200);
  };

  const handleAssess = () => {
    if (selectedSymptoms.length === 0) return;

    if (navigation && navigation.navigate) {
      navigation.navigate('TriageResultScreen', {
        patient,
        selectedSymptomIds: selectedSymptoms,
        duration,
        lang
      });
    } else {
      console.log("Evaluating triage with:", selectedSymptoms, duration);
    }
  };

  const durations = [
    { key: 'today', label: t.today },
    { key: 'days2_3', label: t.days2_3 },
    { key: 'week1', label: t.week1 },
    { key: 'moreThanWeek', label: t.moreThanWeek },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.triageTitle}</Text>
          <Text style={styles.subtitle}>{t.triageSubtitle}</Text>
          <Text style={styles.patientBadge}>
            👤 {patient.nameEn} ({patient.abhaId})
          </Text>
        </View>

        {/* Voice Trigger Banner */}
        <TouchableOpacity
          style={[styles.voiceBar, isListening && styles.voiceBarActive]}
          onPress={() => handleVoiceInputSimulate()}
          activeOpacity={0.8}
        >
          <Text style={styles.voiceIcon}>{isListening ? '🎙️ 🔴' : '🎤'}</Text>
          <View style={styles.voiceTextContainer}>
            <Text style={styles.voiceTitle}>
              {isListening ? t.voiceListening : t.tapToSpeak}
            </Text>
            <Text style={styles.voiceSub}>
              Supports: "ताप", "बुखार", "fever", "chest pain", "उल्टी"
            </Text>
          </View>
        </TouchableOpacity>

        {/* Symptom Checklist */}
        <View style={styles.section}>
          {SYMPTOMS_LIST.map(item => (
            <SymptomItem
              key={item.id}
              item={item}
              isSelected={selectedSymptoms.includes(item.id)}
              onToggle={toggleSymptom}
              lang={lang}
            />
          ))}
        </View>

        {/* Duration Selector */}
        <View style={styles.durationSection}>
          <Text style={styles.sectionTitle}>⏱️ {t.duration}</Text>
          <View style={styles.durationRow}>
            {durations.map(d => {
              const active = duration === d.key;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.durationChip, active && styles.durationChipActive]}
                  onPress={() => setDuration(d.key)}
                >
                  <Text style={[styles.durationText, active && styles.durationTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.assessBtn,
            selectedSymptoms.length === 0 && styles.assessBtnDisabled
          ]}
          onPress={handleAssess}
          disabled={selectedSymptoms.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.assessBtnText}>
            {t.assessButton} ({selectedSymptoms.length})
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  patientBadge: {
    fontSize: 12,
    color: '#0F766E',
    fontWeight: '600',
    marginTop: 6,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  voiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  voiceBarActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  voiceIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  voiceTextContainer: {
    flex: 1,
  },
  voiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  voiceSub: {
    fontSize: 11,
    color: '#60A5FA',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  durationSection: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  durationTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  },
  assessBtn: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  assessBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
