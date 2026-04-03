import * as React from 'react';
import * as documentPicker from 'expo-document-picker';
import * as fs from 'expo-file-system';
import {
  Image,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  adaptNavigationTheme,
  Appbar,
  Avatar,
  Button,
  Card,
  DataTable,
  Dialog,
  Icon,
  Menu,
  PaperProvider,
  Portal,
  Surface,
  Text,
  withTheme,
} from 'react-native-paper';


import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';

import Message from '../components/Message';
import PathInput from '../components/PathInput';
import * as Api from '../shared/api';
import * as playerBackend from '../shared/playerBackend';

import * as storage from '../shared/storage';
import { mdTheme } from '../shared/styles';
import { useIsConnected, useCacheStatus } from '../shared/hooks';

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
  
  const isConnected = useIsConnected();
  const cachedIds = useCacheStatus(playlistSongs);

  let [pathInputVisible, setPathInputVisible] = React.useState(false)
  let [menuVisible, setMenuVisible] = React.useState(false)
  let [defaultMusicStoragePath, setDefaultMusicStoragePath] = React.useState('/')
  let rntpStylePlaylist = React.useRef([])
  let theme = mdTheme()

  React.useEffect(() => {
    storage.inquireItem('defaultMusicStoragePath', (ok, val) => {
      if (ok && val) {
        setDefaultMusicStoragePath(val);
      }
    });
  }, []);

  const handleUploadAndAdd = async () => {
    try {
      const result = await documentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setMenuVisible(false);
      setMessageText(`Starting upload of ${result.assets.length} file(s)...`);
      setMessageState(true);

      for (const asset of result.assets) {
        const uploadUrl = Api.driveUpload(defaultMusicStoragePath, asset.name);
        const uploadResult = await fs.uploadAsync(uploadUrl, asset.uri, {
          httpMethod: 'POST',
          uploadType: fs.FileSystemUploadType.MULTIPART,
        });

        if (uploadResult.status === 200) {
          const data = JSON.parse(uploadResult.body);
          if (data.ok) {
            const fullPath = defaultMusicStoragePath.endsWith('/') 
              ? defaultMusicStoragePath + asset.name 
              : defaultMusicStoragePath + '/' + asset.name;
            await Api.musicPlaylistSongsInsert(playlist.id, fullPath);
          }
        }
      }

      fetchSongs();
      setMessageText("All files uploaded and added successfully!");
      setMessageState(true);
    } catch (e) {
      console.error(e);
      setMessageText("An error occurred during upload: " + e.message);
      setMessageState(true);
    }
  };


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

  const fetchSongs = () => {
    Api.musicPlaylistSongs(playlist.id).then(data => {
      if (data.data.ok) {
        setPlaylistSongs(data.data.data)
        rntpStylePlaylist.current = covertPlaylistAsRntpStyle(data.data.data)
      } else {
        setMessageText(`Error querying playlist songs: NetworkError`)
        setMessageState(true)
      }
    })
  }

  React.useEffect(fetchSongs, [playlist])

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
        description: i.id,
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
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action icon="plus" onPress={() => setMenuVisible(true)} />
            }
          >
            <Menu.Item onPress={() => { setMenuVisible(false); setPathInputVisible(true); }} title="Add from Drive" leadingIcon="folder-search" />
            <Menu.Item onPress={handleUploadAndAdd} title="Upload & Add" leadingIcon="upload" />
          </Menu>
        </Appbar.Header>
        <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
          <>
            <ScrollView style={{ flex: 1 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ width: '90%' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ flex: 30 }}>
                      <Surface elevation={4} style={{ width: '100%', borderRadius: theme.roundness }}>
                        <Image source={{ uri: Api.getPlaylistArtworkPath(playlist.id) }} style={{ width: '100%', aspectRatio: 1, borderRadius: theme.roundness }} />
                      </Surface>
                    </View>
                    <View style={{ flex: 5 }}></View>
                    <View style={{ flex: 50 }}>
                      <Text variant="titleLarge">{playlist.name}</Text>
                      <Text variant="bodyMedium" numberOfLines={1}>{playlist.description.substring(0, 128)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        <Avatar.Image source={{ uri: Api.userAvatarUrl(playlist.owner) }} size={24}></Avatar.Image>
                        <Text style={{ marginLeft: 5 }} variant="bodyMedium">
                          {userInfo.name}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7 }}>
                        <Icon source={'play-circle'} size={19} />
                        <Text style={{ marginLeft: 5 }} variant='bodyMedium'>{playlist.playCount}</Text>
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
                  {playlistSongs.map((item, idx) => {
                    const isCached = cachedIds.has(item.id.toString());
                    const isAvailable = isConnected || isCached;
                    
                    return (
                      <DataTable.Row 
                        key={item.id} 
                        style={{ opacity: isAvailable ? 1 : 0.5 }}
                        onPress={() => {
                          if (!isAvailable) {
                            setMessageText("Offline and no cache available for this song.");
                            setMessageState(true);
                            return;
                          }
                          playerBackend.setCurrentTrack(playlist.id, rntpStylePlaylist.current, idx, true)
                          navigation.navigate('Player', {})
                        }} 
                        onLongPress={() => {
                          setDeleteSongDialogState({ item, state: true })
                        }}
                      >
                        <DataTable.Cell>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text>{item.info.title}</Text>
                            {(isConnected && isCached) && (
                              <Icon source="check-circle-outline" size={16} color={theme.colors.primary} />
                            )}
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell numeric>{item.info.artist}</DataTable.Cell>
                      </DataTable.Row>
                    );
                  })}
                </DataTable>
              </Card>
            </ScrollView>
            <Dialog visible={deleteSongDialogState.state} dismissable={true} onDismiss={() => setDeleteSongDialogState(defaultDeleteSongDialogState)}>
              <Dialog.Title>{deleteSongDialogState.item.info.title}</Dialog.Title>
              <Dialog.Content>
                <Text variant='bodyLarge' style={{ fontWeight: 'bold', paddingRight: 5 }}>
                  Artist
                </Text>
                <Text
                  variant='bodyLarge'
                  style={{ color: theme.colors.secondary, marginTop: 4 }}
                >

                  {deleteSongDialogState.item.info.artist}
                </Text>
                <Text variant='bodyLarge' style={{ fontWeight: 'bold' }}>
                  Album
                </Text>
                <Text
                  variant='bodyLarge'
                  style={{ color: theme.colors.secondary, marginTop: 4 }}
                >

                  {deleteSongDialogState.item.info.album}
                </Text>
              </Dialog.Content>
              <Dialog.Actions >
                <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Button onPress={() => {
                    playerBackend.setCurrentTrack(playlist.id, rntpStylePlaylist.current, playlistSongs.indexOf(deleteSongDialogState.item), true)
                    setDeleteSongDialogState(defaultDeleteSongDialogState)
                    navigation.navigate('Player', {})
                  }}>Play Now</Button>
                  <Button onPress={() => {
                    const rntpTrack = covertPlaylistAsRntpStyle([deleteSongDialogState.item])
                    playerBackend.addTracksToQueue(rntpTrack).then(() => {
                      setMessageText(`Added ${deleteSongDialogState.item.info.title} to queue`)
                      setMessageState(true)
                      setDeleteSongDialogState(defaultDeleteSongDialogState)
                    })
                  }}>Add to Queue</Button>
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
                  })} textColor={theme.colors.error}>Delete from Playlist</Button>
                  <Button onPress={() => setDeleteSongDialogState(defaultDeleteSongDialogState)}>Cancel</Button>
                </View>
              </Dialog.Actions>
            </Dialog>
            <Portal>
              <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
              <PathInput
                state={pathInputVisible}
                onDismiss={() => setPathInputVisible(false)}
                onSelect={async (paths) => {
                  setPathInputVisible(false);
                  const selectedPaths = Array.isArray(paths) ? paths : [paths];
                  
                  setMessageText(`Adding ${selectedPaths.length} song(s) to playlist...`);
                  setMessageState(true);

                  for (const path of selectedPaths) {
                    try {
                      await Api.musicPlaylistSongsInsert(playlist.id, path);
                    } catch (e) {
                      console.error(`Failed to add ${path}:`, e);
                    }
                  }
                  
                  fetchSongs();
                  setMessageText(`${selectedPaths.length} song(s) added successfully`);
                  setMessageState(true);
                }}
                onError={(msg) => {
                  setMessageText(msg);
                  setMessageState(true);
                }}
                path="/"
                acceptType="file"
                multiSelect={true}
                mimeFilter="audio/*"
                title="Add Songs from Drive"
                description="Select one or more songs to add to the playlist"
                dismissable={true}
              />

            </Portal>
          </>
        </TouchableWithoutFeedback >
      </>
    </PaperProvider >
  )
};


export default withTheme(PlaylistView);