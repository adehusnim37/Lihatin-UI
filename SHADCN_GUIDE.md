# Panduan Lengkap shadcn/ui untuk Next.js

## 🎯 Apa itu shadcn/ui?

shadcn/ui adalah **bukan library UI biasa**. Ini adalah **koleksi reusable components** yang:
- ✅ Kamu **copy-paste** langsung ke project (bukan npm package)
- ✅ Fully customizable - kamu **punya kontrol penuh** atas kode
- ✅ Built with **Radix UI** + **Tailwind CSS**
- ✅ Accessible, responsive, dan modern

## 📦 Apa yang Sudah Diinstall?

### 1. Dependencies
```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.1",  // Untuk variant management
    "clsx": "^2.1.1",                       // Utility untuk className
    "lucide-react": "^0.553.0",             // Icon library
    "tailwind-merge": "^3.4.0"              // Merge Tailwind classes
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0"              // Tailwind animations
  }
}
```

### 2. Components yang Sudah Ada
```
components/
  ui/
    button.tsx          → Button component dengan variants
    card.tsx           → Card, CardHeader, CardTitle, CardDescription, CardContent
    input.tsx          → Input field
    label.tsx          → Label untuk form fields
```

### 3. Utils
```typescript
// lib/utils.ts
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```
Fungsi `cn()` untuk merge Tailwind classes dengan smart conflict resolution.

---

## 🚀 Cara Menggunakan shadcn/ui

### 1️⃣ Import Component

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

### 2️⃣ Pakai di JSX

#### Button dengan Variants
```typescript
// Default button
<Button>Click me</Button>

// Variants
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔥</Button>

// Dengan Link (Next.js)
<Button asChild>
  <Link href="/login">Go to Login</Link>
</Button>
```

#### Card Component
```typescript
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content here...</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Input & Label (Forms)
```typescript
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="Enter email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

---

## 📚 Install Component Baru

### Cara Install
```bash
# Install satu component
bunx shadcn@latest add dialog

# Install beberapa sekaligus
bunx shadcn@latest add dialog dropdown-menu select

# Install semua components (tidak direkomendasikan)
bunx shadcn@latest add --all
```

### Component yang Populer
```bash
# Forms
bunx shadcn@latest add form checkbox radio-group select textarea switch

# Navigation
bunx shadcn@latest add navigation-menu tabs breadcrumb

# Overlays
bunx shadcn@latest add dialog alert-dialog sheet popover tooltip

# Data Display
bunx shadcn@latest add table badge avatar progress separator

# Feedback
bunx shadcn@latest add toast alert skeleton

# Layout
bunx shadcn@latest add accordion collapsible sidebar
```

---

## 🎨 Customization

### 1. Ubah Warna (Theme)
File: `app/globals.css`

```css
:root {
  --background: oklch(1 0 0);           /* Background color */
  --foreground: oklch(0.145 0 0);       /* Text color */
  --primary: oklch(0.205 0 0);          /* Primary color */
  --primary-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);  /* Red for delete/danger */
  --muted: oklch(0.97 0 0);             /* Muted background */
  --accent: oklch(0.97 0 0);            /* Accent color */
  --border: oklch(0.922 0 0);           /* Border color */
  --radius: 0.625rem;                   /* Border radius */
}

.dark {
  /* Dark mode colors */
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
}
```

### 2. Ubah Component Style
Edit langsung file di `components/ui/button.tsx`:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 /* base styles */",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        
        // Tambah variant custom
        success: "bg-green-500 text-white hover:bg-green-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        
        // Tambah size custom
        xl: "h-14 px-10 text-lg",
      },
    },
  }
)
```

### 3. Extend dengan Tailwind
```typescript
// Tambah custom classes
<Button className="rounded-full shadow-lg">
  Custom Button
</Button>

// Pakai cn() utility untuk merge classes
<Card className={cn("border-2", isActive && "border-blue-500")}>
  Active Card
</Card>
```

---

## 🔥 Contoh Real-World

### Login Form
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Dashboard Card Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>
    <CardHeader>
      <CardTitle>Total Users</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">1,234</p>
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Revenue</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">$12,345</p>
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Active Sessions</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">89</p>
    </CardContent>
  </Card>
</div>
```

---

## 🎯 Tips & Best Practices

### 1. Pakai "use client" Directive
Components shadcn/ui yang pakai interactivity harus di client:
```typescript
"use client";

import { Button } from "@/components/ui/button";

export default function MyComponent() {
  return <Button onClick={() => alert("Hi!")}>Click</Button>;
}
```

### 2. Kombinasi dengan Tailwind
```typescript
<Button className="bg-gradient-to-r from-purple-500 to-pink-500">
  Gradient Button
</Button>
```

### 3. Responsive Design
```typescript
<Card className="w-full md:w-1/2 lg:w-1/3">
  Responsive Card
</Card>
```

### 4. Dark Mode Support
Semua component sudah support dark mode otomatis karena pakai CSS variables!

```typescript
// Toggle dark mode
<html className="dark">
  <body>{children}</body>
</html>
```

---

## 📖 Resources

- **shadcn/ui Docs**: https://ui.shadcn.com
- **Component Browse**: https://ui.shadcn.com/docs/components
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com
- **Lucide Icons**: https://lucide.dev/icons

---

## 🚀 Next Steps

1. **Explore Components**
   ```bash
   bunx shadcn@latest add dialog toast dropdown-menu
   ```

2. **Coba Build Dashboard**
   - Install: `table`, `badge`, `progress`, `separator`
   - Buat halaman analytics/dashboard

3. **Form Advanced**
   ```bash
   bunx shadcn@latest add form select checkbox radio-group
   ```
   - Pakai `react-hook-form` + `zod` validation

4. **Dark Mode Toggle**
   ```bash
   bunx shadcn@latest add dropdown-menu
   ```
   - Implement theme switcher

---

## 💡 Yang Sudah Dikerjakan di Project Ini

✅ **Homepage** (`app/page.tsx`)
- Pakai `Card` untuk welcome message
- `Button` dengan variants (destructive, outline)
- `asChild` pattern untuk Link + Button

✅ **Login Page** (`app/auth/login/page.tsx`)
- Form dengan `Input` + `Label`
- `Card` layout
- Integrated dengan `useAuth()` context

✅ **Auth Pages** (`/auth`, `/register`, `/forgot-password`)
- Konsisten pakai shadcn/ui components
- Responsive layout

✅ **Auth Layout** (`app/auth/layout.tsx`)
- Sidebar dengan Tailwind styling
- Hover effects & transitions

**Jalankan project:** `bun dev`
**Akses:** http://localhost:3000

