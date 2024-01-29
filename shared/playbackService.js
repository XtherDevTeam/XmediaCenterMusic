import TrackPlayer, { Event } from "react-native-track-player"

module.exports = async () => {
    TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play())
    TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause())
    TrackPlayer.addEventListener('remote-next', async () => {
        await TrackPlayer.skipToNext()
        TrackPlayer.play()
    })
    TrackPlayer.addEventListener('remote-seek', async ({position}) => {
        TrackPlayer.seekTo(position)
    })
    TrackPlayer.addEventListener('remote-previous', async () => {
        await TrackPlayer.skipToPrevious()
        TrackPlayer.play()
    })
    TrackPlayer.addEventListener('remote-jump-forward', async ({ interval }) => {
        const position = (await TrackPlayer.getProgress()).position
        await TrackPlayer.seekTo(position + interval)
    })
    TrackPlayer.addEventListener("remote-jump-backward", async ({ interval }) => {
        const position = (await TrackPlayer.getProgress()).position
        await TrackPlayer.seekTo(position - interval)
    })

}