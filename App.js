import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, useColorScheme, AppRegistry } from 'react-native';
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
import React from 'react';

import * as storage from './shared/storage'
import axios from 'axios';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import Profile from './pages/Profile';
import Music from './pages/Music';
import Player from './pages/Player';
import PlaylistView from './pages/PlaylistView';
import * as playerBackend from './shared/playerBackend'
import { useActiveTrack, useProgress } from 'react-native-track-player';
import * as Api from './shared/api'
import About from './pages/About';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

const Stack = createNativeStackNavigator()
const Tab = createMaterialBottomTabNavigator()

function MainPage({ }) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" options={{
        tabBarIcon: "home"
      }} component={Home} />
      <Tab.Screen options={{
        tabBarIcon: "music"
      }} name="Music" component={Music} />
      <Tab.Screen options={{
        tabBarIcon: "account-circle"
      }} name="Profile" component={Profile} />
    </Tab.Navigator>
  )
}

export default function App() {
  const scheme = useColorScheme()
  // console.log(scheme)

  let playingProgress = useProgress()
  let playingTrack = useActiveTrack()
  let songCounted = React.useRef(false)
  React.useEffect(() => {
    playerBackend.setupTemporaryStorage()
  }, [])
  React.useEffect(() => {
    songCounted.current = false
    if (typeof(playingTrack) != "undefined" && typeof(playingTrack.description) != "undefined") {
      console.log('updating current playing song', playingTrack.description)
      playerBackend.updateCurrentPlayingSong(playingTrack.description)
    }
  }, [playingTrack])
  React.useEffect(() => {
    if (!songCounted.current && playingProgress.position > playingProgress.duration / 2) {
      songCounted.current = true
      storage.inquireItem('current-playing-song-id', (ok, v) => {
        if (ok) {
          Api.increaseSongPlayCount(v).then(
            r => r.data.ok ? console.log('updated song playcount successfully') : console.log('unable to update song playcount')).catch(
              r => console.log('unable to update song playcount: networkError'))
        } else {
          console.log('playerBackend temporary storage has not been initialized yet')
        }
      })
    }
  }, [playingProgress])

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
            <Stack.Screen name="About" options={{ headerShown: false, tabBarVisible: false }} component={
              About
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
