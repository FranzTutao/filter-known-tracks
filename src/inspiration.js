// @flow
(async function listPlaylistsWithSong() {
	// create const's with attributes of Spicetify
	const {Player, Menu, LocalStorage, Platform, React: react, ReactDOM: reactDOM} = Spicetify;
	// wait till things are loaded
	if (!(Player && Menu && LocalStorage && Platform)) {
		setTimeout(listPlaylistsWithSong, 1000);
		return;
	}

	/**
	 * recursively handle folders to eventually get the playlists
	 * @param folder
	 * @returns {Promise<*[]>}
	 */
	async function recursivePlaylistFolder(folder) {
		//to get every playlist no matter how deep, thanks to elijaholmos for reminding me, else i would have forgotten it.
		let playlists = [];
		for (const playlist of folder) {
			if (playlist.type == "playlist") {
				if ((playlist.isCollaborative || playlist.isOwnedBySelf) && playlist.totalLength > 0) {
					let image;
					try {
						image = !playlist.images[0]
							? (await Spicetify.Platform.PlaylistAPI.getMetadata(playlist.uri)).images[0].url
							: playlist.images[0].url;
					} catch {
						image = "";
					}
					playlists.push({
						uri: playlist.uri,
						title: playlist.name,
						desc: playlist.description,
						isCollab: playlist.isCollaborative,
						noOfSongs: playlist.totalLength,
						created: playlist.addedAt.toLocaleString("default", {year: "numeric", month: "short", day: "numeric"}),
						image: image,
					});
				}
			} else if (playlist.type == "folder") {
				playlists.push(...(await recursivePlaylistFolder(playlist.items)));
			}
		}
		return playlists;
	}

	/**
	 * helper function to process playlists
	 * @param playlist
	 * @returns {Promise<{image: string, created: string, title, isCollab: *, noOfSongs: *, uri: *, desc: string | BufferSource}>}
	 */
	async function handlePlaylist(playlist) {
		if ((playlist.isCollaborative || playlist.isOwnedBySelf) && playlist.totalLength > 0) {
			let image;
			try {
				image = !playlist.images[0]
					? (await Spicetify.Platform.PlaylistAPI.getMetadata(playlist.uri)).images[0].url
					: playlist.images[0].url;
			} catch {
				image = "";
			}
			return {
				uri: playlist.uri,
				title: playlist.name,
				desc: playlist.description,
				isCollab: playlist.isCollaborative,
				noOfSongs: playlist.totalLength,
				created: playlist.addedAt.toLocaleString("default", {year: "numeric", month: "short", day: "numeric"}),
				image: image,
			};
		}
	}

	/**
	 * get all playlists belonging to the user
	 * @returns array of playlists to be checked
	 */
	async function getUserLibrary() {
		let playlistsToCheck = Array();
		const userContents = await Spicetify.Platform.RootlistAPI.getContents();
		for (const playlist of userContents.items) {
			if (playlist.type == "playlist") {
				playlistsToCheck.push(...(await handlePlaylist(playlist)));
			} else if (playlist.type == "folder") {
				playlistsToCheck.push(...(await recursivePlaylistFolder(playlist.items)));
			}
		}
		return playlistsToCheck;
	}

	async function checkPlaylist(playlist, songUri) {
		var songFound = false;
		let addedAtDate;
		const tracks = await Spicetify.Platform.PlaylistAPI.getContents(playlist.uri);
		for (var i = 0; i < tracks.items.length; i++) {
			if (tracks.items[i].uri == songUri) {
				songFound = true;
				addedAtDate = new Date(tracks.items[i].addedAt).toLocaleString("default", {year: "numeric", month: "short", day: "numeric"});
				break;
			}
		}
		if (songFound) {
			playlist.index = i + 1;
			playlist.songAddedAt = addedAtDate;
			return playlist;
		} else {
			return false;
		}
	}

	// create context menu
	new Spicetify.ContextMenu.Item(
		"List playlists with this Song",
		() => "DO SOMETHING",
		(uris) => {
			if (uris.length != 1) return false;
			return Spicetify.URI.fromString(uris[0]).type == Spicetify.URI.Type.TRACK;
		},
		"search"
	).register();
})();

