import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileFormData {
  displayName: string;
  age: string;
  gender: string | null;
  interestedInGenders: string[];
  bio: string;
  photos: string[];
  interests: string[];
  preferences: {
    minAge: number;
    maxAge: number;
    maxDistance: number;
  };
}

const STORAGE_KEY = 'evenlove_profile_draft';

export const useEvenLoveProfilePersistence = () => {
  const [profileData, setProfileData] = useState<ProfileFormData>({
    displayName: '',
    age: '',
    gender: null,
    interestedInGenders: [],
    bio: '',
    photos: [],
    interests: [],
    preferences: {
      minAge: 18,
      maxAge: 50,
      maxDistance: 50,
    },
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar dados salvos ao inicializar
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('📱 EvenLove: Carregando dados salvos do perfil:', parsedData);
        setProfileData(parsedData);
      }
    } catch (error) {
      console.error('❌ Error loading saved profile data:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveData = useCallback(async (data: Partial<ProfileFormData>) => {
    try {
      const updatedData = { ...profileData, ...data };
      setProfileData(updatedData);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      console.log('💾 EvenLove: Dados do perfil salvos automaticamente');
    } catch (error) {
      console.error('❌ Error saving profile data:', error);
    }
  }, [profileData]);

  const updateField = useCallback(async (field: keyof ProfileFormData, value: any) => {
    const updatedData = { ...profileData, [field]: value };
    setProfileData(updatedData);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      console.log(`💾 Campo "${field}" salvo automaticamente`);
    } catch (error) {
      console.error('❌ Error saving field:', field, error);
    }
  }, [profileData]);

  const updateNestedField = useCallback(async (
    parentField: keyof ProfileFormData, 
    field: string, 
    value: any
  ) => {
    const updatedParent = { ...(profileData[parentField] as any), [field]: value };
    const updatedData = { ...profileData, [parentField]: updatedParent };
    setProfileData(updatedData);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      console.log(`💾 Campo aninhado "${parentField}.${field}" salvo automaticamente`);
    } catch (error) {
      console.error('❌ Error saving nested field:', parentField, field, error);
    }
  }, [profileData]);

  const clearSavedData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setProfileData({
        displayName: '',
        age: '',
        gender: null,
        interestedInGenders: [],
        bio: '',
        photos: [],
        interests: [],
        preferences: {
          minAge: 18,
          maxAge: 50,
          maxDistance: 50,
        },
      });
      console.log('🗑️ EvenLove: Dados do rascunho limpos');
    } catch (error) {
      console.error('❌ Error clearing saved data:', error);
    }
  };

  const hasSavedData = () => {
    return profileData.displayName.length > 0 || 
           profileData.photos.length > 0 || 
           profileData.bio.length > 0;
  };

  return {
    profileData,
    isLoaded,
    saveData,
    updateField,
    updateNestedField,
    clearSavedData,
    hasSavedData,
  };
};

export default useEvenLoveProfilePersistence; 