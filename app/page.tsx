"use client";

import { useAuth } from "./context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Index() {
  const { user, logout } = useAuth();

  return (
    <div className="container mx-auto p-10 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Hello, World!</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Welcome to Lihatin</CardTitle>
          <CardDescription>
            A Next.js application with authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <p className="text-2xl font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={logout} variant="destructive">
                  Logout
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth">Auth Pages</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">You are not logged in.</p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/auth/login">Go to Login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth">Browse Auth Pages</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>Built with Next.js 15, React 19, Tailwind CSS 4, and shadcn/ui</p>
      </div>
    </div>
  )
}