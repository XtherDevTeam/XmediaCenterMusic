import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import TrackPlayer, { useActiveTrack, usePlaybackState, State } from 'react-native-track-player';
import { useNavigation } from '@react-navigation/native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MiniPlayerCard = ({ track, theme, isPlaying, togglePlayback, onNavigate }) => {
  if (!track) return <View style={{ width: SCREEN_WIDTH }} />;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onNavigate}
      style={{ width: SCREEN_WIDTH }}
    >
      <View style={styles.content}>
        <Image source={{ uri: track.artwork }} style={styles.artwork} />
        <View style={styles.textContainer}>
          <Text 
            variant="titleSmall" 
            numberOfLines={1} 
            style={{ color: theme.colors.primary, fontWeight: 'bold' }}
          >
            {track.title}
          </Text>
          <Text 
            variant="bodySmall" 
            numberOfLines={1} 
            style={{ color: theme.colors.primary, opacity: 0.8 }}
          >
            {track.artist}
          </Text>
        </View>
        <View style={styles.controls}>
          <IconButton
            icon={isPlaying ? "pause" : "play"}
            size={28}
            iconColor={theme.colors.primary}
            onPress={togglePlayback}
          />
          <IconButton
            icon="skip-next"
            size={24}
            iconColor={theme.colors.primary}
            onPress={() => TrackPlayer.skipToNext()}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MiniPlayer = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const translateX = useSharedValue(0);

  const [neighbors, setNeighbors] = useState({ prev: null, next: null });

  useEffect(() => {
    const updateNeighbors = async () => {
      const queue = await TrackPlayer.getQueue();
      const index = await TrackPlayer.getActiveTrackIndex();
      if (index !== undefined && index !== null) {
        setNeighbors({
          prev: index > 0 ? queue[index - 1] : null,
          next: index < queue.length - 1 ? queue[index + 1] : null,
        });
      }
    };
    updateNeighbors();
  }, [activeTrack]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - SCREEN_WIDTH }],
  }));

  useEffect(() => {
    translateX.value = 0;
  }, [activeTrack]);

  if (!activeTrack) return null;

  const isPlaying = playbackState.state === State.Playing;

  const togglePlayback = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -SCREEN_WIDTH / 4 || event.velocityX < -500) {
        if (neighbors.next) {
          runOnJS(TrackPlayer.skipToNext)();
          translateX.value = withSpring(-SCREEN_WIDTH);
        } else {
          translateX.value = withSpring(0);
        }
      } else if (event.translationX > SCREEN_WIDTH / 4 || event.velocityX > 500) {
        if (neighbors.prev) {
          runOnJS(TrackPlayer.skipToPrevious)();
          translateX.value = withSpring(SCREEN_WIDTH);
        } else {
          translateX.value = withSpring(0);
        }
      } else {
        translateX.value = withSpring(0);
      }
      // After the animation finishes, the activeTrack hook will trigger and translateX should reset to 0
      // But we need to handle that in the useEffect or by animating it back to 0 when index changes.
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <BlurView intensity={90} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.carousel, animatedStyle]}>
          <MiniPlayerCard 
            track={neighbors.prev} 
            theme={theme} 
            isPlaying={isPlaying} 
            togglePlayback={togglePlayback}
            onNavigate={() => navigation.navigate('Player')}
          />
          <MiniPlayerCard 
            track={activeTrack} 
            theme={theme} 
            isPlaying={isPlaying} 
            togglePlayback={togglePlayback}
            onNavigate={() => navigation.navigate('Player')}
          />
          <MiniPlayerCard 
            track={neighbors.next} 
            theme={theme} 
            isPlaying={isPlaying} 
            togglePlayback={togglePlayback}
            onNavigate={() => navigation.navigate('Player')}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    width: SCREEN_WIDTH,
    overflow: 'hidden',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: -1
  },
  carousel: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3,
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MiniPlayer;
