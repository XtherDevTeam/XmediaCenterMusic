import React from 'react';
import { View, Modal, StyleSheet, Platform, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton, withTheme, Text, Icon, DataTable, Dialog, List } from 'react-native-paper';
import * as Api from '../shared/api'
import { mdTheme } from '../shared/styles';

function TaskView({ taskId, onError, onDismiss, state }) {
  let intervalRef = React.useRef(null)
  let [taskInfo, setTaskInfo] = React.useState({
    name: '',
    creationTime: '',
    endTime: '',
    logText: '',
    plugin: '',
    handler: ''
  })
  React.useEffect(() => {
    if (state) {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current)
      }
      intervalRef.current = setInterval(() => {
        Api.taskInfo(taskId).then(r => {
          if (r.data.ok) {
            setTaskInfo(r.data.data)
          } else {
            onError(`Unable to fetch task info: ${r.data.data}`)
          }
        }).catch(r => {
          onError(`Unable to fetch task info: NetworkError`)
        })
      }, 500)
    }
  }, [taskId, state])
  React.useEffect(() => {
    if (taskInfo.endTime != '0000-00-00 00:00:00') {
      if (intervalRef.current != null)
        clearInterval(intervalRef.current)
    }
  }, [taskInfo])

  return <Dialog visible={state} onDismiss={() => onDismiss()}>
    <Dialog.Title>Task #{taskId} information</Dialog.Title>
    <Dialog.Content>
      <Text><Text style={{ fontWeight: 700 }}>Plugin: </Text>{taskInfo.plugin}</Text>
      <Text><Text style={{ fontWeight: 700 }}>Handler: </Text>{taskInfo.handler}</Text>
      <Text><Text style={{ fontWeight: 700 }}>Start time: </Text>{taskInfo.creationTime}</Text>
      <Text><Text style={{ fontWeight: 700 }}>End time: </Text>{taskInfo.endTime}</Text>
    </Dialog.Content>
    <Dialog.ScrollArea>
      <ScrollView style={{ marginVertical: 10, maxHeight: Dimensions.get('window').height * 0.45 }}>
        <Text>{taskInfo.logText}</Text>
      </ScrollView>
    </Dialog.ScrollArea>
    <Dialog.Actions>
      <Button onPress={() => {
        onDismiss()
      }}>OK</Button>
    </Dialog.Actions>
  </Dialog>
}

export default TaskView