import {getTracksFromPlaylist, isUserPlaylist} from "./helperFunctions.js";

/**
 *  get all local tracks as uri
 *  @return uris as Array
 */
export async function getAllTracks() {
    // initialize Array
    const localUris = [];
    const userContents = await Spicetify.Platform.RootlistAPI.getContents();
    console.log("User content loaded")
    // handle each item (can be playlist or folder)
    for (const item of userContents.items) {
        const uri = await processItem(item);
        // add uri to Array
        if (uri !== undefined) {
            localUris.push(uri);
        }
    }
    localUris.push(await getLikedTracks());
    return localUris.flat();
}

/**
 * get uris from folder or playlist recursively
 * @param item (playlist or folder)
 * @return track uris as Array
 */
async function processItem(item) {
    // handle playlist
    if (item.type == "playlist") {
        if (!await isUserPlaylist(item.uri)) return;
        return await getTracksFromPlaylist(item.uri);
    } else if (item.type == "folder") {
        // create Array for folder that stores all its contents
        const folderUris = [];
        // loop through folder contents
        for (const nestedItem of item.items) {
            // handle folder contents
            const uris = await processItem(nestedItem);
            folderUris.push(uris);
        }
        // return folder contents
        return folderUris.flat();
    } else {
        console.warn("Something other then Playlist or Folder got found");
    }
}

/**
 * get all liked tracks
 * @returns uris as Array
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