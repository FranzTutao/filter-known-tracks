import Dexie, {Table} from "https://esm.sh/dexie"

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

    function test() {
        // const set = await getUserContentAsSet();
        // console.log(set);
        console.log("Pong");
        db.webTracks.add();
    }

    interface Track {
        name: string
        uri: string
    }

    const db = new (class extends Dexie {
        webTracks!: Table<Track>

        constructor() {
            super("library-data")
            this.version(1).stores({
                webTracks: "&name, uri",
            })
        }
    })()
}

/**
 *  function that gets all tracks a user has and returns them as Set of tracks
 *  @return Set of tracks
 */
async function getUserContentAsSet() {
    // initialize set
    const userContentTracks = new Set;
    // get content as const to satisfy await
    const userContents = await Spicetify.Platform.RootlistAPI.getContents();
    // handle each item (can be playlist or folder)
    for (const item of userContents.items) {
        // get tracks as const to satisfy await
        const tracks = await handleItem(item);
        // add tracks to set
        // @ts-ignore
        if (tracks !== undefined) {
            userContentTracks.add(tracks);
        }
    }
    return [...userContentTracks].flat();
}


/**
 * gets all playlists from item recursively and returns their tracks
 * @param item (playlist or folder)
 * @return tracks (gotten from handlePlaylist())
 */
// @ts-ignore
async function handleItem(item) {
    // handle playlist
    if (item.type == "playlist") {
        return handlePlaylist(item);
    } else if (item.type == "folder") {
        // create a Set for folder that stores all its contents
        const folderTracks = new Set();
        // loop through folder contents
        for (const nestedItem of item.items) {
            // handle folder contents
            const tracks = await handleItem(nestedItem);
            folderTracks.add(tracks);
        }
        // return folder contents
        return [...folderTracks].flat();
    } else console.warn("Something other then Playlist or Folder got found");
}

/**
 * returns all tracks from the inputted playlist
 * @param playlist
 * @return tracks
 */
async function handlePlaylist(playlist) {
    // filter out other playlists and empty playlists
    if (!(playlist.isCollaborative || playlist.isOwnedBySelf) || playlist.totalLength <= 0) return;
    const trackObject = await Spicetify.Platform.PlaylistAPI.getContents(playlist.uri);
    return trackObject.items;
}

// -------------------------------------Database--------------------------------------------------------------


export default main;
