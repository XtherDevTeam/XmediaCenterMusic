import { registerRootComponent } from 'expo';
import App from './App';
import TrackPlayer from 'react-native-track-player';
import 'react-native-gesture-handler';
import playbackService from './shared/playbackService';
import * as playerBackend from './shared/playerBackend';

registerRootComponent(App)
TrackPlayer.registerPlaybackService(() => playbackService)
playerBackend.setup()