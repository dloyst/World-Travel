/* Build the two derived copies of roadtrip.html.
 *
 *   roadtrip-hosted.html    for any ordinary web host (Netlify, Pages, …).
 *                           Full document, fonts embedded, no network calls
 *                           at all. This is the one where sharing by link
 *                           works, because the browser owns the address bar.
 *
 *   roadtrip-artifact.html  for claude.ai artifacts. Same, minus the document
 *                           scaffolding the artifact host supplies itself.
 *                           Note the artifact viewer strips the URL fragment,
 *                           so link-sharing does NOT work in that copy.
 *
 * Usage: node build.js [path/to/faces.css]
 * faces.css holds @font-face rules with base64 woff2 payloads.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "roadtrip.html");
const FACES = process.argv[2] || path.join(__dirname, "fonts", "faces.css");
const src = fs.readFileSync(SRC, "utf8");
const faces = fs.readFileSync(FACES, "utf8");

const DARK = `
  --paper:#0f1715; --surface:#151f1d; --surface-2:#1b2624;
  --ink:#e5ebe4; --ink-2:#b0bdb7; --ink-3:#7c8b85;
  --rule:#2b3936; --rule-2:#222f2c;
  --e0:#3aa7b2; --e1:#83bc63; --e2:#dfb93c; --e3:#d47d3f; --e4:#bcc0cc;
  --accent:#3aa7b2; --warn:#d47d3f; --alert:#e4735c; --ok:#83bc63;
  --flash:#3d3620;
  --shadow:0 1px 0 rgba(0,0,0,.35), 0 8px 24px -14px rgba(0,0,0,.75);`;

/* transforms both copies share */
function common(h){
  // fonts come from the file itself, never the network
  h = h.replace(/<link rel="preconnect"[^>]*>\n/g, "")
       .replace(/<link href="https:\/\/fonts\.googleapis[^>]*>\n/, "");
  h = h.replace("<style>\n", "<style>\n" + faces + "\n");

  // dark theme, defined token-level across all three viewer states
  h = h.replace("  --dur:.28s;\n}",
    "  --dur:.28s;\n  --flash:#f5e2b8;\n}\n\n" +
    "/* Dark: same hypsometric logic, lifted so the bands stay legible on a night ground. */\n" +
    "@media (prefers-color-scheme: dark){ :root:not([data-theme=\"light\"]){" + DARK + "\n} }\n" +
    ":root[data-theme=\"dark\"]{" + DARK + "\n}");
  h = h.replace("@keyframes flash{0%{background:#f5e2b8}100%{background:transparent}}",
                "@keyframes flash{0%{background:var(--flash)}100%{background:transparent}}");

  // print has to survive a dark viewer theme
  h = h.replace(":root{--paper:#fff;--surface:#fff;--surface-2:#fff;--rule:#bbb;--rule-2:#ddd}",
    ":root{--paper:#fff;--surface:#fff;--surface-2:#fff;--ink:#111;--ink-2:#333;--ink-3:#666;" +
    "--rule:#bbb;--rule-2:#ddd;--e0:#1f6f78;--e1:#5c8f4e;--e2:#c39a1f;--e3:#b0632c;--e4:#8d8f9c}");

  // the SVG samples CSS custom properties at draw time — redraw on theme flip
  h = h.replace("  let rt;\n  addEventListener(\"resize\"",
`  const repaint = () => renderTransect(schedule());
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaint); } catch(e){}
  new MutationObserver(repaint).observe(document.documentElement, {attributes:true, attributeFilter:["data-theme"]});

  let rt;
  addEventListener("resize"`);

  h = h.replace(/Save <code>roadtrip\.html<\/code> to disk and open it in a\n    browser \(Chrome, Safari, Firefox\) and it will work\. Nothing is fetched from the network except\n    the fonts, so it runs fine offline\./,
    "Open this page in a browser with JavaScript enabled. Nothing is fetched from the network at all —\n    the typefaces are embedded — so it works offline too.");
  return h;
}

function write(name, html, expectScaffold){
  fs.writeFileSync(path.join(__dirname, name), html);
  const hasScaffold = /<!doctype html>/i.test(html);
  const externals = (html.match(/(?:src|href)="https?:\/\/(?![^"]*")/g) || []).length;
  const ok = hasScaffold === expectScaffold &&
             (html.match(/@font-face/g) || []).length >= 3 &&
             html.slice(0, 8192).includes("<title>");
  console.log(name.padEnd(24),
    (html.length / 1048576).toFixed(2) + "MB",
    "doctype:" + hasScaffold,
    "fonts:" + (html.match(/@font-face/g) || []).length,
    "dark:" + (html.match(/prefers-color-scheme: dark/g) || []).length,
    ok ? "OK" : "*** CHECK FAILED ***");
  return ok;
}

let pass = true;

/* 1. hosted — keep the full document exactly as authored */
pass = write("roadtrip-hosted.html", common(src), true) && pass;

/* 2. artifact — strip what the artifact host supplies itself */
let art = common(src)
  .replace(/^<!doctype html>\n/i, "")
  .replace(/^<meta charset="utf-8">\n/m, "")
  .replace(/<meta name="viewport"[^>]*>\n/, "")
  .replace(/\n<body>\n/, "\n");
pass = write("roadtrip-artifact.html", art, false) && pass;

if(!pass) process.exit(1);
