import * as React from 'react';

import {
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Dimensions,
} from 'react-native';
import {
  adaptNavigationTheme,
  Appbar,
  DataTable,
  Icon,
  IconButton,
  PaperProvider,
  Portal,
  Surface,
  Text,
  withTheme,
} from 'react-native-paper';
import TrackPlayer, {
  RepeatMode,
  State,
  useActiveTrack,
  useIsPlaying,
  useProgress,
} from 'react-native-track-player';

import Slide from '@react-native-assets/slider';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  useFocusEffect,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomDrawer from '../components/BottomDrawer';
import LyricView from '../components/LyricView';
import Message from '../components/Message';
import * as Api from '../shared/api';
import { get_lyric_for, parse_lrc } from '../shared/lyricsManager';
import { formatDuraton } from '../shared/playerBackend';
import * as storage from '../shared/storage';
import { mdTheme } from '../shared/styles';

const { width, height } = Dimensions.get('window');

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

const MORE_ICON = 'dots-vertical';

const Player = ({ navigation, route }) => {
  let [repeatMode, setRepeatMode] = React.useState({
    icon: 'repeat-off',
    index: 0
  })
  let [currentVolume, setCurrentVolume] = React.useState(0.621)
  let isPlaying = useIsPlaying()
  let currentProgress = useProgress()
  let [currentProgressStr, setCurrentProgressStr] = React.useState(['00:00', '00:00'])
  let [currentQueue, setCurrentQueue] = React.useState([])
  let [userInfo, setUserInfo] = React.useState({})
  const [messageState, setMessageState] = React.useState(false)
  let [playQueueState, setPlayQueueState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")
  let [showLyrics, setShowLyrics] = React.useState(false)
  let [lyrics, setLyrics] = React.useState([])
  const [lyricViewHeight, setLyricViewHeight] = React.useState(height * 0.6)
  let currentTrack = useActiveTrack()

  React.useEffect(() => {
    setCurrentProgressStr([formatDuraton(currentProgress.position), '-' + formatDuraton(currentProgress.duration - currentProgress.position)])
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

    if (currentTrack) {
      get_lyric_for(currentTrack.title, currentTrack.album, currentTrack.artist).then(lrc => {
        if (lrc) {
          setLyrics(parse_lrc(lrc.lrc))
        } else {
          setLyrics([])
        }
      })
    }
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
  const insets = useSafeAreaInsets()

  return (
    <PaperProvider theme={mdTheme()}>
      <>


        {currentTrack !== undefined && <ImageBackground source={{ uri: currentTrack.artwork }} style={{ height: '100%', borderRadius: theme.roundness / 0.35, overflow: 'hidden' }} blurRadius={20}>

          <View style={{ flex: 1, backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.65)', paddingBottom: insets.top }}>
            <Appbar.Header style={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}>
              <Appbar.BackAction onPress={() => navigation.goBack()} />
              <Appbar.Content title="Player"></Appbar.Content>
            </Appbar.Header>
            <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
              <>
                {/* Player content */}
                <View
                  style={{ flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}
                  onLayout={(e) => setLyricViewHeight(e.nativeEvent.layout.height)}
                >
                  {!showLyrics ? (
                    <>
                      <TouchableOpacity
                        onPress={() => setShowLyrics(true)}
                        activeOpacity={0.8}
                        style={{ width: '80%', alignItems: 'center' }}
                      >
                        <Surface elevation={4} style={{ width: '100%', borderRadius: theme.roundness / 0.35 }}>
                          <Image
                            source={{ uri: currentTrack.artwork }}
                            style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }}
                          />
                        </Surface>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16 }} numberOfLines={1}>
                        {currentTrack.title == '' ? '<unknown>' : currentTrack.title}
                      </Text>
                      <Text style={{ fontSize: 16, color: theme.colors.secondary, marginTop: 4 }} numberOfLines={1}>
                        {currentTrack.artist == '' ? '<unknown>' : currentTrack.artist}
                      </Text>
                    </>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowLyrics(false)}
                      activeOpacity={1}
                      style={{ width: '100%', flex: 1 }}
                    >
                      <LyricView
                        lyrics={lyrics}
                        currentTime={currentProgress.position}
                        width={width - 40}
                        height={lyricViewHeight}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 10 }}>
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