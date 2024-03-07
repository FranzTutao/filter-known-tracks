import Dexie, {Table} from "dexie";
import {getTrackObject, Track} from "./helperFunctions.js";
import {getAllTracks} from "./getInitialTracks.js";

/**
 * indexedDB storing track objects with uri as index
 */
export const db = new (class extends Dexie {
    webTracks!: Table<Track>

    constructor() {
        super("library-data")
        this.version(1).stores({
            webTracks: "&uri, isrc, name, artist, duration",
        })
    }
})()


/**
 * resync database
 */
export async function resync() {
    Spicetify.showNotification("ReSync started")
    // get local track uris
    const urisToSync = await getAllTracks()
    // initialize counter
    initializeCounter(urisToSync)
    // get all database tracks
    const allDatabaseTracks = await db.webTracks.toArray();
    // remove tracks that are in database but not in map
    for (const trackFromDatabase of allDatabaseTracks) {
        const uriFromDatabase = trackFromDatabase.uri
        if (!counter.has(uriFromDatabase)) {
            // delete Track
            await db.webTracks.delete(uriFromDatabase)
        }
    }
    const urisToAdd = []
    // add tracks that are in map but not in database
    for (const localUri of counter.keys()) {
        if (allDatabaseTracks.includes(localUri)) {
            urisToAdd.push(localUri)
        }
    }
    // add Tracks to database
    const trackObjects = await getTrackObject(urisToAdd)
    await db.webTracks.bulkAdd(trackObjects)
}

/**
 * counter to store amount of times a track is in local library/ database
 *
 * key is irc
 *
 * value is count starting from 1
 */
export const counter = new Map()

/**
 * initialize counter on startup
 * @param urisToSync as Array
 */
function initializeCounter(urisToSync) {
    // check if uris has entries
    if (urisToSync.length <= 0) return
    for (const uri of urisToSync) {
        // check if uri exists
        if (!uri) continue
        // check if already exists
        if (counter.has(uri)) {
            // increase value
            const value = counter.get(uri)
            counter.set(uri, value + 1)
        } else {
            counter.set(uri, 1)
        }
    }
}