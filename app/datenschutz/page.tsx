import Link from "next/link";
import type { Metadata } from "next";
import { LegalNav } from "@/components/LegalNav";

/**
 * Privacy notice, German (Art. 13 DSGVO) for clearpath.neckarshore.ai —
 * planning #3136, step 3. The English version is app/privacy/page.tsx; both
 * say the same and must change together.
 *
 * WHERE THE TEXT COMES FROM
 * - §§ 1, 3, 7 (Beschwerderecht) and the frame of §§ 2 and 6: the wording of
 *   trustscope.neckarshore.ai/datenschutz as delivered on 2026-10-15, taken
 *   section by section as the DPO's opinion on #3136 (2026-10-08, section 5)
 *   lists it. § 2 carries the DPO's Frankfurt sentence, § 6 his sentence on
 *   withdrawing consent.
 * - §§ 4 and 5: the DPO's own wording for ClearPath, verbatim.
 *
 * OPEN MARKER (DPO section 6, marker 1 and 2): which Anthropic company holds
 * the API account, and that it runs under the Commercial Terms, is not
 * measured. The text says "Anthropic Ireland, Limited", as the Commercial
 * Terms name it for a customer in Germany, until one invoice is read. If the
 * invoice names Anthropic, PBC: name that company in § 4 and drop "auch" in
 * the paragraph on the USA. [Gesellschaft laut Rechnung]
 *
 * IF THE MODEL PROVIDER CHANGES (CLEARPATH_MODEL in app/actions.ts), § 4 is
 * false on that day.
 *
 * STYLING: Tailwind classes only. The production CSP in proxy.ts allows styles
 * by nonce only; a style attribute would be blocked.
 */
export const metadata: Metadata = {
  title: "Datenschutz — ClearPath",
  description:
    "Datenschutzerklärung für ClearPath: was mit Ihrem Text geschieht, wenn Sie ihn von Anthropic auswerten lassen.",
};

const HEADING =
  "text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400";
const SUBHEADING = "font-semibold text-zinc-900 dark:text-zinc-50";
const BODY =
  "mt-3 space-y-3 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200";
const LINK =
  "underline underline-offset-4 decoration-zinc-400 hover:decoration-zinc-900 dark:hover:decoration-zinc-100";

