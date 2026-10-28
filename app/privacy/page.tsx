import Link from "next/link";
import type { Metadata } from "next";
import { LegalNav } from "@/components/LegalNav";

/**
 * Privacy notice, English (Art. 13 GDPR) for clearpath.neckarshore.ai —
 * planning #3136, step 3. The German version is app/datenschutz/page.tsx; both
 * say the same and must change together.
 *
 * WHY ENGLISH IS REQUIRED: the app speaks English, and the information has to
 * be understandable to the person it addresses (Art. 12(1) GDPR; DPO opinion
 * on #3136, section 5).
 *
 * WHERE THE TEXT COMES FROM
 * - §§ 4 and 5: the DPO's own English wording for ClearPath, verbatim.
 * - §§ 1, 2, 3, 6, 7: Linus's translation of the TrustScope frame used on the
 *   German page. TrustScope has no English privacy page. This translation is
 *   NOT approved wording until the DPO has read it (step 4 of #3136).
 *
 * OPEN MARKER (DPO section 6, marker 1 and 2): which Anthropic company holds
 * the API account is not measured. The text says "Anthropic Ireland, Limited"
 * until one invoice is read. If it names Anthropic, PBC: name that company in
 * § 4 and drop "also" in the paragraph on the USA. [entity per invoice]
 *
 * IF THE MODEL PROVIDER CHANGES (CLEARPATH_MODEL in app/actions.ts), § 4 is
 * false on that day.
 *
 * STYLING: Tailwind classes only. The production CSP in proxy.ts allows styles
 * by nonce only; a style attribute would be blocked.
 */
export const metadata: Metadata = {
  title: "Privacy — ClearPath",
  description:
    "Privacy notice for ClearPath: what happens to your text when you have it analysed by Anthropic.",
};

const HEADING =
  "text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400";
const SUBHEADING = "font-semibold text-zinc-900 dark:text-zinc-50";
const BODY =
  "mt-3 space-y-3 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200";
const LINK =
  "underline underline-offset-4 decoration-zinc-400 hover:decoration-zinc-900 dark:hover:decoration-zinc-100";

