import {getTracksFromPlaylist, isUserPlaylist} from "./helperFunctions.js";

/**
 *  function that gets all tracks a user has and returns them as Array
 *  @return tracks as Array
 */
export async function getAllTracks() {
    // initialize Array
    const userContentTracks = [];
    // get content as const to satisfy await
    const userContents = await Spicetify.Platform.RootlistAPI.getContents();
    // handle each item (can be playlist or folder)
    for (const item of userContents.items) {
        // get tracks as const to satisfy await
        const tracks = await processItem(item);
        // add tracks to Array
        if (tracks !== undefined) {
            userContentTracks.push(tracks);
        }
    }
    userContentTracks.push(await getLikedTracks());
    console.log("Number of songs in your Library including duplicates and dead Tracks: " + (userContentTracks.flat()).length)
    return userContentTracks.flat();
}

/**
 * helper function to get all tracks from user
 * @param item (playlist or folder)
 * @return tracks as Array?
 */
// @ts-ignore
async function processItem(item) {
    // handle playlist
    if (item.type == "playlist") {
        if (!await isUserPlaylist(item.uri)) return;
        return await getTracksFromPlaylist(item.uri);
    } else if (item.type == "folder") {
        // create Array for folder that stores all its contents
        const folderTracks = [];
        // loop through folder contents
        for (const nestedItem of item.items) {
            // handle folder contents
            const tracks = await processItem(nestedItem);
            folderTracks.push(tracks);
        }
        // return folder contents
        return folderTracks.flat();
    } else {
        console.warn("Something other then Playlist or Folder got found");
    }
}

/**
 * get all liked tracks
 * @returns liked tracks as Array
 */
async function getLikedTracks() {
    const liked = await Spicetify.Platform.LibraryAPI.getTracks({offset: 0, limit: -1});
    if (!liked) return;
    const uris = []
    for (const item of liked.items) {
        uris.push(item.uri)
    }
    return uris;
}