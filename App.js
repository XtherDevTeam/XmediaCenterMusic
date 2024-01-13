import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import SignIn from './pages/SignIn';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import styles, { mdTheme, mdThemeDark, mdThemeLight } from './shared/styles';
import {
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
  PaperProvider,
  useTheme,
} from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import Home from './pages/Home';
import { useEffect } from 'react';

import * as storage from './shared/storage'

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});


const Stack = createNativeStackNavigator()

export default function App() {
  const scheme = useColorScheme()
  console.log(scheme)
  
  return (
    <PaperProvider theme={mdTheme()}>
      <SafeAreaProvider>
        <NavigationContainer theme={scheme === 'dark' ? DarkTheme : LightTheme}>
          <Stack.Navigator>
            <Stack.Screen name="SignIn" options={{ headerShown: false }} component={
              SignIn
            }
            />
            <Stack.Screen name="Home" options={{ headerShown: false }} component={
              Home
            }
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
