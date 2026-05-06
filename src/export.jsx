// Export — rasterize a DOM node to PNG, or serialize to SVG.
//
// Pipeline: clone the live DOM with inline computed styles → wrap in an SVG
// <foreignObject> → load the SVG into an <img> → draw it onto a 2× canvas →
// canvas.toBlob("image/png").
//
// The hard part is keeping the canvas un-tainted so toBlob() can succeed.
// Cross-origin web fonts are the usual culprit: even though the page already
// loaded them, when the SVG <foreignObject> renders the same font-family the
// canvas treats it as cross-origin and refuses to export. Three things below
// work together to avoid that:
//
//   1. embedFonts() — fetch each used @font-face URL and inline it as a
//      base64 data URI, so the SVG references no external resources at all.
//   2. The <style> tag goes inside the cloned node (inside <foreignObject>),
//      not in the SVG <defs>. <defs> styles don't reliably cascade into the
//      foreignObject's HTML content across browsers.
//   3. svgToPngBlob() loads the SVG via a data: URL with crossOrigin set to
//      "anonymous". Blob URLs without crossOrigin still produce a tainted
//      canvas in Chrome even when every referenced resource is inline.
//
// The rasterSafe fallback is a last-resort safety net: it swaps web fonts for
// a system mono stack and strips external background-image url()s, so the
// export still produces *something* if font embedding fails for any reason.

const SAFE_FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

