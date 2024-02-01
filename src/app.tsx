// import Dexie, {Table} from "https://esm.sh/dexie"

async function main() {
    // await if everything necessary is loaded
    while (!Spicetify?.showNotification) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Show message on start.
    Spicetify.showNotification("Hello Franz3, welcome back <3");
    // register context menu
    new Spicetify.ContextMenu.Item(
        "Generate filtered playlist",
        test,
        (uri) => Spicetify.URI.fromString(uri[0]).type == Spicetify.URI.Type.PLAYLIST_V2,
        "enhance",
        false,
    ).register();

    async function test(uri) {
        // const allTracks = await getAllTracks();
        const tracks = await getTracksFromContextMenu(uri[0]);
        console.log(tracks);
    }
}

/**
 * get tracks from context menu (only if it's not your playlist!!!)
 * @param uri
 * @returns tracks as Array or undefined
 */
async function getTracksFromContextMenu(uri) {
    // stop if its users own playlist
    if (await isUserPlaylist(uri)) return;
    // get Tracks from playlist
    const trackObject = await getTracksFromPlaylist(uri);
    // remove undefined entries and return Array?
    return [...trackObject].flat();
}

/**
 *  function that gets all tracks a user has and returns them as Array
 *  @return tracks as Array
 */
async function getAllTracks() {
    // initialize set
    const userContentTracks = new Set;
    // get content as const to satisfy await
    const userContents = await Spicetify.Platform.RootlistAPI.getContents();
    // handle each item (can be playlist or folder)
    for (const item of userContents.items) {
        // get tracks as const to satisfy await
        const tracks = await processItem(item);
        // add tracks to set
        // @ts-ignore
        if (tracks !== undefined) {
            userContentTracks.add(tracks);
        }
    }
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
    } else console.warn("Something other then Playlist or Folder got found");
}

/**
 * returns all tracks from the inputted playlist (uri)
 * @param uri from playlist
 * @return tracks
 */
async function getTracksFromPlaylist(uri) {
    const trackObject = await Spicetify.Platform.PlaylistAPI.getContents(uri);
    return trackObject.items;
}

/**
 * check if the provided playlist belongs to the user or not
 * @param uri
 * @returns boolean
 */
async function isUserPlaylist(uri) {
    const playlist = await Spicetify.Platform.PlaylistAPI.getPlaylist(uri);
    return await (playlist.metadata.isCollaborative || playlist.metadata.isOwnedBySelf || playlist.metadata.canAdd) || playlist.metadata.totalLength <= 0;
}

// -------------------------------------Database--------------------------------------------------------------


export default main;
