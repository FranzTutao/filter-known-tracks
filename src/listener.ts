import {db} from "./database.js";
import {getTrackObject, getTracksFromPlaylist} from "./helperFunctions.js";

/**
 * get added/ deleted tracks and add/ remove from db
 * @param event
 *
 */
export async function trackEventHandler(event) {
    // check if needed content exists
    if (!event?.data?.operation) return console.warn("Unable to tell event type");
    // check if its desired event
    if (event.data.operation === "add") {
        // check if needed content exists
        if (!event.data?.uris || event.data.uris.isEmpty) return console.warn("Unable to get relevant tracks");
        // get all tracks that got added
        const trackObject = await getTrackObject(event.data.uris)
        // add tracks to db
        db.webTracks.bulkAdd(trackObject)
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
        // remove tracks from db
        db.webTracks.bulkDelete([...deletedTracks].flat())
    }
}

/**
 * gets passive deleted tracks and removes them from db
 * @param event
 *
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
    // delete tracks from db
    db.webTracks.bulkDelete([...deletedTracks].flat())
}

/**
 * get added/ deleted liked tracks and adds/ removes these from db
 * @param event
 *
 */
export async function likedEventHandler(event) {
    // check if needed content exists
    if (!event?.data?.operation) return console.warn("Unable to tell event type");
    // check if its desired event
    if (event.data.operation === "add") {
        // check if needed content exists
        if (!event.data?.uris || event.data.uris.isEmpty) return console.warn("Unable to get relevant tracks");
        // add all tracks that got added to db
        const trackObjects = await getTrackObject(event.data.uris)
        db.webTracks.bulkAdd(trackObjects)
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
        // remove tracks from db
        db.webTracks.bulkDelete([...unLikedTracks].flat())
    }
}