function cloneWithInlineStyles(node, options = {}) {
  const rasterSafe = Boolean(options.rasterSafe);
  const clone = node.cloneNode(false);
  if (node.nodeType === 1) {
    const cs = window.getComputedStyle(node);
    // Whitelist only the properties we actually use to keep SVG small.
    const props = [
      "font-family","font-size","font-weight","font-style","line-height","letter-spacing","white-space","tab-size",
      "color","background","background-color","background-image","background-size","background-position","background-repeat",
      "padding","padding-top","padding-right","padding-bottom","padding-left",
      "margin","margin-top","margin-right","margin-bottom","margin-left",
      "border","border-top","border-right","border-bottom","border-left","border-radius","border-color","border-width","border-style",
      "box-shadow","display","align-items","justify-content","gap","flex-direction","flex","flex-wrap","flex-basis",
      "width","min-width","max-width","height","min-height","max-height","box-sizing",
      "position","top","left","right","bottom","overflow","text-align",
      "opacity","transform","aspect-ratio",
    ];
    let styleStr = "";
    for (const p of props) {
      let v = cs.getPropertyValue(p);
      if (rasterSafe && p === "font-family") {
        v = SAFE_FONT_STACK;
      }
      if (rasterSafe && p === "background-image" && /\burl\(/i.test(v)) {
        v = "none";
      }
      if (v) styleStr += `${p}:${v};`;
    }
    clone.setAttribute("style", styleStr);
    for (const a of node.attributes || []) {
      if (a.name !== "style" && a.name !== "class") clone.setAttribute(a.name, a.value);
    }
  }
  for (const child of node.childNodes) {
    clone.appendChild(cloneWithInlineStyles(child, options));
  }
  return clone;
}

async function fetchAsDataURL(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Returns a CSS string of @font-face rules with every url() replaced by a
// base64 data URI, so the resulting SVG has zero cross-origin font references.
// Only embeds rules for font-family names actually used by `node` — Google
// Fonts ships ~14 unicode-range subsets per family/weight, so embedding all
// of them blindly would balloon the export by megabytes.
async function embedFonts(node) {
  // 1. Walk the subtree to collect every font-family name in use. Computed
  //    fontFamily is a comma-separated stack like `'JetBrains Mono', monospace` —
  //    split it, strip quotes, lowercase for matching.
  const usedFamilies = new Set();
  (function walk(n) {
    if (n.nodeType === 1) {
      window.getComputedStyle(n).fontFamily.split(",").forEach(f => {
        usedFamilies.add(f.trim().replace(/^["']|["']$/g, "").toLowerCase());
      });
    }
    for (const c of n.childNodes) walk(c);
  })(node);

  // 2. Pull @font-face rule text from every stylesheet. Same-origin sheets
  //    expose cssRules; cross-origin ones (Google Fonts) throw on access, so
  //    we re-fetch the stylesheet text and regex out @font-face blocks.
  const fontFaceTexts = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules || []) {
        if (rule.type === CSSRule.FONT_FACE_RULE) fontFaceTexts.push(rule.cssText);
      }
    } catch {
      if (!sheet.href) continue;
      try {
        const text = await (await fetch(sheet.href)).text();
        for (const m of text.matchAll(/@font-face\s*\{[^}]+\}/g)) fontFaceTexts.push(m[0]);
      } catch { continue; }
    }
  }

  // 3. Keep only rules whose font-family matches one we actually use.
  const matched = fontFaceTexts.filter(css => {
    const m = css.match(/font-family:\s*["']?([^"';}\n]+)/i);
    return m && usedFamilies.has(m[1].trim().toLowerCase());
  });

  if (!matched.length) return "";

  // 4. For each matched rule, fetch every url(...) and replace it with a
  //    data: URI. Fetches run in parallel across rules; on failure we keep
  //    the original URL so the rest of the export can still proceed (it may
  //    still taint the canvas, in which case the rasterSafe fallback takes
  //    over).
  const urlRe = /url\(["']?([^"')]+)["']?\)/g;
  const embedded = await Promise.all(matched.map(async css => {
    let result = css;
    for (const m of [...css.matchAll(urlRe)]) {
      try {
        const dataUrl = await fetchAsDataURL(m[1]);
        result = result.split(m[0]).join(`url("${dataUrl}")`);
      } catch { /* keep original url on fetch failure */ }
    }
    return result;
  }));

  return embedded.join("\n");
}

async function buildSvg(node, options = {}) {
  const rasterSafe = Boolean(options.rasterSafe);
  const rect = node.getBoundingClientRect();
  const w = Math.ceil(rect.width);
  const h = Math.ceil(rect.height);

  const clone = cloneWithInlineStyles(node, options);
  clone.style.margin = "0";

  let fontCSS = "";
  if (!rasterSafe) {
    try { fontCSS = await embedFonts(node); } catch { /* proceed without embedded fonts */ }
  }

  // The <style> tag must live inside the foreignObject (as a child of the
  // cloned HTML root) so the @font-face data URIs cascade into the rendered
  // HTML — styles in the outer SVG <defs> do not always reach foreignObject
  // content across browsers.
  const baseCSS = `* { box-sizing: border-box; } pre, div, span { font-variant-ligatures: none; }`;
  const styleEl = document.createElement("style");
  styleEl.appendChild(document.createTextNode(baseCSS + "\n" + fontCSS));
  clone.insertBefore(styleEl, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <foreignObject x="0" y="0" width="100%" height="100%" externalResourcesRequired="true">
    ${xml}
  </foreignObject>
</svg>`;
  return { svg, w, h };
}

async function svgToPngBlob(svg, w, h, scale = 2) {
  // data: URL + crossOrigin=anonymous is what dom-to-image-style libraries use
  // to avoid canvas taint when the SVG references cross-origin web fonts.
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.decoding = "sync";
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Failed to decode SVG image"));
    i.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create 2D canvas context");
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  return await new Promise((res, rej) => {
    canvas.toBlob((b) => {
      if (b) return res(b);
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const [, b64] = dataUrl.split(",");
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        res(new Blob([bytes], { type: "image/png" }));
      } catch (fallbackErr) {
        rej(fallbackErr);
      }
    }, "image/png");
  });
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportNode(node, format, name) {
  if (format === "svg") {
    const { svg } = await buildSvg(node);
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`);
  } else {
    let png;
    try {
      const { svg, w, h } = await buildSvg(node);
      png = await svgToPngBlob(svg, w, h, 2);
    } catch (primaryErr) {
      // Fallback: swap web fonts for system fonts when font embedding fails.
      const { svg, w, h } = await buildSvg(node, { rasterSafe: true });
      png = await svgToPngBlob(svg, w, h, 2);
    }
    downloadBlob(png, `${name}.png`);
  }
}

export async function copyPng(node) {
  let png;
  try {
    const { svg, w, h } = await buildSvg(node);
    png = await svgToPngBlob(svg, w, h, 2);
  } catch (primaryErr) {
    const { svg, w, h } = await buildSvg(node, { rasterSafe: true });
    png = await svgToPngBlob(svg, w, h, 2);
  }
  if (navigator.clipboard && window.ClipboardItem) {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
  } else {
    throw new Error("Clipboard image unsupported");
  }
}

export async function exportAll(nodes, format, baseName) {
  for (let i = 0; i < nodes.length; i++) {
    await exportNode(nodes[i], format, `${baseName}-${String(i + 1).padStart(2, "0")}`);
    await new Promise((r) => setTimeout(r, 150));
  }
}
