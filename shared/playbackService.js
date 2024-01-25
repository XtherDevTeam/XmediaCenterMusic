import TrackPlayer, {Event} from "react-native-track-player"

const playbackService = async () => {
    TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play())
    TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause())
    TrackPlayer.addEventListener('remote-next', async () => {
        const track = await TrackPlayer.getCurrentTrack()
        if (track == 0) {
            TrackPlayer.skipToNext()
        }
    })
    TrackPlayer.addEventListener('remote-previous', async () => {
        const track = await TrackPlayer.getCurrentTrack()
        if (track == 1) {
            TrackPlayer.skipToPrevious()
        }
    })
    TrackPlayer.addEventListener('remote-jump-forward', async ({ interval }) => {
        const position = await TrackPlayer.getPosition()
        await TrackPlayer.seekTo(position + interval)
    })
    TrackPlayer.addEventListener("remote-jump-backward", async ({ interval }) => {
        const position = await TrackPlayer.getPosition()
        await TrackPlayer.seekTo(position - interval)
    })

}

export default playbackService