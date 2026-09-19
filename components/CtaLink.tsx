"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";

/** Lien d'appel à l'action qui déclenche l'événement de conversion avant la navigation. */
export function CtaLink({
  href,
  event,
  meta,
  className,
  children,
}: {
  href: string;
  event: string;
  meta?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => track(event, meta, { destination: href })}>
      {children}
    </Link>
  );
}
