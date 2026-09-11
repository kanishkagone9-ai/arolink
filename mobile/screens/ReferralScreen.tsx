// mobile/screens/ReferralScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Base URL for API calls – adjust if needed
const API_BASE_URL = 'http://localhost:8000';
// Placeholder ASHA identifier – replace with actual value from context/auth
const ASHA_ID = 'asha_12345';

type Patient = {
  name: string;
  abha_id: string; // use as patient identifier
  village: string;
  // other fields could be added as needed
};

type ReferralScreenProps = {
  patient: Patient;
};

const REASONS = [
  'High fever',
  'Breathing difficulty',
  'Chest pain',
  'Pregnancy complication',
  'Chronic condition review',
  'Diagnostic test needed',
];

const ReferralScreen: React.FC<ReferralScreenProps> = ({ patient }) => {
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [notes, setNotes] = useState<string>('');
  const [facilities, setFacilities] = useState<Array<{ id?: number; name: string; distance: number; slots: number }>>([]);
  const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [diagnosticToggle, setDiagnosticToggle] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const handleFindFacility = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/facilities/nearest?reason=${encodeURIComponent(reason)}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      // Expecting an array of objects with at least { id?, name, distance, slots }
      setFacilities(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to fetch nearest facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFacility = (index: number) => {
    setSelectedFacility(index);
  };

  const handleConfirmReferral = async () => {
    if (selectedFacility === null) return;
    const facility = facilities[selectedFacility];
    const payload: any = {
      patient_id: patient.abha_id,
      facility_id: facility.id ?? selectedFacility, // fallback to index if id missing
      reason,
      notes,
      asha_id: ASHA_ID,
    };
    if (diagnosticToggle) {
      payload.diagnostics_needed = true;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Server responded with error');
      }
      // Assuming success response contains no extra data needed
      setConfirmation(`Referral sent to ${facility.name}. Patient will receive SMS with appointment details.`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send referral. Please try again.');
    }
  };

  const resetScreen = () => {
    // Reset all states to start a new referral
    setReason(REASONS[0]);
    setNotes('');
    setFacilities([]);
    setSelectedFacility(null);
    setDiagnosticToggle(false);
    setConfirmation(null);
  };

  // If referral has been sent, show confirmation view
  if (confirmation) {
    return (
      <View style={styles.container}>
        <Text style={styles.confirmationText}>{confirmation}</Text>
        <TouchableOpacity style={styles.button} onPress={resetScreen}>
          <Text style={styles.buttonText}>Create another referral</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{patient.name}</Text>
        <Text style={styles.sub}>ABHA ID: {patient.abha_id}</Text>
        <Text style={styles.sub}>Village: {patient.village}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Referral Reason</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={reason} onValueChange={(value) => setReason(value)}>
            {REASONS.map((r) => (
              <Picker.Item label={r} value={r} key={r} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Additional Notes</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          numberOfLines={4}
          placeholder="Enter any additional information..."
          value={notes}
          onChangeText={setNotes}
        />

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Also coordinate diagnostic test</Text>
          <Switch
            value={diagnosticToggle}
            onValueChange={setDiagnosticToggle}
            thumbColor={diagnosticToggle ? '#1D9E75' : '#f4f3f4'}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleFindFacility}>
          <Text style={styles.buttonText}>Find nearest facility</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="small" color="#1D9E75" style={styles.loader} />}

        {facilities.length > 0 && (
          <View style={styles.facilitiesContainer}>
            {facilities.map((f, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.facilityCard, selectedFacility === idx && styles.selectedCard]}
                onPress={() => handleSelectFacility(idx)}
              >
                <Text style={styles.facilityName}>{f.name}</Text>
                <Text style={styles.facilityInfo}>{f.distance} km away</Text>
                <View style={styles.slotBadge}>
                  <Text style={styles.slotBadgeText}>{f.slots} slots</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedFacility !== null && (
          <TouchableOpacity style={styles.button} onPress={handleConfirmReferral}>
            <Text style={styles.buttonText}>Confirm referral</Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1D9E75', // teal accent
  },
  sub: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1D9E75', // teal
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loader: {
    marginVertical: 12,
  },
  facilitiesContainer: {
    marginTop: 16,
  },
  facilityCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  selectedCard: {
    borderColor: '#1D9E75',
    backgroundColor: '#e6f7f0',
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
  facilityInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  slotBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#10B981', // green badge
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  slotBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#333',
  },
  confirmationText: {
    fontSize: 18,
    color: '#1D9E75',
    textAlign: 'center',
    marginVertical: 40,
  },
});

export default ReferralScreen;
