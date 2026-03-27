import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, useColorScheme, AppRegistry, Keyboard } from 'react-native';

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
import rntp, { useActiveTrack, useProgress } from 'react-native-track-player';
import * as Api from './shared/api'
import About from './pages/About';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import MiniPlayer from './components/MiniPlayer';



const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

const Stack = createNativeStackNavigator()
const Tab = createMaterialBottomTabNavigator()

function MainPage({ }) {
  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
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
      {!isKeyboardVisible && (
        <View style={{ position: 'absolute', bottom: 80, left: 0, right: 0 }}>
          <MiniPlayer />
        </View>
      )}
    </View>
  )
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const scheme = useColorScheme()
  // console.log(scheme)

  let playingProgress = useProgress()
  let playingTrack = useActiveTrack()
  let songCounted = React.useRef(false)
  React.useEffect(() => {
    playerBackend.setup()
  }, [])
  React.useEffect(() => {
    songCounted.current = false
    if (typeof (playingTrack) != "undefined" && typeof (playingTrack.description) != "undefined") {
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

  React.useEffect(() => {
    if (playingProgress.position > 0) {
      playerBackend.savePosition(playingProgress.position)
    }
  }, [playingProgress.position])

  React.useEffect(() => {
    if (playingTrack) {
      rntp.getActiveTrackIndex().then(index => {
        if (typeof index === 'number') {
          playerBackend.saveCurrentIndex(index)
        }
      })
    }
  }, [playingTrack])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={mdTheme()}>
        <SafeAreaProvider>
          <StatusBar style="auto" translucent={true} backgroundColor="transparent" />
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
              <Stack.Screen name="Statistics" options={{ headerShown: false, tabBarVisible: false }} component={
                Statistics
              }
              />
              <Stack.Screen name="Settings" options={{ headerShown: false, tabBarVisible: false }} component={
                Settings
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
    </GestureHandlerRootView>
  );
}
