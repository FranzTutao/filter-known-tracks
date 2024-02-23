/**
 * get added/ deleted tracks
 * @param event
 * @returns uris as Array
 */
export async function trackEventHandler(event) {
    // check if needed content exists
    if (!event?.data?.operation) return console.warn("Unable to tell event type");
    // check if its desired event
    if (event.data.operation === "add") {
        // check if needed content exists
        if (!event.data?.uris || event.data.uris.isEmpty) return console.warn("Unable to get relevant tracks");
        // get all tracks that got added
        console.log(event.data.uris);
    }
    // check if its desired event
    else if (event.data.operation === "remove") {
        // check if needed content exists
        if (!event.data?.items || event.data.items.isEmpty) return;
        // handle empty
        const deletedTracks = new Set;
        for (const track of event.data.items) {
            deletedTracks.add(track.uri);
        }
        console.log([...deletedTracks].flat());
    }
}

/**
 * gets passive deleted tracks
 * @param event
 * @returns uri's as Array
 */
export async function playlistEventHandler(event) {
    // check if needed content exists
    if (!event?.data?.operation) return console.warn("Unable to tell event type");
    // check if its desired event
    if (event.data.operation !== "remove") return;
    // check if needed content exists
    if (!event.data?.items || event.data.items.isEmpty) return console.warn("Unable to get relevant playlist");
    // get all tracks from playlist
    const deletedTracks = new Set;
    for (const playlist of event.data.items) {
        deletedTracks.add(await getTracksFromPlaylist(playlist.uri));
    }
    console.log([...deletedTracks].flat());
}

/**
 * get added/ deleted liked tracks
 * @param event
 * @returns uri's as Array
 */
export async function likedEventHandler(event) {
    // check if needed content exists
    if (!event?.data?.operation) return console.warn("Unable to tell event type");
    // check if its desired event
    if (event.data.operation === "add") {
        // check if needed content exists
        if (!event.data?.uris || event.data.uris.isEmpty) return console.warn("Unable to get relevant tracks");
        // get all tracks that got added
        console.log(event.data.uris);
    }
    // check if its desired event
    else if (event.data.operation === "remove") {
        // check if needed content exists
        if (!event.data?.uris || event.data.uris.isEmpty) return console.warn("Unable to get relevant tracks");
        // get all tracks that got removed
        const unLikedTracks = new Set;
        for (const track of event.data.uris) {
            unLikedTracks.add(track);
        }
        console.log([...unLikedTracks].flat());
    }
}