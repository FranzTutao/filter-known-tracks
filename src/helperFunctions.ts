// get playlist of context menu
// const playlist = Spicetify.Platform.PlaylistAPI.getPlaylist(uri);

// spotify:playlist:04tf06kzbTCW70KXx0M9Lw
// create playlist
// console.log(await createNewPlaylist("Hello World"));


import {getAllTracks} from "./getInitialTracks.js";
import {db} from "./database.js";

/**
 * gets trackObjects using their uri
 * @param uris as String or Array
 * @returns trackObject
 */
export async function getTrackObject(uris) {
    // handle Array
    if (Array.isArray(uris)) {
        const trackObjects = [];
        // loop through Array
        for (const uri of uris) {
            // get trackId from uri
            const trackId = uri.split(":")[2];
            const response = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${trackId}`);
            const trackObject = await makeTrackObject(response)
            // check for error (null)
            if (trackObject) {
                trackObjects.push(trackObject)
            }
        }
        // return Array of ISRC's
        return trackObjects.flat();
        // handle String
    } else {
        // get trackId from uri
        const trackId = uris.split(":")[2];
        const response = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${trackId}`);
        const trackObject = await makeTrackObject(response)
        // check for error (null)
        if (trackObject) {
            return trackObject
        }
        return null
    }
}

/**
 * converts track api response to track object
 * @param response
 * @return trackObject or null
 */
export async function makeTrackObject(response) {
    // return null if objects are not present
    if (!response?.uri || !response?.external_ids?.isrc ||
        !response?.name || !response?.artists || !response?.duration_ms) {
        console.warn("Error while getting TrackObject")
        Spicetify.showNotification("Error while getting TrackObject")
        return null
    }
    // get artist name as array of strings
    const artists : Array<string> = []
    for (const artist of response.artists) {
        artists.push(artist.name)
    }
    // create and return track object
    const trackObject: Track = {
        uri: response.uri,
        isrc: response.external_ids.isrc,
        name: response.name,
        artist: artists,
        duration: response.duration_ms
    }
    return trackObject
}

/**
 * create new playlist that will contain all the tracks
 * @param name
 * @returns uri of created playlist
 */
export async function createNewPlaylist(name) {
    return await Spicetify.Platform.RootlistAPI.createPlaylist(name, "", "");
}

/**
 *  add tracks to playlist
 * @param playlistUri playlist the track will be added to
 * @param trackUri uri's of tracks that will be added
 */
export function addTracksToPlaylist(playlistUri, trackUri) {
    // remove duplicates
    const uniqueTrackUri = [...new Set(trackUri)]
    // make trackUri an Array
    const trackUris = [uniqueTrackUri].flat();
    // add to specified playlist
    Spicetify.Platform.PlaylistAPI.add(playlistUri, trackUris, {});
}

/**
 * get tracks from context menu (only if it's not your playlist!!!)
 * @param uri
 * @returns tracks as Array or undefined
 */
export async function getTracksFromContextMenu(uri) {
    // stop if its users own playlist
    if (await isUserPlaylist(uri)) return;
    // get Tracks from playlist
    const trackObject = await getTracksFromPlaylist(uri);
    // remove undefined entries and return Array?
    return [...trackObject].flat();
}

/**
 * returns all track uris from the inputted playlist (uri)
 * @param uri from playlist
 * @return uris of tracks as Array
 */
export async function getTracksFromPlaylist(uri) {
    const trackObject = await Spicetify.Platform.PlaylistAPI.getContents(uri);
    const uris = []
    for (const item of trackObject.items) {
        uris.push(item.uri)
    }
    return uris;
}

/**
 * check if the provided playlist belongs to the user or not
 * @param uri
 * @returns boolean
 */
export async function isUserPlaylist(uri) {
    const playlist = await Spicetify.Platform.PlaylistAPI.getPlaylist(uri);
    return await (playlist.metadata.isCollaborative || playlist.metadata.isOwnedBySelf || playlist.metadata.canAdd) || playlist.metadata.totalLength <= 0;
}

export interface Track {
    uri: string
    isrc: string
    name: string
    artist: Array<string>
    duration: number
}

/**
 * resync library on startup
 */
export async function resync() {
    console.log(await getAllTracks())
}

/**
 * check if uri's are in the database
 * @param uris
 */
export async function uriIsInDatabase(uris) {
    const inDatabase = await db.webTracks.bulkGet(uris)

}

/**
 * counter to store how many times a track is in library
 */
export const counter = new Map