import React from 'react';
import { View, Modal, StyleSheet, Platform, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton, withTheme, Text, Icon, DataTable } from 'react-native-paper';
import * as Api from '../shared/api'
import { mdTheme } from '../shared/styles';

function DirectoryView({ path, showHeadImg, onPressItem, onLongPressItem, onError, width, height, style, onRef }) {
  const [update, newState] = React.useState()
  let [pathName, setPathName] = React.useState(Api.basename(path))
  let [pathDir, setPathDir] = React.useState({ info: { dirs: 0, files: 0, total: 0 }, list: [] })
  let theme = mdTheme()

  let refresh = () => Api.driveDir(path == '' ? '/' : path).then(d => {
    if (d.data.ok) {
      console.log('who starts this', path, '-', Api.basename(path))
      setPathName(Api.basename(path))
      if (path != '/') {
        setPathDir({
          info: d.data.data.info,
          list: [{
            path: Api.dirname(path),
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
    onRef.current = newState
  }, [])
  React.useEffect(() => { refresh() }, [update])

  React.useEffect(() => {
    console.log('currentDir', path)
    refresh()
  }, [path])

  return <Card style={{ width, ...style }}>
    {showHeadImg && <Card.Cover source={require('../assets/background.jpg')} style={{ height: 128 }} />}
    <Card.Title titleVariant='headlineMedium' title={pathName == '' ? 'Drive' : pathName}></Card.Title>
    <Card.Content>
      <Text variant='bodyLarge'><Icon source='book'></Icon> Total: {pathDir.info.total} item(s) <Text style={{ marginLeft: 10 }} /> {pathDir.info.files} file(s), {pathDir.info.dirs} folder(s)</Text>
    </Card.Content>
    <View>
      <DataTable>
        <DataTable.Header style={{ marginTop: 15 }}>
        </DataTable.Header>
        {pathDir.list.map((item, j) => (
          <DataTable.Row key={j} onPress={() => onPressItem(item)} onLongPress={() => onLongPressItem(item)}>
            <DataTable.Cell>
              <View style={{ margin: 10 }}>
                <Text variant='bodyLarge'><Text style={{ marginRight: 10 }}><Icon size={16} source={item.type == 'file' ? 'file' : 'folder'} /> </Text>{item.filename}</Text>
                <Text variant='bodyMedium' style={{ marginTop: 5, color: theme.colors.secondary }}>{item.lastModified}</Text>
              </View>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  </Card>
}

export default DirectoryView