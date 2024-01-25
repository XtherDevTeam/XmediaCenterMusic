import rntp, { State, Capability, AppKilledPlaybackBehavior } from 'react-native-track-player'
import playbackService from './playbackService'

function setup() {
  rntp.setupPlayer({
    // Media controls capabilities
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.Stop,
    ],
    notificationCapabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
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
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback
    },
  }).catch(err => { })
  rntp.registerPlaybackService(() => playbackService)
}

function setPlayQueue() {
  rntp.setQueue(songs)
}

function setCurrentTrack(songs, index, playAfter) {
  return rntp.setQueue(songs).then(() => {
    rntp.getTrack(index).then((track) => {
      rntp.load(track).then(() => {
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
  })
}

function play() {
  return rntp.setPlayWhenReady(true).then((v) => {
    return rntp.play()
  })

}

export { setPlayQueue, setCurrentTrack, play, setup }