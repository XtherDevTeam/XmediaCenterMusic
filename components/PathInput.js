import React from 'react';
import { View, Modal, StyleSheet, Platform, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton, withTheme, Text, Icon, DataTable, Dialog, List } from 'react-native-paper';
import * as Api from '../shared/api'
import { mdTheme } from '../shared/styles';

function PathInput({ path, onSelect, acceptType, state, onDismiss, onError, dismissable, title, description }) {
  let [rPath, setRPath] = React.useState(path)
  let [pathName, setPathName] = React.useState(Api.dirname(path))
  let [pathDir, setPathDir] = React.useState({ info: { dirs: 0, files: 0, total: 0 }, list: [] })
  let theme = mdTheme()

  let refresh = () => Api.driveDir(rPath).then(d => {
    if (d.data.ok) {
      setPathName(Api.basename(rPath))
      if (rPath != '/') {
        setPathDir({
          info: d.data.data.info,
          list: [{
            path: Api.dirname(rPath),
            filename: '..',
            type: 'dir',
            lastModified: 'Back to parent directory',
          }, ...d.data.data.list]
        })
      } else {
        setPathDir(d.data.data)
      }
    } else {
      onError(d.data.data)
      setPathDir({ info: { dirs: 0, files: 0, total: 0 }, list: [] })
    }
  })

  React.useEffect(() => {
    console.log('fileSelector: currentDir', rPath)
    refresh()
  }, [rPath, state])

  React.useEffect(() => setRPath(path), [path])

  return <Dialog visible={state} dismissable={dismissable} onDismiss={onDismiss}>
    <Dialog.Title>{title}</Dialog.Title>
    <Dialog.Content>
      <Text variant='bodyMedium'>{description}</Text>
      <Text variant='bodyMedium'>Current: {rPath}</Text>
      <ScrollView style={{maxHeight: Dimensions.get('window').height * 0.5, marginTop: 10}}>
        <DataTable>
          <DataTable.Header style={{ marginTop: 0 }}>
          </DataTable.Header>
          {pathDir.list.map((item, j) => (
            <DataTable.Row disabled={item.type == 'file' && acceptType == 'dir'} key={j} onPress={() => {
              if (item.type == 'dir') {
                setRPath(item.path)
              } else {
                return onSelect(item.path)
              }
            }}>
              <DataTable.Cell>
                <View style={{ margin: 10 }}>
                  <Text variant='bodyLarge'><Text style={{ marginRight: 10 }}><Icon size={16} source={item.type == 'file' ? 'file' : 'folder'} /> </Text>{item.filename}</Text>
                  <Text variant='bodyMedium' style={{ marginTop: 5, color: theme.colors.secondary }}>{item.lastModified}</Text>
                </View>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </ScrollView>
    </Dialog.Content>
    <Dialog.Actions>
      <Button onPress={() => onDismiss()}>Cancel</Button>
      <Button disabled={acceptType == 'file'} onPress={() => onSelect(rPath)}>OK</Button>
    </Dialog.Actions>
  </Dialog>
}

export default PathInput