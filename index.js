import { registerRootComponent } from 'expo';
import App from './App';
import TrackPlayer from 'react-native-track-player'
import playbackService from './shared/playbackService';
import * as playerBackend from './shared/playerBackend';

registerRootComponent(App)
TrackPlayer.registerPlaybackService(() => playbackService)
playerBackend.setup()