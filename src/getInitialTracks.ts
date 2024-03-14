import {getTracksFromPlaylist, isUserPlaylist} from "./helperFunctions.js";

/**
 *  get all local tracks as uri
 *  @return uris as Array
 */
export async function getAllTracks() {
    // initialize Array TODO useless comment tbh, but its fine. No need for oneliners explaining exactly what the code does though.
    const localUris = [];
    const userContents = await Spicetify.Platform.RootlistAPI.getContents();
    console.log("User content loaded")
    // handle each item (can be playlist or folder)
    for (const item of userContents.items) { // TODO what is item here? We are taking Items from UserContents? What is userContents?
        const uri = await processItem(item);
        // add uri to Array
        if (uri !== undefined) {
            localUris.push(uri);
        }
    }
    localUris.push(await getLikedTracks()); // TODO I would advise for something like getLikedTracks().then(t => localUris.push(t)).
    return localUris.flat();
}

/**
 * get uris from folder or playlist recursively
 * @param item (playlist or folder)
 * @return track uris as Array
 */
async function processItem(item) { // TODO please specify types....
    // handle playlist
    if (item.type == "playlist") { // TODO typing it loosely is fine but it would be preferred to introduce an Enum.
        if (!await isUserPlaylist(item)) return;
        return await getTracksFromPlaylist(item.uri);
    } else if (item.type == "folder") {
        // create Array for folder that stores all its contents
        const folderUris = [];
        // loop through folder contents
        for (const nestedItem of item.items) {
            // handle folder contents
            const uris = await processItem(nestedItem); // TODO recursion is not that nice
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
async function getLikedTracks() {// TODO specifyyyy the tyyyyyyyyyyyyypeeeeeeeee
    const liked = await Spicetify.Platform.LibraryAPI.getTracks({offset: 0, limit: -1}); // TODO limit -1 means infinite search?
    if (!liked) return; // TODO ![] = false..
    const uris = []
    for (const item of liked.items) { // TODO liked.items.map((t => t.uri)) experiment with this, its the same thing
        uris.push(item.uri)
    }
    return uris;
}