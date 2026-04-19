// Export — rasterize a DOM node to PNG, or serialize to SVG.
// Uses foreignObject for SVG (preserves vector text) and draws SVG into a
// canvas for PNG (2× scale for crispness).

(function () {
  function cloneWithInlineStyles(node) {
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
        const v = cs.getPropertyValue(p);
        if (v) styleStr += `${p}:${v};`;
      }
      clone.setAttribute("style", styleStr);
      // Copy some attributes that matter
      for (const a of node.attributes || []) {
        if (a.name !== "style" && a.name !== "class") clone.setAttribute(a.name, a.value);
      }
    }
    for (const child of node.childNodes) {
      clone.appendChild(cloneWithInlineStyles(child));
    }
    return clone;
  }

  async function loadFontsCss() {
    // Intentionally no-op: fetching cross-origin font CSS taints the export canvas.
    return "";
  }

  async function buildSvg(node) {
    const rect = node.getBoundingClientRect();
    const w = Math.ceil(rect.width);
    const h = Math.ceil(rect.height);

    const clone = cloneWithInlineStyles(node);
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
        i.crossOrigin = "anonymous";
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      return await new Promise((res, rej) => {
        try {
          canvas.toBlob((b) => b ? res(b) : rej(new Error("toBlob returned null")), "image/png");
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

  async function exportNode(node, format, name) {
    const { svg, w, h } = await buildSvg(node);
    if (format === "svg") {
      downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`);
    } else {
      const png = await svgToPngBlob(svg, w, h, 2);
      downloadBlob(png, `${name}.png`);
    }
  }

  async function copyPng(node) {
    const { svg, w, h } = await buildSvg(node);
    const png = await svgToPngBlob(svg, w, h, 2);
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    } else {
      throw new Error("Clipboard image unsupported");
    }
  }

  async function exportAll(nodes, format, baseName) {
    for (let i = 0; i < nodes.length; i++) {
      await exportNode(nodes[i], format, `${baseName}-${String(i + 1).padStart(2, "0")}`);
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  window.CodeSS_Export = { exportNode, copyPng, exportAll };
})();
