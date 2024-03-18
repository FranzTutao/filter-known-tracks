import {counter, db} from "./database.js";
import {FolderUri, PlaylistUri, SpotifyTrack, TrackId, TrackObject, TrackUri} from "./types.js";

/**
 * get trackObjects using their uri
 * @param uris as TrackUri[]
 * @returns TrackObject[]
 */
// TODO please type parameters
export async function getTrackObject(uris: TrackUri | TrackUri[]) {
    if (uris.length <= 0) {
        console.log("Uri passed to getTrackObject is faulty: " + uris)
        Spicetify.showNotification("Uri passed to getTrackObject is faulty")
        return null
    }
    // handle both Array and string by making string an Array
    const urisArray = Array.isArray(uris) ? uris : [uris];
    // store trackId's using uris as a Set because they are needed for the request and shouldn't duplicate
    const trackIds: Set<TrackId> = new Set
    const trackObjects: TrackObject[] = []
    // store promises to allow asynchronous fetching
    const promises = []
    for (const uri of urisArray) {
        const trackId: TrackId = uri.split(":")[2];
        if (trackId) trackIds.add(trackId)
    }
    // split into 50 chunks seperated by a comma for the api request as 50 is the maximum it takes
    for (let i = 0; i < trackIds.size; i += 50) {
        const formattedTrackIds = [...trackIds].slice(i, i + 50).join(",")
        promises.push(customFetch(new URL(`https://api.spotify.com/v1/tracks?ids=${formattedTrackIds}`)))
    }
    const bulkResponse = await Promise.all(promises)
    // TODO() handle faulty bulkResponse
    if (bulkResponse.length <= 0) {
        console.warn("Empty bulk api response")
        return null
    }
    for (const response of bulkResponse) {
        if (response?.tracks.length <= 0) {
            console.log("response tracks array is empty")
            continue
        }
        const trackObject = await makeTrackObject(response?.tracks)
        if (trackObject?.length >= 1) trackObjects.push(...trackObject);
    }
    return trackObjects.flat()
}

/**
 * converts track api response to a track object
 * @param responses spotify api response
 * @return trackObject or null
 */
export async function makeTrackObject(responses) {
    const trackObjects = []
    // make response always an array
    const objects = Array.isArray(responses) ? responses : [responses]; // TODO ?????
    for (const response of objects) {
        if (!response) return
        if (!response?.uri || !response?.external_ids?.isrc ||
            !response?.name || !response?.artists || !response?.duration_ms) {
            console.log("Error while getting TrackObject: ")
            console.log(response)
            Spicetify.showNotification("Error while getting TrackObject")
            if (response?.uri) {
                counter.delete(response.uri)
            }
            continue
        }
        // get artist name as string[]
        const artists: Array<string> = []
        for (const artist of response.artists) {
            artists.push(artist.name)
        }
        // create and return track object
        const trackObject: TrackObject = {
            uri: response.uri,
            isrc: response.external_ids.isrc,
            name: response.name,
            artist: artists,
            duration: response.duration_ms
        }
        trackObjects.push(trackObject)
    }
    if (trackObjects.length <= 0) return null
    return trackObjects
}

/**
 * create new playlist at root folder
 * @param name
 * @returns uri of created playlist
 */
export async function createNewPlaylist(name: string) {
    return await Spicetify.Platform.RootlistAPI.createPlaylist(name, "", "");
}

/**
 *  add tracks to playlist (duplicates are only added once)
 * @param playlistUri
 * @param trackUris
 */
export function addTracksToPlaylist(playlistUri: PlaylistUri, trackUris: TrackUri[]) {
    // remove duplicates
    const uniqueTrackUris: TrackUri[] = [...new Set(trackUris)].flat();
    // check if it has tracks in it
    if (uniqueTrackUris.length <= 0) {
        Spicetify.showNotification("No tracks to add to playlist found")
        console.log("No tracks to add to playlist found")
        return
    }
    // add to specified playlist
    Spicetify.Platform.PlaylistAPI.add(playlistUri, uniqueTrackUris, {});
}

