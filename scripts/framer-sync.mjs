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
const APP_PAGE_PATH = path.join(ROOT, "app", "page.tsx");

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

function extractPropsByRegex(css, ruleRegex, props) {
  const match = css.match(ruleRegex);
  const all = parseDeclarations(match?.[1] ?? "");
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

function extractChunk(html, regex) {
  const match = html.match(regex);
  return match ? match[0] : "";
}

function extractClassStyleFromChunk(chunk, className) {
  if (!chunk) return {};
  const regex = new RegExp(`<[^>]*class="[^"]*${escapeRegExp(className)}[^"]*"[^>]*style="([^"]*)"[^>]*>`, "i");
  const match = chunk.match(regex);
  return parseDeclarations(match?.[1] ?? "");
}

function extractStyleFromChunk(chunk, regex) {
  const match = chunk.match(regex);
  return parseDeclarations(match?.[1] ?? "");
}

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parsePx(value) {
  const match = String(value || "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function inferLayerSize(layer = {}, wrapper = {}) {
  const wrapperW = parsePx(wrapper.width);
  const wrapperH = parsePx(wrapper.height);
  const width = parsePx(layer.width);
  const height = parsePx(layer.height);
  const left = parsePx(layer.left);
  const right = parsePx(layer.right);
  const top = parsePx(layer.top);
  const bottom = parsePx(layer.bottom);

  const inferredWidth = Number.isFinite(width)
    ? width
    : Number.isFinite(wrapperW) && Number.isFinite(left) && Number.isFinite(right)
      ? wrapperW - left - right
      : NaN;
  const inferredHeight = Number.isFinite(height)
    ? height
    : Number.isFinite(wrapperH) && Number.isFinite(top) && Number.isFinite(bottom)
      ? wrapperH - top - bottom
      : NaN;

  return {
    width: Number.isFinite(inferredWidth) ? `${inferredWidth}px` : "",
    height: Number.isFinite(inferredHeight) ? `${inferredHeight}px` : "",
  };
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

function parseClassStackAtIndex(source, index, classAttr = "class") {
  const html = source.slice(0, Math.max(0, index));
  const tokenRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;
  const classRegex = classAttr === "className"
    ? /className="([^"]+)"/i
    : /class="([^"]+)"/i;
  const stack = [];

  let token;
  while ((token = tokenRegex.exec(html)) !== null) {
    const full = token[0];
    const tag = token[1].toLowerCase();
    const attrs = token[2] ?? "";
    const isClosing = full.startsWith("</");
    const selfClosing = /\/>$/.test(full);

    if (isClosing) {
      for (let i = stack.length - 1; i >= 0; i -= 1) {
        if (stack[i].tag === tag) {
          stack.splice(i, 1);
          break;
        }
      }
      continue;
    }

    const classMatch = attrs.match(classRegex);
    stack.push({
      tag,
      classes: classMatch ? classMatch[1] : "",
    });

    if (selfClosing) stack.pop();
  }

  return stack.filter((entry) => entry.classes);
}

function stackToPath(stack) {
  return stack.map((entry) => `${entry.tag}.${entry.classes.split(" ").join(".")}`);
}

function sharedClassNode(stackA, stackB) {
  const len = Math.min(stackA.length, stackB.length);
  let shared = null;
  for (let i = 0; i < len; i += 1) {
    if (stackA[i].tag === stackB[i].tag && stackA[i].classes === stackB[i].classes) {
      shared = stackA[i];
    } else {
      break;
    }
  }
  return shared;
}

function findIndexNear(source, needle, anchor, maxDistance = 120000) {
  if (anchor < 0) return source.indexOf(needle);
  const idx = source.indexOf(needle, anchor);
  if (idx === -1) return -1;
  if (idx - anchor > maxDistance) return -1;
  return idx;
}

