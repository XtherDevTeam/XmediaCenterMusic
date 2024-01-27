import * as React from 'react';
import { Appbar, Card, DataTable, Dialog, Drawer, Icon, PaperProvider, Portal, adaptNavigationTheme, withTheme } from 'react-native-paper';
import { Banner } from 'react-native-paper';
import { Image, Keyboard, Platform, ScrollView, TouchableWithoutFeedback, useColorScheme } from 'react-native';
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
import * as playerBackend from '../shared/playerBackend';
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

let defaultDeleteSongDialogState = {
  item: { path: '', id: 114514, info: { title: '' } },
  state: false
}

const PlaylistView = ({ navigation, route }) => {
  let [deleteSongDialogState, setDeleteSongDialogState] = React.useState(defaultDeleteSongDialogState)
  let [userInfo, setUserInfo] = React.useState({})
  const [messageState, setMessageState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")
  let [playlist, setPlaylist] = React.useState(route.params.playlist)
  let [playlistSongs, setPlaylistSongs] = React.useState([])
  let rntpStylePlaylist = React.useRef([])
  let theme = mdTheme()

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

  let refreshPlaylist = () => {
    Api.musicPlaylistInfo(route.params.playlist.id).then(data => {
      if (data.data.ok) {
        setPlaylist(data.data.data)
      } else {
        setMessageText(`Error querying playlist content: NetworkError`)
        setMessageState(true)
      }
    })
  }

  React.useEffect(refreshPlaylist, [route.params.playlist])

  React.useEffect(() => {
    Api.musicPlaylistSongs(playlist.id).then(data => {
      if (data.data.ok) {
        setPlaylistSongs(data.data.data)
        rntpStylePlaylist.current = covertPlaylistAsRntpStyle(data.data.data)
        console.log(rntpStylePlaylist.current)
      } else {
        setMessageText(`Error querying playlist songs: NetworkError`)
        setMessageState(true)
      }
    })
  }, [playlist])

  let covertPlaylistAsRntpStyle = (p) => {
    console.log("what the heck")
    let rntpStyle = []
    p.forEach((i, j) => {
      rntpStyle.push({
        id: i.id,
        title: i.info.title,
        artist: i.info.artist,
        album: i.info.album,
        artwork: Api.getSongArtworkPath(i.id),
        genre: 'Powered by xiaokang00010 with Naganohara Yoimiya',
        url: Api.getMusicPlaylistSongsFileSrc(playlist.id, i.id),
        duration: i.info.length,
      })
    })
    return rntpStyle
  }

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
    <PaperProvider theme={mdTheme()}>
      <>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={"Playlist"}></Appbar.Content>
        </Appbar.Header>
        <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
          <>
            <ScrollView style={{ flex: 1 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ width: '90%' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ flex: 30 }}>
                      <Image source={{ uri: Api.getPlaylistArtworkPath(playlist.id) }} style={{ width: '100%', aspectRatio: 1, borderRadius: theme.roundness }} />
                    </View>
                    <View style={{ flex: 5 }}></View>
                    <View style={{ flex: 50 }}>
                      <Text variant="titleLarge">{playlist.name}</Text>
                      <Text variant="bodyMedium">{playlist.description.substring(0, 128)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        <Avatar.Image source={{ uri: Api.userAvatarUrl(playlist.owner) }} size={24}></Avatar.Image>
                        <Text style={{ marginLeft: 5 }} variant="bodyMedium">
                          {userInfo.name}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <Card style={{ marginTop: 25, flex: 1 }}>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Title</DataTable.Title>
                    <DataTable.Title numeric>Artist</DataTable.Title>
                  </DataTable.Header>
                  {playlistSongs.map((item, idx) => (
                    <DataTable.Row key={item.id} onPress={() => {
                      playerBackend.setCurrentTrack(rntpStylePlaylist.current, idx, true)
                      navigation.navigate('Player', {})
                    }} onLongPress={() => {
                      setDeleteSongDialogState({item, state: true})
                    }}>
                      <DataTable.Cell>{item.info.title}</DataTable.Cell>
                      <DataTable.Cell numeric>{item.info.artist}</DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Card>
            </ScrollView>
            <Dialog visible={deleteSongDialogState.state} dismissable={true} onDismiss={() => setDeleteSongDialogState(defaultDeleteSongDialogState)}>
              <Dialog.Title>Delete song from playlist</Dialog.Title>
              <Dialog.Content><Text variant='bodyMedium'>Are you really going to delete {deleteSongDialogState.item.info.title} from playlist?</Text></Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDeleteSongDialogState(deleteSongDialogState)}>Cancel</Button>
              <Button onPress={() => Api.musicPlaylistSongsDelete(playlist.id, deleteSongDialogState.item.id).then(d => {
                if (d.data.ok) {
                  refreshPlaylist()
                  setMessageText(`Deleted ${deleteSongDialogState.item.info.title} successfully`)
                  setMessageState(true)
                } else {
                  setMessageText(`Unable to delete ${deleteSongDialogState.item.info.title} : ${d.data.data}`)
                  setMessageState(true)
                }
                setDeleteSongDialogState(defaultDeleteSongDialogState)
              }).catch(e => {
                setMessageText(`Unable to delete ${deleteSongDialogState.item.info.title} : NetworkError`)
                setMessageState(true)
                setDeleteSongDialogState(defaultDeleteSongDialogState)
              })}>Continue</Button>
            </Dialog.Actions>
          </Dialog>
          <Portal>
            <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
          </Portal>
        </>
      </TouchableWithoutFeedback >
    </>
    </PaperProvider >
  )
};


export default withTheme(PlaylistView);