export default function DatenschutzPage() {
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
          Datenschutzerklärung
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/privacy" lang="en" className={LINK}>
            English version
          </Link>
        </p>
      </header>

      <div className="w-full max-w-2xl space-y-10">
        <section>
          <h2 className={HEADING}>§ 1 · Verantwortlicher</h2>
          <div className={BODY}>
            <p>Verantwortlich im Sinne der DSGVO ist:</p>
            <p>
              German Rauhut IT Consulting &amp; Digital Ventures
              <br />
              Einzelunternehmen — Inhaber: German Rauhut
              <br />
              Rotebühlstraße 176, 70197 Stuttgart, Deutschland
              <br />
              E-Mail:{" "}
              <a className={LINK} href="mailto:info@neckarshore.ai">
                info@neckarshore.ai
              </a>
              <br />
              Telefon:{" "}
              <a className={LINK} href="tel:+491603859135">
                +49 160 385 9135
              </a>
            </p>
            <p>
              Ein/e Datenschutzbeauftragte/r ist gesetzlich nicht
              bestellungspflichtig (Art. 37 DSGVO, § 38 BDSG) und daher nicht
              benannt. Für alle Anliegen zum Datenschutz erreichen Sie uns unter
              den vorstehenden Kontaktdaten.
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 2 · Hosting (Vercel)</h2>
          <div className={BODY}>
            <p>
              ClearPath wird bei der Vercel Inc., 340 S Lemon Ave #4133, Walnut,
              CA 91789, USA, gehostet. Beim Aufruf der Seiten verarbeitet Vercel
              technisch notwendige Verbindungsdaten (siehe § 3) als
              Auftragsverarbeiter für uns. Rechtsgrundlage ist unser
              berechtigtes Interesse an einem sicheren und leistungsfähigen
              Bereitstellen des Angebots (Art. 6 Abs. 1 lit. f DSGVO). Die
              Verarbeitung erfolgt auf Grundlage eines
              Auftragsverarbeitungsvertrags nach Art. 28 DSGVO, den wir mit
              Vercel geschlossen haben. Der Server, der Ihren eingegebenen Text
              entgegennimmt und weiterleitet, läuft bei Vercel in Frankfurt am
              Main.
            </p>
            <p>
              Dabei können Daten in die USA übermittelt werden. Grundlage der
              Übermittlung sind die EU-Standardvertragsklauseln (Art. 46 Abs. 2
              lit. c DSGVO); zusätzlich ist Vercel unter dem EU-U.S. Data
              Privacy Framework zertifiziert. Ein Zugriff US-amerikanischer
              Behörden lässt sich trotz dieser Garantien nicht vollständig
              ausschließen.
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 3 · Server-Logfiles</h2>
          <div className={BODY}>
            <p>
              Beim Aufruf der Seiten fallen bei unserem Hosting-Anbieter
              technisch notwendige Zugriffsdaten an — insbesondere IP-Adresse,
              Zeitpunkt der Anfrage, angeforderte URL sowie übermittelter
              Browser- und Betriebssystem-Typ. Diese Daten dienen der
              Auslieferung, Sicherheit und Stabilität des Angebots und werden
              nicht mit anderen Datenquellen zusammengeführt. Rechtsgrundlage
              ist unser berechtigtes Interesse am sicheren Betrieb (Art. 6 Abs.
              1 lit. f DSGVO).
            </p>
            <p>
              Speicherdauer (Art. 13 Abs. 2 lit. a DSGVO): Diese Zugriffsdaten
              werden nur so lange gespeichert, wie es für die genannten Zwecke
              erforderlich ist, und anschließend gelöscht. Serverseitige
              Zugriffsprotokolle unseres Hosting-Anbieters werden regelmäßig
              kurzfristig vorgehalten und automatisch überschrieben; darüber
              hinaus führen wir selbst keine dauerhaften Logfiles.
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 4 · Analyse Ihres Textes durch Anthropic</h2>
          <div className={BODY}>
            <p>
              Wenn Sie auf „Agree and run veto check“ klicken, sendet ClearPath
              den Text, den Sie eingegeben haben (höchstens 4.000 Zeichen), an
              unseren Server in Frankfurt am Main und von dort an die Anthropic
              Ireland, Limited. Anthropic lässt ihn von einem KI-Sprachmodell
              (Claude) auswerten und schickt das Ergebnis zurück: drei
              Denkfehler, die zu Ihrer Entscheidung passen könnten, und eine
              Frage. Mit dem Text wird nichts mitgeschickt, das Sie kennzeichnet:
              kein Name, kein Konto, keine IP-Adresse.
            </p>
            <p>
              <span className={SUBHEADING}>Was wir speichern:</span> nichts
              davon. Ihr Text und das Ergebnis stehen nur in Ihrem Browser und
              sind weg, sobald Sie die Seite neu laden oder schließen.
            </p>
            <p>
              <span className={SUBHEADING}>Was Anthropic speichert:</span>{" "}
              Anthropic verarbeitet den Text als unser Auftragsverarbeiter (Art.
              28 DSGVO) und darf ihn nach unserem Vertrag nicht zum Training
              seiner Modelle verwenden. Anthropic löscht Eingaben und Ergebnisse
              nach eigenen Angaben innerhalb von 30 Tagen. Stuft ein
              automatisches Prüfsystem einen Text als Verstoß gegen Anthropics
              Nutzungsregeln ein, kann er dort bis zu zwei Jahre aufbewahrt
              werden. Einen einzelnen Text können wir bei Anthropic nicht
              heraussuchen oder vorzeitig löschen lassen, weil er keiner Person
              zugeordnet ist.
            </p>
            <p>
              <span className={SUBHEADING}>Übermittlung in die USA:</span> Die
              Auswertung findet auch auf Servern der Anthropic, PBC in den USA
              statt. Dafür gelten die EU-Standardvertragsklauseln (Art. 46 Abs.
              2 lit. c DSGVO); sie sind Teil unseres Vertrags mit Anthropic. Eine
              Kopie erhalten Sie auf Anfrage.
            </p>
            <p>
              <span className={SUBHEADING}>Rechtsgrundlage:</span> Ihre
              Einwilligung (Art. 6 Abs. 1 lit. a DSGVO; soweit Ihr Text Angaben
              etwa zu Gesundheit, Religion oder politischen Ansichten enthält,
              Art. 9 Abs. 2 lit. a DSGVO). Sie erteilen sie mit dem Klick auf
              „Agree and run veto check“, für jede Analyse einzeln. Sie können
              sie jederzeit für die Zukunft widerrufen, indem Sie keine weitere
              Analyse starten. Eine bereits gesendete Anfrage können wir nicht
              zurückholen.
            </p>
            <p>Bitte schreiben Sie keine Namen anderer Personen in den Text.</p>
            <p>
              <span className={SUBHEADING}>
                Keine automatisierte Entscheidung:
              </span>{" "}
              ClearPath gibt einen Denkanstoß und rät weder zu noch ab. Eine
              Entscheidung über Sie trifft die Seite nicht (Art. 22 DSGVO).
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 5 · Was diese Seite nicht tut</h2>
          <div className={BODY}>
            <p>
              ClearPath setzt keine Cookies, zählt keine Besuche, lädt keine
              Schriften oder Skripte von fremden Servern und kennt kein Konto.
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 6 · Ihre Rechte</h2>
          <div className={BODY}>
            <p>
              Sie haben im Rahmen der gesetzlichen Voraussetzungen das Recht auf
              Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung
              (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO),
              Datenübertragbarkeit (Art. 20 DSGVO) sowie ein Widerspruchsrecht
              gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
              (Art. 21 DSGVO). Wenden Sie sich dafür an die in § 1 genannte
              Kontaktadresse. Eine erteilte Einwilligung können Sie jederzeit mit
              Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO).
            </p>
          </div>
        </section>

        <section>
          <h2 className={HEADING}>§ 7 · Beschwerderecht</h2>
          <div className={BODY}>
            <p>
              Unbeschadet anderweitiger Rechtsbehelfe haben Sie das Recht, sich
              bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77
              DSGVO), insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts,
              Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.
            </p>
          </div>
        </section>
      </div>

      <LegalNav />
    </main>
  );
}
