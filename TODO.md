Refact the playback list into independent list, and persistent state should be employed.

The current implementation of playback list is to use `current-playing-playlist-id` `current-playing-song-id` in the AsyncStorage to inherit all songs from the playlists. However, this limits the functions and flexibility of playback. So users cannot manually add a song from another playlist into the current playback list. 

You job is to refactor this implementation. The new implementation should be as follows:

1. Refactor `setCurrentTrack` and relevant APIs, to remember and maintain a new data structure called PlaybackList which records the independent song info, like title, album, url, etc. When the users plays a song from the playlist, it should replace the current playback list with this playlist for now. What's more, when the playback list is updated, you should update the RNTP queue as well.
2. The play back status should be persisted if the app is closed and reopened. So user can resume the playback from where it left off.

Refactor Work 2

Current music import settings is flawed. When user is intended to import a music file, it has to go through the file selector, upload it, then import it in the playlist. However, we wish to make user directly upload their music into playlists. Which means, we can set up a default location for music storage, and we can make a shortcut in the playlist view to directly upload the music into the storage then add it into the playlist.

This demands a new page for Settings, in which the location of default music storage is set. Also, the PlaylistView's add button should not only has the function of adding music from the drive, but also has the function of uploading music from the local storage, which also demands for a new dialog to select one desired function between the mentioned.

Apart from all this, the file selector in PathInput.js is flawed. It should also support mime filtering, multi-file selections to support the mentioned features.

During your implementation work, refer to existing file uploading practice and API documentation is suggested.