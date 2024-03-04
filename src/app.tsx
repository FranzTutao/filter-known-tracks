import {likedEventHandler, playlistEventHandler, trackEventHandler} from "./listener.js";
import {getTracksFromContextMenu, resync} from "./helperFunctions.js";
import {db} from "./database.js";

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
    // register event listener for add/ remove songs
    Spicetify.Platform.PlaylistAPI.getEvents().addListener("operation_complete", trackEventHandler);
    Spicetify.Platform.RootlistAPI.getEvents().addListener("operation_complete", playlistEventHandler);
    Spicetify.Platform.LibraryAPI.getEvents().addListener("operation_complete", likedEventHandler);
    // resync database
    // TODO()

    async function onPlaylistContextMenu(uri) {
        // get tracks that have to be compared to the database
        const tracksToCompare = await getTracksFromContextMenu(uri)
        // handle error
        if (!tracksToCompare) {
            console.log("Unable to fetch Tracks of this playlist.")
            console.log("Tracks to Compare to: " + tracksToCompare)
            Spicetify.showNotification("Unable to fetch Tracks of this playlist, please retry")
        }
    }
}

async function test() {
    // await resync()

}


export default main;
