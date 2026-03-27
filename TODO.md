Refact the playback list into independent list, and persistent state should be employed.

The current implementation of playback list is to use `current-playing-playlist-id` `current-playing-song-id` in the AsyncStorage to inherit all songs from the playlists. However, this limits the functions and flexibility of playback. So users cannot manually add a song from another playlist into the current playback list. 

You job is to refactor this implementation. The new implementation should be as follows:

1. Refactor `setCurrentTrack` and relevant APIs, to remember and maintain a new data structure called PlaybackList which records the independent song info, like title, album, url, etc. When the users plays a song from the playlist, it should replace the current playback list with this playlist for now. What's more, when the playback list is updated, you should update the RNTP queue as well.
2. The play back status should be persisted if the app is closed and reopened. So user can resume the playback from where it left off.