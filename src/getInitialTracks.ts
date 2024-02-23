import {isUserPlaylist} from "./helperFunctions.js";
import {getTracksFromPlaylist} from "./helperFunctions.js";

/**
 *  function that gets all tracks a user has and returns them as Array
 *  @return tracks as Array
 */
export async function getAllTracks() {
    // initialize set
    const userContentTracks = new Set;
    // get content as const to satisfy await
    const userContents = await Spicetify.Platform.RootlistAPI.getContents();
    // handle each item (can be playlist or folder)
    for (const item of userContents.items) {
        // get tracks as const to satisfy await
        const tracks = await processItem(item);
        // add tracks to set
        if (tracks !== undefined) {
            userContentTracks.add(tracks);
        }
    }
    userContentTracks.add(await getLikedTracks());
    return [...userContentTracks].flat();
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
        // create a Set for folder that stores all its contents
        const folderTracks = new Set();
        // loop through folder contents
        for (const nestedItem of item.items) {
            // handle folder contents
            const tracks = await processItem(nestedItem);
            folderTracks.add(tracks);
        }
        // return folder contents
        return [...folderTracks].flat();
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
    return liked.items;
}