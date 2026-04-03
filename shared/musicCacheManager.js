import * as FileSystem from 'expo-file-system';
import TrackPlayer from 'react-native-track-player';

export const CACHE_DIR = FileSystem.documentDirectory + 'kiana_kaslana_cache/';

export const initCacheDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
};

export const getLocalUri = (audioId) => {
  return CACHE_DIR + `${audioId}.mp3`;
};

export const checkCacheExists = async (audioId) => {
  const localUri = getLocalUri(audioId);
  const fileInfo = await FileSystem.getInfoAsync(localUri);
  return fileInfo.exists;
};

export const triggerCaching = async (track) => {
  if (!track || !track.id || !track.url) return;
  
  await initCacheDir();
  const localUri = getLocalUri(track.id);
  const exists = await checkCacheExists(track.id);

  if (!exists) {
    if (track.url.startsWith('http')) {
      console.log(`[CacheManager] Triggering background cache for: ${track.title} (${track.id})`);
      downloadAudioSilently(track.url, localUri);
    } else {
      console.log(`[CacheManager] Track already has local URL or is not a remote URL: ${track.url}`);
    }
  } else {
    // console.log(`[CacheManager] Already cached: ${track.title}`);
  }
};

export const resolvePlayableUrl = async (track) => {
  if (!track || !track.id) return track.url;
  
  const exists = await checkCacheExists(track.id);
  if (exists) {
    const localUri = getLocalUri(track.id);
    // console.log(`[CacheManager] Cache hit for ${track.id}, using local uri`);
    return localUri;
  }
  
  return track.url;
};

const downloadAudioSilently = async (remoteUrl, localUri) => {
  try {
    const downloadResumable = FileSystem.createDownloadResumable(
      remoteUrl,
      localUri
    );
    const { uri } = await downloadResumable.downloadAsync();
    console.log('[CacheManager] Song cached/downloaded: ', uri);
  } catch (e) {
    console.error('[CacheManager] Cache download failed: ', e);
  }
};

export const checkAndClearCache = async (maxSizeMB = 4096) => {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) return;

  const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
  let totalSize = 0;
  const fileStats = [];

  for (const file of files) {
    const info = await FileSystem.getInfoAsync(CACHE_DIR + file);
    totalSize += info.size;
    fileStats.push({ uri: CACHE_DIR + file, size: info.size, time: info.modificationTime });
  }

  if (totalSize > maxSizeMB * 1024 * 1024) {
    fileStats.sort((a, b) => a.time - b.time);

    while (totalSize > maxSizeMB * 1024 * 1024 && fileStats.length > 0) {
      const oldestFile = fileStats.shift();
      await FileSystem.deleteAsync(oldestFile.uri);
      totalSize -= oldestFile.size;
      console.log('[CacheManager] Cache released:', oldestFile.uri);
    }
  }
};