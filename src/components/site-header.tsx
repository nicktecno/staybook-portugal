import Link from "next/link";
import { MapPin } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="size-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">Staybook Portugal</span>
          <span className="sm:hidden">Staybook</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Browse
          </Link>
        </nav>
      </div>
    </header>
  );
}
