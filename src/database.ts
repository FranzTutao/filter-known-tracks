import Dexie, {Table} from "dexie";
import {Track} from "./helperFunctions.js";


export const db = new (class extends Dexie {
    webTracks!: Table<Track>

    constructor() {
        super("library-data")
        this.version(1).stores({
            webTracks: "&uri, isrc, name, artist, duration",
        })
    }
})()

// console.log(db.webTracks.add({name: "TrackName", uri: "TrackUri"}))