/**
 * Shared query-string keys for app-shell, profile, and lists navigation.
 *
 * Keep param names here so features do not duplicate literals or create
 * circular imports between `app-shell`, `profile`, and `lists`. Builders such as
 * `buildShellViewSearchParams`, `buildProfileSectionSearchParams`, and
 * `buildListsNavigationSearchParams` should import these constants rather than
 * defining their own.
 *
 * @example
 * // Shell tab: default view omits the param
 * // / → explore
 * // /?view=profile → profile
 *
 * @example
 * // Profile subsection (only meaningful when shell view is profile)
 * // /?view=profile&section=info
 *
 * @example
 * // Lists detail deep-link (only meaningful when shell view is lists)
 * // /?view=lists&listId=abc123
 */
export const SHELL_VIEW_PARAM = "view";

/**
 * Profile subsection key (`hub` is represented by omitting this param).
 *
 * When the shell leaves the profile view, builders should remove this param
 * from the URL (see `buildShellViewSearchParams`).
 */
export const PROFILE_SECTION_PARAM = "section";

/**
 * Lists detail key (index is represented by omitting this param).
 *
 * When the shell leaves the lists view, builders should remove this param
 * from the URL (see `buildShellViewSearchParams`).
 */
export const LIST_ID_PARAM = "listId";

/** Mobile shell map-focus mode (`?mapMode=1` when the bottom sheet is collapsed). */
export const SHELL_MAP_MODE_PARAM = "mapMode";
