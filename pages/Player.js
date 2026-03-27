import * as React from 'react';

import {
  Image,
  ImageBackground,
  ScrollView,
  TouchableWithoutFeedback,
  View,
  Dimensions,
} from 'react-native';
import {
  adaptNavigationTheme,
  Appbar,
  Button,
  DataTable,
  Dialog,
  Icon,
  IconButton,
  PaperProvider,
  Portal,
  Surface,
  Text,
  withTheme,
  TouchableRipple
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
import QueueDrawer from '../components/QueueDrawer';
import * as Api from '../shared/api';
import { get_lyric_for, parse_lrc, invalidate_lyric_cache } from '../shared/lyricsManager';
import { formatDuraton } from '../shared/playerBackend';
import * as storage from '../shared/storage';
import { mdTheme } from '../shared/styles';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

const MORE_ICON = 'dots-vertical';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';



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
  const [lyricDialogVisible, setLyricDialogVisible] = React.useState(false)
  const [selectedLyric, setSelectedLyric] = React.useState(null)
  let currentTrack = useActiveTrack()
  const translateX = useSharedValue(0);
  const [neighbors, setNeighbors] = React.useState({ prev: null, next: null });
  const lyricsOpacity = useSharedValue(0);

  React.useEffect(() => {
    lyricsOpacity.value = withTiming(showLyrics ? 1 : 0, { duration: 100 });
  }, [showLyrics]);

  React.useEffect(() => {
    const updateNeighbors = async () => {
      const queue = await TrackPlayer.getQueue();
      const index = await TrackPlayer.getActiveTrackIndex();
      if (index !== undefined && index !== null) {
        setNeighbors({
          prev: index > 0 ? queue[index - 1] : null,
          next: index < queue.length - 1 ? queue[index + 1] : null,
        });
      }
    };
    updateNeighbors();
  }, [currentTrack]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -width / 4 || event.velocityX < -500) {
        if (neighbors.next) {
          runOnJS(TrackPlayer.skipToNext)();
          translateX.value = withSpring(-width);
        } else {
          translateX.value = withSpring(0);
        }
      } else if (event.translationX > width / 4 || event.velocityX > 500) {
        if (neighbors.prev) {
          runOnJS(TrackPlayer.skipToPrevious)();
          translateX.value = withSpring(width);
        } else {
          translateX.value = withSpring(0);
        }
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - width }],
  }));

  const artworkOpacityStyle = useAnimatedStyle(() => ({
    opacity: 1 - lyricsOpacity.value,
  }));

  const lyricsOpacityStyle = useAnimatedStyle(() => ({
    opacity: lyricsOpacity.value,
  }));

  React.useEffect(() => {
    translateX.value = 0;
  }, [currentTrack]);

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

  const handleLyricLongPress = (line) => {
    setSelectedLyric(line)
    setLyricDialogVisible(true)
  }

  const copyLyric = async () => {
    if (selectedLyric) {
      await Clipboard.setStringAsync(selectedLyric.text)
      setLyricDialogVisible(false)
      setMessageText("Lyric copied to clipboard")
      setMessageState(true)
    }
  }

  const invalidateLyricCache = () => {
    if (currentTrack) {
      setLyricDialogVisible(false)
      setMessageText("Lyric cache invalidated. Re-fetching...")
      setMessageState(true)
      invalidate_lyric_cache(currentTrack.title, currentTrack.album, currentTrack.artist).then(lrc => {
        if (lrc) {
          setLyrics(parse_lrc(lrc.lrc))
        } else {
          setLyrics([])
        }
      })
    }
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
              <Appbar.Content title=""></Appbar.Content>
            </Appbar.Header>
            <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
              <>
                {/* Player content */}
                <GestureDetector gesture={panGesture}>
                  <View 
                    style={{ flex: 1, width: width, overflow: 'hidden' }}
                    onLayout={(e) => setLyricViewHeight(e.nativeEvent.layout.height)}
                  >
                    <Animated.View style={[{ flexDirection: 'row', width: width * 3, flex: 1 }, animatedStyle]}>
                      {/* Previous Track Slot */}
                      <View style={{ width: width, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
                        {neighbors.prev && (
                          <>
                            <Surface elevation={4} style={{ width: '80%', borderRadius: theme.roundness / 0.35 }}>
                              <Image
                                source={{ uri: neighbors.prev.artwork }}
                                style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }}
                              />
                            </Surface>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, opacity: 0.5 }} numberOfLines={1}>
                              {neighbors.prev.title}
                            </Text>
                          </>
                        )}
                      </View>

                      {/* Current Track Slot */}
                      <View style={{ width: width, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <Animated.View 
                          style={[{ width: '100%', alignItems: 'center', position: 'absolute' }, artworkOpacityStyle]}
                          pointerEvents={showLyrics ? 'none' : 'auto'}
                        >
                          <TouchableRipple
                            onPress={() => setShowLyrics(true)}
                            style={{ width: '80%', alignItems: 'center' }}
                          >
                            <Surface elevation={4} style={{ width: '100%', borderRadius: theme.roundness / 0.35 }}>
                              <Image
                                source={{ uri: currentTrack.artwork }}
                                style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }}
                              />
                            </Surface>
                          </TouchableRipple>
                          <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16 }} numberOfLines={1}>
                            {currentTrack.title == '' ? '<unknown>' : currentTrack.title}
                          </Text>
                          <Text style={{ fontSize: 16, color: theme.colors.secondary, marginTop: 4 }} numberOfLines={1}>
                            {currentTrack.artist == '' ? '<unknown>' : currentTrack.artist}
                          </Text>
                        </Animated.View>

                        <Animated.View 
                          style={[{ width: '100%', height: '100%', flex: 1 }, lyricsOpacityStyle]}
                          pointerEvents={showLyrics ? 'auto' : 'none'}
                        >
                          <LyricView
                            lyrics={lyrics}
                            currentTime={currentProgress.position}
                            width={width - 40}
                            height={lyricViewHeight}
                            onLyricPress={() => setShowLyrics(false)}
                            onLyricLongPress={handleLyricLongPress}
                          />
                        </Animated.View>
                      </View>

                      {/* Next Track Slot */}
                      <View style={{ width: width, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
                        {neighbors.next && (
                          <>
                            <Surface elevation={4} style={{ width: '80%', borderRadius: theme.roundness / 0.35 }}>
                              <Image
                                source={{ uri: neighbors.next.artwork }}
                                style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }}
                              />
                            </Surface>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16, opacity: 0.5 }} numberOfLines={1}>
                              {neighbors.next.title}
                            </Text>
                          </>
                        )}
                      </View>
                    </Animated.View>
                  </View>
                </GestureDetector>

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


                <QueueDrawer 
                  visible={playQueueState} 
                  onClose={() => setPlayQueueState(false)} 
                  queue={currentQueue}
                  onQueueUpdate={(updatedQueue) => setCurrentQueue(updatedQueue)}
                />
                <Portal>
                  <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
                  <Dialog visible={lyricDialogVisible} onDismiss={() => setLyricDialogVisible(false)}>
                    <Dialog.Title>Lyric Actions</Dialog.Title>
                    <Dialog.Content>
                      <Text variant="bodyMedium">{selectedLyric?.text || "No lyric selected"}</Text>
                    </Dialog.Content>
                    <Dialog.Actions >
                      <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Button onPress={copyLyric}>Copy to Clipboard</Button>
                        <Button onPress={invalidateLyricCache}>Invalidate Lyric Cache</Button>
                        <Button onPress={() => setLyricDialogVisible(false)}>Cancel</Button>
                      </View>
                    </Dialog.Actions>
                  </Dialog>
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