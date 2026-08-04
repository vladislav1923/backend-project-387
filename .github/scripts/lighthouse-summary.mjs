#!/usr/bin/env node
/**
 * Reads a Lighthouse JSON report and writes a markdown summary of
 * actionable project fixes (failed / low-scoring audits).
 *
 * Usage: node lighthouse-summary.mjs <report.json> <out.md>
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [, , jsonPath, outPath] = process.argv;

if (!jsonPath || !outPath) {
  console.error("Usage: node lighthouse-summary.mjs <report.json> <out.md>");
  process.exit(1);
}

const report = JSON.parse(readFileSync(resolve(jsonPath), "utf8"));
const categories = report.categories ?? {};
const audits = report.audits ?? {};
const fetchTime = report.fetchTime ?? new Date().toISOString();
const finalUrl = report.finalDisplayedUrl ?? report.requestedUrl ?? "unknown";

function scorePct(score) {
  if (typeof score !== "number") return "n/a";
  return `${Math.round(score * 100)}`;
}

function auditStatus(score, scoreDisplayMode) {
  if (scoreDisplayMode === "manual" || scoreDisplayMode === "informative") {
    return "info";
  }
  if (scoreDisplayMode === "notApplicable" || score == null) {
    return "na";
  }
  if (score === 1) return "pass";
  if (score >= 0.9) return "warn";
  return "fail";
}

const categoryRows = Object.values(categories).map((cat) => {
  const score = scorePct(cat.score);
  return `| ${cat.title} | ${score} |`;
});

/** Audits that need attention: failed or warning numeric scores. */
const fixCandidates = Object.values(audits)
  .filter((audit) => {
    const status = auditStatus(audit.score, audit.scoreDisplayMode);
    return status === "fail" || status === "warn";
  })
  .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

const byPriority = {
  high: fixCandidates.filter((a) => (a.score ?? 0) < 0.5),
  medium: fixCandidates.filter((a) => (a.score ?? 0) >= 0.5 && (a.score ?? 0) < 0.9),
  low: fixCandidates.filter((a) => (a.score ?? 0) >= 0.9 && (a.score ?? 0) < 1),
};

function formatAudit(audit) {
  const score = scorePct(audit.score);
  const lines = [
    `### ${audit.title}`,
    "",
    `- **ID:** \`${audit.id}\``,
    `- **Score:** ${score}/100`,
  ];
  if (audit.description) {
    lines.push(`- **Why it matters:** ${audit.description.replace(/\n+/g, " ")}`);
  }
  if (audit.displayValue) {
    lines.push(`- **Measured:** ${audit.displayValue}`);
  }
  if (audit.details?.type === "opportunity" && audit.details.overallSavingsMs) {
    lines.push(
      `- **Potential savings:** ~${Math.round(audit.details.overallSavingsMs)} ms`,
    );
  }
  lines.push("");
  lines.push("**Suggested project fix:**");
  lines.push(suggestFix(audit));
  lines.push("");
  return lines.join("\n");
}

