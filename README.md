## Docs from Spicetify

Check out [Spicetify's docs](https://spicetify.app/docs/development/spicetify-creator/the-basics)!

## Commands

``npm run build``

``spicetify apply``

``npm run watch``

``spicetify watch -le``

## Function

Creates a new playlist which only contains songs of the different/ foreign playlist that are not in your Spotify library

- will need to synchronize your Spotify library on startup, before it can be used
- will put that newly created playlist in a folder called "New Songs" in the root directory
- will copy image and name of the old playlist and mention the user who created the old playlist in the description
- if used on self-owned playlist it excludes that playlist from your library (only uri comparison, no isrc)

It took ~12 minutes 30 seconds for a playlist with ~5600 tracks, where ~5360 were new tracks, to finish

## ToDo

- allow usage on self owned playlists
- clean up "getTrackObject" and use a parallel approach
- find solution for how to handle library changes while re-syncing
- improve message feedback
- make marketplace ready/ suitable
- custom compare instead of isrc (compare using title, artists and duration)
- resync on demand
- add blacklist for songs
- add blacklist and whitelist for playlists
- allow specific path where playlist is put
- allow custom description
- toggle between all and self-owned tracks
- add option to make playlist with only tracks that are also in your library to find common tracks

## Known bugs:

## Useful Links

https://dexie.org/docs/Typescript

https://spicetify.app/docs/development/api-wrapper/

https://developer.spotify.com/documentation/web-api/reference/get-track

https://spicetify.app/docs/development/api-wrapper/methods/cosmos-async

https://github.com/spicetify/spicetify-marketplace/wiki/Publishing-to-Marketplace
