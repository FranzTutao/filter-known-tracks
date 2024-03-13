import {counter, db} from "./database.js";

/**
 * gets trackObjects using their uri
 * @param uris as String or Array<string>
 * @returns Array of trackObjects
 */
// TODO please type parameters
export async function getTrackObject(uris) {
    // check if uris exists
    if (!uris) { // TODO this can fire at wrong times, are you checking for explicit null or empty string? '!"" == true', whereas empty array: ![] == false
        console.warn("Uri passed to getTrackObject is faulty: " + uris)
        Spicetify.showNotification("Uri passed to getTrackObject is faulty")
        return null
    }
    // handle both array and string by making string an array
    const urisArray = Array.isArray(uris) ? uris : [uris];
    // store trackIds from uris
    const trackIds = new Set
    //store all trackObjects
    const trackObjects = []
    // Array for promises to allow asynchronous
    const promises = []

    // get track id from Array
    for (const uri of urisArray) {
        // get track id from uri
        const trackId = uri.split(":")[2];
        if (trackId) trackIds.add(trackId)
    }
    // split into 50 chunks for api request as that's the max it
    for (let i = 0; i < trackIds.size; i += 50) {
        // format into String seperated by comma
        const formattedTrackIds = [...trackIds].slice(i, i + 50).join(",")
        promises.push(customFetch(`https://api.spotify.com/v1/tracks?ids=${formattedTrackIds}`))
    }
    const bulkResponse = await Promise.all(promises)
    // TODO() handle faulty bulkResponse
    if (!bulkResponse) {
        console.warn("Empty bulk api response") // TODO uwu
        return null
    }
    for (const response of bulkResponse) {
        // check if tracks exist
        if (!response?.tracks) continue
        // get trackObjects
        const trackObject = await makeTrackObject(response.tracks)
        if (trackObject) trackObjects.push(trackObject);
    }
    return trackObjects.flat()
}

/**
 * converts track api response to track object
 * @param response
 * @return trackObject or null
 */
export async function makeTrackObject(responses) {
    // store newly created trackObjects
    const trackObjects = []
    // make response always an array
    const objects = Array.isArray(responses) ? responses : [responses]; // TODO ?????

    for (const response of objects) {
        // return null if objects are not present
        if (!response) return
        if (!response?.uri || !response?.external_ids?.isrc ||
            !response?.name || !response?.artists || !response?.duration_ms) {
            console.warn("Error while getting TrackObject: ")
            console.log(response)
            Spicetify.showNotification("Error while getting TrackObject")
            if (response?.uri) {
                counter.delete(response.uri)
            }
            return null
        }
        // get artist name as Array of Strings
        const artists: Array<string> = []
        for (const artist of response.artists) {
            artists.push(artist.name)
        }
        // create and return track object
        const trackObject: Track = {
            uri: response.uri,
            isrc: response.external_ids.isrc,
            name: response.name,
            artist: artists,
            duration: response.duration_ms
        }
        trackObjects.push(trackObject)
    }
    if (!trackObjects) return null
    return trackObjects
}

/**
 * create new playlist
 * @param name
 * @returns uri of created playlist
 */
export async function createNewPlaylist(name) {
    return await Spicetify.Platform.RootlistAPI.createPlaylist(name, "", "");
}

/**
 *  add tracks to playlist (duplicates are only added once)
 * @param playlistUri
 * @param trackUri uri's as Array
 */
export function addTracksToPlaylist(playlistUri, trackUri) {
    // remove duplicates
    const uniqueTrackUri = [...new Set(trackUri)]
    // make trackUri an Array
    const trackUris = [uniqueTrackUri].flat();
    // check if it has tracks in it
    if (trackUri.length === 0) {
        Spicetify.showNotification("No tracks to add to playlist found")
        console.warn("No tracks to add to playlist found")
        return
    }
    // add to specified playlist
    Spicetify.Platform.PlaylistAPI.add(playlistUri, trackUris, {});
}

/**
 * get tracks from context menu (only if it's not your playlist!!!)
 * @param playlistUri
 * @returns uris as Array or undefined
 */
export async function getTracksFromContextMenu(playlistUri) {
    // get playlistItem TODO again, this commenting style is not very beneficial. Please document the methods more and don't add one liners to every single line that don't add anything of value really.
    const playlistItem = await Spicetify.Platform.PlaylistAPI.getPlaylist(playlistUri);
    // stop if its users own playlist
    if (await isUserPlaylist(playlistItem)) return;
    // get uris of tracks from playlist
    const uris = await getTracksFromPlaylist(playlistUri);
    // remove undefined entries and return Array?
    return [...uris].flat(); // TODO what are you doing with flat() here?
}

/**
 * returns all track uris from the inputted playlist
 * @param playlistUri from playlist
 * @return uris of tracks as Array
 */
export async function getTracksFromPlaylist(playlistUri) {
    const trackObject = await Spicetify.Platform.PlaylistAPI.getContents(playlistUri);
    const uris = []
    for (const item of trackObject.items) {
        uris.push(item.uri)
    }
    return uris;
}

