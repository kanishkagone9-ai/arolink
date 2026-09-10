import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { PatientProfileScreen } from './src/screens/PatientProfileScreen';
import { TriageScreen } from './src/screens/TriageScreen';
import { TriageResultScreen } from './src/screens/TriageResultScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('PatientProfileScreen');
  const [screenParams, setScreenParams] = useState({
    abhaId: "ABHA-1234-5678-9012",
    lang: "mr"
  });

  const navigation = {
    navigate: (screenName, params = {}) => {
      setScreenParams(prev => ({ ...prev, ...params }));
      setCurrentScreen(screenName);
    },
    goBack: () => {
      if (currentScreen === 'TriageResultScreen') setCurrentScreen('TriageScreen');
      else if (currentScreen === 'TriageScreen') setCurrentScreen('PatientProfileScreen');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle=\"dark-content\" backgroundColor=\"#F8FAFC\" />
      {currentScreen === 'PatientProfileScreen' && (
        <PatientProfileScreen
          navigation={navigation}
          abhaId={screenParams.abhaId}
          lang={screenParams.lang}
        />
      )}
      {currentScreen === 'TriageScreen' && (
        <TriageScreen
          navigation={navigation}
          route={{ params: screenParams }}
        />
      )}
      {currentScreen === 'TriageResultScreen' && (
        <TriageResultScreen
          navigation={navigation}
          route={{ params: screenParams }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
