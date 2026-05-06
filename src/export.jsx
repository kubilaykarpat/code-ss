// Export — rasterize a DOM node to PNG, or serialize to SVG.
// Uses foreignObject for SVG (preserves vector text) and draws SVG into a
// canvas for PNG (2× scale for crispness).

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
        // Avoid cross-origin webfont usage in canvas exports.
        v = SAFE_FONT_STACK;
      }
      if (rasterSafe && p === "background-image" && /\burl\(/i.test(v)) {
        // External images can taint the canvas; keep gradients and local values.
        v = "none";
      }
      if (v) styleStr += `${p}:${v};`;
    }
    clone.setAttribute("style", styleStr);
    // Copy some attributes that matter
    for (const a of node.attributes || []) {
      if (a.name !== "style" && a.name !== "class") clone.setAttribute(a.name, a.value);
    }
  }
  for (const child of node.childNodes) {
    clone.appendChild(cloneWithInlineStyles(child, options));
  }
  return clone;
}

async function buildSvg(node, options = {}) {
  const rect = node.getBoundingClientRect();
  const w = Math.ceil(rect.width);
  const h = Math.ceil(rect.height);

  const clone = cloneWithInlineStyles(node, options);
  clone.style.margin = "0";

  const xml = new XMLSerializer().serializeToString(clone);
  // NOTE: we intentionally do NOT embed @font-face rules that fetch from
  // Google Fonts — external resources taint the canvas. The exported SVG
  // uses the font-family name only; the viewer's fallback monospace
  // renders cleanly if the font isn't installed.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <style type="text/css"><![CDATA[
    * { box-sizing: border-box; }
    pre, div, span { font-variant-ligatures: none; }
    ]]></style>
  </defs>
  <foreignObject x="0" y="0" width="${w}" height="${h}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;">
      ${xml}
    </div>
  </foreignObject>
</svg>`;
  return { svg, w, h };
}

async function svgToPngBlob(svg, w, h, scale = 2) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
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
      try {
        canvas.toBlob((b) => {
          if (b) return res(b);
          // Fallback for browsers/environments where toBlob intermittently returns null.
          try {
            const dataUrl = canvas.toDataURL("image/png");
            const [, b64] = dataUrl.split(",");
            const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            res(new Blob([bytes], { type: "image/png" }));
          } catch (fallbackErr) {
            rej(fallbackErr);
          }
        }, "image/png");
      } catch (e) { rej(e); }
    });
  } finally {
    URL.revokeObjectURL(url);
  }
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
      // Fallback for browsers that reject foreignObject + remote font rendering.
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
