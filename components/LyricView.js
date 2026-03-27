import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

/**
 * LyricView Component
 * @param {Array} lyrics - Array of { time, text } objects
 * @param {number} currentTime - Current playback position in seconds
 * @param {number} width - Component width
 * @param {number} height - Component height
 */
const LyricView = ({ lyrics = [], currentTime = 0, width, height, onLyricPress, onLyricLongPress }) => {
  const defaultLyricOffset = -1.0; // -1.0s
  const theme = useTheme();
  const scrollViewRef = useRef(null);
  const [lineLayouts, setLineLayouts] = useState({});

  // Find the index of the current lyric line
  const currentLineIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return currentTime >= line.time + defaultLyricOffset && (!nextLine || currentTime < nextLine.time + defaultLyricOffset);
  });

  // Auto-scroll to center the current line
  useEffect(() => {
    if (scrollViewRef.current && currentLineIndex !== -1 && height > 0) {
      const targetLayout = lineLayouts[currentLineIndex];
      if (targetLayout) {
        // Calculate scroll Y to center the current line
        // Scroll Y = target Y - (container height / 2) + (line height / 2)
        const scrollToY = Math.max(0, targetLayout.y - height / 2 + targetLayout.height / 2);
        scrollViewRef.current.scrollTo({
          y: scrollToY,
          animated: true,
        });
      }
    }
  }, [currentLineIndex, height, lineLayouts]);

  if (!lyrics || lyrics.length === 0) {
    return (
      <TouchableWithoutFeedback onPress={() => onLyricPress()} onLongPress={() => onLyricLongPress(null)}>
        <View style={[styles.center, { width, height }]}>
          <Text style={{ color: theme.colors.onSurfaceVariant, opacity: 0.5 }}>No lyrics available</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View style={{ width, height, backgroundColor: 'transparent' }}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.lyricsScroll, { paddingVertical: height / 2 }]}
        scrollEventThrottle={16}
      >
        {lyrics.map((line, index) => (
          <TouchableWithoutFeedback onPress={() => onLyricPress()} style={{ width: '100%' }} onLongPress={() => onLyricLongPress(line)}>
            <Text
              key={`${line.time}-${index}`}
              onLayout={(e) => {
                const layout = e.nativeEvent.layout;
                setLineLayouts(prev => {
                  // Only update if layout significantly changed to avoid performance issues
                  if (prev[index] && Math.abs(prev[index].y - layout.y) < 0.5 && Math.abs(prev[index].height - layout.height) < 0.5) {
                    return prev;
                  }
                  return { ...prev, [index]: layout };
                });
              }}
              style={[
                styles.lyricLine,
                { color: theme.colors.onSurfaceVariant, opacity: 0.4 },
                index === currentLineIndex && {
                  color: theme.colors.primary,
                  opacity: 1,
                  fontWeight: 'bold',
                  fontSize: 22,
                  transform: [{ scale: 1.1 }]
                }
              ]}
            >
              {line.text}
            </Text>
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lyricsScroll: {
    paddingHorizontal: 20,
  },
  lyricLine: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 24,
    minHeight: 32
  },
});

export default LyricView;
