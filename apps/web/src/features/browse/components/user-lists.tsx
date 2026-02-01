"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function UserLists() {
  const router = useRouter();

  return (
    <div>
      <h1>User lists</h1>
      <Button
        onClick={() => {
          router.push(`/list/123`);
        }}
      >
        List 123
      </Button>
    </div>
  );
}
