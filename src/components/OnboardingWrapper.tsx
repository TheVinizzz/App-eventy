import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import OnboardingScreen from '../screens/OnboardingScreen';
import RootNavigator from '../navigation/RootNavigator';
import { View, ActivityIndicator } from 'react-native';

// Para resetar o onboarding durante desenvolvimento, descomente a linha abaixo:
// AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);

const OnboardingWrapper: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      console.log('OnboardingWrapper: Checking status');
      console.log('Has seen onboarding:', hasSeenOnboarding);
      
      setShowOnboarding(hasSeenOnboarding !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // Show onboarding by default if error
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#000' 
      }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return <RootNavigator />;
};

export default OnboardingWrapper;