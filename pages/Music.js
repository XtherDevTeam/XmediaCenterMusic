import * as React from 'react';

import {
  ImageBackground,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Appbar,
  Card,
  IconButton,
  Portal,
  Text,
  withTheme,
} from 'react-native-paper';
import TrackPlayer, {
  State,
  useActiveTrack,
  usePlaybackState,
} from 'react-native-track-player';

import { useFocusEffect } from '@react-navigation/native';

import Message from '../components/Message';
import * as Api from '../shared/api';
import * as storage from '../shared/storage';
import { mdTheme } from '../shared/styles';

const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

const Profile = ({ navigation, route }) => {
  let [userInfo, setUserInfo] = React.useState({})
  let [playlists, setPlaylists] = React.useState([])
  let currentTrack = useActiveTrack()
  let playerState = usePlaybackState()
  const [messageState, setMessageState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")
  const theme = mdTheme()

  useFocusEffect(
    React.useCallback(() => {
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
    }, [])
  )

  React.useEffect(() => {
    if (userInfo != {}) {
      Api.userPlaylists().then(data => {
        if (data.data.ok) {
          console.log(data.data.data)
          setPlaylists(data.data.data)
        } else {
          setMessageText(`Unable to fetch user playlists: ${data.data.data}`)
          setMessageState(true)
        }
      }).catch(err => {
        setMessageText("Unable to fetch user playlists: NetworkError")
        setMessageState(true)
      })
    }
  }, [userInfo])

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

  return (
    <>
      <Appbar.Header>
        <Appbar.Action icon={"logout"} onPress={() => signOut()} />
        <Appbar.Content title="Music"></Appbar.Content>
        <Appbar.Action icon={"chart-bar"} onPress={() => navigation.navigate('Statistics')} />
      </Appbar.Header>
      <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
        <>
          <ScrollView>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              {currentTrack !== undefined ? <Card key={1145149191} style={{ width: "95%", marginBottom: 20 }} onPress={() => {
                navigation.navigate('Player', {})
              }} onLongPress={() => {
                console.log(playerState)
              }}>
                <ImageBackground src={currentTrack.artwork} style={{ borderRadius: theme.roundness / 0.35, overflow: 'hidden' }} blurRadius={20}>
                  <Card.Content style={{ backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.60)' : 'rgba(255, 255, 255, 0.60)' }}>
                    <Text variant="titleLarge" style={{marginTop: 20}}>Now playing · {currentTrack.title}</Text>
                    <Text variant="bodyMedium">{currentTrack.album}</Text>
                    <Text variant="bodyMedium">{currentTrack.artist}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                          icon="skip-previous"
                          size={25}
                          onPress={() => {
                            TrackPlayer.skipToPrevious().then(() => TrackPlayer.play())
                          }}
                        />
                      </View>
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                          icon={playerState.state === State.Playing ? "pause" : "play"}
                          size={25}
                          onPress={() => (playerState.state === State.Playing ? TrackPlayer.pause() : TrackPlayer.play())}
                        />
                      </View>
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                          icon="skip-next"
                          size={25}
                          onPress={() => {
                            TrackPlayer.skipToNext().then(() => TrackPlayer.play())
                          }}
                        />
                      </View>
                    </View>
                  </Card.Content>
                </ImageBackground>
              </Card> : <></>}

              {playlists.map(item => <Card key={item.id} style={{ width: "95%", marginBottom: 20 }} onPress={() => {
                navigation.navigate('PlaylistView', { playlist: item })
              }} onLongPress={() => {

              }}>
                <Card.Cover src={Api.getPlaylistArtworkPath(item.id)} style={{ height: 128 }}></Card.Cover>
                <Card.Content style={{ marginTop: 15 }}>
                  <Text variant="titleLarge">{item.name}</Text>
                  <Text variant="bodyMedium">{item.description}</Text>
                </Card.Content>
              </Card>)}
            </View>
          </ScrollView>
          <Portal>
            <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
          </Portal>
        </>
      </TouchableWithoutFeedback >
    </>
  )
};

export default withTheme(Profile);