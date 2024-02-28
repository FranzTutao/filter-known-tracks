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
    // check if uris exists
    if (!uris) {
        console.warn("Uri passed to getTrackObject is faulty: " + uris)
        Spicetify.showNotification("Uri passed to getTrackObject is faulty")
        return null
    }
    // handle Array
    if (Array.isArray(uris)) {
        // store trackIds from uris
        const trackIds = new Set
        // Array of all responses
        const bulkResponse = []
        //store all trackObjects
        const trackObjects = []

        // loop through Array of uris
        for (const uri of uris) {
            // get trackId from uri
            const trackId = uri.split(":")[2];
            if (trackId) trackIds.add(trackId)
        }
        // split into 45 chunks for api request (at 50 it times out; if I want 100, I have to write my own fetch)
        for (let i = 0; i < trackIds.size; i += 45) {
            // format into String seperated by comma
            const formattedTrackIds = [...trackIds].slice(i, i + 45).join(",")
            const singeResponse = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks?ids=${formattedTrackIds}`)
            // save tracks in an Array
            bulkResponse.push(singeResponse.tracks)
        }
        // format Array of Array's to only an Array which contains the Tracks
        if (!bulkResponse) {
            console.warn("Empty bulk api response")
            return null
        }
        // get trackObjects and return
        for (const response of (bulkResponse.flat())) {
            const trackObject = await makeTrackObject(response)
            if (trackObject) trackObjects.push(trackObject);
        }
        return trackObjects


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
        console.warn("Spotify response faulty: " + trackObject)
        Spicetify.showNotification("Spotify response faulty")
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
        console.warn("Error while getting TrackObject: ")
        console.warn(response)
        Spicetify.showNotification("Error while getting TrackObject")
        return null
    }
    // get artist name as array of strings
    const artists: Array<string> = []
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

/**
 * structure Tracks are saved in the database
 */
export interface Track {
    uri: string
    isrc: string
    name: string
    artist: Array<string>
    duration: number
}

/**
 * resync database
 *
 */
export async function resync() {
    // get local track uris
    let urisToSync = await getAllTracks()
    // get all database tracks
    const allTracks = await db.webTracks.toArray();

    // filter tracks that are in database, but not local
    const tracksToDelete = allTracks.filter(track => !urisToSync.includes(track.uri));
    // check if anything needs to be removed
    if (tracksToDelete.length >= 1) {
        // delete tracks not in the URI array
        for (const track of tracksToDelete) {
            await db.webTracks.delete(track.uri);
        }
    }
    // add missing tracks to database
    // collect all uris missing
    const urisToAdd = []
    // handle each track
    for (const uri of urisToSync) {
        // check if already in database
        const exists = allTracks.some(track => track.uri === uri);
        if (!exists && uri) {
            urisToAdd.push(uri)
        }
    }
    const trackObjects = await getTrackObject(urisToAdd.flat())

    if (trackObjects) {
        await db.webTracks.bulkAdd(trackObjects)
    }
}

/**
 * counter to store how many times a track is in library
 */
export const counter = new Map