export default function PrivacyPage() {
  return (
    <main
      lang="en"
      className="min-h-screen flex flex-col items-center px-6 py-12 bg-zinc-50 dark:bg-black"
    >
      <header className="w-full max-w-2xl mb-10">
        <p className="text-sm">
          <Link
            href="/"
            className={`${LINK} text-zinc-700 dark:text-zinc-300`}
          >
            ← ClearPath
          </Link>
        </p>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Privacy notice
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/datenschutz" lang="de" className={LINK}>
            Deutsche Fassung
          </Link>
        </p>
      </header>

      <div className="w-full max-w-2xl space-y-10">
        <section>
          <h2 className={HEADING}>§ 1 · Controller</h2>
          <div className={BODY}>
            <p>The controller within the meaning of the GDPR is:</p>
            <p>
              German Rauhut IT Consulting &amp; Digital Ventures
              <br />
              Sole proprietorship — owner: German Rauhut
              <br />
              Rotebühlstraße 176, 70197 Stuttgart, Germany
              <br />
              E-mail:{" "}
              <a className={LINK} href="mailto:info@neckarshore.ai">
                info@neckarshore.ai
              </a>
              <br />
              Phone:{" "}
              <a className={LINK} href="tel:+491603859135">
                +49 160 385 9135
              </a>
            </p>
            <p>
              We are not legally required to appoint a data protection officer
              (Art. 37 GDPR, § 38 BDSG) and have therefore not appointed one.
              For any data protection matter, you can reach us at the contact
              details above.
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 2 · Hosting (Vercel)</h2>
          <div className={BODY}>
            <p>
              ClearPath is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut,
              CA 91789, USA. When you open the pages, Vercel processes the
              technically necessary connection data (see § 3) as our processor.
              The legal basis is our legitimate interest in providing the
              service securely and reliably (Art. 6(1)(f) GDPR). The processing
              is governed by a data processing agreement under Art. 28 GDPR that
              we have concluded with Vercel. The server that receives and
              forwards the text you enter runs at Vercel in Frankfurt am Main.
            </p>
            <p>
              Data may be transferred to the USA in the process. The transfer is
              based on the EU standard contractual clauses (Art. 46(2)(c) GDPR);
              in addition, Vercel is certified under the EU-U.S. Data Privacy
              Framework. Access by US authorities cannot be fully ruled out
              despite these safeguards.
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 3 · Server log files</h2>
          <div className={BODY}>
            <p>
              When you open the pages, our hosting provider records technically
              necessary access data — in particular the IP address, the time of
              the request, the requested URL and the browser and operating
              system type transmitted. These data serve the delivery, security
              and stability of the service and are not combined with other data
              sources. The legal basis is our legitimate interest in secure
              operation (Art. 6(1)(f) GDPR).
            </p>
            <p>
              Storage period (Art. 13(2)(a) GDPR): these access data are kept
              only as long as the purposes above require and are deleted
              afterwards. Our hosting provider&apos;s server-side access logs
              are held for a short time and overwritten automatically; beyond
              that, we keep no permanent log files ourselves.
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 4 · Analysis of your text by Anthropic</h2>
          <div className={BODY}>
            <p>
              When you click &ldquo;Agree and run veto check&rdquo;, ClearPath
              sends the text you entered (at most 4,000 characters) to our
              server in Frankfurt am Main and from there to Anthropic Ireland,
              Limited. Anthropic has it analysed by an AI language model
              (Claude) and returns the result: three biases that may fit your
              decision, and one question. Nothing that marks you is sent with
              the text: no name, no account, no IP address.
            </p>
            <p>
              <span className={SUBHEADING}>What we store:</span> none of it.
              Your text and the result exist only in your browser and are gone
              as soon as you reload or close the page.
            </p>
            <p>
              <span className={SUBHEADING}>What Anthropic stores:</span>{" "}
              Anthropic processes the text as our processor (Art. 28 GDPR) and,
              under our contract, may not use it to train its models. By its own
              account Anthropic deletes inputs and results within 30 days. If an
              automated safety system classifies a text as a breach of
              Anthropic&apos;s usage policy, it can be kept there for up to two
              years. We cannot have a single text picked out or deleted early at
              Anthropic, because it is not tied to a person.
            </p>
            <p>
              <span className={SUBHEADING}>Transfer to the USA:</span> the
              analysis also takes place on servers of Anthropic, PBC in the USA.
              The EU standard contractual clauses apply to this (Art. 46(2)(c)
              GDPR); they are part of our contract with Anthropic. You can ask us
              for a copy.
            </p>
            <p>
              <span className={SUBHEADING}>Legal basis:</span> your consent
              (Art. 6(1)(a) GDPR; where your text contains details of, for
              example, health, religion or political views, Art. 9(2)(a) GDPR).
              You give it by clicking &ldquo;Agree and run veto check&rdquo;,
              for each analysis separately. You can withdraw it at any time for
              the future by not starting another analysis. A request that has
              been sent cannot be called back.
            </p>
            <p>Please do not put other people&apos;s names into the text.</p>
            <p>
              <span className={SUBHEADING}>No automated decision:</span>{" "}
              ClearPath offers a prompt for thought and advises neither for nor
              against. The page takes no decision about you (Art. 22 GDPR).
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 5 · What this page does not do</h2>
          <div className={BODY}>
            <p>
              ClearPath sets no cookies, counts no visits, loads no fonts or
              scripts from other servers and has no accounts.
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 6 · Your rights</h2>
          <div className={BODY}>
            <p>
              Within the limits set by law, you have the right of access (Art.
              15 GDPR), rectification (Art. 16 GDPR), erasure (Art. 17 GDPR),
              restriction of processing (Art. 18 GDPR), data portability (Art.
              20 GDPR) and a right to object to processing based on Art. 6(1)(f)
              GDPR (Art. 21 GDPR). To exercise them, contact us at the address
              in § 1. You can withdraw a consent you have given at any time with
              effect for the future (Art. 7(3) GDPR).
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 7 · Right to lodge a complaint</h2>
          <div className={BODY}>
            <p>
              Without prejudice to any other remedy, you have the right to lodge
              a complaint with a data protection supervisory authority (Art. 77
              GDPR), in particular in the Member State of your habitual
              residence, your place of work or the place of the alleged
              infringement.
            </p>
          </div>
        </section>
      </div>

      <LegalNav />
    </main>
  );
}
