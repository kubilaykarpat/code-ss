// Lightweight syntax highlighter + language auto-detection.
// Not a full Prism replacement — purpose-built for common syntaxes with a
// consistent token model so themes can restyle everything.
//
// Token types: keyword | string | number | comment | function | type | punct |
//              operator | builtin | tag | attr | variable | regex | text

const LANGS = {
    javascript: {
      label: "JavaScript",
      aliases: ["js", "jsx", "javascript", "node"],
      rules: [
        { type: "comment", re: /\/\/[^\n]*/y },
        { type: "comment", re: /\/\*[\s\S]*?\*\//y },
        { type: "string", re: /`(?:\\.|\$\{[^}]*\}|[^`\\])*`/y },
        { type: "string", re: /"(?:\\.|[^"\\])*"/y },
        { type: "string", re: /'(?:\\.|[^'\\])*'/y },
        { type: "regex", re: /\/(?:\\.|\[[^\]]*\]|[^\/\\\n])+\/[gimsuy]*/y },
        { type: "number", re: /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)n?\b/y },
        { type: "keyword", re: /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|default|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|import|export|from|as|static|get|set)\b/y },
        { type: "builtin", re: /\b(?:true|false|null|undefined|NaN|Infinity|console|document|window|Math|JSON|Array|Object|String|Number|Boolean|Promise|Map|Set|Symbol|Error|RegExp)\b/y },
        { type: "function", re: /[A-Za-z_$][\w$]*(?=\s*\()/y },
        { type: "variable", re: /[A-Za-z_$][\w$]*/y },
        { type: "operator", re: /[=+\-*/%<>!&|^~?:]+/y },
        { type: "punct", re: /[{}()\[\];,.]/y },
      ],
    },
    typescript: {
      label: "TypeScript",
      aliases: ["ts", "tsx", "typescript"],
      rules: null, // fills from javascript + adds types below
    },
    python: {
      label: "Python",
      aliases: ["py", "python"],
      rules: [
        { type: "comment", re: /#[^\n]*/y },
        { type: "string", re: /"""[\s\S]*?"""/y },
        { type: "string", re: /'''[\s\S]*?'''/y },
        { type: "string", re: /[rbuRBU]?"(?:\\.|[^"\\])*"/y },
        { type: "string", re: /[rbuRBU]?'(?:\\.|[^'\\])*'/y },
        { type: "number", re: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?j?\b/y },
        { type: "keyword", re: /\b(?:def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|pass|break|continue|try|except|finally|raise|with|yield|lambda|global|nonlocal|async|await)\b/y },
        { type: "builtin", re: /\b(?:print|len|range|list|dict|set|tuple|str|int|float|bool|self|cls|__init__|__name__|__main__|map|filter|zip|enumerate|sorted|open|input|isinstance|type|super)\b/y },
        { type: "function", re: /[A-Za-z_][\w]*(?=\s*\()/y },
        { type: "variable", re: /[A-Za-z_][\w]*/y },
        { type: "operator", re: /[=+\-*/%<>!&|^~@]+/y },
        { type: "punct", re: /[{}()\[\]:;,.]/y },
      ],
    },
    rust: {
      label: "Rust",
      aliases: ["rs", "rust"],
      rules: [
        { type: "comment", re: /\/\/[^\n]*/y },
        { type: "comment", re: /\/\*[\s\S]*?\*\//y },
        { type: "string", re: /"(?:\\.|[^"\\])*"/y },
        { type: "string", re: /'(?:\\.|[^'\\])'/y },
        { type: "number", re: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?:u|i|f)?\d*\b/y },
        { type: "keyword", re: /\b(?:fn|let|mut|const|static|if|else|match|for|while|loop|break|continue|return|struct|enum|trait|impl|pub|use|mod|crate|self|Self|super|as|where|ref|move|async|await|dyn|type|unsafe)\b/y },
        { type: "type", re: /\b(?:i8|i16|i32|i64|i128|u8|u16|u32|u64|u128|f32|f64|bool|char|str|String|Vec|Option|Result|Box|Rc|Arc)\b/y },
        { type: "builtin", re: /\b(?:Some|None|Ok|Err|true|false|println|print|eprintln|format|vec|panic)!?\b/y },
        { type: "function", re: /[A-Za-z_][\w]*(?=\s*[(!<])/y },
        { type: "variable", re: /[A-Za-z_][\w]*/y },
        { type: "operator", re: /[=+\-*/%<>!&|^~?:]+/y },
        { type: "punct", re: /[{}()\[\];,.]/y },
      ],
    },
    go: {
      label: "Go",
      aliases: ["go", "golang"],
      rules: [
        { type: "comment", re: /\/\/[^\n]*/y },
        { type: "comment", re: /\/\*[\s\S]*?\*\//y },
        { type: "string", re: /`[^`]*`/y },
        { type: "string", re: /"(?:\\.|[^"\\])*"/y },
        { type: "number", re: /\b\d+(?:\.\d+)?\b/y },
        { type: "keyword", re: /\b(?:func|var|const|type|struct|interface|package|import|return|if|else|for|range|switch|case|default|break|continue|go|defer|chan|select|map|fallthrough)\b/y },
        { type: "type", re: /\b(?:string|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float32|float64|bool|byte|rune|error)\b/y },
        { type: "builtin", re: /\b(?:nil|true|false|make|new|len|cap|append|copy|delete|close|panic|recover|print|println)\b/y },
        { type: "function", re: /[A-Za-z_][\w]*(?=\s*\()/y },
        { type: "variable", re: /[A-Za-z_][\w]*/y },
        { type: "operator", re: /[=+\-*/%<>!&|^~?:]+/y },
        { type: "punct", re: /[{}()\[\];,.]/y },
      ],
    },
    ruby: {
      label: "Ruby",
      aliases: ["rb", "ruby"],
      rules: [
        { type: "comment", re: /#[^\n]*/y },
        { type: "string", re: /"(?:\\.|#\{[^}]*\}|[^"\\])*"/y },
        { type: "string", re: /'(?:\\.|[^'\\])*'/y },
        { type: "number", re: /\b\d+(?:\.\d+)?\b/y },
        { type: "keyword", re: /\b(?:def|end|class|module|if|elsif|else|unless|while|until|for|do|return|yield|begin|rescue|ensure|raise|require|require_relative|attr_reader|attr_writer|attr_accessor|true|false|nil|self|super|and|or|not|in)\b/y },
        { type: "variable", re: /[@$]?[A-Za-z_][\w]*[?!]?/y },
        { type: "function", re: /[A-Za-z_][\w]*(?=\s*\()/y },
        { type: "operator", re: /[=+\-*/%<>!&|^~?:]+/y },
        { type: "punct", re: /[{}()\[\];,.]/y },
      ],
    },
    java: {
      label: "Java",
      aliases: ["java"],
      rules: [
        { type: "comment", re: /\/\/[^\n]*/y },
        { type: "comment", re: /\/\*[\s\S]*?\*\//y },
        { type: "string", re: /"(?:\\.|[^"\\])*"/y },
        { type: "number", re: /\b\d+(?:\.\d+)?[fdlFDL]?\b/y },
        { type: "keyword", re: /\b(?:public|private|protected|static|final|abstract|class|interface|extends|implements|new|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|finally|throw|throws|import|package|synchronized|volatile|transient|native|this|super|null|true|false|void|instanceof)\b/y },
        { type: "type", re: /\b(?:int|long|short|byte|float|double|boolean|char|String|Integer|Long|Double|Boolean|Object|List|Map|Set|ArrayList|HashMap)\b/y },
        { type: "function", re: /[A-Za-z_][\w]*(?=\s*\()/y },
        { type: "variable", re: /[A-Za-z_][\w]*/y },
        { type: "operator", re: /[=+\-*/%<>!&|^~?:]+/y },
        { type: "punct", re: /[{}()\[\];,.]/y },
      ],
    },
    c: {
      label: "C / C++",
      aliases: ["c", "cpp", "c++", "h", "hpp"],
      rules: [
        { type: "comment", re: /\/\/[^\n]*/y },
        { type: "comment", re: /\/\*[\s\S]*?\*\//y },
        { type: "string", re: /"(?:\\.|[^"\\])*"/y },
        { type: "string", re: /'(?:\\.|[^'\\])'/y },
        { type: "number", re: /\b\d+(?:\.\d+)?[fFlLuU]*\b/y },
        { type: "keyword", re: /\b(?:if|else|for|while|do|switch|case|default|break|continue|return|struct|union|enum|typedef|sizeof|const|static|extern|volatile|register|auto|goto|class|public|private|protected|new|delete|this|template|typename|namespace|using|try|catch|throw|virtual|override|final|include|define|ifndef|ifdef|endif|pragma)\b/y },
        { type: "type", re: /\b(?:int|long|short|char|float|double|void|bool|unsigned|signed|size_t|uint32_t|int32_t|uint64_t|int64_t|string|vector|map|set)\b/y },
        { type: "function", re: /[A-Za-z_][\w]*(?=\s*\()/y },
        { type: "variable", re: /#?[A-Za-z_][\w]*/y },
        { type: "operator", re: /[=+\-*/%<>!&|^~?:]+/y },
        { type: "punct", re: /[{}()\[\];,.]/y },
      ],
    },
    swift: {
      label: "Swift",
      aliases: ["swift"],
      rules: [
        { type: "comment", re: /\/\/[^\n]*/y },
        { type: "comment", re: /\/\*[\s\S]*?\*\//y },
        { type: "string", re: /"(?:\\.|\\\([^)]*\)|[^"\\])*"/y },
        { type: "number", re: /\b\d+(?:\.\d+)?\b/y },
        { type: "keyword", re: /\b(?:func|let|var|if|else|guard|switch|case|default|for|while|repeat|break|continue|return|struct|class|enum|protocol|extension|import|public|private|internal|fileprivate|open|static|final|override|init|deinit|self|Self|super|try|catch|throw|throws|rethrows|async|await|where|in|is|as|nil|true|false)\b/y },
        { type: "type", re: /\b(?:Int|Double|Float|String|Bool|Character|Array|Dictionary|Set|Optional|Any|AnyObject|Void)\b/y },
        { type: "function", re: /[A-Za-z_][\w]*(?=\s*\()/y },
        { type: "variable", re: /[A-Za-z_][\w]*/y },
        { type: "operator", re: /[=+\-*/%<>!&|^~?:]+/y },
        { type: "punct", re: /[{}()\[\];,.]/y },
      ],
    },
    kotlin: {
      label: "Kotlin",
      aliases: ["kt", "kotlin"],
      rules: [
        { type: "comment", re: /\/\/[^\n]*/y },
        { type: "comment", re: /\/\*[\s\S]*?\*\//y },
        { type: "string", re: /"""[\s\S]*?"""/y },
        { type: "string", re: /"(?:\\.|\$[A-Za-z_][\w]*|\$\{[^}]*\}|[^"\\])*"/y },
        { type: "number", re: /\b\d+(?:\.\d+)?[fFlL]?\b/y },
        { type: "keyword", re: /\b(?:fun|val|var|if|else|when|for|while|do|break|continue|return|class|object|interface|data|sealed|enum|abstract|open|override|final|public|private|protected|internal|import|package|companion|init|constructor|this|super|null|true|false|is|as|in|out|by|where|try|catch|finally|throw|lateinit|lazy|suspend)\b/y },
        { type: "type", re: /\b(?:Int|Long|Short|Byte|Float|Double|Boolean|Char|String|Unit|Any|Nothing|Array|List|Map|Set)\b/y },
        { type: "function", re: /[A-Za-z_][\w]*(?=\s*\()/y },
        { type: "variable", re: /[A-Za-z_][\w]*/y },
        { type: "operator", re: /[=+\-*/%<>!&|^~?:]+/y },
        { type: "punct", re: /[{}()\[\];,.]/y },
      ],
    },
    sql: {
      label: "SQL",
      aliases: ["sql", "pgsql", "mysql"],
      rules: [
        { type: "comment", re: /--[^\n]*/y },
        { type: "comment", re: /\/\*[\s\S]*?\*\//y },
        { type: "string", re: /'(?:''|[^'])*'/y },
        { type: "string", re: /"(?:""|[^"])*"/y },
        { type: "number", re: /\b\d+(?:\.\d+)?\b/y },
        { type: "keyword", re: /\b(?:SELECT|FROM|WHERE|AND|OR|NOT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|VIEW|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|ON|AS|GROUP|BY|ORDER|ASC|DESC|HAVING|LIMIT|OFFSET|UNION|DISTINCT|CASE|WHEN|THEN|ELSE|END|NULL|TRUE|FALSE|IS|IN|BETWEEN|LIKE|EXISTS|WITH|RETURNING)\b/iy },
        { type: "type", re: /\b(?:INT|INTEGER|BIGINT|SMALLINT|VARCHAR|TEXT|CHAR|DATE|TIMESTAMP|TIME|BOOLEAN|BOOL|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|UUID|JSON|JSONB|BYTEA|SERIAL)\b/iy },
        { type: "function", re: /[A-Za-z_][\w]*(?=\s*\()/y },
        { type: "variable", re: /[A-Za-z_][\w]*/y },
        { type: "operator", re: /[=+\-*/%<>!]+/y },
        { type: "punct", re: /[{}()\[\];,.]/y },
      ],
    },
    html: {
      label: "HTML",
      aliases: ["html", "xml", "svg"],
      rules: [
        { type: "comment", re: /<!--[\s\S]*?-->/y },
        { type: "punct", re: /<\/?/y },
        { type: "tag", re: /[A-Za-z][\w-]*/y, after: ["punct"] },
        { type: "attr", re: /[A-Za-z_:][\w.:-]*(?==)/y },
        { type: "string", re: /"(?:\\.|[^"\\])*"/y },
        { type: "string", re: /'(?:\\.|[^'\\])*'/y },
        { type: "operator", re: /=/y },
        { type: "punct", re: />/y },
        { type: "text", re: /[^<]+/y },
      ],
    },
    css: {
      label: "CSS",
      aliases: ["css", "scss", "sass", "less"],
      rules: [
        { type: "comment", re: /\/\*[\s\S]*?\*\//y },
        { type: "string", re: /"(?:\\.|[^"\\])*"/y },
        { type: "string", re: /'(?:\\.|[^'\\])*'/y },
        { type: "number", re: /-?\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|ms|s|deg)?\b/y },
        { type: "keyword", re: /@[A-Za-z-]+/y },
        { type: "function", re: /[A-Za-z-]+(?=\s*\()/y },
        { type: "attr", re: /[A-Za-z-]+(?=\s*:)/y },
        { type: "tag", re: /[#.][A-Za-z_][\w-]*/y },
        { type: "variable", re: /--[\w-]+/y },
        { type: "builtin", re: /#[0-9a-fA-F]{3,8}\b/y },
        { type: "variable", re: /[A-Za-z_][\w-]*/y },
        { type: "operator", re: /[:;,>+~*]/y },
        { type: "punct", re: /[{}()\[\]]/y },
      ],
    },
    json: {
      label: "JSON",
      aliases: ["json"],
      rules: [
        { type: "string", re: /"(?:\\.|[^"\\])*"(?=\s*:)/y, as: "attr" },
        { type: "string", re: /"(?:\\.|[^"\\])*"/y },
        { type: "number", re: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y },
        { type: "keyword", re: /\b(?:true|false|null)\b/y },
        { type: "punct", re: /[{}()\[\]:,]/y },
      ],
    },
    yaml: {
      label: "YAML",
      aliases: ["yml", "yaml"],
      rules: [
        { type: "comment", re: /#[^\n]*/y },
        { type: "string", re: /"(?:\\.|[^"\\])*"/y },
        { type: "string", re: /'(?:''|[^'])*'/y },
        { type: "number", re: /\b-?\d+(?:\.\d+)?\b/y },
        { type: "keyword", re: /\b(?:true|false|null|yes|no|on|off)\b/iy },
        { type: "attr", re: /[A-Za-z_][\w-]*(?=\s*:)/y },
        { type: "operator", re: /[:\-?]/y },
        { type: "punct", re: /[{}\[\],]/y },
        { type: "text", re: /[^\s]+/y },
      ],
    },
    shell: {
      label: "Shell",
      aliases: ["sh", "bash", "zsh", "shell"],
      rules: [
        { type: "comment", re: /#[^\n]*/y },
        { type: "string", re: /"(?:\\.|\$\{[^}]*\}|[^"\\])*"/y },
        { type: "string", re: /'[^']*'/y },
        { type: "variable", re: /\$\{[^}]+\}|\$\w+/y },
        { type: "keyword", re: /\b(?:if|then|else|elif|fi|for|in|do|done|while|until|case|esac|function|return|export|local|readonly|declare|echo|printf|cd|pwd|ls|cat|grep|sed|awk|cp|mv|rm|mkdir|rmdir|touch|chmod|chown|sudo|ssh|curl|wget|git|npm|yarn|pnpm|node|python|pip)\b/y },
        { type: "function", re: /^\s*[A-Za-z_][\w]*(?=\s*\()/my },
        { type: "operator", re: /[|&;<>]+/y },
        { type: "variable", re: /-{1,2}[\w-]+/y },
        { type: "text", re: /\S+/y },
      ],
    },
    markdown: {
      label: "Markdown",
      aliases: ["md", "markdown"],
      rules: [
        { type: "comment", re: /<!--[\s\S]*?-->/y },
        { type: "keyword", re: /^#{1,6}[^\n]+/my },
        { type: "function", re: /^\s*[-*+]\s/my },
        { type: "function", re: /^\s*\d+\.\s/my },
        { type: "string", re: /`[^`\n]+`/y },
        { type: "string", re: /```[\s\S]*?```/y },
        { type: "type", re: /\*\*[^*\n]+\*\*/y },
        { type: "type", re: /_[^_\n]+_/y },
        { type: "attr", re: /!?\[[^\]]*\]\([^)]*\)/y },
        { type: "operator", re: /^>\s*/my },
        { type: "text", re: /[^\n`*_!\[>#-]+/y },
      ],
    },
    plain: {
      label: "Plain text",
      aliases: ["text", "plain", "txt"],
      rules: [{ type: "text", re: /[\s\S]+/y }],
    },
  };

// TypeScript = JavaScript + extra types/keywords
LANGS.typescript.rules = [
    { type: "comment", re: /\/\/[^\n]*/y },
    { type: "comment", re: /\/\*[\s\S]*?\*\//y },
    { type: "string", re: /`(?:\\.|\$\{[^}]*\}|[^`\\])*`/y },
    { type: "string", re: /"(?:\\.|[^"\\])*"/y },
    { type: "string", re: /'(?:\\.|[^'\\])*'/y },
    { type: "number", re: /\b(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?)\b/y },
    { type: "keyword", re: /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|default|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|import|export|from|as|static|get|set|interface|type|enum|namespace|declare|abstract|implements|public|private|protected|readonly|override)\b/y },
    { type: "type", re: /\b(?:string|number|boolean|any|unknown|never|void|object|bigint|symbol|null|undefined|Array|Promise|Record|Partial|Required|Readonly|Pick|Omit)\b/y },
    { type: "builtin", re: /\b(?:true|false|null|undefined|NaN|Infinity|console|document|window|Math|JSON)\b/y },
    { type: "function", re: /[A-Za-z_$][\w$]*(?=\s*[(<])/y },
    { type: "variable", re: /[A-Za-z_$][\w$]*/y },
    { type: "operator", re: /[=+\-*/%<>!&|^~?:]+/y },
    { type: "punct", re: /[{}()\[\];,.]/y },
];

// Build an id -> lang map and alias -> id map.
const ALIAS = {};
for (const id of Object.keys(LANGS)) {
  LANGS[id].id = id;
  for (const a of LANGS[id].aliases) ALIAS[a.toLowerCase()] = id;
}

export function resolveLang(name) {
  if (!name) return null;
  const key = String(name).toLowerCase().trim();
  if (LANGS[key]) return key;
  return ALIAS[key] || null;
}

// Tokenize a single line at a time so highlighting respects \n boundaries.
export function tokenize(code, langId) {
  const lang = LANGS[langId] || LANGS.plain;
  const rules = lang.rules;
  const lines = code.split("\n");
  const out = [];
  for (const line of lines) {
    out.push(tokenizeLine(line, rules));
  }
  return out;
}

function tokenizeLine(line, rules) {
  const tokens = [];
  let i = 0;
  const len = line.length;
  while (i < len) {
    // skip leading whitespace as its own token so layout is stable
    const wsMatch = /[ \t]+/y;
    wsMatch.lastIndex = i;
    const ws = wsMatch.exec(line);
    if (ws && ws.index === i) {
      tokens.push({ type: "ws", text: ws[0] });
      i += ws[0].length;
      continue;
    }
    let matched = false;
    for (const rule of rules) {
      rule.re.lastIndex = i;
      const m = rule.re.exec(line);
      if (m && m.index === i) {
        tokens.push({ type: rule.as || rule.type, text: m[0] });
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ type: "text", text: line[i] });
      i += 1;
    }
  }
  return tokens;
}

// Heuristic auto-detection — scores each language by keyword + symbol hits.
export function detect(code) {
    if (!code || !code.trim()) return "plain";
    const sample = code.slice(0, 4000);

    const scores = {};
    const hit = (id, n = 1) => (scores[id] = (scores[id] || 0) + n);

    // Strong shebang / doctype signals first.
    if (/^#!.*\b(bash|sh|zsh)\b/.test(sample)) return "shell";
    if (/^#!.*\bpython/.test(sample)) return "python";
    if (/^#!.*\bnode/.test(sample)) return "javascript";
    if (/^\s*<!DOCTYPE\s+html/i.test(sample) || /^\s*<html[\s>]/i.test(sample)) return "html";
    if (/^\s*<\?xml/.test(sample)) return "html";

    // JSON — starts with { or [ and parses
    const trimmed = sample.trim();
    if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && /[}\]]\s*$/.test(trimmed)) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch {}
    }

    // Markdown — headers, fenced blocks, list bullets
    if (/^#{1,6}\s+\S/m.test(sample) || /^```/m.test(sample)) hit("markdown", 3);
    if (/^\s*[-*+]\s+\S/m.test(sample)) hit("markdown", 1);

    // HTML/XML
    if (/<\/?[a-z][\w-]*[^>]*>/i.test(sample)) hit("html", 2);

    // CSS
    if (/[.#]?[\w-]+\s*\{[^}]*:[^}]*;/.test(sample)) hit("css", 3);
    if (/@(?:media|import|keyframes|font-face)/.test(sample)) hit("css", 2);

    // SQL — uppercase keywords
    if (/\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(sample)) hit("sql", 3);
    if (/\bFROM\b.*\bWHERE\b/is.test(sample)) hit("sql", 2);

    // YAML
    if (/^[A-Za-z_][\w-]*:\s*(?:$|[^{]*$)/m.test(sample) && !/[{};]/.test(sample.slice(0, 200))) hit("yaml", 2);

    // Python
    if (/^\s*def\s+\w+\s*\(/m.test(sample)) hit("python", 3);
    if (/^\s*import\s+\w+$/m.test(sample)) hit("python", 2);
    if (/^\s*from\s+\w+\s+import\s/m.test(sample)) hit("python", 3);
    if (/\bprint\s*\(/.test(sample)) hit("python", 1);
    if (/:\s*$/m.test(sample) && /^\s{2,}/m.test(sample)) hit("python", 1);

    // Rust
    if (/\bfn\s+\w+\s*\(/.test(sample)) hit("rust", 3);
    if (/\blet\s+mut\s+/.test(sample)) hit("rust", 3);
    if (/->\s*\w/.test(sample) && /\bimpl\b/.test(sample)) hit("rust", 2);
    if (/::\w/.test(sample)) hit("rust", 1);
    if (/\bpanic!|println!|vec!/.test(sample)) hit("rust", 2);

    // Go
    if (/^\s*package\s+\w+/m.test(sample)) hit("go", 4);
    if (/\bfunc\s+\w+\s*\(/.test(sample)) hit("go", 2);
    if (/:=/.test(sample)) hit("go", 2);

    // Ruby
    if (/^\s*def\s+\w+/m.test(sample) && /\bend\b/.test(sample)) hit("ruby", 3);
    if (/\bputs\b|\battr_(?:reader|writer|accessor)\b/.test(sample)) hit("ruby", 2);
    if (/:\w+\s*=>/.test(sample)) hit("ruby", 1);

    // Java
    if (/\bpublic\s+(?:static\s+)?(?:void|class|int)/.test(sample)) hit("java", 3);
    if (/System\.out\.println/.test(sample)) hit("java", 3);

    // C/C++
    if (/#include\s*[<"]/.test(sample)) hit("c", 3);
    if (/\bstd::/.test(sample)) hit("c", 2);
    if (/\bint\s+main\s*\(/.test(sample)) hit("c", 2);

    // Swift
    if (/\bfunc\s+\w+.*->\s*\w/.test(sample)) hit("swift", 2);
    if (/\bvar\s+\w+\s*:\s*\w+/.test(sample) && /\blet\s+\w+\s*:/.test(sample)) hit("swift", 2);
    if (/@\w+/.test(sample) && /\bUIView\b|SwiftUI/.test(sample)) hit("swift", 3);

    // Kotlin
    if (/\bfun\s+\w+\s*\(/.test(sample) && /\bval\b|\bvar\b/.test(sample)) hit("kotlin", 2);

    // Shell
    if (/\$\{?\w+\}?/.test(sample) && /^\s*(?:if|for|while)\s+.*?;\s*then/m.test(sample)) hit("shell", 3);
    if (/^\s*(?:echo|cd|ls|mkdir|rm|grep|sed|awk)\s/m.test(sample)) hit("shell", 1);

    // TypeScript
    if (/:\s*(?:string|number|boolean|any|unknown|void)\b/.test(sample)) hit("typescript", 3);
    if (/\binterface\s+\w+\s*\{/.test(sample)) hit("typescript", 3);
    if (/\btype\s+\w+\s*=/.test(sample)) hit("typescript", 2);

    // JavaScript
    if (/\b(?:const|let|var)\s+\w+\s*=/.test(sample)) hit("javascript", 2);
    if (/=>\s*[\{(]/.test(sample)) hit("javascript", 2);
    if (/\bconsole\.log\b/.test(sample)) hit("javascript", 2);
    if (/\bfunction\s+\w*\s*\(/.test(sample)) hit("javascript", 1);
    if (/\brequire\s*\(/.test(sample)) hit("javascript", 1);

    let best = "plain";
  let bestScore = 0;
  for (const id of Object.keys(scores)) {
    if (scores[id] > bestScore) {
      bestScore = scores[id];
      best = id;
    }
  }
  return bestScore >= 2 ? best : "plain";
}

export function langList() {
  return Object.values(LANGS).map((l) => ({ id: l.id, label: l.label }));
}

export { LANGS };
