import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_SOURCE = "https://yummy-frame-152799.framer.app/";
const SOURCE_URL = process.argv[2] || DEFAULT_SOURCE;
const ROOT = process.cwd();
const MIRROR_SCRIPT = path.join(ROOT, "scripts", "mirror-framer-assets.mjs");
const FRAMER_HTML = path.join(ROOT, "data", "framer", "source.html");
const COMPARE_DIR = path.join(ROOT, "data", "compare");
const REPORT_MD = path.join(COMPARE_DIR, "framer-sync-report.md");
const REPORT_JSON = path.join(COMPARE_DIR, "framer-sync-report.json");
const APP_CSS_PATH = path.join(ROOT, "app", "globals.css");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseDeclarations(block = "") {
  const output = {};
  for (const part of block.split(";")) {
    const idx = part.indexOf(":");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key || !val) continue;
    output[key] = val;
  }
  return output;
}

function extractRuleBlock(css, selector) {
  const regex = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`);
  const match = css.match(regex);
  return match ? match[1] : "";
}

function extractMediaBlock(css, queryFragment) {
  const regex = new RegExp(`@media\\s*\\(${escapeRegExp(queryFragment)}\\)\\s*\\{`);
  const startMatch = regex.exec(css);
  if (!startMatch) return "";

  let i = startMatch.index + startMatch[0].length;
  let depth = 1;
  while (i < css.length && depth > 0) {
    const char = css[i];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    i += 1;
  }
  return css.slice(startMatch.index + startMatch[0].length, i - 1);
}

function extractProps(css, selector, props) {
  const block = extractRuleBlock(css, selector);
  const all = parseDeclarations(block);
  const picked = {};
  for (const prop of props) picked[prop] = all[prop] ?? "";
  return picked;
}

function extractInlineStyleProps(html, tagRegex, props) {
  const match = html.match(tagRegex);
  const style = match?.[1] ?? "";
  const all = parseDeclarations(style);
  const picked = {};
  for (const prop of props) picked[prop] = all[prop] ?? "";
  return picked;
}

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parsePx(value) {
  const match = String(value || "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function normalizeCalcCenter(value) {
  if (!value) return "";
  const normalized = normalize(value).replace(/\s+/g, "");
  if (normalized === "calc(50%-10px)") return "5px";
  return value;
}

function toPaddingSides(padding) {
  const vals = normalize(padding).split(" ").filter(Boolean);
  if (vals.length === 1) return { top: vals[0], right: vals[0], bottom: vals[0], left: vals[0] };
  if (vals.length === 2) return { top: vals[0], right: vals[1], bottom: vals[0], left: vals[1] };
  if (vals.length === 3) return { top: vals[0], right: vals[1], bottom: vals[2], left: vals[1] };
  if (vals.length === 4) return { top: vals[0], right: vals[1], bottom: vals[2], left: vals[3] };
  return { top: "", right: "", bottom: "", left: "" };
}

function toLogicalBlock(paddingBlock) {
  const vals = normalize(paddingBlock).split(" ").filter(Boolean);
  if (vals.length === 1) return { top: vals[0], bottom: vals[0] };
  if (vals.length >= 2) return { top: vals[0], bottom: vals[1] };
  return { top: "", bottom: "" };
}

function toLogicalInline(paddingInline) {
  const vals = normalize(paddingInline).split(" ").filter(Boolean);
  if (vals.length === 1) return { left: vals[0], right: vals[0] };
  if (vals.length >= 2) return { left: vals[0], right: vals[1] };
  return { left: "", right: "" };
}

function toPaddingString(sides) {
  return `${sides.top} ${sides.right} ${sides.bottom} ${sides.left}`.trim();
}

function compareRows(rows) {
  return rows.map((row) => {
    const framer = normalize(row.framer);
    const ours = normalize(row.ours);
    const match = framer && ours && framer === ours;
    return { ...row, framer, ours, status: match ? "MATCH" : "DIFF" };
  });
}

function markdownTable(rows) {
  const lines = ["| Check | Framer | Ours | Status |", "|---|---|---|---|"];
  for (const row of rows) {
    lines.push(`| ${row.check} | \`${row.framer || "-"}\` | \`${row.ours || "-"}\` | ${row.status} |`);
  }
  return lines.join("\n");
}

