/**
 * Shared query-string keys for app-shell and profile navigation.
 *
 * Keep param names here so features do not duplicate literals or create
 * circular imports between `app-shell` and `profile`. Builders such as
 * `buildShellViewSearchParams` and `buildProfileSectionSearchParams` should
 * import these constants rather than defining their own.
 *
 * @example
 * // Shell tab: default view omits the param
 * // /map → explore
 * // /map?view=profile → profile
 *
 * @example
 * // Profile subsection (only meaningful when shell view is profile)
 * // /map?view=profile&section=info
 */
export const SHELL_VIEW_PARAM = "view";

/**
 * Profile subsection key (`hub` is represented by omitting this param).
 *
 * When the shell leaves the profile view, builders should remove this param
 * from the URL (see `buildShellViewSearchParams`).
 */
export const PROFILE_SECTION_PARAM = "section";

/** Mobile shell map-focus mode (`?mapMode=1` when the bottom sheet is collapsed). */
export const SHELL_MAP_MODE_PARAM = "mapMode";
