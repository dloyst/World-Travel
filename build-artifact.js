/* Build the hosted variant from roadtrip.html.
   The Artifact sandbox blocks external requests, so the webfonts are inlined
   as data URIs and the document scaffolding is stripped (the host supplies it).

   Usage:  node build-artifact.js  [path/to/faces.css]
   faces.css holds the @font-face rules with base64 woff2 payloads; regenerate
   it by fetching the latin subsets from fonts.googleapis.com.                */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "roadtrip.html");
const OUT = path.join(__dirname, "roadtrip-artifact.html");
const FACES = process.argv[2] || path.join(__dirname, "fonts", "faces.css");

let h = fs.readFileSync(SRC, "utf8");
const faces = fs.readFileSync(FACES, "utf8");

// 1. strip the scaffolding the Artifact wrapper supplies
h = h.replace(/^<meta charset="utf-8">\n/, "")
     .replace(/<meta name="viewport"[^>]*>\n/, "")
     .replace(/<link rel="preconnect"[^>]*>\n/g, "")
     .replace(/<link href="https:\/\/fonts\.googleapis[^>]*>\n/, "")
     .replace(/\n<body>\n/, "\n");

// 2. inline the typefaces at the top of the stylesheet
h = h.replace("<style>\n", "<style>\n" + faces + "\n");

// 3. dark theme — tokens only, across all three viewer states
const DARK = `
  --paper:#0f1715; --surface:#151f1d; --surface-2:#1b2624;
  --ink:#e5ebe4; --ink-2:#b0bdb7; --ink-3:#7c8b85;
  --rule:#2b3936; --rule-2:#222f2c;
  --e0:#3aa7b2; --e1:#83bc63; --e2:#dfb93c; --e3:#d47d3f; --e4:#bcc0cc;
  --accent:#3aa7b2; --warn:#d47d3f; --alert:#e4735c; --ok:#83bc63;
  --flash:#3d3620;
  --shadow:0 1px 0 rgba(0,0,0,.35), 0 8px 24px -14px rgba(0,0,0,.75);`;
h = h.replace("  --dur:.28s;\n}",
  "  --dur:.28s;\n  --flash:#f5e2b8;\n}\n\n" +
  "/* Dark: same hypsometric logic, lifted so the bands stay legible on a night ground. */\n" +
  "@media (prefers-color-scheme: dark){ :root:not([data-theme=\"light\"]){" + DARK + "\n} }\n" +
  ":root[data-theme=\"dark\"]{" + DARK + "\n}");
h = h.replace("@keyframes flash{0%{background:#f5e2b8}100%{background:transparent}}",
              "@keyframes flash{0%{background:var(--flash)}100%{background:transparent}}");

// 4. print must survive a dark viewer theme
h = h.replace(":root{--paper:#fff;--surface:#fff;--surface-2:#fff;--rule:#bbb;--rule-2:#ddd}",
  ":root{--paper:#fff;--surface:#fff;--surface-2:#fff;--ink:#111;--ink-2:#333;--ink-3:#666;" +
  "--rule:#bbb;--rule-2:#ddd;--e0:#1f6f78;--e1:#5c8f4e;--e2:#c39a1f;--e3:#b0632c;--e4:#8d8f9c}");

// 5. the SVG samples CSS custom properties at draw time — redraw on theme flip
h = h.replace("  let rt;\n  addEventListener(\"resize\"",
`  const repaint = () => renderTransect(schedule());
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaint); } catch(e){}
  new MutationObserver(repaint).observe(document.documentElement, {attributes:true, attributeFilter:["data-theme"]});

  let rt;
  addEventListener("resize"`);

// 6. the no-script notice is about a preview pane, not a downloaded file
h = h.replace(/Save <code>roadtrip\.html<\/code> to disk and open it in a\n    browser \(Chrome, Safari, Firefox\) and it will work\. Nothing is fetched from the network except\n    the fonts, so it runs fine offline\./,
  "Open this page in a browser with JavaScript enabled. Nothing is fetched from the network at all —\n    the typefaces are embedded — so it runs fine offline.");

fs.writeFileSync(OUT, h);

const checks = {
  megabytes: +(h.length / 1048576).toFixed(2),
  titleInFirst8KB: h.slice(0, 8192).includes("<title>"),
  noScaffolding: !/<(!doctype|html|body|head)[\s>]/i.test(h),
  fontFaces: (h.match(/@font-face/g) || []).length,
  darkBlocks: (h.match(/prefers-color-scheme: dark/g) || []).length
};
console.log(JSON.stringify(checks, null, 1));
if(!checks.noScaffolding || !checks.titleInFirst8KB || checks.fontFaces < 3)
  { console.error("BUILD CHECK FAILED"); process.exit(1); }
