import * as React from 'react';
import { Appbar, Drawer, FAB, Icon, PaperProvider, Portal, adaptNavigationTheme, withTheme, Dialog, List, ProgressBar } from 'react-native-paper';
import { Banner } from 'react-native-paper';
import { Image, Keyboard, Platform, ScrollView, TouchableWithoutFeedback, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as documentPicker from 'expo-document-picker';
import * as fs from 'expo-file-system';
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
import * as Clipboard from 'expo-clipboard';
import * as sharing from 'expo-sharing';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import Music from './Music';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignIn from './SignIn';
import DirectoryView from '../components/DirectoryView';
import PlaylistSelector from '../components/PlaylistSelector';
import PathInput from '../components/PathInput';
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme
});

const MORE_ICON = 'dots-vertical';

let defaultFileActionsDialogState = {
  item: {
    filename: 'NaganoharaYoimya.ckpt',
    type: 'file',
    path: '/yoimiya/NaganoharaYoimya.ckpt',
    lastModified: '2008-12-09 06:21:00',
    mime: 'application/octet-stream'
  },
  visible: false
}

let defaultPlaylistSelectorState = {
  onSelect: (id) => null, state: false, onDismiss: () => null, onError: (e) => null, dismissable: true, title: 'Yoimiya!'
}

let defaultConfirmDownloadDialogState = {
  item: { filename: '', path: '', type: 'file' },
  state: false
}

let defaultConfirmDeletingDialogState = {
  item: { filename: '', path: '', type: 'file' },
  state: false
}

let defaultFileDownloadProgressDialogState = {
  filename: '',
  progress: 0,
  expected: 1,
  state: false
}

let defaultRenameDialogState = {
  item: { filename: '', path: '', type: 'file' },
  state: false,
}

let defaultPathInputState = {
  title: '',
  description: '',
  path: '/',
  acceptType: 'both',
  onDismiss: () => { },
  onSelect: () => { },
  state: false
}

