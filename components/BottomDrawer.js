import React, { useState } from 'react';
import { View, Modal, StyleSheet, Platform, ScrollView, SafeAreaView, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton } from 'react-native-paper';

const BottomDrawer = ({ drawerTitle, onClose, children, state }) => {
  return (
    <Modal
      visible={state}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.fullScreen}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContainer}>
          <View style={{ height: '100%' }}>
            <Card style={{ height: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
              <Card.Title title={drawerTitle} titleVariant='titleMedium' right={() => <IconButton icon={"close"} onPress={() => {
                onClose()
              }} />}></Card.Title>
              <ScrollView style={{ height: '100%' }}>
                {children}
              </ScrollView>
            </Card>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    maxHeight: Dimensions.get('window').height * 0.5,
    width: '100%',
    backgroundColor: 'transparent',
  },
});

export default BottomDrawer;