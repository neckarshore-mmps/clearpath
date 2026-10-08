import Link from "next/link";
import type { Metadata } from "next";

/**
 * Imprint (§ 5 DDG) for clearpath.neckarshore.ai — planning #3136, step 2.
 *
 * WHERE THE TEXT COMES FROM
 * The provider block, the contact block, the § 18 MStV line and the paragraph
 * on liability for content are the wording of trustscope.neckarshore.ai/impressum
 * (signed off for TrustScope by the Founder and the DPO on 2026-07-13). Name,
 * address, phone and mail were compared with neckarshore.ai/impressum on
 * 2026-10-08 and are the same there.
 *
 * WHAT IS LEFT OUT ON PURPOSE
 * - No link to a privacy page: /datenschutz does not exist yet (step 3 of
 *   #3136, waits for the DPO's wording). It comes with that step. The test in
 *   __tests__/impressum.test.tsx fails on a link to a route that is not there.
 * - No paragraph on liability for links: this site links to no other site.
 *   If a later page does, the paragraph comes back with it.
 * - No VAT ID line: § 27a UStG asks for one only where one is assigned.
 *
 * WHY THE CONTENT CARRIES lang="de"
 * The root layout declares lang="en" because the app is English. The imprint
 * is German, as on TrustScope.
 *
 * STYLING: Tailwind classes only. The production CSP in proxy.ts allows styles
 * by nonce only; a style attribute would be blocked.
 */
export const metadata: Metadata = {
  title: "Impressum — ClearPath",
  description:
    "Anbieterkennzeichnung nach § 5 DDG für ClearPath — ein Angebot von Neckarshore AI.",
};

const HEADING =
  "text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400";
const BODY =
  "mt-3 space-y-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200";
const LINK =
  "underline underline-offset-4 decoration-zinc-400 hover:decoration-zinc-900 dark:hover:decoration-zinc-100";

export default function ImpressumPage() {
  return (
    <main
      lang="de"
      className="min-h-screen flex flex-col items-center px-6 py-12 bg-zinc-50 dark:bg-black"
    >
      <header className="w-full max-w-2xl mb-10">
        <p className="text-sm">
          <Link
            href="/"
            lang="en"
            className={`${LINK} text-zinc-700 dark:text-zinc-300`}
          >
            ← ClearPath
          </Link>
        </p>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Impressum
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Anbieterkennzeichnung nach § 5 DDG für ClearPath — ein Angebot von
          Neckarshore AI.
        </p>
      </header>

      <div className="w-full max-w-2xl space-y-10">
        <section>
          <h2 className={HEADING}>Angaben gemäß § 5 DDG</h2>
          <div className={BODY}>
            <p className="font-medium">
              German Rauhut IT Consulting &amp; Digital Ventures
            </p>
            <p>Einzelunternehmen — Inhaber: German Rauhut</p>
            <p>Rotebühlstraße 176</p>
            <p>70197 Stuttgart</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>Kontakt</h2>
          <div className={BODY}>
            <p>
              Telefon:{" "}
              <a className={LINK} href="tel:+491603859135">
                +49 160 385 9135
              </a>
            </p>
            <p>
              E-Mail:{" "}
              <a className={LINK} href="mailto:info@neckarshore.ai">
                info@neckarshore.ai
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <div className={BODY}>
            <p>German Rauhut, Anschrift wie oben.</p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>Haftung für Inhalte</h2>
          <div className={BODY}>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene
              Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
              verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter
              jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die
              auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur
              Entfernung oder Sperrung der Nutzung von Informationen nach den
              allgemeinen Gesetzen bleiben hiervon unberührt.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
