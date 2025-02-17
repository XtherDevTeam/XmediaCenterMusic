import * as React from 'react';

import {
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Appbar,
  Avatar,
  Button,
  Icon,
  Portal,
  Text,
  TextInput,
  withTheme,
} from 'react-native-paper';
import rntp from 'react-native-track-player';

import Message from '../components/Message';
import * as Api from '../shared/api';
import * as storage from '../shared/storage';

const SignIn = ({ navigation, route }) => {
  const serverAddressRef = React.useRef(null)
  const usernameRef = React.useRef(null)
  const passwordRef = React.useRef(null)

  const handlePress = () => {
    serverAddressRef.current?.blur()
    usernameRef.current?.blur()
    passwordRef.current?.blur()
    setMessageState(false)
  }

  const [serverAddressState, setServerAddressState] = React.useState("")
  const [usernameState, setUsernameState] = React.useState("")
  const [passwordState, setPasswordState] = React.useState("")
  const [messageState, setMessageState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")
  const [currentLoginState, setCurrentLoginState] = React.useState(false)

  React.useEffect(() => {
    storage.inquireItem('serverAddress', (result, v) => {
      if (result) {
        setServerAddressState(v)
      }
    })
    storage.inquireItem('username', (result, v) => {
      if (result) {
        setUsernameState(v)
      }
    })
    storage.removeItem('loginSession', r => {})
    storage.removeItem('loginStatus', r => {})
    Api.refreshStorageUrl()
    rntp.setQueue([])
  }, [])
  React.useEffect(() => {
    if (route.params.hasOwnProperty('initialPage') === true) {
      setMessageText('User is not logged in')
      setMessageState(true)
    }
  }, [route])

  const onSubmit = () => {
    console.log(serverAddressState, usernameState, passwordState)
    storage.setItem('serverAddress', serverAddressState, (r) => {
      if (!r) {
        setMessageText("Unable to store server address.")
        setMessageState(true)
      }
    })
    storage.setItem('username', usernameState, (r) => {
      if (!r) {
        setMessageText("Unable to store username.")
        setMessageState(true)
      }
    })
    Api.refreshStorageUrl()
    Api.submitLogin(usernameState, passwordState).then((result) => {
      if (result.data.ok) {
        storage.setItem('loginStatus', result.data.data, (r) => {
          if (!r) {
            setMessageText("Unable to store login status.")
            setMessageState(true)
          }
          if (route.params.hasOwnProperty("initialPage") === true) {
            route.params.initialPage = false
          }
          navigation.goBack()
        })
      } else {
        setMessageText(`Unable to login: ${result.data.data}`)
        setMessageState(true)
      }
    }, (err) => {
      console.log(JSON.stringify(err))
      setMessageText("Unable to login: NetworkError")
      setMessageState(true)
    })
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title="Sign In" ></Appbar.Content>
      </Appbar.Header>
      <ScrollView>
        <TouchableWithoutFeedback onPress={handlePress} accessible={false}>
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Avatar.Image
              source={require('../assets/new.png')}
              size={100}
              style={{ marginTop: 20 }}
            />
            <Text variant="headlineSmall" style={{ marginTop: 20 }}>Welcome to XmediaCenter Music</Text>

            <TextInput
              label="Server Address"
              placeholder='http://yoimiyaIsTheBest.localhost:11452/'
              style={{ width: '90%', marginTop: 20 }}
              ref={serverAddressRef}
              value={serverAddressState}
              keyboardType='url'
              onChangeText={(v) => setServerAddressState(v)}
            />

            <TextInput
              label="Username"
              placeholder='JerryChou'
              style={{ width: '90%', marginTop: 20 }}
              ref={usernameRef}
              value={usernameState}
              onChangeText={(v) => setUsernameState(v)}
            />

            <TextInput
              label="Password"
              placeholder='Enter your password here...'
              secureTextEntry
              style={{ width: '90%', marginTop: 20 }}
              ref={passwordRef}
              value={passwordState}
              onChangeText={(v) => setPasswordState(v)}
            />

            <Button mode='contained-tonal' style={{ width: '90%', marginTop: 20 }} onPress={() => {
              onSubmit()
            }}>Login</Button>

            <Text variant='bodySmall' style={{ width: "90%", marginTop: 20, textAlign: 'center' }}>
              <Icon size={15} source={"alert-circle-outline"}></Icon>
              This application does not support registration currently, please finish your registration in the corresponding website.
            </Text>
            <Portal>
              <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
            </Portal>
          </View >

        </TouchableWithoutFeedback >
      </ScrollView>
    </>
  )
};

export default withTheme(SignIn);