/**
 * get tracks from context menu
 * @param playlistUris
 * @returns uris as Array or null
 */
export async function getTracksFromContextMenu(playlistUris: PlaylistUri) {
    // get uris of tracks from playlist
    const uris = await getTracksFromPlaylist(playlistUris);
    // remove undefined entries and return Array?
    if (uris.length >= 1) {
        return uris
    }
    return null
}

/**
 * returns all track uris from the inputted playlist
 * @param playlistUri from playlist
 * @return uris of tracks as Array
 */
export async function getTracksFromPlaylist(playlistUri: PlaylistUri) {
    const trackObject = await Spicetify.Platform.PlaylistAPI.getContents(playlistUri);
    const uris = []
    for (const item of trackObject.items) {
        uris.push(item.uri)
    }
    return uris;
}

/**
 * check if the provided playlist belongs to the user (true) or not (false) and has tracks in it
 * @param item (either playlistItem or playlist uri)
 * @returns boolean
 */
export async function isUserPlaylist(item: object | PlaylistUri): Promise<boolean> {
    // store the playlistItem
    const playlistItem = typeof item !== "string" ? item :
        await Spicetify.Platform.PlaylistAPI.getPlaylist(item).then(response => response.metadata);
    return await (playlistItem.isCollaborative || playlistItem.isOwnedBySelf || playlistItem.canAdd) && playlistItem.totalLength > 0;
}

/**
 *  get a playlists name, original creator and playlist image ID
 * @param playlistUri of playlist
 * @returns name of playlist and original creator as object of strings.
 * @returns "Error getting name" when fails to get information for playlistName and creator Name
 * @returns undefined for image when fails to get information
 */