async function main() {
  await fs.mkdir(COMPARE_DIR, { recursive: true });

  execFileSync(process.execPath, [MIRROR_SCRIPT, SOURCE_URL], { stdio: "inherit" });

  const html = await fs.readFile(FRAMER_HTML, "utf8");
  const appCss = await fs.readFile(APP_CSS_PATH, "utf8");
  const appPage = await fs.readFile(APP_PAGE_PATH, "utf8");

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
  const framerHeaderWrapperMobile = extractProps(
    framerCss,
    ".framer-ktuoI.framer-v-1esu27r .framer-1aqw7tj",
    ["padding", "gap", "height", "overflow"]
  );
  const framerHeaderLogoRowMobile = extractProps(
    framerCss,
    ".framer-ktuoI.framer-v-1esu27r .framer-e3m6kx",
    ["justify-content", "height", "width"]
  );
  const framerBadge = extractProps(framerCss, ".framer-y5z8st", ["padding", "gap"]);
  const framerBadgePulse = extractProps(framerCss, ".framer-iRvoL .framer-5ebvu8", ["width", "height"]);
  const framerBadgeText = extractProps(framerCss, ".framer-iRvoL .framer-1g1kez6", [
    "white-space",
    "width",
    "height",
    "position",
  ]);
  const framerBadgeChunk = extractChunk(
    html,
    /<div class="framer-iRvoL[\s\S]*?2 freie Plätze \| Januar 2026[\s\S]*?<\/div><\/div><\/div>/i
  );
  const framerBadgePingLayer = extractProps(framerCss, ".framer-iRvoL .framer-f0lo8w", [
    "left",
    "top",
    "right",
    "bottom",
    "width",
    "height",
  ]);
  const framerBadgeSolidLayer = extractProps(framerCss, ".framer-iRvoL .framer-1gy39l1", [
    "left",
    "top",
    "right",
    "bottom",
    "width",
    "height",
  ]);
  const framerHeroOuter = extractProps(framerCss, ".framer-lZ68u .framer-7dmf0w", ["gap"]);
  const framerHeroMain = extractProps(framerCss, ".framer-lZ68u .framer-63wktm", ["gap", "max-width"]);
  const framerHeroLeftStack = extractProps(framerCss, ".framer-lZ68u .framer-17ibdrm", [
    "gap",
    "min-width",
    "max-width",
  ]);
  const framerHeroLeftStackMobile = extractProps(framerMobileMedia, ".framer-lZ68u .framer-17ibdrm", [
    "gap",
    "min-width",
    "width",
  ]);
  const framerHeroHeadingBlock = extractProps(framerCss, ".framer-lZ68u .framer-13alot3", ["gap"]);
  const framerHeroHeadingBlockMobile = extractProps(framerMobileMedia, ".framer-lZ68u .framer-13alot3", ["gap"]);
  const framerHeroRight = extractProps(framerCss, ".framer-lZ68u .framer-1f4kieq", [
    "gap",
    "min-width",
    "max-width",
    "padding",
  ]);
  const framerHeroCard = extractProps(framerCss, ".framer-s8bNR.framer-55vxhz", ["width", "padding"]);
  const framerHeroArc = extractProps(framerCss, ".framer-lZ68u .framer-6zbmna", ["width", "height", "top", "right"]);
  const framerHeroLight = extractProps(framerCss, ".framer-lZ68u .framer-1mhdpyj", ["width", "height", "top", "right"]);

  const framerHeroMobileH1Chunk = extractChunk(
    html,
    /<div class="ssr-variant hidden-7lwtj4 hidden-72rtr7"><div class="framer-1d7p3v8"[\s\S]*?<\/h1><\/div><\/div>/i
  );
  const framerHeroH1Base = extractStyleFromChunk(framerHeroMobileH1Chunk, /<h1 style="([^"]*)"/i);
  const framerHeroH1Serif = extractStyleFromChunk(
    framerHeroMobileH1Chunk,
    /<span style="([^"]*Instrument Serif[^"]*)"/i
  );
  const framerHeroH1Inter = extractStyleFromChunk(
    framerHeroMobileH1Chunk,
    /<span style="([^"]*Inter Placeholder[^"]*--framer-font-weight:500[^"]*)"/i
  );

  const framerCtaMobileChunk = extractChunk(
    html,
    /<a class="[^"]*framer-Fl12I[^"]*framer-v-1pdr1wz[^"]*"[\s\S]*?<\/a>/i
  );
  const framerCtaMobileRoot = extractStyleFromChunk(framerCtaMobileChunk, /<a class="[^"]*framer-v-1pdr1wz[^"]*"[^>]*style="([^"]*)"/i);
  const framerCtaMobileGlow = extractClassStyleFromChunk(framerCtaMobileChunk, "framer-970ela");
  const framerCtaMobileStroke = extractClassStyleFromChunk(framerCtaMobileChunk, "framer-l6w58q");
  const framerCtaMobileFill = extractClassStyleFromChunk(framerCtaMobileChunk, "framer-1uukn9o");
  const framerCtaFrame = extractProps(framerCss, ".framer-1m7j0kf", ["padding", "gap"]);
  const framerCtaContentRow = extractProps(framerCss, ".framer-hrkeo7", ["gap"]);

  const appTopbar = extractProps(appCss, ".topbar", [
    "background",
    "backdrop-filter",
    "border-bottom",
    "height",
  ]);
  const appTopbarMobile = extractProps(appMobileMedia, ".topbar", ["height", "padding-inline", "overflow"]);
  const appTopbarInnerMobile = extractProps(appMobileMedia, ".topbar-inner", ["padding"]);
  const appToggle = extractProps(appCss, ".menu-toggle", ["width", "height"]);
  const appToggleLine = extractProps(appCss, ".menu-toggle span", ["width", "height", "left"]);
  const appToggleLineTop = extractProps(appCss, ".menu-toggle span:first-child", ["top"]);
  const appToggleLineBottom = extractProps(appCss, ".menu-toggle span:last-child", ["top"]);
  const appHeroDesktop = extractProps(appCss, ".hero", ["padding-inline", "padding-block"]);
  const appHeroMobile = extractProps(appMobileMedia, ".hero", ["padding-inline", "padding-block"]);
  const appHeroHeadlineMobile = extractProps(appMobileMedia, ".hero-headline", ["font-size", "line-height", "letter-spacing"]);
  const appWordPlain = extractProps(appCss, ".word-plain", ["font-size"]);
  const appWordPlainMobile = extractProps(appMobileMedia, ".word-plain", ["font-size"]);
  const appSoftSerif = extractProps(appCss, ".soft-serif", ["color", "font-size"]);
  const appPulseTag = extractProps(appCss, ".pulse-tag", ["gap", "padding"]);
  const appPulseDot = extractProps(appCss, ".pulse-dot", ["width", "height"]);
  const appPulseDotCore = extractProps(appCss, ".pulse-dot-solid", ["width", "height", "left", "top"]);
  const appPulseText = extractProps(appCss, ".pulse-text", ["white-space", "width", "height", "position"]);
  const appHeroContent = extractProps(appCss, ".hero-content", ["width"]);
  const appHeroGrid = extractProps(appCss, ".hero-grid", ["gap"]);
  const appHeroGridMobile = extractProps(appMobileMedia, ".hero-grid", ["gap"]);
  const appHeroContentStack = extractProps(appCss, ".hero-content", ["gap"]);
  const appHeroCopy = extractProps(appCss, ".hero-copy", ["gap", "min-width", "max-width"]);
  const appHeroCopyMobile = extractProps(appMobileMedia, ".hero-copy", ["gap", "min-width", "width"]);
  const appHeroTextBlock = extractProps(appCss, ".hero-text-block", ["gap"]);
  const appHeroTextBlockMobile = extractProps(appMobileMedia, ".hero-text-block", ["gap"]);
  const appHeroVisual = extractProps(appCss, ".hero-visual", ["gap", "min-width", "max-width", "padding"]);
  const appHeroCard = extractProps(appCss, ".hero-image-wrap", ["width", "padding", "transform", "border-radius"]);
  const appHeroArc = extractProps(appCss, ".hero-ring", ["width", "height", "top", "right"]);
  const appHeroLight = extractProps(appCss, ".hero-side-glow", ["width", "height", "top", "right"]);
  const appHeroActionsBase = extractProps(appCss, ".hero-actions", ["margin-top", "gap"]);
  const appCtaMobile = extractPropsByRegex(
    appMobileMedia,
    /\.hero-actions\s+\.cta-primary,\s*\.hero-actions\s+\.cta-ref\s*\{([^}]*)\}/,
    ["padding", "gap"]
  );
  const appCtaMobileRef = extractProps(appMobileMedia, ".hero-actions .cta-ref", ["padding", "gap"]);
  const appCtaLayersMobile = extractProps(appMobileMedia, ".hero .cta-stack .cta-stroke", ["display"]);
  const appCtaLabelBase = extractProps(appCss, ".cta-stack .cta-label", ["gap"]);
  const appCtaLabelMobile = extractProps(appMobileMedia, ".cta-stack .cta-label", ["gap"]);

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
  const appHeaderWrapperSynthetic = appTopbarInnerMobile.padding || "";
  const framerSerifSize = framerHeroH1Serif["--framer-font-size"] || framerHeroH1Base["--framer-font-size"];
  const framerInterSize = framerHeroH1Inter["--framer-font-size"] || "";
  const framerSizeRatio =
    Number.isFinite(parsePx(framerInterSize)) && Number.isFinite(parsePx(framerSerifSize)) && parsePx(framerSerifSize) !== 0
      ? String((parsePx(framerInterSize) / parsePx(framerSerifSize)).toFixed(2))
      : "";
  const appWordPlainScaleRaw = appWordPlainMobile["font-size"] || appWordPlain["font-size"];
  const appWordPlainScale = appWordPlainScaleRaw.endsWith("em")
    ? Number.parseFloat(appWordPlainScaleRaw).toFixed(2)
    : appWordPlainScaleRaw;

  const framerBadgeCore = inferLayerSize(framerBadgeSolidLayer, framerBadgePulse);
  const appBadgeCore = inferLayerSize(appPulseDotCore, appPulseDot);
  const framerBadgeCoreModel = framerBadgeChunk.includes("framer-1gy39l1") ? "layered" : "single";
  const appBadgeCoreModel = appPage.includes("pulse-dot-solid") ? "layered" : "single";

  const framerBadgeIdx = html.indexOf("2 freie Plätze | Januar 2026");
  const framerH1Idx = findIndexNear(html, "Markenführung", framerBadgeIdx);
  const framerH2Idx = findIndexNear(html, "Austauschbarkeit", framerH1Idx);
  const appBadgeIdx = appPage.indexOf("2 freie Plätze | Januar 2026");
  const appH1Idx = appPage.indexOf("Markenführung");
  const appH2Idx = appPage.indexOf("Austauschbarkeit");

  const framerBadgeStack = parseClassStackAtIndex(html, framerBadgeIdx, "class");
  const framerH1Stack = parseClassStackAtIndex(html, framerH1Idx, "class");
  const framerH2Stack = parseClassStackAtIndex(html, framerH2Idx, "class");
  const appBadgeStack = parseClassStackAtIndex(appPage, appBadgeIdx, "className");
  const appH1Stack = parseClassStackAtIndex(appPage, appH1Idx, "className");
  const appH2Stack = parseClassStackAtIndex(appPage, appH2Idx, "className");

  const framerSharedBadgeH1 = sharedClassNode(framerBadgeStack, framerH1Stack);
  const framerSharedBadgeH2 = sharedClassNode(framerBadgeStack, framerH2Stack);
  const appSharedBadgeH1 = sharedClassNode(appBadgeStack, appH1Stack);
  const appSharedBadgeH2 = sharedClassNode(appBadgeStack, appH2Stack);

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
      ours: appTopbarMobile["padding-inline"] || "18px",
    },
    {
      check: "Header wrapper mobile padding model",
      framer: framerHeaderWrapperMobile.padding,
      ours: appHeaderWrapperSynthetic,
    },
    {
      check: "Header wrapper mobile overflow",
      framer: framerHeaderWrapperMobile.overflow,
      ours: appTopbarMobile.overflow || "visible",
    },
    {
      check: "Header logo row justify-content",
      framer: framerHeaderLogoRowMobile["justify-content"],
      ours: "space-between",
    },
    {
      check: "Badge padding",
      framer: framerBadge.padding,
      ours: appPulseTag.padding || "0",
    },
    {
      check: "Badge gap",
      framer: framerBadge.gap,
      ours: appPulseTag.gap,
    },
    {
      check: "Badge pulse dot size",
      framer: `${framerBadgePulse.width} / ${framerBadgePulse.height}`,
      ours: `${appPulseDot.width} / ${appPulseDot.height}`,
    },
    {
      check: "Badge pulse core model",
      framer: framerBadgeCoreModel,
      ours: appBadgeCoreModel,
    },
    {
      check: "Badge pulse core size target",
      framer: "6px / 6px",
      ours: `${appBadgeCore.width || "auto"} / ${appBadgeCore.height || "auto"}`,
    },
    {
      check: "Badge text wrapper model",
      framer: `${framerBadgeText["white-space"]} / ${framerBadgeText.width} / ${framerBadgeText.position}`,
      ours: `${appPulseText["white-space"]} / ${appPulseText.width} / ${appPulseText.position}`,
    },
    {
      check: "Hero outer container gap source",
      framer: framerHeroOuter.gap,
      ours: appHeroContentStack.gap,
    },
    {
      check: "Hero main wrapper gap (desktop)",
      framer: framerHeroMain.gap,
      ours: appHeroGrid.gap,
    },
    {
      check: "Hero main wrapper gap (mobile)",
      framer: framerHeroMain.gap,
      ours: appHeroGridMobile.gap || appHeroGrid.gap,
    },
    {
      check: "Left content stack gap (badge->cta)",
      framer: framerHeroLeftStack.gap,
      ours: appHeroCopy.gap,
    },
    {
      check: "Left content stack gap (mobile)",
      framer: framerHeroLeftStackMobile.gap || framerHeroLeftStack.gap,
      ours: appHeroCopyMobile.gap || appHeroCopy.gap,
    },
    {
      check: "Heading block gap (tag/h1/h2)",
      framer: framerHeroHeadingBlock.gap,
      ours: appHeroTextBlock.gap,
    },
    {
      check: "Heading block gap (mobile)",
      framer: framerHeroHeadingBlockMobile.gap || framerHeroHeadingBlock.gap,
      ours: appHeroTextBlockMobile.gap || appHeroTextBlock.gap,
    },
    {
      check: "Hero right column model",
      framer: `${framerHeroRight["min-width"]} / ${framerHeroRight["max-width"]} / ${framerHeroRight.padding}`,
      ours: `${appHeroVisual["min-width"]} / ${appHeroVisual["max-width"]} / ${appHeroVisual.padding}`,
    },
    {
      check: "Hero card frame",
      framer: `${framerHeroCard.width} / ${framerHeroCard.padding}`,
      ours: `${appHeroCard.width} / ${appHeroCard.padding}`,
    },
    {
      check: "Hero arc anchor",
      framer: `${framerHeroArc.width} / ${framerHeroArc.height} / ${framerHeroArc.top} / ${framerHeroArc.right}`,
      ours: `${appHeroArc.width} / ${appHeroArc.height} / ${appHeroArc.top} / ${appHeroArc.right}`,
    },
    {
      check: "Hero side light anchor",
      framer: `${framerHeroLight.width} / ${framerHeroLight.height} / ${framerHeroLight.top} / ${framerHeroLight.right}`,
      ours: `${appHeroLight.width} / ${appHeroLight.height} / ${appHeroLight.top} / ${appHeroLight.right}`,
    },
    {
      check: "Shared wrapper: badge + h1",
      framer: framerSharedBadgeH1 ? "shared" : "separate",
      ours: appSharedBadgeH1 ? "shared" : "separate",
    },
    {
      check: "Shared wrapper: badge + h2",
      framer: framerSharedBadgeH2 ? "shared" : "separate",
      ours: appSharedBadgeH2 ? "shared" : "separate",
    },
    {
      check: "Hero H1 base font-size (mobile)",
      framer: framerHeroH1Base["--framer-font-size"],
      ours: appHeroHeadlineMobile["font-size"],
    },
    {
      check: "Hero H1 serif color role",
      framer: framerHeroH1Serif["--framer-text-color"] || framerHeroH1Base["--framer-text-color"],
      ours: appSoftSerif.color,
    },
    {
      check: "Hero H1 inter/serif size ratio",
      framer: framerSizeRatio,
      ours:
        Number.isFinite(parsePx(appWordPlainScaleRaw)) && Number.isFinite(parsePx(appSoftSerif["font-size"]))
          ? String((parsePx(appWordPlainScaleRaw) / parsePx(appSoftSerif["font-size"])).toFixed(2))
          : appWordPlainScale || "1.00",
    },
    {
      check: "Hero CTA mobile frame padding",
      framer: framerCtaFrame.padding,
      ours: appCtaMobile.padding,
    },
    {
      check: "Hero CTA mobile frame gap",
      framer: framerCtaFrame.gap,
      ours: appCtaMobile.gap,
    },
    {
      check: "Hero CTA content row gap",
      framer: framerCtaContentRow.gap,
      ours: appCtaLabelMobile.gap || appCtaLabelBase.gap,
    },
    {
      check: "Hero CTA layers visible on mobile",
      framer: "visible",
      ours: appCtaLayersMobile.display === "none" ? "hidden" : "visible",
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
        headerMobile: { wrapper: framerHeaderWrapperMobile, logoRow: framerHeaderLogoRowMobile },
        hamburger: { box: framerHamburger, top: framerHambLineTop, bottom: framerHambLineBottom },
        badge: {
          container: framerBadge,
          pulse: framerBadgePulse,
          text: framerBadgeText,
          pingLayer: framerBadgePingLayer,
          solidLayer: framerBadgeSolidLayer,
        },
        heroStructure: {
          outer: framerHeroOuter,
          main: framerHeroMain,
          leftStack: framerHeroLeftStack,
          leftStackMobile: framerHeroLeftStackMobile,
          headingBlock: framerHeroHeadingBlock,
          headingBlockMobile: framerHeroHeadingBlockMobile,
          rightColumn: framerHeroRight,
          card: framerHeroCard,
          arc: framerHeroArc,
          sideLight: framerHeroLight,
        },
        heroH1Mobile: { base: framerHeroH1Base, serif: framerHeroH1Serif, inter: framerHeroH1Inter },
        ctaMobile: {
          root: framerCtaMobileRoot,
          frame: framerCtaFrame,
          content: framerCtaContentRow,
          glow: framerCtaMobileGlow,
          stroke: framerCtaMobileStroke,
          fill: framerCtaMobileFill,
        },
        hero: { desktop: framerHeroDesktop, mobile: framerHeroMobile },
      },
      app: {
        topbar: appTopbar,
        topbarMobile: appTopbarMobile,
        hamburger: { box: appToggle, line: appToggleLine, top: appToggleLineTop, bottom: appToggleLineBottom },
        badge: { container: appPulseTag, dot: appPulseDot, dotCore: appPulseDotCore, text: appPulseText },
        heroStructure: {
          content: appHeroContent,
          contentStack: appHeroContentStack,
          copyStack: appHeroCopy,
          copyStackMobile: appHeroCopyMobile,
          headingBlock: appHeroTextBlock,
          headingBlockMobile: appHeroTextBlockMobile,
          rightColumn: appHeroVisual,
          card: appHeroCard,
          arc: appHeroArc,
          sideLight: appHeroLight,
          gridDesktop: appHeroGrid,
          gridMobile: appHeroGridMobile,
          leadToActions: appHeroActionsBase,
        },
        heroH1Mobile: { headline: appHeroHeadlineMobile, wordPlain: appWordPlain, softSerif: appSoftSerif },
        ctaMobile: {
          primary: appCtaMobile,
          reference: appCtaMobileRef,
          layers: appCtaLayersMobile,
        },
        hero: { desktop: appHeroDesktop, mobile: appHeroMobile },
      },
      structure: {
        framer: {
          badgePath: stackToPath(framerBadgeStack),
          h1Path: stackToPath(framerH1Stack),
          h2Path: stackToPath(framerH2Stack),
          sharedBadgeH1: framerSharedBadgeH1 || null,
          sharedBadgeH2: framerSharedBadgeH2 || null,
        },
        app: {
          badgePath: stackToPath(appBadgeStack),
          h1Path: stackToPath(appH1Stack),
          h2Path: stackToPath(appH2Stack),
          sharedBadgeH1: appSharedBadgeH1 || null,
          sharedBadgeH2: appSharedBadgeH2 || null,
        },
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
    "## Hero Structure Map",
    "",
    `- Framer shared wrapper (badge + h1): \`${framerSharedBadgeH1?.classes || "none"}\``,
    `- Framer shared wrapper (badge + h2): \`${framerSharedBadgeH2?.classes || "none"}\``,
    `- App shared wrapper (badge + h1): \`${appSharedBadgeH1?.classes || "none"}\``,
    `- App shared wrapper (badge + h2): \`${appSharedBadgeH2?.classes || "none"}\``,
    "",
    `- Framer badge path tail: \`${stackToPath(framerBadgeStack).slice(-6).join(" > ") || "n/a"}\``,
    `- Framer h1 path tail: \`${stackToPath(framerH1Stack).slice(-6).join(" > ") || "n/a"}\``,
    `- App badge path tail: \`${stackToPath(appBadgeStack).slice(-6).join(" > ") || "n/a"}\``,
    `- App h1 path tail: \`${stackToPath(appH1Stack).slice(-6).join(" > ") || "n/a"}\``,
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
