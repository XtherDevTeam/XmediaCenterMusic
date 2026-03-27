import React from 'react';
import { ScrollView, View } from 'react-native';
import { DataTable, IconButton, Text, useTheme } from 'react-native-paper';
import BottomDrawer from './BottomDrawer';
import * as playerBackend from '../shared/playerBackend';
import rntp, { useActiveTrack } from 'react-native-track-player';

const QueueDrawer = ({ visible, onClose, queue, onQueueUpdate }) => {
  const theme = useTheme();
  const activeTrack = useActiveTrack();
  const [expandedIndex, setExpandedIndex] = React.useState(null);

  const handleSkip = async (index) => {
    await rntp.skip(index);
    await rntp.play();
    onClose();
  };

  const handleRemove = async (index) => {
    const updatedQueue = await playerBackend.removeTrackFromQueue(index);
    if (onQueueUpdate) {
      onQueueUpdate(updatedQueue);
    }
    setExpandedIndex(null);
  };

  return (
    <>
      <BottomDrawer drawerTitle="Play queue" onClose={onClose} state={visible}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Title</DataTable.Title>
            <DataTable.Title numeric>Artist</DataTable.Title>
          </DataTable.Header>
          {queue.map((item, idx) => {
            const isActive = activeTrack?.title === item.title && activeTrack?.artist === item.artist;
            return (
              <DataTable.Row
                key={`${item.id || idx}-${idx}`}
                onPress={() => handleSkip(idx)}
                onLongPress={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                style={isActive ? { backgroundColor: theme.colors.secondaryContainer, borderRadius: 8 } : {}}
              >
                <DataTable.Cell>
                  <Text
                    variant={isActive ? "titleSmall" : "bodyMedium"}
                    numberOfLines={1}
                    style={{ color: isActive ? theme.colors.primary : theme.colors.onSurface }}
                  >
                    {item.title}
                  </Text>
                </DataTable.Cell>
                  <DataTable.Cell numeric>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Text variant="bodySmall" numberOfLines={1}>{item.artist}</Text>
                      {expandedIndex === idx && (
                        <IconButton
                          icon="minus-circle-outline"
                          size={20}
                          onPress={() => handleRemove(idx)}
                          iconColor={theme.colors.error}
                          style={{ margin: 0, marginLeft: 8 }}
                        />
                      )}
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
            );
          })}
        </DataTable>
        </BottomDrawer>
    </>
  );
};

export default QueueDrawer;