export async function getPlaylistInformation(playlistUri: PlaylistUri) {
    const metadata = await Spicetify.Platform.PlaylistAPI.getMetadata(playlistUri)
    let playlistName: string | undefined = metadata?.name
    let creatorName: string | undefined = metadata?.owner?.displayName
    let playlistImageId: string | undefined
    // get playlistImage ID instead of uri
    // e.g. spotify:mosaic:foo:bar:foo:bar -> foo:bar:foo:bar
    playlistImageId = (metadata?.images[0]?.url).split(":").slice(2).join(":");
    // handle images that are from Spotify themselves and in wrong format
    if (!playlistImageId) {
        playlistImageId = (metadata?.images[0]?.url).split("/").slice(4).join("/");
    }
    // give failure feedback
    if (!playlistName) {
        console.log("Failed to get Playlist name: ")
        console.log(metadata)
        Spicetify.showNotification("Failed to get Playlist name, please set manually")
    }
    if (!creatorName) {
        console.log("Failed to get Playlist creator name: ")
        console.log(metadata)
        Spicetify.showNotification("Failed to get Playlist creator name, please set manually")
    }
    if (!playlistImageId) {
        console.log("Failed to get Playlist image: ")
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
export async function compareIsrc(trackObject: TrackObject) {
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
 * context menu for playlists
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
 * @param playlistUris
 */
export async function onPlaylistContextMenu(playlistUris: string[]) {
    // assert PlaylistUri as type
    const typedPlaylistUri = playlistUris as PlaylistUri[]
    // remove function to call this again while processing
    contextMenu.deregister()
    // check uris
    if (typedPlaylistUri.length <= 0) {
        console.log("Event failed to get the Playlist")
        Spicetify.showNotification("Event failed to get the Playlist")
        contextMenu.register()
        return
    }
    // loop through it as uris could be more than only one
    for (const playlistUri of typedPlaylistUri) {
        // get tracks that have to be compared to the database
        const tracksToCompare = await getTracksFromContextMenu(playlistUri)
        // handle error
        if (!tracksToCompare || tracksToCompare.length <= 0) {
            console.log("Unable to fetch Tracks of this playlist.")
            console.log("Tracks to Compare to: " + tracksToCompare)
            Spicetify.showNotification("Unable to fetch Tracks of this playlist, please retry")
            contextMenu.register()
            return
        }
        Spicetify.showNotification("Processing, please wait")
        let trackUrisToAdd: TrackUri[]
        const userPlaylist = await isUserPlaylist(playlistUri)
        if (userPlaylist) {
            // compare foreign playlist
            trackUrisToAdd = await compareForSelfOwnedPlaylist(tracksToCompare)
        } else {
            // compare self owned playlist
            trackUrisToAdd = await compareForForeignPlaylist(tracksToCompare)
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
        const folderUri: FolderUri = await getFolder("New Songs")
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
export async function movePlaylist(playlistUri: PlaylistUri, folderUri: FolderUri) {
    if (!playlistUri || !folderUri) {
        console.log("Playlist couldn't be moved")

        return
    }
    await Spicetify.Platform.RootlistAPI.move({"uri": playlistUri}, {"after": {"uri": folderUri}})
}

/**
 * returns uri of first folder in your root library matching with parameter
 * @param folderName
 * @returns uri of folder or undefined
 */
export async function getFolder(folderName: string) {
    if (!folderName) return
    // get root content
    const content = await Spicetify.Platform.RootlistAPI.getContents()
    const items = content?.items
    if (!items || items.length <= 0) {
        console.log("Error getting Folders")
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
        console.log("Error creating Folder")
        Spicetify.showNotification("Error creating Folder")
        return
    }
    return createdFolder.uri
}

/**
 * implementation of CosmosAsync with longer timeout and 3 retries when it fails
 * @param url
 *
 */
export async function customFetch(url: URL) {
    // set timeout after 20 seconds
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
    // try three times
    for (let i = 0; i <= 2; i++) {
        try {
            const response = await Promise.race([
                fetch(url.toString(), requestOptions),
                new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error("RequestTimedOut"))
                    }, timeout)
                })
            ]);
            if (response.ok) {
                const spotifyResponse = await response.json() as SpotifyTrack;
                if (spotifyResponse.tracks) {
                    return spotifyResponse;
                }
            }
        } catch (error: unknown) {
            if (typeof error === "string") {
                console.log("Error occurred: " + error)
            } else if (error instanceof Error) {
                console.log("Error occurred:", error.message);
            }
        }
    }
}

/**
 * compare tracks when coming from a foreign playlist
 * @param tracksToCompare
 * @returns null or Array of uri's
 */
async function compareForForeignPlaylist(tracksToCompare: TrackUri[]) {
    const trackUrisToAdd: TrackUri[] = []
    // variable for time indication
    let i = 0
    // compare playlist and map/ database
    for (const trackUri of tracksToCompare) {
        // compare uri to map
        if (counter.has(trackUri)) continue
        // compare isrc of Track to database
        const trackObject: null | TrackObject = await getTrackObject(trackUri)
        if (await compareIsrc(trackObject)) continue
        // store track to add
        trackUrisToAdd.push(trackUri)
        // give rough time indicators
        i++
        if (Math.floor(tracksToCompare.length / 4) === i) Spicetify.showNotification("1/4 of tracks processed")
        if (Math.floor(tracksToCompare.length / 2) === i) Spicetify.showNotification("1/2 of tracks processed")
        if (Math.floor(tracksToCompare.length / 4) * 3 === i) Spicetify.showNotification("3/4 of tracks processed")
    }
    return trackUrisToAdd
}

/**
 * compare tracks when coming from a self owned playlist (only compares uri, not isrc)
 * @param tracksToCompare
 * @returns Array of uri's to add
 */
async function compareForSelfOwnedPlaylist(tracksToCompare: TrackUri[]) {
    const trackUrisToAdd: TrackUri[] = []
    // variable for time indication
    let i = 0
    // compare playlist and map/ database
    for (const trackUri of tracksToCompare) {
        // compare uri to map (if we got it two times in map we will skip it)
        if (!(counter.get(trackUri) <= 1)) continue
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
    return trackUrisToAdd
}