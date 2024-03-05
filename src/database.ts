import Dexie, {Table} from "dexie";
import {getTrackObject, Track} from "./helperFunctions.js";
import {getAllTracks} from "./getInitialTracks.js";


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
 *
 */
export async function resync() {
    // get local track uris
    let urisToSync = await getAllTracks()
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
            console.log(localUri)
            urisToAdd.push(localUri)
        }
    }
    // add Tracks to database
    const trackObjects = await getTrackObject(urisToAdd)
    await db.webTracks.bulkAdd(trackObjects)
}

/**
 * counter to store how many times a track is in library
 *
 * key is irc
 *
 * value is count starting from 1
 */
export const counter = new Map()

/**
 *
 * @param urisToSync
 */
function initializeCounter(urisToSync) {
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