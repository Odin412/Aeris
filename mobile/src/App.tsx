import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from './screens/Dashboard';
import { VoiceConsoleScreen } from './screens/VoiceConsole';
import { MarketplaceScreen } from './screens/Marketplace';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Voice" component={VoiceConsoleScreen} />
        <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