/**
 * check if the provided playlist belongs to the user (true) or not (false) and has tracks in it TODO so what if it belongs to the user (true) and has tracks in it? We cant differentiate whether it belongs to the user and theres tracks in it or not?
 * @param trackItem
 * @returns boolean
 */
export async function isUserPlaylist(trackItem) { // TODO type
    if (!trackItem) return false // TODO ???
    return await (trackItem.isCollaborative || trackItem.isOwnedBySelf || trackItem.canAdd) && trackItem.totalLength > 0; // TODO so we could still return false, even though it belongs to the user, but it contains no tracks?
}

/**
 * structure of track objects which are saved in the database
 */
export interface Track {
    uri: string
    isrc: string
    name: string
    artist: Array<string>
    duration: number
}

/**
 *  get a playlists name, original creator and playlist image ID
 * @param uri of playlist
 * @returns name of playlist and original creator as object of strings.
 * @returns "Error getting name" when fails to get information for playlistName and creator Name
 * @returns undefined for image when fails to get information
 */
export async function getPlaylistInformation(uri) {
    const metadata = await Spicetify.Platform.PlaylistAPI.getMetadata(uri)
    let playlistName = metadata?.name
    let creatorName = metadata?.owner?.displayName
    let playlistImageId
    // get playlistImage ID instead of uri
    // e.g. spotify:mosaic:foo:bar:foo:bar -> foo:bar:foo:bar
    playlistImageId = (metadata?.images[0]?.url).split(":").slice(2).join(":");
    // handle images that are from Spotify themselves and in wrong format
    if (!playlistImageId) {
        playlistImageId = (metadata?.images[0]?.url).split("/").slice(4).join("/");
    }
    // give failure feedback
    if (!playlistName) {
        console.warn("Failed to get Playlist name: ")
        console.log(metadata)
        Spicetify.showNotification("Failed to get Playlist name, please set manually")
    }
    if (!creatorName) {
        console.warn("Failed to get Playlist creator name: ")
        console.log(metadata)
        Spicetify.showNotification("Failed to get Playlist creator name, please set manually")
    }
    if (!playlistImageId) {
        console.warn("Failed to get Playlist image: ")
        console.log(metadata)
        Spicetify.showNotification("Failed to get Playlist image, please set manually")
    }
    // handle generic (not custom) image as these cant be passed and are instead auto generated by Spotify
    if ((metadata?.images[0]?.url).split(":")[1] === "mosaic") {
        playlistImageId = undefined
    }
    // handle edge case where title is an empty String
    if (playlistName === "") {
        playlistName = "Error getting name"
    }
    // handle empty creator
    if (creatorName === "") {
        creatorName = "Error getting name"
    }
    // handle empty image
    if (playlistImageId === "") {
        playlistImageId = undefined
    }
    return {
        "playlistName": playlistName ?? "Error getting name",
        "creatorName": creatorName ?? "Error getting name",
        "playlistImage": playlistImageId
    }
}

/**
 * check if track object is in database
 * @param trackObject
 * @returns true if the isrc is in the database
 */
export async function compareIsrc(trackObject) {
    const localUri = trackObject?.uri
    const localIsrc = trackObject?.isrc
    // check if needed values exist
    if (!localUri || !localIsrc) return false
    const databaseTrackObject = await db.webTracks.get(localUri)
    // check if needed trackObject exists
    if (!databaseTrackObject?.isrc) return false
    return databaseTrackObject.isrc === localIsrc
}

/**
 * context menu
 */
export const contextMenu = new Spicetify.ContextMenu.Item(
    "Generate filtered playlist",
    onPlaylistContextMenu,
    (uri) => Spicetify.URI.fromString(uri[0]).type == Spicetify.URI.Type.PLAYLIST_V2,
    "enhance",
    false,
)

/**
 * triggered on context menu; starts the comparing process
 * @param uris of playlist
 */
