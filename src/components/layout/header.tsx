import { UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-primary font-headline">
            IndiCal AI
          </h1>
        </Link>
      </div>
    </header>
  );
}
