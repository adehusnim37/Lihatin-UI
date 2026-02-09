"use client";

import Link from "next/link";
import { IconLink, IconChartBar, IconLock, IconBolt, IconArrowRight, IconCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-7xl items-center px-4">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <IconLink className="size-6" />
              <span className="font-bold">Lihat.in</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 md:pt-20 md:pb-24">
        <div className="container mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center">
          <Badge variant="outline" className="">
            🚀 Free & Open Source
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Shorten Links,
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Track Everything
            </span>
          </h1>
          <p className="max-w-[42rem] text-lg text-muted-foreground sm:text-xl">
            Create short links, track clicks, analyze traffic. All the tools you need
            to understand your audience and grow your reach.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/register">
                Start for Free
                <IconArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="mt-20 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
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
              Built with Next.js 15, React 19, Go & shadcn/ui
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Lihat.in. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}