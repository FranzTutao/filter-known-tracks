## Docs from Spicetify

Check out [Spicetify's docs](https://spicetify.app/docs/development/spicetify-creator/the-basics)!

## Commands

``npm run build``

``spicetify apply``

``npm run watch``

``spicetify watch -le``

## Function

Creates a new playlist which only contains songs of the different/ foreign playlist that are not in your Spotify library

- will compare tracks from another playlist with your own library based on the isrc or uri as fallback
- will need to synchronize your Spotify library on startup, before it can be used
- will put that newly created playlist in a folder called "New Songs" in the root directory
- will copy image and name of the old playlist and mention the user who created the old playlist in the description
- if used on self-owned playlist it compares based on the uri instead of isrc

It took ~12 minutes 30 seconds for a playlist with ~5600 tracks, where ~5360 were new tracks, to finish

## ToDo

#### Features

- find solution for how to handle library changes while re-syncing
- improve message feedback
- make marketplace ready/ suitable
- custom compare instead of isrc (compare using title, artists and duration)
- resync on demand
- add blacklist for songs
- add blacklist and whitelist for playlists
- allow specific path where playlist is put
- allow custom description
- toggle welcome message and make it customizable
- toggle between all and self-owned tracks from your library
- add option to make/ compare playlist with tracks that are in your library to find tracks in common

#### Improve code

- restructure code to have the things we expect first, and not the edge cases
- add utils class for map to handle everything map related
- use Error instead of undefined/ null
- make functions smaller and thereby easier to test and modify

## Known bugs:

## Useful Links

https://dexie.org/docs/Typescript

https://spicetify.app/docs/development/api-wrapper/

https://developer.spotify.com/documentation/web-api/reference/get-track

https://spicetify.app/docs/development/api-wrapper/methods/cosmos-async

https://github.com/spicetify/spicetify-marketplace/wiki/Publishing-to-Marketplace
