import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AppNavigator from './AppNavigator';
import CreateEventScreen from '../screens/CreateEventScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import EventDashboardScreen from '../screens/EventDashboardScreen';
import EventAffiliatesScreen from '../screens/EventAffiliatesScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import HelpScreen from '../screens/HelpScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import CheckInScreen from '../screens/CheckInScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import EvenLoveEntryScreen from '../screens/EvenLoveEntryScreen';
import EvenLoveEntryScreenV2 from '../screens/EvenLoveEntryScreenV2';
import EvenLoveMainScreen from '../screens/EvenLoveMainScreen';
import EvenLoveMainScreenV2 from '../screens/EvenLoveMainScreenV2';
import EvenLoveMatchesScreen from '../screens/EvenLoveMatchesScreen';
import EvenLoveChatScreen from '../screens/EvenLoveChatScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import RatingScreen from '../screens/RatingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={AppNavigator}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen 
        name="CreateEvent" 
        component={CreateEventScreen}
        options={{ 
          presentation: 'modal',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="EventDashboard" 
        component={EventDashboardScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="EventAffiliates" 
        component={EventAffiliatesScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="MyEvents" 
        component={MyEventsScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="CheckIn" 
        component={CheckInScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="PaymentSuccess" 
        component={PaymentSuccessScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: false, // Prevent swipe back on success screen
        }}
      />
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="EvenLoveEntry" 
        component={EvenLoveEntryScreenV2}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="EvenLoveMain" 
        component={EvenLoveMainScreenV2}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="EvenLoveMatches" 
        component={EvenLoveMatchesScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="EvenLoveChat" 
        component={EvenLoveChatScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Rating" 
        component={RatingScreen}
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator; 