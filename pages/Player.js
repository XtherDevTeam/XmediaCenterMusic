import * as React from 'react';
import { Appbar, DataTable, Drawer, Icon, IconButton, PaperProvider, Portal, adaptNavigationTheme, withTheme } from 'react-native-paper';
import { Banner } from 'react-native-paper';
import { Image, ImageBackground, Keyboard, Platform, ScrollView, TouchableWithoutFeedback, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { Avatar } from 'react-native-paper';
import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Button } from 'react-native-paper';
import { mdTheme } from '../shared/styles';
import * as storage from '../shared/storage';
import * as Api from '../shared/api';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import Message from '../components/Message';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import Profile from './Profile';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import Music from './Music';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignIn from './SignIn';
import TrackPlayer, { useActiveTrack, useIsPlaying } from 'react-native-track-player';
import BottomDrawer from '../components/BottomDrawer';
import { Slider } from 'react-native-awesome-slider';
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

import { GestureHandlerRootView } from 'react-native-gesture-handler';

const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

const Player = ({ navigation, route }) => {
  let isPlaying = useIsPlaying()
  let [currentQueue, setCurrentQueue] = React.useState([])
  let [userInfo, setUserInfo] = React.useState({})
  const [messageState, setMessageState] = React.useState(false)
  let [playQueueState, setPlayQueueState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")
  let currentTrack = useActiveTrack()

  React.useEffect(() => {
    storage.inquireItem('loginStatus', (result, v) => {
      if (!result) {
        navigation.navigate('SignIn', { initialPage: true })
      }
      Api.checkIfLoggedIn().then((data) => {
        if (data.data.ok) {
          let uid = data.data.data.uid
          Api.userInfo(uid).then((data) => {
            if (data.data.ok) {
              setUserInfo(data.data.data)
            } else {
              setMessageText(`Error querying user information: ${data.data.data}`)
              setMessageState(true)
            }
          }).catch((err) => {
            setMessageText(`Error querying user information: NetworkError`)
            setMessageState(true)
          })
        }
      }).catch((e) => {
        setMessageText(`Error querying user information: NetworkError`)
        setMessageState(true)
      })
    })
  }, [navigation])



  React.useEffect(() => {
    TrackPlayer.getQueue().then((q) => {
      setCurrentQueue(q)
    })
  }, [currentTrack])

  let signOut = () => {
    Api.signOut().then((r) => {
      if (r.data.ok) {
        storage.removeItem('loginStatus', (r) => { })
      }
      navigation.navigate('SignIn', { initialPage: true })
    }).catch(e => {
      setMessageText(`Error signing out: ${e.data.data}`)
      setMessageState(true)
    })
  }

  let theme = mdTheme()

  return (
    <PaperProvider theme={mdTheme()}>
      <>


        {currentTrack !== undefined && <ImageBackground src={currentTrack.artwork} style={{ borderRadius: theme.roundness / 0.35, overflow: 'hidden' }} blurRadius={20}>

          <View style={{ height: '100%', backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.50)' : 'rgba(255, 255, 255, 0.50)' }}>
            <Appbar.Header style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}>
              <Appbar.BackAction onPress={() => navigation.goBack()} />
              <Appbar.Content title="Player"></Appbar.Content>
            </Appbar.Header>
            <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
              <>
                {/* Player controls */}
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                  <Image
                    source={{ uri: currentTrack.artwork }}
                    style={{ width: 200, height: 200, borderRadius: 10 }}
                  />
                  <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>
                    {currentTrack.title}
                  </Text>
                  <Text style={{ fontSize: 16, color: 'gray', marginTop: 4 }}>
                    {currentTrack.artist}
                  </Text>
                </View>

                {/* Progress bar */}
                {/* <Slider
                  style={{ marginHorizontal: 16, marginTop: 16 }}
                  value={0.5} // Replace with actual progress value
                  thumbSize={15}
                  thumbTintColor={theme.colors.primary}
                  maximumValue={1}
                  step={0.01}
                  onValueChange={(value) => {
                    // Handle progress change
                  }}
                /> */}
                <GestureHandlerRootView>
                  <Slider
                    progress={0}
                    minimumValue={0}
                    maximumValue={1}
                  />
                </GestureHandlerRootView>

                {/* Player controls (play, pause, skip) */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    marginTop: 16,
                  }}
                >
                  <IconButton
                    icon="skip-previous"
                    onPress={() => {
                      // Handle skip to previous
                    }}
                  />
                  <IconButton
                    icon={isPlaying ? "pause" : "play"}
                    onPress={() => {
                      // Handle play/pause
                    }}
                  />
                  <IconButton
                    icon="skip-next"
                    onPress={() => {
                      // Handle skip to next
                    }}
                  />
                </View>
                <BottomDrawer drawerTitle="Play queue" onClose={() => { setPlayQueueState(false) }} state={playQueueState}>
                  <ScrollView>
                    <DataTable>
                      <DataTable.Header>
                        <DataTable.Title>Title</DataTable.Title>
                        <DataTable.Title numeric>Artist</DataTable.Title>
                      </DataTable.Header>
                      {currentQueue.map((item, idx) => (
                        <DataTable.Row key={idx} onPress={() => {
                          TrackPlayer.skip(idx).then(() => { TrackPlayer.play() })
                        }}>
                          <DataTable.Cell>{item.title}</DataTable.Cell>
                          <DataTable.Cell numeric>{item.artist}</DataTable.Cell>
                        </DataTable.Row>
                      ))}
                    </DataTable>
                  </ScrollView>
                </BottomDrawer>
                <Portal>
                  <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
                </Portal>
              </>
            </TouchableWithoutFeedback >
          </View>
        </ImageBackground>}
      </>
    </PaperProvider>
  )
};


export default withTheme(Player);