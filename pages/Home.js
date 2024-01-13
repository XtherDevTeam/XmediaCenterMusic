import * as React from 'react';
import { Appbar, Icon, PaperProvider, withTheme } from 'react-native-paper';
import { Banner } from 'react-native-paper';
import { Image, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { Avatar } from 'react-native-paper';
import { View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Button } from 'react-native-paper';
import { mdTheme } from '../shared/styles';
const Home = ({ navigation, route }) => {
  return (
    <>
      <Appbar.Header>
        <Appbar.Content title="Home"></Appbar.Content>
      </Appbar.Header>
      <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
        <></>
      </TouchableWithoutFeedback >
    </>
  )
};

export default withTheme(Home);