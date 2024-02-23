// get playlist of context menu
// const playlist = Spicetify.Platform.PlaylistAPI.getPlaylist(uri);

// spotify:playlist:04tf06kzbTCW70KXx0M9Lw
// create playlist
// console.log(await createNewPlaylist("Hello World"));


/**
 * gets isrc of track(s) using their uri
 * @param uri as String or Array
 * @returns isrc as String or Array
 */
export async function getISRC(uris) {
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
    // make trackUri an Array
    const trackUris = [trackUri].flat();
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
 * returns all tracks from the inputted playlist (uri)
 * @param uri from playlist
 * @return tracks as Array
 */
export async function getTracksFromPlaylist(uri) {
    const trackObject = await Spicetify.Platform.PlaylistAPI.getContents(uri);
    return trackObject.items;
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