const Home = ({ navigation, route }) => {
  let [pathInputState, setPathInputState] = React.useState(defaultPathInputState)
  let [renameDialogState, setRenameDialogState] = React.useState(defaultRenameDialogState)
  let [renameDialogInput, setRenameDialogInput] = React.useState("")
  let directoryViewRef = React.useRef(null)
  let [createFolderDialogFolderName, setCreateFolderDialogFolderName] = React.useState("")
  let [showCreateFolderDialog, setShowCreateFolderDialog] = React.useState(false)
  let downloadDialogState = React.useRef(['', false])
  let [confirmDeletingDialogState, setConfirmDeletingDialogState] = React.useState(defaultConfirmDeletingDialogState)
  let [fileDownloadProgressDialogState, setFileDownloadProgressDialogState] = React.useState(defaultFileDownloadProgressDialogState)
  let [confirmDownloadDialogState, setConfirmDownloadDialogState] = React.useState(defaultConfirmDownloadDialogState)
  let [showMoreOptions, setShowMoreOptions] = React.useState(false)
  let [fileActionsDialogState, setFileActionsDialogState] = React.useState(defaultFileActionsDialogState)
  let [playlistSelectorState, setPlaylistSelectorState] = React.useState(defaultPlaylistSelectorState)
  let [dirPath, setDirPath] = React.useState('')
  let [userInfo, setUserInfo] = React.useState({})
  const [messageState, setMessageState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")

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
                console.log('rnmcb')
                setDirPath('/')
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

  let handleCopyLink = (item) => {
    Clipboard.setStringAsync(Api.getShareLinkPath(item))
    setMessageText(`Link has been copied to clipboard: ${item}`)
    setMessageState(true)
  }

  let downloadItem = (item) => {
    let downloadPath = `${fs.documentDirectory}${item.filename}`
    setFileDownloadProgressDialogState({ filename: item.filename, progress: 0, pps: 0, expected: 1, state: true })
    downloadDialogState.current = [item.filename, true]
    fs.createDownloadResumable(Api.getDownloadPath(item.path), downloadPath, {}, (p) => {
      if (downloadDialogState.current[1]) {
        setFileDownloadProgressDialogState({
          filename: fileDownloadProgressDialogState.filename,
          progress: p.totalBytesWritten,
          expected: p.totalBytesExpectedToWrite,
          pps: p.totalBytesWritten / p.totalBytesExpectedToWrite,
          state: true
        })
      }
    }).downloadAsync().then(() => {
      downloadDialogState.current = ['', false]
      console.log('Download completed! Waiting for sharing menu to pop up...')
      setMessageText('Download completed! Waiting for sharing menu to pop up...')
      setMessageState(true)
      sharing.shareAsync(downloadPath).then(() => {
        console.log('cleaning temporoary files')
        fs.deleteAsync(downloadPath)
      })
      setFileDownloadProgressDialogState(defaultFileDownloadProgressDialogState)
    })
    setConfirmDownloadDialogState(defaultConfirmDownloadDialogState)
  }

  return (
    <PaperProvider theme={mdTheme()}>
      <>
        <Appbar.Header>
          <Appbar.Action icon={"logout"} onPress={() => signOut()} />
          <Appbar.Content title="Home"></Appbar.Content>
        </Appbar.Header>
        <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
          <>
            <ScrollView>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <DirectoryView
                  onRef={directoryViewRef}
                  style={{ marginBottom: 89 }}
                  showHeadImg={true}
                  path={dirPath}
                  onPressItem={i => {
                    if (i.type == 'dir') {
                      setDirPath(i.path)
                    } else {
                      setConfirmDownloadDialogState({ item: i, state: true })
                    }
                  }}
                  onLongPressItem={i => i.filename != '..' ? setFileActionsDialogState({ item: i, visible: true }) : null}
                  onError={(e) => {
                    setMessageText(`DirectoryView: ${e}`)
                    setMessageState(true)
                  }}
                  allowChangePath={true}
                  width='95%' />
              </View>
            </ScrollView>
            <Dialog visible={fileActionsDialogState.visible} onDismiss={() => setFileActionsDialogState(defaultFileActionsDialogState)}>
              <Dialog.Title>{fileActionsDialogState.item.filename}</Dialog.Title>
              <Dialog.Content>
                <Text ellipsizeMode='tail' numberOfLines={1}><Text variant='bodyLarge'>Path: </Text> {fileActionsDialogState.item.path}</Text>
                <Text><Text variant='bodyLarge'>MIME: </Text> {fileActionsDialogState.item.mime}</Text>
                <Text><Text variant='bodyLarge'>Last modified: </Text> {fileActionsDialogState.item.lastModified}</Text>
                <Text style={{ marginTop: 5 }}></Text>
                <List.Item
                  title="Copy"
                  left={props => <List.Icon {...props} icon="content-copy" />}
                  onPress={() => {
                    setPathInputState({
                      title: 'Copy to',
                      description: 'Select a path for the destination',
                      acceptType: 'dir',
                      path: dirPath,
                      onDismiss: () => setPathInputState(defaultPathInputState),
                      onSelect: v => {
                        Api.driveCopy(fileActionsDialogState.item.path, `${v}/`).then(r => {
                          if (r.data.ok) {
                            setMessageText(`Copied ${fileActionsDialogState.item.filename} to ${v} successfully.`)
                            setMessageState(true)
                          } else {
                            setMessageText(`Unable to copy ${fileActionsDialogState.item.filename} : ${r.data.data}`)
                            setMessageState(true)
                          }
                          directoryViewRef.current(Math.random())
                          setPathInputState(defaultPathInputState)
                        }).catch(r => {
                          setMessageText(`Unable to copy ${fileActionsDialogState.item.filename} : NetworkError`)
                          setMessageState(true)
                          setPathInputState(defaultPathInputState)
                        })
                      },
                      state: true
                    })
                    setFileActionsDialogState(defaultFileActionsDialogState)
                  }}
                />
                <List.Item
                  title="Move"
                  left={props => <List.Icon {...props} icon="folder-move" />}
                  onPress={() => {
                    setPathInputState({
                      title: 'Move to',
                      description: 'Select a path for the destination',
                      acceptType: 'dir',
                      path: dirPath,
                      onDismiss: () => setPathInputState(defaultPathInputState),
                      onSelect: v => {
                        Api.driveMove(fileActionsDialogState.item.path, `${v}/`).then(r => {
                          if (r.data.ok) {
                            setMessageText(`Copied ${fileActionsDialogState.item.filename} to ${v} successfully.`)
                            setMessageState(true)
                          } else {
                            setMessageText(`Unable to copy ${fileActionsDialogState.item.filename} : ${r.data.data}`)
                            setMessageState(true)
                          }
                          directoryViewRef.current(Math.random())
                          setPathInputState(defaultPathInputState)
                        }).catch(r => {
                          setMessageText(`Unable to copy ${fileActionsDialogState.item.filename} : NetworkError`)
                          setMessageState(true)
                          setPathInputState(defaultPathInputState)
                        })
                      },
                      state: true
                    })
                    setFileActionsDialogState(defaultFileActionsDialogState)
                  }}
                />
                <List.Item
                  title="Rename"
                  left={props => <List.Icon {...props} icon="rename-box" />}
                  onPress={() => {
                    setRenameDialogInput(fileActionsDialogState.item.filename)
                    setRenameDialogState({ item: fileActionsDialogState.item, state: true })
                    setFileActionsDialogState(defaultFileActionsDialogState)
                  }}
                />
                <List.Item
                  title="Delete"
                  left={props => <List.Icon {...props} icon="delete" />}
                  onPress={() => {
                    setConfirmDeletingDialogState({ item: fileActionsDialogState.item, state: true })
                    setFileActionsDialogState(defaultFileActionsDialogState)
                  }}
                />
                <List.Item
                  title="Share"
                  left={props => <List.Icon {...props} icon="share" />}
                  onPress={() => {
                    Api.shareLinkCreate(fileActionsDialogState.item.path).then(r => {
                      if (r.data.ok) {
                        console.log(r.data.data)
                        handleCopyLink(r.data.data)
                      } else {
                        setMessageText(`Unable to create a share link: ${r.data.data}`)
                        setMessageState(true)
                      }
                      setFileActionsDialogState(defaultFileActionsDialogState)
                    }).catch(r => {
                      console.log(r)
                      setMessageText(`Unable to create a share link: NetworkError`)
                      setMessageState(true)
                    })
                  }}
                />
                {fileActionsDialogState.item.mime.startsWith('audio/') && <List.Item
                  title="Add to playlist"
                  left={props => <List.Icon {...props} icon="playlist-plus" />}
                  onPress={() => {
                    setPlaylistSelectorState({
                      onSelect: (id) => Api.musicPlaylistSongsInsert(id, fileActionsDialogState.item.path).then(d => {
                        if (d.data.ok) {
                          setMessageText(`Added ${fileActionsDialogState.item.filename} to playlist successfully.`)
                          setMessageState(true)
                        } else {
                          setMessageText(`Failed to add song to playlist: ${d.data.data}`)
                          setMessageState(true)
                        }
                        setPlaylistSelectorState(defaultFileActionsDialogState)
                      }).catch(e => {
                        setMessageText(`Failed to add song to playlist: NetworkError`)
                        setMessageState(true)
                        setPlaylistSelectorState(defaultFileActionsDialogState)
                      }),
                      onDismiss: () => setPlaylistSelectorState(defaultFileActionsDialogState),
                      dismissable: true,
                      title: `Add ${fileActionsDialogState.item.filename} to playlist`,
                      state: true
                    })
                    setFileActionsDialogState(defaultFileActionsDialogState)
                  }}
                />}
                <List.Item
                  title="Download"
                  left={props => <List.Icon {...props} icon="download" />}
                  onPress={() => {
                    setConfirmDownloadDialogState({ item: fileActionsDialogState.item, state: true })
                    setFileActionsDialogState(defaultFileActionsDialogState)
                  }}
                />
              </Dialog.Content>
            </Dialog>
            <Dialog visible={showMoreOptions} onDismiss={() => setShowMoreOptions(false)}>
              <Dialog.Title>More options</Dialog.Title>
              <Dialog.Content>
                <List.Item
                  title="Upload"
                  left={props => <List.Icon {...props} icon="upload" />}
                  onPress={() => {
                    documentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: true }).then(r => {
                      if (!r.canceled) {
                        r.assets.forEach(rv => fs.uploadAsync(Api.driveUpload(dirPath, rv.name), rv.uri, { httpMethod: 'POST', uploadType: fs.FileSystemUploadType.MULTIPART }).then(rvv => {
                          console.log(rv.uri)
                          if (rvv.status == 200) {
                            let data = JSON.parse(rvv.body)
                            if (data.ok) {
                              setMessageText(`Uploaded ${rv.name} successfully.`)
                              setMessageState(true)
                            } else {
                              setMessageText(`Unable to upload ${rv.name} : ${data.data}`)
                              setMessageState(true)
                            }
                          } else {
                            setMessageText(`Unable to upload ${rv.name} : NetworkError`)
                            setMessageState(true)
                          }
                          directoryViewRef.current(Math.random())
                        }).catch(rvv => {
                          setMessageText(`Unable to upload ${rv.name} : NetworkError`)
                          setMessageState(true)
                          directoryViewRef.current(Math.random())
                        }))
                      }
                    })
                  }}
                />
                <List.Item
                  title="Download music"
                  left={props => <List.Icon {...props} icon="cloud-download" />}
                  onPress={() => {

                  }}
                />
                <List.Item
                  title="Refresh"
                  left={props => <List.Icon {...props} icon="refresh" />}
                  onPress={() => {
                    console.log('current dir', dirPath)
                    directoryViewRef.current(Math.random())
                    setShowMoreOptions(false)
                  }}
                />
                <List.Item
                  title="Create folder"
                  left={props => <List.Icon {...props} icon="folder-plus" />}
                  onPress={() => {
                    setShowCreateFolderDialog(true)
                    setShowMoreOptions(false)
                  }}
                />
              </Dialog.Content>
            </Dialog>
            <PathInput {...pathInputState}></PathInput>
            <Dialog visible={renameDialogState.state} onDismiss={() => {
              setRenameDialogState(defaultRenameDialogState)
              setRenameDialogInput('')
            }}>
              <Dialog.Title>Rename</Dialog.Title>
              <Dialog.Content>
                <TextInput label={`Enter new name for ${renameDialogState.item.filename}`} value={renameDialogInput} onChangeText={v => setRenameDialogInput(v)}></TextInput>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => {
                  setRenameDialogState(defaultRenameDialogState)
                  setRenameDialogInput('')
                }}>Cancel</Button>
                <Button onPress={() => {
                  Api.driveRename(renameDialogState.item.path, renameDialogInput).then(r => {
                    if (r.data.ok) {
                      setMessageText(`Renamed to ${renameDialogInput} successfully`)
                      setMessageState(true)
                    } else {
                      setMessageText(`Unable to rename item: ${r.data.data}`)
                      setMessageState(true)
                    }
                    directoryViewRef.current(Math.random())
                    setRenameDialogState(defaultRenameDialogState)
                    setRenameDialogInput('')
                  }).catch(r => {
                    setMessageText(`Unable to rename item: NetworkError`)
                    setMessageState(true)
                    setRenameDialogState(defaultRenameDialogState)
                    setRenameDialogInput('')
                  })
                }}>Rename</Button>
              </Dialog.Actions>
            </Dialog>
            <Dialog visible={fileDownloadProgressDialogState.state} onDismiss={() => {
              setFileDownloadProgressDialogState(defaultFileDownloadProgressDialogState)
              downloadDialogState.current = ['', false]
            }}>
              <Dialog.Title>Downloading {fileDownloadProgressDialogState.filename}</Dialog.Title>
              <Dialog.Content>
                <Text variant='bodyMedium'>Progress: ({fileDownloadProgressDialogState.progress}/{fileDownloadProgressDialogState.expected})</Text>
                <ProgressBar progress={fileDownloadProgressDialogState.pps}></ProgressBar>
              </Dialog.Content>
            </Dialog>
            <Dialog visible={confirmDeletingDialogState.state} onDismiss={() => setConfirmDeletingDialogState(defaultConfirmDeletingDialogState)}>
              <Dialog.Title>Confirm deleting</Dialog.Title>
              <Dialog.Content><Text variant='bodyMedium'>Are you really going to delete {confirmDeletingDialogState.item.filename}?</Text></Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setConfirmDeletingDialogState(defaultConfirmDeletingDialogState)}>Cancel</Button>
                <Button onPress={() => {
                  Api.driveDelete(confirmDeletingDialogState.item.path).then(r => {
                    if (r.data.ok) {
                      setMessageText(`Deleted ${confirmDeletingDialogState.item.filename} successfully.`)
                      setMessageState(true)
                    } else {
                      setMessageText(`Unable to delete ${confirmDeletingDialogState.item.filename}: ${r.data.data}`)
                      setMessageState(true)
                    }
                  }).catch(r => {
                    setMessageText(`Unable to delete ${confirmDeletingDialogState.item.filename}: NetworkError`)
                    setMessageState(true)
                  })
                  directoryViewRef.current(Math.random())
                  setFileActionsDialogState(defaultFileActionsDialogState)
                  setConfirmDeletingDialogState(defaultConfirmDeletingDialogState)
                }}>Confirm</Button>
              </Dialog.Actions>
            </Dialog>
            <Dialog visible={showCreateFolderDialog} onDismiss={() => setShowCreateFolderDialog(false)}>
              <Dialog.Title>Create folder</Dialog.Title>
              <Dialog.Content>
                <TextInput mode='flat' label={'New folder name'} value={createFolderDialogFolderName} onChangeText={v => setCreateFolderDialogFolderName(v)}></TextInput>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowCreateFolderDialog(false)}>Cancel</Button>
                <Button onPress={() => {
                  Api.driveCreateDir(dirPath, createFolderDialogFolderName).then(r => {
                    if (r.data.ok) {
                      setMessageText(`Created ${createFolderDialogFolderName} successfully`)
                      setMessageState(true)
                    } else {
                      setMessageText(`Unable to create ${createFolderDialogFolderName} : ${r.data.data}`)
                      setMessageState(true)
                    }
                    directoryViewRef.current(Math.random())
                    setShowCreateFolderDialog(false)
                  }).catch(r => {
                    setMessageText(`Unable to create ${createFolderDialogFolderName} : NetworkError`)
                    setMessageState(true)
                    setShowCreateFolderDialog(false)
                  })
                }}>Create</Button>
              </Dialog.Actions>
            </Dialog>
            <Dialog visible={confirmDownloadDialogState.state} onDismiss={() => setConfirmDownloadDialogState(defaultConfirmDownloadDialogState)}>
              <Dialog.Title>Confirm downloading</Dialog.Title>
              <Dialog.Content><Text variant='bodyMedium'>Are you really going to download {confirmDownloadDialogState.item.filename}?</Text></Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setConfirmDownloadDialogState(defaultConfirmDownloadDialogState)}>Cancel</Button>
                <Button onPress={() => {
                  downloadItem(confirmDownloadDialogState.item)
                }}>Confirm</Button>
              </Dialog.Actions>
            </Dialog>
            <PlaylistSelector
              state={playlistSelectorState.state}
              dismissable={playlistSelectorState.dismissable}
              onDismiss={playlistSelectorState.onDismiss}
              onError={playlistSelectorState.onError}
              onSelect={playlistSelectorState.onSelect}
              title={playlistSelectorState.title} />
            <Portal>
              <FAB
                icon={MORE_ICON}
                style={{
                  position: 'absolute',
                  margin: 16,
                  right: 0,
                  bottom: 0
                }}
                onPress={() => setShowMoreOptions(true)}
              />
              <Message timeout={5000} style={{
                position: 'absolute',
                margin: 16,
                width: '91.5%',
                bottom: 0
              }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
            </Portal>
          </>
        </TouchableWithoutFeedback >
      </>
    </PaperProvider>
  )
};


export default withTheme(Home);