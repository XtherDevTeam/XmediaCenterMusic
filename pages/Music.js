import * as React from 'react';
import { Appbar, Card, Drawer, Icon, PaperProvider, Portal, Surface, withTheme } from 'react-native-paper';
import { Banner } from 'react-native-paper';
import { Image, ImageBackground, Keyboard, Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';
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
import rntp, { State, useActiveTrack } from 'react-native-track-player';
import { BlurView } from '@react-native-community/blur'

const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

const Profile = ({ navigation, route }) => {
  let [userInfo, setUserInfo] = React.useState({})
  let [playlists, setPlaylists] = React.useState([])
  let currentTrack = useActiveTrack()
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
    if (userInfo !== {}) {
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
      </Appbar.Header>
      <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
        <>
          <ScrollView>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              {currentTrack !== undefined ? <Card key={1145149191} style={{ width: "95%", marginBottom: 20 }} onPress={() => {
                navigation.navigate('Player', {})
              }} onLongPress={() => {

              }}>
                <BlurView
                  blurType="light"
                  blurAmount={10}
                  reducedTransparencyFallbackColor="white"
                />
                <Card.Content style={{ marginTop: 15 }}>
                  <Text variant="titleLarge">{currentTrack.title} · Now playing</Text>
                  <Text variant="bodyMedium">{currentTrack.album}</Text>
                  <Text variant="bodyMedium">{currentTrack.artist}</Text>
                </Card.Content>
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