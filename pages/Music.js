import * as React from 'react';
import { Appbar, Drawer, Icon, PaperProvider, Portal, withTheme } from 'react-native-paper';
import { Banner } from 'react-native-paper';
import { Image, Keyboard, Platform, TouchableWithoutFeedback } from 'react-native';
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

const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

const Profile = ({ navigation, route }) => {
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

  return (
    <>
      <Appbar.Header>
        <Appbar.Action icon={"logout"} onPress={() => signOut()} />
        <Appbar.Content title="Music"></Appbar.Content>
      </Appbar.Header>
      <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
        <>
          <Portal>
            <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
          </Portal>
        </>
      </TouchableWithoutFeedback >
    </>
  )
};

export default withTheme(Profile);