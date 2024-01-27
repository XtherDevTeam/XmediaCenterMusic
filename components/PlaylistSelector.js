import React from 'react';
import { View, Modal, StyleSheet, Platform, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton, withTheme, Text, Icon, DataTable, Dialog, List } from 'react-native-paper';
import * as Api from '../shared/api'
import { mdTheme } from '../shared/styles';

function PlaylistSelector({ onSelect, state, onDismiss, onError, dismissable, title }) {
  let [playlists, setPlaylists] = React.useState([])
  React.useEffect(() => {
    Api.userPlaylists().then(d => {
      if (d.data.ok) {
        setPlaylists(d.data.data)
      } else {
        onError(`unable to fetch user's playlists: ${d.data.data}`)
      }
    }).catch(e => {
      onError(`unable to fetch user's playlists: NetworkError`)
    })
  }, [state])

  return <Dialog visible={state} dismissable={dismissable} onDismiss={onDismiss}>
    <Dialog.Title>{title}</Dialog.Title>
    <Dialog.Content>
      {playlists.map((item, index) => <List.Item
        key={index}
        title={item.name}
        left={props => <List.Icon {...props} icon="music-box-multiple" />}
        description={item.description}
        descriptionNumberOfLines={1}
        descriptionEllipsizeMode='tail'
        onPress={() => onSelect(item.id)}
      >
      </List.Item>)}
    </Dialog.Content>
    <Dialog.Actions>
      <Button onPress={() => (dismissable ? onDismiss() : null)}>Cancel</Button>
    </Dialog.Actions>
  </Dialog>
}

export default PlaylistSelector