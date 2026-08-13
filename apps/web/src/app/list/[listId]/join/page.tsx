import { JoinListView } from "@/features/lists/views/join-list-view";

type JoinListPageProps = {
  params: Promise<{ listId: string }>;
  searchParams: Promise<{ editToken?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : null;
}

export default async function JoinListPage({ params, searchParams }: JoinListPageProps) {
  const { listId } = await params;
  const editToken = firstParam((await searchParams).editToken);
  const query = new URLSearchParams();
  if (editToken) {
    query.set("editToken", editToken);
  }
  const qs = query.toString();
  const returnPath = `/list/${listId}/join${qs ? `?${qs}` : ""}`;

  return <JoinListView editToken={editToken} returnPath={returnPath} />;
}
