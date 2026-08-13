import { AcceptInviteView } from "@/features/lists/views/accept-invite-view";

type AcceptInvitePageProps = {
  params: Promise<{ listId: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : null;
}

export default async function AcceptInvitePage({ params, searchParams }: AcceptInvitePageProps) {
  const { listId } = await params;
  const token = firstParam((await searchParams).token);
  const query = new URLSearchParams();
  if (token) {
    query.set("token", token);
  }
  const qs = query.toString();
  const returnPath = `/list/${listId}/collaborators/accept${qs ? `?${qs}` : ""}`;

  return <AcceptInviteView listId={listId} token={token} returnPath={returnPath} />;
}
