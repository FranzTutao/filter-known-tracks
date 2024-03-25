import {SettingsSection} from "spcr-settings";

enum Setting {
    welcomeUserToggle = "welcome-user-toggle",
    welcomeUserName = "welcome-user-name",
    playlistDescription = "playlist-description",
    folderName = "folder-name",
    selfOwnedToggle = "self-owned-toggle"
}

/**
 * get user defined settings
 */
export class Settings {
    settings = new SettingsSection("Filter known tracks", "filter-known-tracks-settings");
    constructor() {
        // welcome message
        this.settings.addToggle(Setting.welcomeUserToggle, "Cute little welcome message", false);
        this.settings.addInput(Setting.welcomeUserName, "Name for the welcome message", "Your Name");
        // playlist description
        const defaultValue = "Original playlist from: {creatorName} | Playlist created via a Spicetify extension developed by Franz3"
        this.settings.addInput(Setting.playlistDescription, "Description of the playlist created", defaultValue);
        // folder name
        this.settings.addInput(Setting.folderName, "Name of the folder where playlists will be saved in", "New Songs");
        // self owned playlists
        this.settings.addToggle(Setting.selfOwnedToggle, "Filter to only count self-owned playlists", true);
        // save settings
        this.saveSettings()
    }

    /**
     * save the settings structure after creating it
     */
    saveSettings () {
        this.settings.pushSettings().then().catch(error => {
            console.error("Error saving the Settings: ", error)
        })
    }

    /**
     * check if user wants a welcome message
     * @returns boolean
     */
    isWelcomeUserToggled () {
        return this.settings.getFieldValue(Setting.welcomeUserToggle) as boolean
    }

    /**
     * get the username for welcome message
     * @returns userName
     */
    getWelcomeUserName () {
        return this.settings.getFieldValue(Setting.welcomeUserName) as string
    }

    /**
     * get text that will be the description of the newly created playlist
     * {creatorName} being a placeholder for the artistName passed
     * @param artistName
     * @returns playlistDescription
     */
    getPlaylistDescription(artistName : string) {
        const description = this.settings.getFieldValue(Setting.playlistDescription) as string
        return description.replace("{creatorName}", artistName)
    }

    /**
     * get name of folder where playlists get saved to
     * @returns folderName
     */
    getFolderName() {
        return this.settings.getFieldValue(Setting.folderName) as string
    }
    isSelfOwnedToggled () {
        return this.settings.getFieldValue(Setting.selfOwnedToggle) as boolean
    }
}