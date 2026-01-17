"use client";
import { ArrowRight, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 mb-2">
            <Image src="/favicon.ico" alt="Nirby" width={25} height={25} />{" "}
            <span className="text-2xl font-bold">Nirby</span>
          </CardTitle>
          <CardDescription>
            <p>
              Welcome to Nirby! Discover and share your favorite places with ease.{" "}
              <Link href="/lists" className="inline-flex items-center text-primary">
                Explore lists <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </p>
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="default" onClick={handleLogout}>
            Logout
          </Button>
          <Button variant="default" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
