import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - akan muncul di semua /auth/* pages */}
      <aside className="w-64 bg-muted/40 border-r p-6">
        <h2 className="text-lg font-semibold mb-4">Auth Menu</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                href="/auth"
                className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Auth Home
              </Link>
            </li>
            <li>
              <Link
                href="/auth/login"
                className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Login
              </Link>
            </li>
            <li>
              <Link
                href="/auth/register"
                className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Register
              </Link>
            </li>
            <li>
              <Link
                href="/auth/forgot-password"
                className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Forgot Password
              </Link>
            </li>
          </ul>
        </nav>
        <hr className="my-4 border-border" />
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Home
        </Link>
      </aside>

      {/* Content area - children akan berubah sesuai route */}
      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}

