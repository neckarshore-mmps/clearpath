/**
 * Legal pages smoke test — planning #3136, steps 2 and 3.
 *
 * What it holds:
 *   1. The imprint renders the provider facts § 5 DDG asks for.
 *   2. The start page tells the visitor, before the button, that the text goes
 *      to Anthropic, and the button itself says the agreement ("Agree and run
 *      veto check", DPO way 1, Founder 2026-10-08). The note stands before
 *      the button in the markup, and no keyboard shortcut submits past it
 *      (Founder 2026-10-15).
 *   3. Both privacy pages carry the DPO's sentences for ClearPath verbatim, in
 *      their language, and no open marker of the DPO's draft.
 *   4. Every page links to the imprint and to both privacy pages, and every
 *      internal link points at a route that exists in app/.
 *   5. No page carries a style attribute (the production CSP in proxy.ts
 *      allows styles by nonce only).
 *
 * WHAT THIS TEST CANNOT DO
 *   - It renders the source with react-dom/server. It does not look at the
 *     delivered site; the read-back after the merge does that, by curl.
 *   - It does not know whether the facts are TRUE (which Anthropic company
 *     holds the account is an open marker, see app/datenschutz/page.tsx).
 *   - It does not check how the pages look.
 */

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import ImpressumPage from "../app/impressum/page";
import DatenschutzPage from "../app/datenschutz/page";
import PrivacyPage from "../app/privacy/page";
import Home from "../app/page";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");

function internalLinks(markup: string): string[] {
  return [...markup.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]);
}

function routeExists(href: string): boolean {
  const segments = href.split("/").filter(Boolean);
  return existsSync(path.join(appDir, ...segments, "page.tsx"));
}

/** Visible text: tags out, entities decoded, whitespace collapsed. */
function visibleText(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .replace(/ ([.,;:)])/g, "$1")
    .trim();
}

const pages = {
  "/": renderToStaticMarkup(createElement(Home)),
  "/impressum": renderToStaticMarkup(createElement(ImpressumPage)),
  "/datenschutz": renderToStaticMarkup(createElement(DatenschutzPage)),
  "/privacy": renderToStaticMarkup(createElement(PrivacyPage)),
};

describe("imprint page (/impressum)", () => {
  const imprint = pages["/impressum"];

  it.each([
    "Angaben gemäß § 5 DDG",
    "German Rauhut IT Consulting &amp; Digital Ventures",
    "Einzelunternehmen — Inhaber: German Rauhut",
    "Rotebühlstraße 176",
    "70197 Stuttgart",
    "Deutschland",
    'href="tel:+491603859135"',
    'href="mailto:info@neckarshore.ai"',
    "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
    "German Rauhut, Anschrift wie oben.",
  ])("carries %s", (fact) => {
    expect(imprint).toContain(fact);
  });

  it("marks its content as German", () => {
    expect(imprint).toMatch(/<main[^>]*\slang="de"/);
  });
});

describe("start page: information and consent before the click", () => {
  const home = pages["/"];
  const CONSENT_NOTE =
    "Your text is sent to Anthropic, an AI provider, for this one analysis. " +
    "We do not store it; Anthropic deletes it within 30 days and processes it " +
    "in the USA as well. Leave out other people's names. By clicking " +
    "“Agree and run veto check” you agree to this, also for sensitive details " +
    "you choose to include. Privacy";

  it("carries the DPO's note word for word, with its link to /privacy", () => {
    expect(visibleText(home)).toContain(CONSENT_NOTE);
    const note = home.match(/<p id="consent-note"[\s\S]*?<\/p>/)?.[0] ?? "";
    expect(internalLinks(note)).toEqual(["/privacy"]);
  });

  it("names the agreement on the button itself", () => {
    expect(home).toMatch(/<button[^>]*>Agree and run veto check<\/button>/);
    expect(home).not.toMatch(/>Run veto check</);
  });

  it("shows the note before the button", () => {
    const note = home.indexOf('id="consent-note"');
    const button = home.indexOf(">Agree and run veto check</button>");
    expect(note).toBeGreaterThan(-1);
    expect(button).toBeGreaterThan(note);
  });

  it("has no keyboard shortcut that submits past the button", () => {
    const source = readFileSync(path.join(appDir, "page.tsx"), "utf8");
    expect(source).not.toMatch(/onKeyDown/);
    expect(home).not.toContain("⌘");
  });
});

describe("privacy pages", () => {
  const de = visibleText(pages["/datenschutz"]);
  const en = visibleText(pages["/privacy"]);

  it("are marked with their language", () => {
    expect(pages["/datenschutz"]).toMatch(/<main[^>]*\slang="de"/);
    expect(pages["/privacy"]).toMatch(/<main[^>]*\slang="en"/);
  });

  it.each([
    "Wenn Sie auf „Agree and run veto check“ klicken, sendet ClearPath den Text, den Sie eingegeben haben (höchstens 4.000 Zeichen), an unseren Server in Frankfurt am Main und von dort an die Anthropic Ireland, Limited.",
    "Was wir speichern: nichts davon.",
    "Anthropic löscht Eingaben und Ergebnisse nach eigenen Angaben innerhalb von 30 Tagen.",
    "Die Auswertung findet auch auf Servern der Anthropic, PBC in den USA statt.",
    "Sie erteilen sie mit dem Klick auf „Agree and run veto check“, für jede Analyse einzeln.",
    "Bitte schreiben Sie keine Namen anderer Personen in den Text.",
    "Eine Entscheidung über Sie trifft die Seite nicht (Art. 22 DSGVO).",
    "ClearPath setzt keine Cookies, zählt keine Besuche, lädt keine Schriften oder Skripte von fremden Servern und kennt kein Konto.",
    "Der Server, der Ihren eingegebenen Text entgegennimmt und weiterleitet, läuft bei Vercel in Frankfurt am Main.",
    "Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO).",
  ])("German page carries: %s", (sentence) => {
    expect(de).toContain(sentence);
  });

  it.each([
    "When you click “Agree and run veto check”, ClearPath sends the text you entered (at most 4,000 characters) to our server in Frankfurt am Main and from there to Anthropic Ireland, Limited.",
    "What we store: none of it.",
    "By its own account Anthropic deletes inputs and results within 30 days.",
    "the analysis also takes place on servers of Anthropic, PBC in the USA.",
    "You give it by clicking “Agree and run veto check”, for each analysis separately.",
    "Please do not put other people's names into the text.",
    "The page takes no decision about you (Art. 22 GDPR).",
    "ClearPath sets no cookies, counts no visits, loads no fonts or scripts from other servers and has no accounts.",
  ])("English page carries: %s", (sentence) => {
    expect(en).toContain(sentence);
  });

  it("carry none of the DPO draft's open markers", () => {
    for (const text of [de, en]) {
      expect(text).not.toMatch(/Gesellschaft laut Rechnung|entity per invoice|\[/);
    }
  });
});

describe("every page", () => {
  it.each(Object.entries(pages))(
    "%s has one h1, links to all three legal pages and to nothing missing",
    (_route, markup) => {
      expect(markup.match(/<h1\b/g)).toHaveLength(1);
      const links = internalLinks(markup);
      expect(links).toEqual(
        expect.arrayContaining(["/impressum", "/datenschutz", "/privacy"]),
      );
      expect(links.filter((href) => !routeExists(href))).toEqual([]);
    },
  );

  it.each(Object.entries(pages))("%s carries no style attribute", (_r, markup) => {
    expect(markup).not.toMatch(/\sstyle="/);
  });
});
