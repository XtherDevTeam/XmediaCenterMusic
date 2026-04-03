import TrackPlayer, { Event } from "react-native-track-player"
import * as musicCacheManager from './musicCacheManager'

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

    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
        const trackId = event.track?.id || (await TrackPlayer.getTrack(event.index))?.id;
        if (!trackId) return;

        const track = await TrackPlayer.getTrack(event.index);
        if (!track) return;

        // Hook: Trigger background caching
        musicCacheManager.triggerCaching(track);

        // Hook: Replace source if cached and within 1s window (to avoid gaps)
        const progress = await TrackPlayer.getProgress();
        if (progress.position < 1 && track.url.startsWith('http')) {
            const hasCache = await musicCacheManager.checkCacheExists(track.id);
            if (hasCache) {
                const localUri = musicCacheManager.getLocalUri(track.id);
                console.log(`[PlaybackService] Replacing remote source with local cache: ${localUri}`);
                
                // TrackPlayer.load replaces the current track's source
                await TrackPlayer.load({
                    ...track,
                    url: localUri
                });
                await TrackPlayer.play();
            }
        }
    });
}