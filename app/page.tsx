"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IconLink, IconChartBar, IconLock, IconBolt, IconArrowRight, IconCheck, IconCopy } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createShortLink } from "@/lib/api/shortlinks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Index() {
  const router = useRouter();
  const [demoUrl, setDemoUrl] = useState("");
  const [demoAlias, setDemoAlias] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdShortCode, setCreatedShortCode] = useState<string | null>(null);

  const sanitizedAlias = demoAlias
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const previewCode = sanitizedAlias || "your-custom-code";
  const previewShortURL = `lihat.in/${previewCode}`;
  const createdShortURL = createdShortCode ? `lihat.in/${createdShortCode}` : null;

  const handleTryCreateLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedURL = demoUrl.trim();
    if (!trimmedURL || isCreating) {
      return;
    }

    setIsCreating(true);
    setCreatedShortCode(null);
    try {
      const response = await createShortLink({
        is_bulky: false,
        links: [
          {
            original_url: trimmedURL,
            custom_code: sanitizedAlias || undefined,
            title: "Landing page quick link",
          },
        ],
      });

      if (!response.success || !response.data?.short_code) {
        const message = response.message || "Failed to create short link.";
        throw new Error(message);
      }

      setCreatedShortCode(response.data.short_code);
      toast.success("Short link created", {
        description: `Your link is ready: lihat.in/${response.data.short_code}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create short link.";
      const lowered = message.toLowerCase();
      if (
        lowered.includes("unauthorized") ||
        lowered.includes("session") ||
        lowered.includes("login") ||
        lowered.includes("forbidden")
      ) {
        toast.error("Please sign in first", {
          description: "You need an account to create short links.",
        });
        router.push("/auth/login?redirect=/main/links");
      } else {
        toast.error("Failed to create link", {
          description: message,
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCreatedLink = async () => {
    if (!createdShortURL) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdShortURL);
      toast.success("Copied", {
        description: "Short link copied to clipboard.",
      });
    } catch {
      toast.error("Copy failed", {
        description: "Unable to copy short link.",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex shrink-0">
            <Link href="/" className="flex items-center gap-2" aria-label="Lihatin home">
              <Image
                src="/logo.svg"
                alt="Lihatin logo"
                width={35}
                height={35}
                className="size-8 rounded-sm sm:size-[35px]"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center justify-end">
            <nav className="flex items-center gap-1 sm:gap-2" aria-label="Account navigation">
              <Button variant="ghost" size="sm" className="px-2.5 sm:px-3" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button size="sm" className="px-3 sm:px-4" asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center sm:px-6">
          <Badge variant="outline" className="">
            🚀 Free & Open Source
          </Badge>
          <h1 className="text-3xl font-bold leading-tight tracking-tight min-[380px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
            Shorten Links,
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Track Everything
            </span>
          </h1>
          <p className="max-w-[42rem] text-base leading-7 text-muted-foreground sm:text-lg md:text-xl">
            Create short links, track clicks, analyze traffic. All the tools you need
            to understand your audience and grow your reach.
          </p>
          <div className="mt-4 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:mt-6 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-4">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/auth/register">
                Start for Free
                <IconArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4 lg:mt-20">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Users</CardDescription>
                <CardTitle className="text-3xl font-bold">1,000+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Growing every day</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Links Created</CardDescription>
                <CardTitle className="text-3xl font-bold">50K+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">And counting</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Clicks</CardDescription>
                <CardTitle className="text-3xl font-bold">2M+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Tracked & analyzed</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Try Create Link Section */}
      <section className="pb-20 md:pb-24">
        <div className="container mx-auto max-w-5xl px-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Try Feature</Badge>
                <Badge variant="outline">No credit card</Badge>
              </div>
              <CardTitle className="text-2xl sm:text-3xl">Create Your First Short Link</CardTitle>
              <CardDescription className="text-base">
                This form sends a real request to create a short link using your account session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={handleTryCreateLink}>
                <div className="space-y-2">
                  <label htmlFor="demo-url" className="text-sm font-medium">
                    Destination URL
                  </label>
                  <Input
                    id="demo-url"
                    type="url"
                    value={demoUrl}
                    onChange={(event) => setDemoUrl(event.target.value)}
                    placeholder="https://your-landing-page.com/product"
                    className="bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="demo-alias" className="text-sm font-medium">
                    Custom alias
                  </label>
                  <Input
                    id="demo-alias"
                    type="text"
                    value={demoAlias}
                    onChange={(event) => setDemoAlias(event.target.value)}
                    placeholder="my-campaign"
                    className="bg-background"
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto" disabled={!demoUrl.trim() || isCreating}>
                  {isCreating ? "Creating..." : "Create Link"}
                  <IconArrowRight className="ml-2 size-4" />
                </Button>
              </form>

              <div className="mt-4 flex flex-col items-center justify-center rounded-md border bg-background/80 px-3 py-3 text-center text-sm">
                <span className="text-muted-foreground">Preview</span>
                <span className="font-medium">{previewShortURL}</span>
              </div>

              {createdShortURL && (
                <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-3 text-center text-sm text-emerald-900">
                  <Badge variant="secondary">Created</Badge>
                  <span className="font-medium">{createdShortURL}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 border-emerald-300 bg-transparent px-2 text-emerald-900 hover:bg-emerald-100"
                    onClick={() => void handleCopyCreatedLink()}
                  >
                    <IconCopy className="mr-1 size-3.5" />
                    Copy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features to manage and analyze your short links
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <IconLink className="size-6 text-primary" />
                </div>
                <CardTitle>Custom Short Links</CardTitle>
                <CardDescription>
                  Create memorable, branded short links with custom aliases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Custom domains
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Bulk creation
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    QR codes
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <IconChartBar className="size-6 text-primary" />
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Track every click with detailed analytics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Real-time tracking
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Geographic data
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Device breakdown
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <IconLock className="size-6 text-primary" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Enterprise-grade security to protect your links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Password protection
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Link expiration
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    IP restrictions
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <IconBolt className="size-6 text-primary" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Optimized for speed with global CDN distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    99.9% uptime
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Instant redirects
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Global servers
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <IconChartBar className="size-6 text-primary" />
                </div>
                <CardTitle>API Access</CardTitle>
                <CardDescription>
                  Integrate with your tools and automate workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    RESTful API
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    API keys
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Webhooks
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <IconLink className="size-6 text-primary" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Work together with your team on link management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Shared workspaces
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Role management
                  </li>
                  <li className="flex items-center">
                    <IconCheck className="mr-2 size-4 text-primary" />
                    Activity logs
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader className="pb-8 text-center">
              <CardTitle className="text-3xl font-bold sm:text-4xl">
                Ready to get started?
              </CardTitle>
              <CardDescription className="text-base">
                Join thousands of users who trust Lihat.in for their link management
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">
                  Create Free Account
                  <IconArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/main">View Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row">
          <div className="flex items-center gap-2">
            <IconLink className="size-5" />
            <p className="text-sm text-muted-foreground">
              Built With Go & shadcn/ui
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">Terms</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">Privacy</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Lihat.in. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
