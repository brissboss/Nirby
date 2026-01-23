"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function AppPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div className="">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p>Not logged in</p>
        <Button onClick={() => router.push("/login")}>Login</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p>Logged in as {user.email}</p>
      <Button onClick={() => logout()}>Logout</Button>
    </div>
  );
}
