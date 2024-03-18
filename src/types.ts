/**
 * structure of track objects which are saved in the database
 */
export interface TrackObject {
    uri: TrackUri
    isrc: string
    name: string
    artist: Array<string>
    duration: number
}

export type TrackUri = `spotify:track:${TrackId}` & string
export type TrackId = string
export type PlaylistUri = `spotify:playlist:${string}` & string
export type UserUri = `spotify:user:${string}` & string
export type FolderUri = `${UserUri}:folder:${string}` & string

// export type SpotifyResponse

export interface UserContents {
    type: ItemType;
    addedAt: Date;
    items: UserContentsItem[];
    name: string;
    uri: string;
    totalItemCount: number;
}

export interface UserContentsItem {
    addedAt: Date;
    type: ItemType;
    uri: PlaylistUri | FolderUri;
    name: string;
    description?: string;
    images?: Image[];
    madeFor?: null;
    owner?: Owner;
    totalLength?: number;
    unfilteredTotalLength?: number;
    totalLikes?: null;
    duration?: null;
    isLoaded?: boolean;
    isOwnedBySelf?: boolean;
    isPublished?: boolean;
    hasEpisodes?: null;
    hasSpotifyTracks?: null;
    hasSpotifyAudiobooks?: null;
    canAdd?: boolean;
    canRemove?: boolean;
    canPlay?: null;
    formatListData?: FormatListData | null;
    canReportAnnotationAbuse?: boolean;
    hasDateAdded?: boolean;
    permissions?: null;
    collaborators?: Collaborators;
    items?: FolderItems[];
}

export interface Collaborators {
    count: number;
    items: any[];
}

export interface FormatListData {
    type: string;
    attributes: FormatListDataAttributes;
}

export interface FormatListDataAttributes {
    "correlation-id"?: string;
    image_url: string;
    header_image_url_desktop: string;
    "recs.hasArtists"?: string;
    primary_color: string;
    mediaListConfig?: string;
    moveFollowersJobId?: string;
    episode_description?: string;
    isAlgotorial?: string;
    status: string;
    uri?: string;
    request_id?: string;
    controls_show_count?: string;
    "shuffle.algorithm"?: string;
    controls_show_images?: string;
    "madeFor.displayed"?: string;
    "madeFor.username"?: string;
    controls_show_names?: string;
    customize_url?: string;
    temporary_hack_prefer_linear_playback?: string;
    regularly_updated?: string;
    "always-on-demand"?: string;
}

export interface Image {
    url: string;
    label: Label;
}

export enum Label {
    Large = "large",
    Small = "small",
    Standard = "standard",
    Xlarge = "xlarge",
}

export interface FluffyItem {
    addedAt: Date;
    type: ItemType;
    uri: string;
    name: string;
    description?: string;
    images?: Image[];
    madeFor?: null;
    owner?: Owner;
    totalLength?: number;
    unfilteredTotalLength?: number;
    totalLikes?: null;
    duration?: null;
    isLoaded?: boolean;
    isOwnedBySelf?: boolean;
    isPublished?: boolean;
    hasEpisodes?: null;
    hasSpotifyTracks?: null;
    hasSpotifyAudiobooks?: null;
    canAdd?: boolean;
    canRemove?: boolean;
    canPlay?: null;
    formatListData?: TentacledFormatListData | null;
    canReportAnnotationAbuse?: boolean;
    hasDateAdded?: boolean;
    permissions?: null;
    collaborators?: Collaborators;
    items?: FolderItems[];
}

export interface FolderItems {
    type: ItemType;
    addedAt: Date;
    items?: FluffyItem[];
    name: string;
    uri: string;
    description?: string;
    images?: Image[];
    madeFor?: null;
    owner?: Owner;
    totalLength?: number;
    unfilteredTotalLength?: number;
    totalLikes?: null;
    duration?: null;
    isLoaded?: boolean;
    isOwnedBySelf?: boolean;
    isPublished?: boolean;
    hasEpisodes?: null;
    hasSpotifyTracks?: null;
    hasSpotifyAudiobooks?: null;
    canAdd?: boolean;
    canRemove?: boolean;
    canPlay?: null;
    formatListData?: FluffyFormatListData | null;
    canReportAnnotationAbuse?: boolean;
    hasDateAdded?: boolean;
    permissions?: null;
    collaborators?: Collaborators;
}

export interface TentacledFormatListData {
    type: string;
    attributes: TentacledAttributes;
}

export interface TentacledAttributes {
    mediaListConfig: string;
    request_id: string;
    uri: string;
    status: string;
    isAlgotorial: string;
    primary_color: string;
    "recs.hasArtists": string;
    autoplay: string;
    "correlation-id": string;
    moveFollowersJobId?: string;
    episode_description?: string;
    header_image_url_desktop?: string;
    image_url?: string;
}

export interface Owner {
    type: string;
    uri: string;
    username: string;
    displayName: string;
    images: any[];
}

