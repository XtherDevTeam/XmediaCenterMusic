import rntp, { State, Capability, AppKilledPlaybackBehavior, IOSCategory, IOSCategoryMode, IOSCategoryOptions } from 'react-native-track-player'
import playbackService from './playbackService'
import * as storage from './storage'
import * as Api from './api'

function setup() {
  (async () => {
    await rntp.setupPlayer({iosCategory: IOSCategory.Playback, iosCategoryMode: IOSCategoryMode.Default})
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
        
  })()
}

function setPlayQueue() {
  rntp.setQueue(songs)
}

function formatDuraton(time) {
  if (time > -1) {
    var hour = Math.floor(time / 3600);
    var min = Math.floor(time / 60) % 60;
    var sec = Math.floor(time % 60);
    // console.log(hour, min, sec)
    if (hour == 0) {
      // do nothing
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

function setCurrentTrack(pid, songs, index, playAfter) {
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
  return rntp.setQueue(songs).then(() => {
    rntp.skip(index).then(() => {
      if (playAfter) {
        play().then(() => {
          console.log("???")
          rntp.getPlaybackState().then((v) => {
            console.log(v)
          })
        }).catch((reason) => {
          console.log(reason)
        })
      }
    })
  })
}

function play() {
  return rntp.setPlayWhenReady(true).then((v) => {
    return rntp.play()
  })

}

function setupTemporaryStorage() {
  storage.setItem('current-playing-playlist-id', null, k => { })
  storage.setItem('current-playing-song-id', null, k => { })
}

function updateCurrentPlayingPlaylist(pid) {
  storage.setItem('current-playing-playlist-id', pid, k => { })
}

function updateCurrentPlayingSong(sid) {
  storage.setItem('current-playing-song-id', sid, k => { })
}

export {
  setPlayQueue, setCurrentTrack, play, setup, formatDuraton, setupTemporaryStorage,
  updateCurrentPlayingPlaylist, updateCurrentPlayingSong
}