function suggestFix(audit) {
  const id = audit.id;
  const map = {
    "unused-javascript":
      "Remove or lazy-load unused client JS; split heavy routes; avoid shipping unused shadcn/UI modules on the guest page.",
    "unused-css-rules":
      "Trim unused Tailwind/global CSS; ensure CSS for unused UI primitives is not on the critical path.",
    "render-blocking-resources":
      "Defer non-critical CSS/JS; prefer Next.js font optimization and avoid blocking third-party scripts in `layout.tsx`.",
    "largest-contentful-paint":
      "Optimize the LCP element (hero heading/list); preload critical fonts; reduce server/TTFB for `/`.",
    "cumulative-layout-shift":
      "Reserve space for calendar/cards/icons; set explicit sizes on images and avoid late-injected layout shifts.",
    "total-blocking-time":
      "Cut long main-thread tasks; defer non-essential client components with `dynamic()` / lazy hydration.",
    "speed-index":
      "Improve above-the-fold paint: smaller first bundle, skeleton placeholders already present — reduce client work before first paint.",
    interactive:
      "Reduce hydration cost on the guest booking page; move non-interactive chrome to Server Components where possible.",
    "uses-long-cache-ttl":
      "Confirm static asset cache headers (already set for `/_next/static`); avoid short TTL on hashed assets.",
    "uses-text-compression":
      "Enable gzip/brotli on the host (Render/nginx) for HTML/JS/CSS responses.",
    "uses-responsive-images":
      "Serve appropriately sized images via `next/image` with width/height.",
    "offscreen-images":
      "Lazy-load below-the-fold images with `next/image` `loading=\"lazy\"`.",
    "font-display":
      "Use `display: swap` / Next.js font loader so text remains visible while fonts load.",
    "color-contrast":
      "Increase contrast for muted text (`text-muted-foreground`) against backgrounds, especially in dark/light themes.",
    "button-name":
      "Ensure icon-only buttons have accessible names (`aria-label`).",
    "link-name":
      "Give links discernible text or `aria-label`.",
    label:
      "Associate form controls with `<label>` / `aria-labelledby` in booking dialogs.",
    "document-title":
      "Set a descriptive `<title>` in `src/app/layout.tsx` metadata.",
    "meta-description":
      "Add `metadata.description` for SEO on the guest booking page.",
    "hreflang":
      "Add hreflang only if you ship multiple locales; otherwise ignore.",
    "is-crawlable":
      "Ensure robots meta / headers allow indexing for public pages if SEO matters.",
    "robots-txt":
      "Add or fix `public/robots.txt` if crawl rules are required.",
    "tap-targets":
      "Increase hit area of slot/time buttons (min ~48px) for mobile.",
    viewport:
      "Keep a proper viewport meta tag in the root layout.",
    "bf-cache":
      "Avoid `unload` listeners and Cache-Control that block back/forward cache.",
  };

  if (map[id]) {
    return map[id];
  }

  return `Review Lighthouse audit \`${id}\` and address the reported failure in the Next.js app (likely under \`src/app\` / \`src/components\`).`;
}

const lines = [];
lines.push("# Lighthouse morning report");
lines.push("");
lines.push(`- **When:** ${fetchTime}`);
lines.push(`- **URL:** ${finalUrl}`);
lines.push("");
lines.push("## Category scores");
lines.push("");
lines.push("| Category | Score |");
lines.push("| --- | ---: |");
lines.push(...categoryRows);
lines.push("");
lines.push("## Fixes to make in the project");
lines.push("");

if (fixCandidates.length === 0) {
  lines.push("No failed or warning audits. No project changes required from this run.");
} else {
  lines.push(
    `Found **${fixCandidates.length}** audits below 100. Prioritized below.`,
  );
  lines.push("");

  if (byPriority.high.length) {
    lines.push("## High priority (score < 50)");
    lines.push("");
    for (const audit of byPriority.high) {
      lines.push(formatAudit(audit));
    }
  }
  if (byPriority.medium.length) {
    lines.push("## Medium priority (score 50–89)");
    lines.push("");
    for (const audit of byPriority.medium) {
      lines.push(formatAudit(audit));
    }
  }
  if (byPriority.low.length) {
    lines.push("## Low priority (score 90–99)");
    lines.push("");
    for (const audit of byPriority.low) {
      lines.push(formatAudit(audit));
    }
  }
}

lines.push("---");
lines.push("");
lines.push(
  "HTML/JSON reports are attached as workflow artifacts (retention 14 days). Open the Actions run from the previous night to review them in the morning.",
);
lines.push("");

const markdown = lines.join("\n");
const out = resolve(outPath);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, markdown, "utf8");
console.log(`Wrote summary: ${out}`);
console.log(
  `Scores: ${Object.values(categories)
    .map((c) => `${c.id}=${scorePct(c.score)}`)
    .join(", ")}`,
);
console.log(`Fix candidates: ${fixCandidates.length}`);
