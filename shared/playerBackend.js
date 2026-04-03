import rntp, { State, Capability, AppKilledPlaybackBehavior, IOSCategory, IOSCategoryMode, IOSCategoryOptions } from 'react-native-track-player'
import playbackService from './playbackService'
import * as storage from './storage'
import * as Api from './api'
import * as musicCacheManager from './musicCacheManager'


console.log("[PlayerBackend] Loading module...");

export function setup() {
  (async () => {
    try {
      await rntp.setupPlayer({ iosCategory: IOSCategory.Playback, iosCategoryMode: IOSCategoryMode.Default })
    } catch (error) {
      console.log(error)
    }

    await rntp.updateOptions({
      // Media controls capabilities
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],

      // Capabilities that will show up when the notification is in the compact form on Android
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],

      android: {
        // This is the default behavior
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        stoppingAppPausesPlayback: true
      }
    })

    // Restore persistent state
    await loadPlaybackState()
  })()
}

export async function loadPlaybackState() {
  return new Promise((resolve) => {
    storage.inquireItem('playback-list', async (ok, list) => {
      if (ok && Array.isArray(list) && list.length > 0) {
        console.log(`[PlayerBackend] Restoring playback list with ${list.length} tracks`)
        
        // Resolve playable URLs for restored tracks
        const resolvedList = await Promise.all(list.map(async (t) => ({
          ...t,
          url: await musicCacheManager.resolvePlayableUrl(t)
        })));
        
        await rntp.setQueue(resolvedList)

        storage.inquireItem('last-played-index', async (okIndex, index) => {
          const targetIndex = okIndex ? index : 0
          await rntp.skip(targetIndex)

          storage.inquireItem('last-played-position', async (okPos, pos) => {
            if (okPos && pos > 0) {
              await rntp.seekTo(pos)
            }
            resolve()
          })
        })
      } else {
        resolve()
      }
    })
  })
}

export async function setPlayQueue(songs) {
  savePlaybackList(songs)
  const resolvedSongs = await Promise.all(songs.map(async (s) => ({
    ...s,
    url: await musicCacheManager.resolvePlayableUrl(s)
  })));
  return rntp.setQueue(resolvedSongs)
}

export function formatDuraton(time) {
  if (time > -1) {
    var hour = Math.floor(time / 3600);
    var min = Math.floor(time / 60) % 60;
    var sec = Math.floor(time % 60);
    if (hour == 0) {
      time = ""
    } else if (hour < 10) {
      time = '0' + hour + ":";
    } else {
      time = hour + ":";
    }

    if (min < 10) {
      time += "0";
    }
    time += min + ":";

    if (sec < 10) {
      time += "0";
    }
    time += sec;
  }
  return time;
}

export async function setCurrentTrack(pid, songs, index, playAfter) {
  // Persistence
  savePlaybackList(songs)
  saveCurrentIndex(index)

  if (pid) {
    storage.inquireItem('current-playing-playlist-id', (ok, v) => {
      if (ok) {
        if (v != pid) {
          Api.increasePlaylistPlayCount(pid).then(
            r => r.data.ok ? console.log('updated playlist playcount successfully') : console.log('unable to update playlist playcount')).catch(
              r => console.log('unable to update playlist playcount: networkError'))
        }
      }
    })
  updateCurrentPlayingPlaylist(pid)
  }

  const resolvedSongs = await Promise.all(songs.map(async (s) => ({
    ...s,
    url: await musicCacheManager.resolvePlayableUrl(s)
  })));

  await rntp.setQueue(resolvedSongs);
  await rntp.skip(index);
  
  if (playAfter) {
    try {
      await play();
      const state = await rntp.getPlaybackState();
      console.log(state);
    } catch (reason) {
      console.log(reason);
    }
  }
}

export async function addTracksToQueue(newTracks) {
  return new Promise((resolve) => {
    storage.inquireItem('playback-list', async (ok, list) => {
      const currentList = ok ? list : []
      const updatedList = [...currentList, ...newTracks]
      savePlaybackList(updatedList)
      
      const resolvedNewTracks = await Promise.all(newTracks.map(async (t) => ({
        ...t,
        url: await musicCacheManager.resolvePlayableUrl(t)
      })));

      await rntp.add(resolvedNewTracks)
      resolve(updatedList)
    })
  })
}

export function play() {
  return rntp.setPlayWhenReady(true).then((v) => {
    return rntp.play()
  })
}

export function savePlaybackList(list) {
  storage.setItem('playback-list', list, () => { })
}

export function saveCurrentIndex(index) {
  storage.setItem('last-played-index', index, () => { })
}

export function savePosition(position) {
  storage.setItem('last-played-position', position, () => { })
}

export function updateCurrentPlayingPlaylist(pid) {
  storage.setItem('current-playing-playlist-id', pid, k => { })
}

export function updateCurrentPlayingSong(sid) {
  storage.setItem('current-playing-song-id', sid, k => { })
}

export async function removeTrackFromQueue(index) {
  return new Promise((resolve) => {
    storage.inquireItem('playback-list', async (ok, list) => {
      if (ok && Array.isArray(list)) {
        const updatedList = list.filter((_, i) => i !== index)
        savePlaybackList(updatedList)
        await rntp.remove(index)
        resolve(updatedList)
      } else {
        resolve([])
      }
    })
  })
}