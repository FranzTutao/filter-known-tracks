import Dexie, {Table} from "dexie";

interface Track {
    name: string
    uri: string
}

export const db = new (class extends Dexie {
    webTracks!: Table<Track>

    constructor() {
        super("library-data")
        this.version(1).stores({
            webTracks: "&name, uri",
        })
    }
})()

// console.log(db.webTracks.add({name: "TrackName", uri: "TrackUri"}))