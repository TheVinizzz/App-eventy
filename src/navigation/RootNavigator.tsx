import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AppNavigator from './AppNavigator';
import CreateEventScreen from '../screens/CreateEventScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import EventDashboardScreen from '../screens/EventDashboardScreen';
import EventAffiliatesScreen from '../screens/EventAffiliatesScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import HelpScreen from '../screens/HelpScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import CheckInScreen from '../screens/CheckInScreen';
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
    </Stack.Navigator>
  );
};

export default RootNavigator; 