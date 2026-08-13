import { SharedListView } from "@/features/lists/views/shared-list-view";

type SharedListPageProps = {
  params: Promise<{ shareToken: string }>;
};

export default async function SharedListPage({ params }: SharedListPageProps) {
  const { shareToken } = await params;

  return <SharedListView shareToken={shareToken} />;
}
