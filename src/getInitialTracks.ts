import {getTracksFromPlaylist, isUserPlaylist} from "./helperFunctions.js";
import {TrackUri} from "./types.js";

/**
 *  get all local tracks
 *  @return TrackUri[]
 */
export async function getAllLocalTracks() : Promise<TrackUri[]> {
    const localUris : TrackUri[] = [];
    // get all local playlists and their tracks
    const userContents = await Spicetify.Platform.RootlistAPI.getContents();
    console.log("User content loaded")
    // handle each item (can be playlist or folder)
    for (const item of userContents.items) {
        const uris: TrackUri = await processItem(item);
        if (uris) {
            localUris.push(uris);
        }
    }
    // get all liked tracks
    await getLikedTracks().then((uris : TrackUri[] | undefined) => {
        if (uris) {
            localUris.push(...uris)
        }
    })
    return localUris.flat()
}

/**
 * get uris from folder or playlist recursively
 * @param item (playlist or folder)
 * @return TrackUri[]
 */
async function processItem(item) { // TODO please specify types....
    enum ItemType {
        Playlist = "playlist",
        Folder = "folder"
    }
    // handle playlists
    if (item.type === ItemType.Playlist) {
        const userPlaylist = await isUserPlaylist(item)
        if (!userPlaylist) return;
        return await getTracksFromPlaylist(item.uri);
    } else if (item.type === ItemType.Folder) {
        // handle folders
        const folderUris = [];
        for (const nestedItem of item.items) {
            const uris = await processItem(nestedItem); // TODO recursion is not that nice
            folderUris.push(uris);
        }
        // return folder contents
        return folderUris.flat();
    } else {
        console.log("Something other then Playlist or Folder got found");
    }
}

/**
 * get all liked tracks
 * @returns TrackUri[]
 */
async function getLikedTracks() : Promise <TrackUri[] | undefined> {
    const liked = await Spicetify.Platform.LibraryAPI.getTracks({offset: 0, limit: -1});
    return liked.items.map(likedTrack => likedTrack.uri)
}