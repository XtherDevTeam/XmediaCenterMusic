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
  FAB,
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
import CreatePlaylistDialog from '../components/CreatePlaylistDialog';
import * as Api from '../shared/api';
import * as storage from '../shared/storage';
import { mdTheme } from '../shared/styles';

import MiniPlayer from '../components/MiniPlayer';


const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

const Profile = ({ navigation, route }) => {
  let [userInfo, setUserInfo] = React.useState({})
  let [playlists, setPlaylists] = React.useState([])
  let currentTrack = useActiveTrack()
  let playerState = usePlaybackState()
  const [messageState, setMessageState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")
  const [createPlaylistDialogVisible, setCreatePlaylistDialogVisible] = React.useState(false)
  const theme = mdTheme()

  const fetchPlaylists = () => {
    Api.userPlaylists().then(data => {
      if (data.data.ok) {
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
    if (Object.keys(userInfo).length !== 0) {
      fetchPlaylists()
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
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Action icon={"logout"} onPress={() => signOut()} />
        <Appbar.Content title="Music"></Appbar.Content>
        <Appbar.Action icon={"chart-bar"} onPress={() => navigation.navigate('Statistics')} />
      </Appbar.Header>
      <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
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
            <CreatePlaylistDialog
              visible={createPlaylistDialogVisible}
              onDismiss={React.useCallback(() => setCreatePlaylistDialogVisible(false), [])}
              onCreate={React.useCallback(async (name, description) => {
                try {
                  const res = await Api.musicPlaylistCreate(name, description);
                  if (res.data.ok) {
                    fetchPlaylists();
                    setMessageText("Playlist created successfully");
                    setMessageState(true);
                  } else {
                    setMessageText("Failed to create playlist: " + res.data.data);
                    setMessageState(true);
                  }
                } catch (e) {
                  setMessageText("Failed to create playlist: NetworkError");
                  setMessageState(true);
                }
              }, [])}
            />

          </Portal>
          <FAB
            icon="plus"
            style={{
              position: 'absolute',
              margin: 16,
              right: 0,
              bottom: 80,
            }}
            onPress={() => setCreatePlaylistDialogVisible(true)}
          />
        </View>
      </TouchableWithoutFeedback >
    </View>
  )
};

export default withTheme(Profile);