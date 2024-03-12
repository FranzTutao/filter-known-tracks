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
-

## ToDo

- allow usage on self owned playlists
- find solution for how to handle library changes while re-syncing
- implement own fetch that allows up to 100 track requests instead of the current 45
- make marketplace ready/ suitable
- debug
- custom compare instead of isrc (compare using title, artists and duration)
- resync on demand
- add blacklist for songs
- add blacklist and whitelist for playlists
- allow specific path where playlist is put
- allow custom description
- toggle between all and self-owned tracks
- add option to make playlist with only tracks that are also in your library to find common tracks

## Known bugs:

- fetching in batches over 50 doesn't work (theoretical limit is 100)

## Useful Links

https://dexie.org/docs/Typescript

https://spicetify.app/docs/development/api-wrapper/

https://developer.spotify.com/documentation/web-api/reference/get-track

https://spicetify.app/docs/development/api-wrapper/methods/cosmos-async

https://github.com/spicetify/spicetify-marketplace/wiki/Publishing-to-Marketplace
