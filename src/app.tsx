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
        // get playlist of context menu
        // const playlist = Spicetify.Platform.PlaylistAPI.getPlaylist(uri);

        // spotify:playlist:04tf06kzbTCW70KXx0M9Lw
        // create playlist
        // console.log(await createNewPlaylist("Hello World"));

        // test database
        // db.webTracks.add("idk", "idk");

        console.log(getISRC("spotify:track:6ibDVMcMUNqZ5eXT9sD4Vy"));
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

/**
 * create new playlist that will contain all the tracks
 * @param name
 * @returns uri of created playlist
 */
async function createNewPlaylist(name) {
    return await Spicetify.Platform.RootlistAPI.createPlaylist(name, "", "");
}

/**
 *  add track(s) to playlist
 * @param playlistUri playlist the track will be added to
 * @param trackUri uri of track or array of uri's that will be added
 */
async function addTracksToPlaylist(playlistUri, trackUri) {
    // handle Array
    if (Array.isArray(trackUri)) {
        await Spicetify.Platform.PlaylistAPI.add(playlistUri, trackUri, {});
        // handle String
    } else await Spicetify.Platform.PlaylistAPI.add(playlistUri, [trackUri], {});
}

/**
 * gets isrc of track(s) using their uri
 * @param uri as String or Array
 * @returns isrc as String or Array
 */
async function getISRC(uris) {
    // handle Array
    if (Array.isArray(uris)) {
        const ISRCs = new Set();
        // loop through Array
        for (const uri of uris) {
            // get trackId from uri
            const trackId = uri.split(":")[2];
            const response = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${trackId}`);
            // check if we got the ISRC
            if (response.external_ids && response.external_ids.isrc) {
                ISRCs.add(response.external_ids.isrc);
            } else {
                console.warn("ERROR when getting the ISRC");
            }
        }
        // return Array of ISRC's
        return [...ISRCs].flat();
        // handle String
    } else {
        // get trackId from uri
        const trackId = uris.split(":")[2];
        const response = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${trackId}`);
        // check if we got the ISRC
        if (response.external_ids && response.external_ids.isrc) {
            return response.external_ids.isrc;
        } else {
            console.warn("ERROR when getting the ISRC");
        }
    }
}

// -------------------------------------Database--------------------------------------------------------------

// interface Track {
//     name: string
//     uri: string
// }
//
// const db = new (class extends Dexie {
//     webTracks!: Table<Track>
//
//     constructor() {
//         super("library-data")
//         this.version(1).stores({
//             webTracks: "&name, uri",
//         })
//     }
// })()

export default main;
