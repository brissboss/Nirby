"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";

export function UserLists() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div>
      <h1>User lists</h1>
      {user ? (
        <Button
          onClick={() => {
            router.push(`/list/123`);
          }}
        >
          List 123
        </Button>
      ) : (
        <Button
          onClick={() => {
            router.push(`/login`);
          }}
        >
          Login
        </Button>
      )}
    </div>
  );
}
