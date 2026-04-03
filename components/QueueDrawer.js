import React from 'react';
import { ScrollView, View } from 'react-native';
import { DataTable, IconButton, Text, useTheme } from 'react-native-paper';
import BottomDrawer from './BottomDrawer';
import * as playerBackend from '../shared/playerBackend';
import rntp, { useActiveTrack } from 'react-native-track-player';
import { useIsConnected, useCacheStatus } from '../shared/hooks';
import { Icon } from 'react-native-paper';

const QueueDrawer = ({ visible, onClose, queue, onQueueUpdate }) => {
  const theme = useTheme();
  const activeTrack = useActiveTrack();
  const [expandedIndex, setExpandedIndex] = React.useState(null);
  
  const isConnected = useIsConnected();
  const cachedIds = useCacheStatus(queue);

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
            const isCached = cachedIds.has(item.id?.toString());
            const isAvailable = isConnected || isCached;
            
            return (
              <DataTable.Row
                key={`${item.id || idx}-${idx}`}
                onPress={() => {
                  if (isAvailable) {
                    handleSkip(idx);
                  }
                }}
                onLongPress={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                style={[
                  isActive ? { backgroundColor: theme.colors.secondaryContainer, borderRadius: 8 } : {},
                  { opacity: isAvailable ? 1 : 0.5 }
                ]}
              >
                <DataTable.Cell>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      variant={isActive ? "titleSmall" : "bodyMedium"}
                      numberOfLines={1}
                      style={{ 
                        color: isActive ? theme.colors.primary : theme.colors.onSurface,
                        flexShrink: 1
                      }}
                    >
                      {item.title}
                    </Text>
                    {(isConnected && isCached) && (
                      <Icon source="check-circle-outline" size={14} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                    )}
                  </View>
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
