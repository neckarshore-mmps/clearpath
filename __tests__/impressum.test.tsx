/**
 * Imprint smoke test — planning #3136, step 2.
 *
 * What it holds:
 *   1. The imprint page renders the provider facts § 5 DDG asks for.
 *   2. The German content is marked lang="de" (the root layout says "en").
 *   3. The start page links to /impressum.
 *   4. Every internal link on both pages points at a route that exists in
 *      app/. This is the guard against linking /datenschutz before step 3
 *      has built it.
 *   5. Neither page carries a style attribute (the production CSP in proxy.ts
 *      allows styles by nonce only).
 *
 * WHAT THIS TEST CANNOT DO
 *   - It renders the source with react-dom/server. It does not look at the
 *     delivered site; the read-back after the merge does that, by curl.
 *   - It does not know whether the provider facts are TRUE. It holds that
 *     they are the ones compared with neckarshore.ai/impressum on 2026-10-08.
 *   - It does not check how the page looks.
 */

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import ImpressumPage from "../app/impressum/page";
import Home from "../app/page";

const appDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "app",
);

function internalLinks(markup: string): string[] {
  return [...markup.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]);
}

function routeExists(href: string): boolean {
  const segments = href.split("/").filter(Boolean);
  return existsSync(path.join(appDir, ...segments, "page.tsx"));
}

const imprint = renderToStaticMarkup(createElement(ImpressumPage));
const home = renderToStaticMarkup(createElement(Home));

describe("imprint page (/impressum)", () => {
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

  it("has exactly one h1 and marks its content as German", () => {
    expect(imprint.match(/<h1\b/g)).toHaveLength(1);
    expect(imprint).toMatch(/<main[^>]*\slang="de"/);
  });

  it("links back to the start page", () => {
    expect(internalLinks(imprint)).toContain("/");
  });
});

describe("start page", () => {
  it("links to the imprint", () => {
    expect(internalLinks(home)).toContain("/impressum");
  });
});

describe("both pages", () => {
  it("link only to routes that exist in app/", () => {
    const links = [...internalLinks(imprint), ...internalLinks(home)];
    expect(links.length).toBeGreaterThanOrEqual(2);
    const missing = links.filter((href) => !routeExists(href));
    expect(missing).toEqual([]);
  });

  it("carry no style attribute", () => {
    expect(imprint).not.toMatch(/\sstyle="/);
    expect(home).not.toMatch(/\sstyle="/);
  });
});
