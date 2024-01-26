import { useState } from 'react';
import { Image, Modal, View, Button, Text, StyleSheet, Dimensions, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Card, IconButton, ThemeProvider, withTheme } from 'react-native-paper';
import { mdTheme } from '../shared/styles';

function BottomDrawer({ drawerTitle, onClose, children, state }) {
  let theme = mdTheme()
  const windowHeight = Dimensions.get('window').height

  return (<><Modal
    animationType="slide"
    transparent={true}
    visible={state}
    onRequestClose={onClose}
  >
    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ position: 'absolute', height: '100%', width: '100%', top: 0, left: 0, backgroundColor: 'rgba(0,0,0,.5)' }} />
      </TouchableWithoutFeedback>

      <Card style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -10,
        maxHeight: '50%'
      }}>
        <Card.Title title={drawerTitle} titleVariant='titleMedium' right={() => <IconButton icon={"close"} onPress={() => {
          console.log(drawerTitle)
          onClose()
        }} />}></Card.Title>
        <View style={{ marginBottom: 40, width: '100%', padding: 'unset', marginTop: -10 }}>
          {children}
        </View>

      </Card>
    </View >
  </Modal ></>)
}

export default withTheme(BottomDrawer)