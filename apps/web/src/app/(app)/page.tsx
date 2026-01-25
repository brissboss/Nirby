"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function AppPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div className="">Loading...</div>;
  }

  if (user) {
    router.push("/app");
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p>Not logged in</p>
      <Button onClick={() => router.push("/login")}>Login</Button>
    </div>
  );
}
