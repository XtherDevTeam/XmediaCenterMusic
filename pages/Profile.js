import * as React from 'react';
import { Appbar, Card, DataTable, Drawer, Icon, PaperProvider, Portal, withTheme } from 'react-native-paper';
import { Banner } from 'react-native-paper';
import { Image, Keyboard, Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';
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
import * as Clipboard from 'expo-clipboard';


const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

const Profile = ({ navigation, route }) => {
  let [userInfo, setUserInfo] = React.useState({})
  let [userShareLinks, setUserShareLinks] = React.useState([])
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
                console.log(data.data.data)
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
    if (userInfo != {} && userInfo !== undefined) {
      Api.userShareLinks(userInfo.id).then(data => {
        if (data.data.ok) {
          console.log(data.data.data)
          setUserShareLinks(data.data.data)
        } else {
          setMessageText(`Unable to fetch user share links: ${data.data.data}`)
          setMessageState(true)
        }
      }).catch(err => {
        setMessageText("Unable to fetch user share links: NetworkError")
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

  let handleCopyLink = (item) => {
    Clipboard.setStringAsync(Api.getShareLinkPath(item.id))
    setMessageText(`Link has been copied to clipboard: ${item.id}`)
    setMessageState(true)
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.Action icon={"logout"} onPress={() => signOut()} />
        <Appbar.Content title="Profile"></Appbar.Content>
      </Appbar.Header>
      <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
        <>
          <ScrollView>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Card style={{ width: "95%" }}>
                <Card.Cover source={{ uri: Api.userHeadImgUrl(userInfo.id) }} style={{ height: 128 }} />
                <Card.Content style={{ marginTop: 15 }}>
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Avatar.Image source={{ uri: Api.userAvatarUrl(userInfo.id) }} size={42}></Avatar.Image>
                    <Text variant="titleLarge">{userInfo.name}</Text>
                    <Text variant="bodyMedium" style={{ textAlign: 'center' }}>{userInfo.slogan}</Text>
                  </View>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Share name</DataTable.Title>
                      <DataTable.Title numeric>link</DataTable.Title>
                    </DataTable.Header>
                    {userShareLinks.map((item) => (
                      <DataTable.Row key={item.id} onPress={() => {
                        handleCopyLink(item)
                      }}>
                        <DataTable.Cell>{item.path}</DataTable.Cell>
                        <DataTable.Cell numeric>{item.id}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </Card.Content>
              </Card>
              <Portal>
                <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
              </Portal>
            </View>
          </ScrollView>
        </>
      </TouchableWithoutFeedback >
    </>
  )
};

export default withTheme(Profile);