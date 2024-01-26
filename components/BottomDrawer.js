import React, { useState } from 'react';
import { View, Modal, StyleSheet, Platform, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton } from 'react-native-paper';

const BottomDrawer = ({ drawerTitle, onClose, children, state }) => {
  return (
    <Modal
      visible={state}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.bottomDrawer}>
          <Card>
            <Card.Title title={drawerTitle} titleVariant='titleMedium' right={() => <IconButton icon={"close"} onPress={() => {
              console.log(drawerTitle)
              onClose()
            }} />}></Card.Title>
            <ScrollView>
              {children}
            </ScrollView>
          </Card>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 95 : 0,
  },
  bottomDrawer: {
    height: '50%',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 50 : 75,
  },
});

export default BottomDrawer;