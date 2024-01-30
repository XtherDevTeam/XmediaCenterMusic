import * as React from 'react';
import { Appbar, Card, DataTable, Dialog, Drawer, Icon, PaperProvider, Portal, withTheme } from 'react-native-paper';
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
import { Audio } from 'expo-av';


const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

let defaultConfirmDeletingDialogState = {
  item: { id: 114514 },
  state: false
}

const Profile = ({ navigation, route }) => {
  let [sound, setSound] = React.useState(null)

  async function playSound() {
    console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync(require('../assets/AboutPage.mp3'));
    setSound(sound);

    console.log('Playing Sound');
    await sound.playAsync();
  }

  useFocusEffect(React.useCallback(() => {
    playSound()
  }, []))

  React.useEffect(() => {
    return sound ? () => {
      console.log('Unloading Sound');
      sound.unloadAsync();
    } : undefined
  }, [sound])



  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="About XmediaCenter 2 Music"></Appbar.Content>
      </Appbar.Header>
      <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
        <>
          <ScrollView>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Card style={{ width: "95%" }}>
                <Card.Cover source={require('../assets/yoimiya.jpg')} style={{ height: 128 }} />
                <Card.Content style={{ marginTop: 15 }}>
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Avatar.Image source={require('../assets/icon.png')} size={56}></Avatar.Image>
                    <Text variant="titleLarge">XmediaCenter 2 Music</Text>
                    <Text variant="bodyMedium" style={{ textAlign: 'center' }}>Version: 1.0.0(1)</Text>
                    <Text variant="bodyMedium" style={{ textAlign: 'center' }}>Made with ❤️ by Jerry Chou and Naganohara Yoimiya</Text>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <Text variant='bodyMedium'>
                      This is my first time to write such a sort of application with React-Native and Expo.
                      Needless to say, the road of developing applications is not flat all the time.
                    </Text>
                    <Text variant='bodyMedium'>
                      Therefore, I went out of the way to solve endless problems like the beginners touch a new thing for the first time.
                      Finding relevant answers for my questions like "how to setup react-native-track-player playback notification properly" or
                      "how to pack my application with Xcode managed provisioning profile in release mode" through ChatGPT and searching engines,
                      always makes my browser be filled with loads of tabs. Nevertheless, when I finally made this application work, can be without other music applications like NeteaseMusic,
                      and get rid of the annoying VIP-only sign, the result worths the work.
                    </Text>
                    <Text variant='bodyMedium'>
                      Thanks for using, though there is always only one user which is myself.
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </View>
          </ScrollView>
        </>
      </TouchableWithoutFeedback >
    </>
  )
};

export default withTheme(Profile);