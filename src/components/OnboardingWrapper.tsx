import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import OnboardingScreen from '../screens/OnboardingScreen';
import RootNavigator from '../navigation/RootNavigator';
import { View, ActivityIndicator } from 'react-native';

const OnboardingWrapper: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // TEMPORÁRIO: Limpar AsyncStorage para garantir que onboarding apareça
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      
      const hasSeenOnboarding = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      console.log('🔧 OnboardingWrapper Debug:');
      console.log('Storage key:', STORAGE_KEYS.ONBOARDING_COMPLETED);
      console.log('Stored value:', hasSeenOnboarding);
      console.log('Show onboarding:', hasSeenOnboarding !== 'true');
      
      // TEMPORÁRIO: Forçar sempre mostrar onboarding
      setShowOnboarding(true);
      // setShowOnboarding(hasSeenOnboarding !== 'true');
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