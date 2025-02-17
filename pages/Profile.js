import * as React from 'react';

import * as Clipboard from 'expo-clipboard';
import {
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Appbar,
  Avatar,
  Button,
  Card,
  DataTable,
  Dialog,
  Portal,
  Text,
  withTheme,
} from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import Message from '../components/Message';
import * as Api from '../shared/api';
import * as storage from '../shared/storage';

const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

let defaultConfirmDeletingDialogState = {
  item: { id: 114514 },
  state: false
}

const Profile = ({ navigation, route }) => {
  let [confirmDeletingDialogState, setConfirmDeletingDialogState] = React.useState(defaultConfirmDeletingDialogState)
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

  let refreshShareLinks = () => (userInfo != {} ? Api.userShareLinks(userInfo.id).then(data => {
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
  }) : console.log('nmsl', userInfo))

  React.useEffect(() => {
    console.log(userInfo)
    refreshShareLinks()
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
        <Appbar.Action  icon={"information-outline"} onPress={() => navigation.navigate('About', {})} />
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
                      }} onLongPress={() => {
                        setConfirmDeletingDialogState({ item, state: true })
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
          <Dialog visible={confirmDeletingDialogState.state} onDismiss={() => setConfirmDeletingDialogState(defaultConfirmDeletingDialogState)}>
            <Dialog.Title>Confirm deleting share link</Dialog.Title>
            <Dialog.Content><Text variant='bodyMedium'>Are you really going to delete share link {confirmDeletingDialogState.item.id}?</Text></Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmDeletingDialogState(defaultConfirmDeletingDialogState)}>Cancel</Button>
              <Button onPress={() => Api.shareLinkDelete(confirmDeletingDialogState.item.id).then(r => {
                if (r.data.ok) {
                  setMessageText(`Deleted share link ${confirmDeletingDialogState.item.id} successfully.`)
                  setMessageState(true)
                } else {
                  setMessageText(`Unable to delete share link ${confirmDeletingDialogState.item.id}: ${r.data.data}`)
                  setMessageState(true)
                }
                refreshShareLinks()
                setConfirmDeletingDialogState(defaultConfirmDeletingDialogState)
              }).catch(r => {
                setMessageText(`Unable to delete share link ${confirmDeletingDialogState.item.id}: NetworkError`)
                setMessageState(true)
                setConfirmDeletingDialogState(defaultConfirmDeletingDialogState)
              })}>Confirm</Button>
            </Dialog.Actions>
          </Dialog>
        </>
      </TouchableWithoutFeedback >
    </>
  )
};

export default withTheme(Profile);