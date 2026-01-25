import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppPage() {
  return (
    <div>
      <h1>Sidebar content</h1>
      <Link href="/app/lists/123">
        <Button variant="outline">Go to list 123</Button>
      </Link>
      <Link href="/app/lists/123/items/123">
        <Button variant="outline">Go to item 123</Button>
      </Link>
    </div>
  );
}
