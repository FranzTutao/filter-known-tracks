import {likedEventHandler, playlistEventHandler, trackEventHandler} from "./listener.js";
import {resync} from "./database.js";
import {contextMenu} from "./helperFunctions.js";

// TODO why does this have to be a .tsx file?!
async function main() {
    // await if messages can be sent
    while (!Spicetify?.showNotification) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Show message on start
    Spicetify.showNotification("Hello Franz3, welcome back <3"); // todo UWU
    // await if everything necessary is loaded
    while (!Spicetify?.Platform?.PlaylistAPI?.getPlaylist) {
        await new Promise(res => Spicetify.Events.platformLoaded.on(res))
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
