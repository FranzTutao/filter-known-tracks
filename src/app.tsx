import {likedEventHandler, playlistEventHandler, trackEventHandler} from "./listener.js";
import {resync} from "./database.js";
import {contextMenu} from "./helperFunctions.js";


async function main() {
    // await if everything necessary is loaded
    while (!Spicetify?.showNotification) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Show message on start.
    Spicetify.showNotification("Hello Franz3, welcome back <3");
    // await for content to load
    while (!Spicetify?.Platform?.PlaylistAPI?.getPlaylist) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // resync database and map
    await resync()
    Spicetify.showNotification("ReSync complete")
    console.log("ReSync complete")
    // register context menu
    contextMenu.register()
    // register event listener for add/ remove songs
    Spicetify.Platform.PlaylistAPI.getEvents().addListener("operation_complete", trackEventHandler);
    Spicetify.Platform.RootlistAPI.getEvents().addListener("operation_complete", playlistEventHandler);
    Spicetify.Platform.LibraryAPI.getEvents().addListener("operation_complete", likedEventHandler);
}

export default main;
