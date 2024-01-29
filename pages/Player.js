import * as React from 'react';
import { Appbar, DataTable, Drawer, Icon, IconButton, PaperProvider, Portal, Surface, adaptNavigationTheme, withTheme } from 'react-native-paper';
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
import TrackPlayer, { Event, RepeatMode, State, useActiveTrack, useIsPlaying, useProgress } from 'react-native-track-player';
import BottomDrawer from '../components/BottomDrawer';
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});
import Slide from '@react-native-assets/slider'
import { formatDuraton } from '../shared/playerBackend';

const MORE_ICON = 'dots-vertical';

const Player = ({ navigation, route }) => {
  let [repeatMode, setRepeatMode] = React.useState({
    icon: 'repeat-off',
    index: 0
  })
  let isCounted = React.useRef(false)
  let [currentVolume, setCurrentVolume] = React.useState(0.621)
  let isPlaying = useIsPlaying()
  let currentProgress = useProgress()
  let [currentProgressStr, setCurrentProgressStr] = React.useState(['00:00', '00:00'])
  let [currentQueue, setCurrentQueue] = React.useState([])
  let [userInfo, setUserInfo] = React.useState({})
  const [messageState, setMessageState] = React.useState(false)
  let [playQueueState, setPlayQueueState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")
  let currentTrack = useActiveTrack()

  React.useEffect(() => {
    setCurrentProgressStr([formatDuraton(currentProgress.position), '-' + formatDuraton(currentProgress.duration - currentProgress.position)])
    if (!isCounted.current && currentProgress.position > currentProgress.duration / 2) {
      isCounted.current = true
      Api.increaseSongPlayCount(parseInt(currentTrack.description, 10)).then(r => {
        if (r.data.ok) {
          console.log('update song playback count successfully')
        } else {
          setMessageText(`Unable to update song playback count: ${r.data.data}`)
          setMessageState(true)
        }
      }).catch(r => {
        setMessageText(`Unable to update song playback count: NetworkError`)
        setMessageState(true)
      })
    }
  }, [currentProgress])

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

  useFocusEffect(React.useCallback(() => {
    TrackPlayer.getVolume().then(v => {
      setCurrentVolume(v)
    })
  }, []))


  React.useEffect(() => {
    isCounted.current = false
    TrackPlayer.getQueue().then((q) => {
      setCurrentQueue(q)
    })
    TrackPlayer.getRepeatMode().then(q => {
      if (q == RepeatMode.Off) {
        setRepeatMode({
          icon: 'repeat-off',
          index: 0,
        })
      } else if (q == RepeatMode.Queue) {
        setRepeatMode({
          icon: 'repeat',
          index: 1,
        })
      } else if (q == RepeatMode.Track) {
        setRepeatMode({
          icon: 'repeat-once',
          index: 2,
        })
      }
    })
  }, [currentTrack])

  React.useEffect(() => {
    if (currentVolume != 0.621) {
      TrackPlayer.setVolume(currentVolume)
    }
  }, [currentVolume])

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

          <View style={{ height: '100%', backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.65)' }}>
            <Appbar.Header style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}>
              <Appbar.BackAction onPress={() => navigation.goBack()} />
              <Appbar.Content title="Player"></Appbar.Content>
            </Appbar.Header>
            <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
              <>
                {/* Player controls */}
                <View style={{ marginTop: 16, padding: 20, height: '100%', alignItems: 'center' }}>
                  <Surface elevation={4} style={{ width: '80%', borderRadius: theme.roundness / 0.35 }}>
                    <Image
                      source={{ uri: currentTrack.artwork }}
                      style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }}
                    />
                  </Surface>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>
                    {currentTrack.title == '' ? '<unknown>' : currentTrack.title}
                  </Text>
                  <Text style={{ fontSize: 16, color: theme.colors.secondary, marginTop: 4 }}>
                    {currentTrack.artist == '' ? '<unknown>' : currentTrack.artist}
                  </Text>
                  {/* Progress bar */}
                  <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                    <Text style={{ marginTop: 13, width: 48 }} variant='labelMedium'>{currentProgressStr[0]}</Text>
                    <View style={{ flex: 1 }}>
                      <Slide thumbTintColor={theme.colors.primary} value={currentProgress.position} minimumValue={0} maximumValue={currentProgress.duration} step={1} style={{ marginHorizontal: 16, marginTop: 16 }} onValueChange={(v) => {
                        TrackPlayer.seekTo(v)
                      }}></Slide>
                    </View>
                    <Text style={{ marginTop: 13, width: 48 }} variant='labelMedium'>{currentProgressStr[1]}</Text>
                  </View>

                  {/* Player controls (play, pause, skip) */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      marginTop: 16,
                    }}
                  >
                    <IconButton
                      icon={repeatMode.icon}
                      onPress={() => {
                        repeatMode.index = (repeatMode.index + 1) % 3;
                        TrackPlayer.setRepeatMode(([RepeatMode.Off, RepeatMode.Queue, RepeatMode.Track])[repeatMode.index])
                        setRepeatMode({
                          icon: (['repeat-off', 'repeat', 'repeat-once'])[repeatMode.index],
                          index: repeatMode.index
                        })
                      }}
                      size={32}
                    />
                    <IconButton
                      icon="skip-previous"
                      onPress={() => {
                        TrackPlayer.skipToPrevious().then(() => TrackPlayer.play())
                      }}
                      size={32}
                    />
                    <IconButton
                      icon={isPlaying.playing ? "pause" : "play"}
                      onPress={() => {
                        console.log("WDNMD")
                        TrackPlayer.getPlaybackState().then(v => {
                          if (v.state === State.Playing) {
                            TrackPlayer.pause()
                          } else {
                            TrackPlayer.play()
                          }
                        })
                      }}
                      size={32}
                    />
                    <IconButton
                      icon="skip-next"
                      onPress={() => {
                        TrackPlayer.skipToNext().then(() => TrackPlayer.play())
                      }}
                      size={32}
                    />
                    <IconButton
                      icon='playlist-play'
                      onPress={() => {
                        setPlayQueueState(true)
                      }}
                      size={32}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                    <Text style={{ marginTop: 13, width: 16 }} variant='labelMedium'><Icon size={16} source="volume-minus" /></Text>
                    <View style={{ flex: 1 }}>
                      <Slide thumbTintColor={theme.colors.primary} value={currentVolume} minimumValue={0} maximumValue={1} step={0} style={{ marginHorizontal: 16, marginTop: 16 }} onValueChange={(v) => {
                        setCurrentVolume(v)
                      }}></Slide>
                    </View>
                    <Text style={{ marginTop: 13, width: 16 }} variant='labelMedium'><Icon size={16} source="volume-plus" /></Text>
                  </View>
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