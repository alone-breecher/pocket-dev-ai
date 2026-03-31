import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { AppProvider } from './src/context/AppContext';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS } from './src/styles/colors';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: COLORS.accent,
                background: COLORS.bg,
                card: COLORS.surface,
                text: COLORS.text,
                border: COLORS.border,
                notification: COLORS.accent,
              },
            }}
          >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                  headerShown: true,
                  headerStyle: { backgroundColor: COLORS.surface },
                  headerTintColor: COLORS.text,
                  headerTitle: 'Settings',
                  headerBackTitleVisible: false,
                }}
              />
            </Stack.Navigator>
            <StatusBar style="light" backgroundColor={COLORS.bg} />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