export enum ItemType {
    Folder = "folder",
    Playlist = "playlist",
}

export interface FluffyFormatListData {
    type: string;
    attributes: FluffyAttributes;
}

export interface FluffyAttributes {
    artistGid: string;
    translatedArtistName: string;
}

// ------------------------------------------
export interface SpotifyTrack {
    tracks: Track[];
}

export interface Track {
    album: Album;
    artists: Artist[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: ExternalIDS;
    external_urls: ExternalUrls;
    href: string;
    id: string;
    is_local: boolean;
    name: string;
    popularity: number;
    preview_url: string;
    track_number: number;
    type: string;
    uri: string;
}

export interface Album {
    album_type: string;
    artists: Artist[];
    available_markets: string[];
    external_urls: ExternalUrls;
    href: string;
    id: string;
    images: TrackImage[];
    name: string;
    release_date: Date;
    release_date_precision: string;
    total_tracks: number;
    type: string;
    uri: string;
}

export interface Artist {
    external_urls: ExternalUrls;
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

export interface ExternalUrls {
    spotify: string;
}

export interface TrackImage {
    height: number;
    url: string;
    width: number;
}

export interface ExternalIDS {
    isrc: string;
}

// ---------------------------------
export interface TrackEvent {
    defaultPrevented: boolean;
    immediateStopped: boolean;
    stopped: boolean;
    type: string;
    data: TrackEventData;
}

export interface TrackEventData {
    operation: string;
    uri: PlaylistUri;
    uris?: TrackUri[];
    items?: TrackEventDataItem[];
    error: null;
}

export interface TrackEventDataItem {
    uri: TrackUri;
    uid: string;
}

// -------------------------------------

export interface PlaylistEvent {
    defaultPrevented: boolean;
    immediateStopped: boolean;
    stopped: boolean;
    type: string;
    data: PlaylistEventData;
}

export interface PlaylistEventData {
    operation: string;
    items: PlaylistEventDataItem[];
    error: null;
}

export interface PlaylistEventDataItem {
    uri: PlaylistUri;
}

// ---------------------------------------

export interface LikedEvent {
    defaultPrevented: boolean;
    immediateStopped: boolean;
    stopped: boolean;
    type: string;
    data: LikedEventData;
}

export interface LikedEventData {
    operation: string;
    uris: TrackUri[];
    error: null;
    silent: boolean;
}

// ----------------------------------------------

export interface Playlist {
    metadata: Metadata;
    contents: PlaylistContents;
}

export interface PlaylistContents {
    items:       PlaylistContentsItem[];
    offset:      number;
    limit:       number;
    totalLength: number;
}

export interface PlaylistContentsItem {
    uid:                  string;
    playIndex:            null;
    addedAt:              Date;
    addedBy:              Owner;
    formatListAttributes: FormatListAttributes;
    type:                 ItemType;
    uri:                  string;
    name:                 string;
    album:                Album;
    artists:              Artist[];
    discNumber:           number;
    trackNumber:          number;
    duration:             ItemDuration;
    isExplicit:           boolean;
    isLocal:              boolean;
    isPlayable:           boolean;
    is19PlusOnly:         boolean;
    hasAssociatedVideo:   boolean;
}

export interface Owner {
    type:        string;
    uri:         UserUri;
    username:    string;
    displayName: string;
    images:      Image[];
}

export interface Album {
    type:   AlbumType;
    uri:    string;
    name:   string;
    artist: Artist;
    images: Image[];
}

export interface Artist {
    type: ArtistType;
    uri:  string;
    name: string;
}

export enum ArtistType {
    Artist = "artist",
}

export enum AlbumType {
    Album = "album",
}

export interface ItemDuration {
    milliseconds: number;
}

export interface FormatListAttributes {
}

export enum ItemType {
    Track = "track",
}

export interface Metadata {
    type:                     string;
    uri:                      string;
    name:                     string;
    description:              string;
    images:                   Image[];
    madeFor:                  null;
    owner:                    Owner;
    totalLength:              number;
    unfilteredTotalLength:    number;
    totalLikes:               number;
    duration:                 MetadataDuration;
    isLoaded:                 boolean;
    isOwnedBySelf:            boolean;
    isPublished:              boolean;
    hasEpisodes:              boolean;
    hasSpotifyTracks:         boolean;
    hasSpotifyAudiobooks:     boolean;
    canAdd:                   boolean;
    canRemove:                boolean;
    canPlay:                  boolean;
    formatListData:           null;
    canReportAnnotationAbuse: boolean;
    hasDateAdded:             boolean;
    permissions:              Permissions;
    collaborators:            Collaborators;
}

export interface MetadataDuration {
    milliseconds: number;
    isEstimate:   boolean;
}

export interface Permissions {
    canView:                    boolean;
    canAdministratePermissions: boolean;
    canCancelMembership:        boolean;
    isPrivate:                  boolean;
}