export async function onPlaylistContextMenu(uris) {
    // remove function to call this again while processing
    contextMenu.deregister()
    // check uris
    if (!uris) {
        console.log("Event failed to get the Playlist")
        Spicetify.showNotification("Event failed to get the Playlist")
        contextMenu.register()
        return
    }
    const trackUrisToAdd = []
    for (const playlistUri of uris) {
        // get tracks that have to be compared to the database
        const tracksToCompare = await getTracksFromContextMenu(playlistUri)
        // handle error
        if (!tracksToCompare) {
            console.log("Unable to fetch Tracks of this playlist.")
            console.log("Tracks to Compare to: " + tracksToCompare)
            Spicetify.showNotification("Unable to fetch Tracks of this playlist, please retry")
            contextMenu.register()
            return
        }
        Spicetify.showNotification("Processing, please wait")
        // variable for time indication
        let i = 0
        // compare playlist and map/ database
        for (const trackUri of tracksToCompare) {
            // compare uri to map
            if (counter.has(trackUri)) continue
            // compare isrc of Track to database
            const trackObject = await getTrackObject(trackUri)
            if (await compareIsrc(trackObject)) continue
            // store track to add
            trackUrisToAdd.push(trackUri)
            // give rough time indicators
            i++
            if (Math.floor(tracksToCompare.length / 4) === i) Spicetify.showNotification("1/4 of tracks processed")
            if (Math.floor(tracksToCompare.length / 2) === i) Spicetify.showNotification("1/2 of tracks processed")
            if (Math.floor(tracksToCompare.length / 4) * 3 === i) Spicetify.showNotification("3/4 of tracks processed")
        }
        // handle case where the new playlist would be empty
        if (trackUrisToAdd.length <= 0) {
            // add context menu back
            contextMenu.register()
            // finish operation
            console.log("You already know all tracks")
            Spicetify.showNotification("You already know all tracks")
            return
        }
        // create playlist
        const playlistInfo = await getPlaylistInformation(playlistUri)
        const playlistName = playlistInfo.playlistName
        const createdPlaylistUri = await createNewPlaylist(playlistName)
        // add Tracks to playlist
        addTracksToPlaylist(createdPlaylistUri, trackUrisToAdd)
        // create description text
        const creatorName = playlistInfo.creatorName
        const playlistImage = playlistInfo.playlistImage
        let description = "Original playlist from: " + creatorName + " | Playlist created via a Spicetify extension developed by Franz3"
        // change description of playlist
        // no image
        if (!playlistImage) {
            await Spicetify.Platform.PlaylistAPI.setAttributes(createdPlaylistUri,
                {"description": description})
        } else {
            // with image
            await Spicetify.Platform.PlaylistAPI.setAttributes(createdPlaylistUri,
                {"description": description, "picture": playlistImage})
        }
        // change playlist location
        const folderUri = await getFolder("New Songs")
        if (!folderUri) return
        await movePlaylist(createdPlaylistUri, folderUri)
    }
    // add context menu back
    contextMenu.register()
    // finish operation
    console.log("Operation complete")
    Spicetify.showNotification("Operation complete, have fun")
}

/**
 * move playlist to specified folder
 * @param playlistUri
 * @param folderUri
 */
export async function movePlaylist(playlistUri, folderUri) {
    if (!playlistUri || !folderUri) {
        console.warn("Playlist couldn't be moved")

        return
    }
    await Spicetify.Platform.RootlistAPI.move({"uri": playlistUri}, {"after": {"uri": folderUri}})
}

/**
 * returns uri of first folder in your root library matching with parameter
 * @param folderName
 * @returns uri of folder or undefined
 */
export async function getFolder(folderName) {
    if (!folderName) return
    // get root content
    const content = await Spicetify.Platform.RootlistAPI.getContents()
    const items = content?.items
    if (!items) {
        console.warn("Error getting Folders")
        Spicetify.showNotification("Error getting Folders")
        return
    }
    // check if folder exists
    for (const item of items) {
        if (item.type !== "folder") continue
        if (item.name === folderName) return item.uri
    }
    // create folder if not
    const createdFolder = await Spicetify.Platform.RootlistAPI.createFolder(folderName, "")
    if (!createdFolder?.uri) {
        console.warn("Error creating Folder")
        Spicetify.showNotification("Error creating Folder")
        return
    }
    return createdFolder.uri
}

/**
 * implementation of CosmosAsync with longer timeout and 3 retries when it fails
 * @param url
 * @param recursiveCounter
 */
export async function customFetch(url, recursiveCounter = 0) { // TODO please.. no.. recursion
    // set timeout to 30 seconds
    const timeout = 1000 * 20
    const urlObj = new URL(url);
    const isSpClientAPI = urlObj.hostname.includes("spotify.com") && urlObj.hostname.includes("spclient");
    const isWebAPI = urlObj.hostname === "api.spotify.com";
    const Authorization = `Bearer ${Spicetify.Platform.AuthorizationAPI.getState().token.accessToken}`;
    let injectedHeaders = {};
    if (isWebAPI) injectedHeaders = {Authorization};
    if (isSpClientAPI) {
        injectedHeaders = {
            Authorization,
            "Spotify-App-Version": Spicetify.Platform.version,
            "App-Platform": Spicetify.Platform.PlatformData.app_platform
        };
    }
    const requestOptions = {
        method: "GET",
        headers: injectedHeaders
    }
    // send api request
    const fetchPromise = fetch(url, requestOptions)
    // make promise that will reject after timeout
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error("Request timed out"))
        }, timeout)
    })
    // return the promise
    return Promise.race([fetchPromise, timeoutPromise]).then(response => {
        // return if request is successful
        if (response.ok) {
            // wait 1 second to not spam
            setTimeout(() => {
            }, 1000)
            return response.json()
        } else {
            // try recursively three times and return undefined if request still failed
            if (recursiveCounter === 2) {
                console.warn("Error while fetching data from the Spotify API")
                return
            }
            // wait 1 second to not spam
            setTimeout(() => {
            }, 1000)
            return customFetch(url, ++recursiveCounter)
        }
    })
}