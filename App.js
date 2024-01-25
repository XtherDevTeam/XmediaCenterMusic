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
  Icon,
} from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import Home from './pages/Home';
import { useEffect } from 'react';

import * as storage from './shared/storage'
import axios from 'axios';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import Profile from './pages/Profile';
import Music from './pages/Music';
import Player from './pages/Player';
import PlaylistView from './pages/PlaylistView';
import * as playerBackend from './shared/playerBackend'

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

const Stack = createNativeStackNavigator()
const Tab = createMaterialBottomTabNavigator()

playerBackend.setup()

function MainPage({ }) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" options={{
        tabBarIcon: "home"
      }} component={Home} />
      <Tab.Screen  options={{
        tabBarIcon: "music"
      }}  name="Music" component={Music} />
      <Tab.Screen  options={{
        tabBarIcon: "account-circle"
      }}  name="Profile" component={Profile} />
    </Tab.Navigator>
  )
}

export default function App() {
  const scheme = useColorScheme()
  console.log(scheme)
  return (
    <PaperProvider theme={mdTheme()}>
      <SafeAreaProvider>
        <NavigationContainer theme={scheme === 'dark' ? DarkTheme : LightTheme}>

          <Stack.Navigator initialRouteName='MainPage'>
            <Stack.Screen name="SignIn" options={{ headerShown: false, tabBarVisible: false }} component={
              SignIn
            }
            />
            <Stack.Screen name="PlaylistView" options={{ headerShown: false, tabBarVisible: false }} component={
              PlaylistView
            }
            />
            <Stack.Screen name="Player" options={{ headerShown: false, tabBarVisible: false }} component={
              Player
            }
            />
            <Stack.Screen name="MainPage" options={{ headerShown: false }} component={
              MainPage
            }
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