async function main() {
  await fs.mkdir(COMPARE_DIR, { recursive: true });

  execFileSync(process.execPath, [MIRROR_SCRIPT, SOURCE_URL], { stdio: "inherit" });

  const html = await fs.readFile(FRAMER_HTML, "utf8");
  const appCss = await fs.readFile(APP_CSS_PATH, "utf8");

  const styleMatch = html.match(/<style[^>]*data-framer-css-ssr-minified[^>]*>([\s\S]*?)<\/style>/i);
  if (!styleMatch) throw new Error("Framer CSS block not found in source snapshot.");
  const framerCss = styleMatch[1];
  await fs.writeFile(path.join(COMPARE_DIR, "framer_css_live.min.css"), framerCss, "utf8");

  const framerMobileMedia = extractMediaBlock(framerCss, "max-width:809.98px");
  const appMobileMedia = extractMediaBlock(appCss, "max-width: 809.98px");

  const framerNavInline = extractInlineStyleProps(
    html,
    /<nav[^>]*class="[^"]*framer-v-1esu27r[^"]*"[^>]*style="([^"]*)"[^>]*>/i,
    [
      "background-color",
      "backdrop-filter",
      "--border-bottom-width",
      "--border-color",
    ]
  );
  const framerHamburger = extractProps(framerCss, ".framer-zvTCt.framer-enge9g", ["width", "height"]);
  const framerHambLineTop = extractProps(framerCss, ".framer-zvTCt .framer-1y3t1g5", [
    "width",
    "height",
    "top",
    "left",
  ]);
  const framerHambLineBottom = extractProps(framerCss, ".framer-zvTCt .framer-1sepsw4", [
    "width",
    "height",
    "bottom",
    "left",
  ]);
  const framerHeroDesktop = extractProps(framerCss, ".framer-1t0wz46", ["padding"]);
  const framerHeroMobile = extractProps(framerMobileMedia, ".framer-lZ68u .framer-1t0wz46", ["padding"]);

  const appTopbar = extractProps(appCss, ".topbar", [
    "background",
    "backdrop-filter",
    "border-bottom",
    "height",
  ]);
  const appTopbarMobile = extractProps(appMobileMedia, ".topbar", ["height", "padding-inline"]);
  const appToggle = extractProps(appCss, ".menu-toggle", ["width", "height"]);
  const appToggleLine = extractProps(appCss, ".menu-toggle span", ["width", "height", "left"]);
  const appToggleLineTop = extractProps(appCss, ".menu-toggle span:first-child", ["top"]);
  const appToggleLineBottom = extractProps(appCss, ".menu-toggle span:last-child", ["top"]);
  const appHeroDesktop = extractProps(appCss, ".hero", ["padding-inline", "padding-block"]);
  const appHeroMobile = extractProps(appMobileMedia, ".hero", ["padding-inline", "padding-block"]);

  const framerPaddingDesktopSides = toPaddingSides(framerHeroDesktop.padding);
  const framerPaddingMobileSides = toPaddingSides(framerHeroMobile.padding);
  const appDesktopBlock = toLogicalBlock(appHeroDesktop["padding-block"]);
  const appDesktopInline = toLogicalInline(appHeroDesktop["padding-inline"]);
  const appPaddingDesktopSides = {
    top: appDesktopBlock.top,
    right: appDesktopInline.right,
    bottom: appDesktopBlock.bottom,
    left: appDesktopInline.left,
  };
  const appMobileBlock = toLogicalBlock(appHeroMobile["padding-block"]);
  const appMobileInline = toLogicalInline(appHeroMobile["padding-inline"]);
  const appPaddingMobileSides = {
    top: appMobileBlock.top,
    right: appMobileInline.right,
    bottom: appMobileBlock.bottom,
    left: appMobileInline.left,
  };

  const appToggleWidth = parsePx(appToggle.width);
  const appLineHeight = parsePx(appToggleLine.height);
  const appBottomTop = parsePx(appToggleLineBottom.top);
  const appBottomEquivalent = Number.isFinite(appToggleWidth) && Number.isFinite(appLineHeight) && Number.isFinite(appBottomTop)
    ? `${appToggleWidth - appBottomTop - appLineHeight}px`
    : "";

  const rows = compareRows([
    {
      check: "Header background (mobile ref)",
      framer: framerNavInline["background-color"],
      ours: appTopbar.background,
    },
    {
      check: "Header blur",
      framer: framerNavInline["backdrop-filter"],
      ours: appTopbar["backdrop-filter"],
    },
    {
      check: "Hamburger size",
      framer: `${framerHamburger.width} / ${framerHamburger.height}`,
      ours: `${appToggle.width} / ${appToggle.height}`,
    },
    {
      check: "Hamburger line size",
      framer: `${framerHambLineTop.width} / ${framerHambLineTop.height}`,
      ours: `${appToggleLine.width} / ${appToggleLine.height}`,
    },
    {
      check: "Hamburger top line position",
      framer: `${framerHambLineTop.top} / ${normalizeCalcCenter(framerHambLineTop.left)}`,
      ours: `${appToggleLineTop.top} / ${appToggleLine.left}`,
    },
    {
      check: "Hamburger bottom line position",
      framer: `${framerHambLineBottom.bottom} / ${normalizeCalcCenter(framerHambLineBottom.left)}`,
      ours: `${appBottomEquivalent} / ${appToggleLine.left}`,
    },
    {
      check: "Hero padding desktop",
      framer: toPaddingString(framerPaddingDesktopSides),
      ours: toPaddingString(appPaddingDesktopSides),
    },
    {
      check: "Hero padding mobile",
      framer: toPaddingString(framerPaddingMobileSides),
      ours: toPaddingString(appPaddingMobileSides),
    },
    {
      check: "Topbar mobile height",
      framer: "64px",
      ours: appTopbarMobile.height,
    },
    {
      check: "Topbar mobile horizontal padding",
      framer: "18px",
      ours: appTopbarMobile["padding-inline"],
    },
  ]);

  const payload = {
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    snapshot: {
      framerHtml: path.relative(ROOT, FRAMER_HTML),
      framerCss: path.relative(ROOT, path.join(COMPARE_DIR, "framer_css_live.min.css")),
      appCss: path.relative(ROOT, APP_CSS_PATH),
    },
    extracted: {
      framer: {
        navInline: framerNavInline,
        hamburger: { box: framerHamburger, top: framerHambLineTop, bottom: framerHambLineBottom },
        hero: { desktop: framerHeroDesktop, mobile: framerHeroMobile },
      },
      app: {
        topbar: appTopbar,
        topbarMobile: appTopbarMobile,
        hamburger: { box: appToggle, line: appToggleLine, top: appToggleLineTop, bottom: appToggleLineBottom },
        hero: { desktop: appHeroDesktop, mobile: appHeroMobile },
      },
    },
    checks: rows,
  };

  const md = [
    "# Framer Sync Report",
    "",
    `- Source: ${SOURCE_URL}`,
    `- Generated: ${payload.generatedAt}`,
    "",
    "## Snapshot Files",
    "",
    `- Framer HTML: \`${payload.snapshot.framerHtml}\``,
    `- Framer CSS: \`${payload.snapshot.framerCss}\``,
    `- App CSS: \`${payload.snapshot.appCss}\``,
    "",
    "## Header/Hero/Mobile Diff",
    "",
    markdownTable(rows),
    "",
    "## Summary",
    "",
    `- MATCH: ${rows.filter((r) => r.status === "MATCH").length}`,
    `- DIFF: ${rows.filter((r) => r.status === "DIFF").length}`,
  ].join("\n");

  await fs.writeFile(REPORT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await fs.writeFile(REPORT_MD, md, "utf8");

  console.log(`\nWrote: ${path.relative(ROOT, REPORT_MD)}`);
  console.log(`Wrote: ${path.relative(ROOT, REPORT_JSON)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
