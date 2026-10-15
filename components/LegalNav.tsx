import Link from "next/link";

/**
 * The three legal links, on every page (planning #3136: the imprint and both
 * privacy pages are reachable from every page, DPO comment, step 4 list).
 *
 * Each link carries the language of the page it opens, because the root
 * layout says lang="en" and two of the three targets are German.
 *
 * STYLING: Tailwind classes only. The production CSP in proxy.ts allows styles
 * by nonce only; a style attribute would be blocked.
 */
const LINK =
  "underline underline-offset-4 decoration-zinc-400 hover:decoration-zinc-900 dark:hover:decoration-zinc-100";

export function LegalNav() {
  return (
    <nav
      aria-label="Legal"
      className="w-full max-w-2xl mt-4 text-xs text-zinc-600 dark:text-zinc-300 flex flex-wrap gap-x-4 gap-y-2"
    >
      <Link href="/impressum" lang="de" className={LINK}>
        Impressum
      </Link>
      <Link href="/datenschutz" lang="de" className={LINK}>
        Datenschutz
      </Link>
      <Link href="/privacy" lang="en" className={LINK}>
        Privacy
      </Link>
    </nav>
  );
}
