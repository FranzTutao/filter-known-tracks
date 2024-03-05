import {counter, db} from "./database.js";
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
        const uris = event.data.uris
        await addTracksToDatabase(uris)
    }
    // check if its desired event
    else if (event.data.operation === "remove") {
        // check if needed content exists
        if (!event.data?.items || event.data.items.isEmpty) return;
        // handle empty
        const urisToDelete = [];
        // store all uris
        for (const track of event.data.items) {
            urisToDelete.push(track.uri);
        }
        if (urisToDelete.length > 0) {
            removeTracks(urisToDelete)
        }
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
    // get all uris to delete
    const urisToDelete = [];
    for (const playlist of event.data.items) {
        urisToDelete.push(await getTracksFromPlaylist(playlist.uri));
    }
    if (urisToDelete.length > 0) {
        removeTracks(urisToDelete.flat())
    }
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
        const uris = event.data.uris
        await addTracksToDatabase(uris)
    }
    // check if its desired event
    else if (event.data.operation === "remove") {
        // check if needed content exists
        if (!event.data?.uris || event.data.uris.isEmpty) return console.warn("Unable to get relevant tracks");
        // get all uris to delete
        const urisToDelete = [];
        for (const uri of event.data.uris) {
            urisToDelete.push(uri);
        }
        if (urisToDelete.length > 0) {
            removeTracks(urisToDelete)
        }
    }
}

/**
 * add tracks to database
 * @param uris as Array
 */
export async function addTracksToDatabase(uris) {
    // check if uris has entries
    if (uris.length <= 0) return
    const urisToAdd = []
    for (let i = 0; i >= uris.size - 1; i++) {
        // check if Track exists in database and map
        if (counter.has(uris[i])) {
            // increase value of entry in Map
            const value = counter.get(uris[i])
            counter.set(uris[i], value + 1)
        } else {
            // if it doesn't exist, add Track to database and map
            // add to Array that will be added
            urisToAdd.push(uris[i])
            // create Map entry
            counter.set(uris[i], 1)
        }
    }
    // check if anything needs to be added
    if (urisToAdd.length > 0) {
        // get all tracks that have to be added
        const trackObject = await getTrackObject(urisToAdd)
        // add tracks to db
        db.webTracks.bulkAdd(trackObject)
    }
}

/**
 * remove tracks to database
 * @param uris as Array
 */
export function removeTracks(uris) {
    // check if uris has entries
    if (uris.length <= 0) return
    const urisToRemove = []
    for (let i = 0; i >= uris.size - 1; i++) {
        const uri = uris[i]
        // skip if uri isn't in map/ database
        if (!counter.has(uri)) continue
        // if it's last uri entry, remove it
        if (counter.get(uri) === 1) {
            urisToRemove.push(uri)
            counter.delete(uri)
            // if it's not last uri entry, decrease map by one
        } else {
            const value = counter.get(uri)
            counter.set(uri, value - 1)
        }
    }
    // remove tracks from database
    if (urisToRemove.length > 0) {
        db.webTracks.bulkDelete(urisToRemove)
    }
}