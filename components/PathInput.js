import React from 'react';
import { View, Modal, StyleSheet, Platform, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton, withTheme, Text, Icon, DataTable, Dialog, List, Checkbox, TouchableRipple, Searchbar } from 'react-native-paper';
import * as Api from '../shared/api'
import { mdTheme } from '../shared/styles';

function PathInput({ path, onSelect, acceptType, state, onDismiss, onError, dismissable, title, description, multiSelect, mimeFilter }) {
  let [rPath, setRPath] = React.useState(path)
  let [pathName, setPathName] = React.useState(Api.dirname(path))
  let [pathDir, setPathDir] = React.useState({ info: { dirs: 0, files: 0, total: 0 }, list: [] })
  let [selectedPaths, setSelectedPaths] = React.useState([])
  let [searchQuery, setSearchQuery] = React.useState('');

  let theme = mdTheme()


  let refresh = () => Api.driveDir(rPath).then(d => {
    if (d.data.ok) {
      setPathName(Api.basename(rPath))
      let list = d.data.data.list;

      // Apply MIME filter
      if (mimeFilter) {
        list = list.filter(item => {
          if (item.type === 'dir') return true;
          if (typeof mimeFilter === 'string') {
            if (mimeFilter.endsWith('/*')) {
              return item.mime.startsWith(mimeFilter.replace('/*', '/'));
            }
            return item.mime === mimeFilter;
          }
          if (Array.isArray(mimeFilter)) {
            return mimeFilter.includes(item.mime);
          }
          return true;
        });
      }

      if (rPath != '/') {
        setPathDir({
          info: d.data.data.info,
          list: [{
            path: Api.dirname(rPath),
            filename: '..',
            type: 'dir',
            lastModified: 'Back to parent directory',
          }, ...list]
        })
      } else {
        setPathDir({ ...d.data.data, list: list })
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

  React.useEffect(() => {
    setRPath(path)
    setSelectedPaths([])
    setSearchQuery('')
  }, [path, state])

  const toggleSelection = (path) => {
    if (selectedPaths.includes(path)) {
      setSelectedPaths(selectedPaths.filter(p => p !== path));
    } else {
      setSelectedPaths([...selectedPaths, path]);
    }
  };

  const handleOK = () => {
    if (multiSelect) {
      onSelect(selectedPaths);
    } else {
      onSelect(rPath);
    }
  };

  const filteredList = pathDir.list.filter(item => 
    item.filename === '..' || item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return <Dialog visible={state} dismissable={dismissable} onDismiss={onDismiss}>
    <Dialog.Title>{title}</Dialog.Title>
    <Dialog.Content>
      <Text variant='bodyMedium'>{description}</Text>
      <Text variant='bodyMedium'>Current: {rPath}</Text>
      <Searchbar
        placeholder="Filter files..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={{ marginVertical: 10, elevation: 0, backgroundColor: theme.colors.surfaceVariant }}
      />
      <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.4, marginTop: 10 }}>
        <DataTable>
          <DataTable.Header style={{ marginTop: 0 }}>
          </DataTable.Header>
          {filteredList.map((item, j) => {
            const isSelected = selectedPaths.includes(item.path);
            const isSelectable = item.type === 'file' && acceptType === 'file';

            return (
              <TouchableRipple
                key={j}
                disabled={item.type == 'file' && acceptType == 'dir'}
                onPress={() => {
                  if (item.type == 'dir') {
                    setRPath(item.path)
                  } else {
                    if (multiSelect) {
                      toggleSelection(item.path);
                    } else {
                      return onSelect(item.path)
                    }
                  }
                }}
              >
                <DataTable.Row>
                  <DataTable.Cell style={{ flex: multiSelect ? 0.2 : 0 }}>
                    {multiSelect && isSelectable && (
                      <Checkbox
                        status={isSelected ? 'checked' : 'unchecked'}
                        onPress={() => toggleSelection(item.path)}
                      />
                    )}
                  </DataTable.Cell>

                  <DataTable.Cell style={{ flex: 1 }}>
                    <View style={{ margin: 10 }}>
                      <Text variant='bodyLarge'><Text style={{ marginRight: 10 }}><Icon size={16} source={item.type == 'file' ? 'file' : 'folder'} /> {item.filename}</Text></Text>
                      <Text variant='bodyMedium' style={{ marginTop: 5, color: theme.colors.secondary }}>{item.lastModified}</Text>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              </TouchableRipple>
            )
          })}
        </DataTable>
      </ScrollView>

    </Dialog.Content>
    <Dialog.Actions>
      <Button onPress={() => onDismiss()}>Cancel</Button>
      <Button disabled={(acceptType == 'file' && !multiSelect) || (multiSelect && selectedPaths.length === 0)} onPress={handleOK}>OK</Button>
    </Dialog.Actions>

  </Dialog>
}

export default PathInput