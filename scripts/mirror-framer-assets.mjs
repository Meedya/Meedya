import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const SOURCE_URL = process.argv[2] || 'https://yummy-frame-152799.framer.app/';
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data', 'framer');
const OUT_DIR = path.join(ROOT, 'public', 'framer-mirror');

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractUrls(html) {
  const urls = new Set();
  const direct = html.match(/https:\/\/[^\s"'<>`]+/g) || [];
  for (const raw of direct) {
    const cleaned = decodeHtml(raw).replace(/[),.;]+$/, '');
    urls.add(cleaned);
  }

  const srcsetMatches = html.match(/srcset="([^"]+)"/g) || [];
  for (const srcset of srcsetMatches) {
    const value = decodeHtml(srcset.slice(8, -1));
    const parts = value.split(',').map((p) => p.trim().split(' ')[0]).filter(Boolean);
    for (const part of parts) urls.add(part);
  }

  const assetLike = [...urls].filter((url) => {
    if (!url.startsWith('https://')) return false;
    return (
      url.includes('framerusercontent.com/') ||
      url.includes('framer.com/edit/') ||
      url.includes('fonts.gstatic.com/') ||
      url.includes('fonts.googleapis.com/')
    );
  });

  return [...new Set(assetLike)].sort();
}

function extFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname || '';
    const ext = path.extname(pathname);
    if (ext) return ext.replace(/[^a-zA-Z0-9.]/g, '');
  } catch {
    return '.bin';
  }
  return '.bin';
}

function targetPathFor(url) {
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
  const ext = extFromUrl(url);
  const host = new URL(url).hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const file = `${hash}${ext}`;
  return path.join(OUT_DIR, host, file);
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

async function download(url) {
  const target = targetPathFor(url);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    return { url, target, ok: false, status: response.status, bytes: 0 };
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(target, buffer);
  return { url, target, ok: true, status: response.status, bytes: buffer.length };
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const html = await fetchText(SOURCE_URL);
  const htmlPath = path.join(DATA_DIR, 'source.html');
  await fs.writeFile(htmlPath, html, 'utf8');

  const urls = extractUrls(html);
  const results = [];

  for (const url of urls) {
    try {
      const result = await download(url);
      results.push(result);
      const mark = result.ok ? 'OK ' : 'ERR';
      console.log(`${mark} ${result.status} ${url}`);
    } catch (error) {
      results.push({ url, target: targetPathFor(url), ok: false, status: 0, bytes: 0, error: String(error) });
      console.log(`ERR 000 ${url}`);
    }
  }

  const manifest = {
    sourceUrl: SOURCE_URL,
    mirroredAt: new Date().toISOString(),
    totalUrls: urls.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    bytes: results.reduce((sum, r) => sum + (r.bytes || 0), 0),
    items: results
  };

  const manifestPath = path.join(DATA_DIR, 'asset-manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  const byExt = new Map();
  for (const item of results.filter((r) => r.ok)) {
    const ext = path.extname(item.target) || '.bin';
    byExt.set(ext, (byExt.get(ext) || 0) + 1);
  }

  const lines = [];
  lines.push('# Framer Asset Mirror Report');
  lines.push('');
  lines.push(`- Source: ${SOURCE_URL}`);
  lines.push(`- Mirrored at: ${manifest.mirroredAt}`);
  lines.push(`- Total URLs: ${manifest.totalUrls}`);
  lines.push(`- Success: ${manifest.success}`);
  lines.push(`- Failed: ${manifest.failed}`);
  lines.push(`- Downloaded bytes: ${manifest.bytes}`);
  lines.push('');
  lines.push('## File Types');
  lines.push('');
  for (const [ext, count] of [...byExt.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`- ${ext}: ${count}`);
  }
  lines.push('');
  lines.push('## Paths');
  lines.push('');
  lines.push(`- HTML snapshot: ${path.relative(ROOT, htmlPath)}`);
  lines.push(`- Manifest JSON: ${path.relative(ROOT, manifestPath)}`);
  lines.push(`- Asset root: ${path.relative(ROOT, OUT_DIR)}`);

  await fs.writeFile(path.join(DATA_DIR, 'asset-report.md'), lines.join('\n'), 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
