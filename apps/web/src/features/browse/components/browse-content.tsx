import { SearchBar, UserLists } from "@/features/browse";

export function BrowseContent() {
  return (
    <div className="flex flex-col gap-2 px-4 py-2 md:py-4">
      {/* Search input */}
      <div>
        <SearchBar />
      </div>
      {/* Users lists */}
      <div>
        <UserLists />
      </div>
    </div>
  );
}
