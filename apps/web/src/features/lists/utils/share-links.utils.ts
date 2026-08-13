/** Builds the public read-only share URL for a list. */
export function buildShareUrl(origin: string, shareToken: string): string {
  return `${origin}/shared/${shareToken}`;
}

/** Builds the edit-invite join URL for a list. */
export function buildEditLinkUrl(origin: string, listId: string, editToken: string): string {
  return `${origin}/list/${listId}/join?editToken=${editToken}`;
}
