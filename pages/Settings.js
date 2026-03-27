import * as React from 'react';
import { View, ScrollView } from 'react-native';
import { Appbar, List, TextInput, Button, Portal, PaperProvider } from 'react-native-paper';
import PathInput from '../components/PathInput';
import Message from '../components/Message';
import * as storage from '../shared/storage';
import { mdTheme } from '../shared/styles';

const Settings = ({ navigation }) => {
  const [defaultMusicStoragePath, setDefaultMusicStoragePath] = React.useState('/');
  const [pathInputVisible, setPathInputVisible] = React.useState(false);
  const [messageState, setMessageState] = React.useState(false);
  const [messageText, setMessageText] = React.useState('');

  React.useEffect(() => {
    storage.inquireItem('defaultMusicStoragePath', (ok, val) => {
      if (ok && val) {
        setDefaultMusicStoragePath(val);
      }
    });
  }, []);

  const saveSettings = (path) => {
    storage.setItem('defaultMusicStoragePath', path, (ok) => {
      if (ok) {
        setDefaultMusicStoragePath(path);
        setMessageText('Settings saved successfully');
        setMessageState(true);
      } else {
        setMessageText('Failed to save settings');
        setMessageState(true);
      }
    });
  };

  return (
    <PaperProvider theme={mdTheme()}>
      <View style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Settings" />
        </Appbar.Header>
        <ScrollView style={{ flex: 1 }}>
          <List.Section>
            <List.Subheader>Music Import</List.Subheader>
            <List.Item
              title="Default Storage Path"
              description={defaultMusicStoragePath}
              left={props => <List.Icon {...props} icon="folder-music" />}
              onPress={() => setPathInputVisible(true)}
            />
          </List.Section>
        </ScrollView>

        <PathInput
          state={pathInputVisible}
          path={defaultMusicStoragePath}
          title="Select Default Storage"
          description="Choose the folder where uploaded music will be stored"
          acceptType="dir"
          onDismiss={() => setPathInputVisible(false)}
          onSelect={(path) => {
            saveSettings(path);
            setPathInputVisible(false);
          }}
          onError={(err) => {
            setMessageText(err);
            setMessageState(true);
          }}
          dismissable={true}
        />

        <Portal>
          <Message
            timeout={3000}
            style={{ marginBottom: 64 }}
            state={messageState}
            onStateChange={() => setMessageState(false)}
            icon="check-circle"
            text={messageText}
          />
        </Portal>
      </View>
    </PaperProvider>
  );
};

export default Settings;
