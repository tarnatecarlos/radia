"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  AlertTriangle,
  Code2,
  ExternalLink,
  FileText,
  Film,
  Lightbulb,
  Link2,
  Music,
  Palette,
  Shield,
  X,
} from "lucide-react";

// ─── Allowed embed domains (Notion-style allowlist) ───────────────────────
const EMBED_PROVIDERS: {
  name: string;
  match: RegExp;
  toEmbed: (url: string) => string;
  icon: typeof Film;
  allow?: string;
}[] = [
  {
    name: "YouTube",
    match: /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]+)/,
    toEmbed: (url) => {
      const id = url.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]+)/)?.[1];
      return `https://www.youtube-nocookie.com/embed/${id}`;
    },
    icon: Film,
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
  },
  {
    name: "Vimeo",
    match: /^https:\/\/(www\.)?vimeo\.com\/(\d+)/,
    toEmbed: (url) => {
      const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return `https://player.vimeo.com/video/${id}`;
    },
    icon: Film,
    allow: "autoplay; fullscreen; picture-in-picture",
  },
  {
    name: "Loom",
    match: /^https:\/\/(www\.)?loom\.com\/(share|i)\/([a-zA-Z0-9]+)/,
    toEmbed: (url) => {
      const id = url.match(/loom\.com\/(?:share|i)\/([a-zA-Z0-9]+)/)?.[1];
      return `https://www.loom.com/embed/${id}`;
    },
    icon: Film,
    allow: "autoplay; fullscreen",
  },
  {
    name: "Figma",
    match: /^https:\/\/(www\.)?figma\.com\/(file|design|board|proto|slides)\/.+/,
    toEmbed: (url) => `https://embed.figma.com/design/${url.split("/").slice(4).join("/")}?embed-host=radia`,
    icon: Palette,
    allow: "fullscreen",
  },
  {
    name: "Miro",
    match: /^https:\/\/miro\.com\/app\/board\/(.+)/,
    toEmbed: (url) => {
      const id = url.match(/board\/([^/?]+)/)?.[1];
      return `https://miro.com/app/live-embed/${id}/`;
    },
    icon: Palette,
    allow: "fullscreen",
  },
  {
    name: "CodePen",
    match: /^https:\/\/(www\.)?codepen\.io\/([^/]+)\/(pen|full|details)\/([^/?]+)/,
    toEmbed: (url) => {
      const m = url.match(/codepen\.io\/([^/]+)\/(?:pen|full|details)\/([^/?]+)/);
      return m ? `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result` : url;
    },
    icon: Code2,
  },
  {
    name: "CodeSandbox",
    match: /^https:\/\/codesandbox\.io\/(s|p\/sandbox)\/([^/?]+)/,
    toEmbed: (url) => {
      const id = url.match(/codesandbox\.io\/(?:s|p\/sandbox)\/([^/?]+)/)?.[1];
      return `https://codesandbox.io/embed/${id}`;
    },
    icon: Code2,
  },
  {
    name: "Google Docs",
    match: /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/,
    toEmbed: (url) => {
      const m = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
      if (!m) return url;
      if (m[1] === "document") return `https://docs.google.com/document/d/${m[2]}/preview`;
      if (m[1] === "spreadsheets") return `https://docs.google.com/spreadsheets/d/${m[2]}/pubhtml?widget=true`;
      return `https://docs.google.com/presentation/d/${m[2]}/embed`;
    },
    icon: FileText,
  },
  {
    name: "Airtable",
    match: /^https:\/\/airtable\.com\/(embed\/|shr|app).+/,
    toEmbed: (url) => url.includes("/embed/") ? url : url.replace("airtable.com/", "airtable.com/embed/"),
    icon: FileText,
    allow: "fullscreen",
  },
  {
    name: "Spotify",
    match: /^https:\/\/open\.spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/,
    toEmbed: (url) => {
      const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
      return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : url;
    },
    icon: Music,
    allow: "encrypted-media",
  },
  {
    name: "Excalidraw",
    match: /^https:\/\/(link\.)?excalidraw\.com\/.+/,
    toEmbed: (url) => url,
    icon: Palette,
    allow: "fullscreen",
  },
  {
    name: "Typeform",
    match: /^https:\/\/([\w-]+\.)?typeform\.com\/to\/([A-Za-z0-9]+)/,
    toEmbed: (url) => url,
    icon: FileText,
    allow: "fullscreen",
  },
  {
    name: "Notion",
    match: /^https:\/\/(www\.)?notion\.so\/.+/,
    toEmbed: (url) => url,
    icon: FileText,
  },
];

// ─── URL safety check ─────────────────────────────────────────────────────
const BLOCKED_PATTERNS = [
  /^javascript:/i,
  /^data:/i,
  /^blob:/i,
  /^vbscript:/i,
  /[\x00-\x1f]/,              // control characters
  /user:pass@/i,              // credentials in URL
];

const SAFE_LINK_DOMAINS = new Set([
  // embed providers
  "youtube.com", "www.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com",
  "loom.com", "www.loom.com", "figma.com", "www.figma.com", "miro.com",
  "codepen.io", "www.codepen.io", "codesandbox.io",
  "docs.google.com", "drive.google.com", "airtable.com",
  "open.spotify.com", "soundcloud.com",
  "excalidraw.com", "link.excalidraw.com",
  "typeform.com", "form.typeform.com",
  "notion.so", "www.notion.so",
  "github.com", "gist.github.com",
  // general safe domains
  "google.com", "www.google.com",
  "stackoverflow.com", "www.stackoverflow.com",
  "wikipedia.org", "en.wikipedia.org",
  "slack.com", "discord.com", "linear.app",
  "vercel.com", "netlify.com", "supabase.com",
  "npmjs.com", "www.npmjs.com",
  "developer.mozilla.org", "mdn.io",
  "react.dev", "nextjs.org",
]);

function isUrlSafe(url: string): boolean {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(url)) return false;
  }
  if (!url.startsWith("https://") && !url.startsWith("http://")) return false;
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return false;
    return true;
  } catch {
    return false;
  }
}

function isUrlTrustedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    if (SAFE_LINK_DOMAINS.has(hostname)) return true;
    // Check if subdomain of a safe domain
    for (const domain of SAFE_LINK_DOMAINS) {
      if (hostname.endsWith(`.${domain}`)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getEmbedProvider(url: string) {
  if (!isUrlSafe(url)) return null;
  for (const provider of EMBED_PROVIDERS) {
    if (provider.match.test(url)) return provider;
  }
  return null;
}

// ─── Markdown-like parser ─────────────────────────────────────────────────
interface ParsedBlock {
  type: "h1" | "h2" | "h3" | "paragraph" | "bullet" | "numbered" | "checkbox" | "blockquote" | "code" | "hr" | "embed" | "callout" | "empty";
  content: string;
  checked?: boolean;
  calloutType?: "info" | "warning" | "tip";
  embedUrl?: string;
  lang?: string;
}

function parseBlocks(text: string): ParsedBlock[] {
  const lines = text.split("\n");
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", content: codeLines.join("\n"), lang });
      i++;
      continue;
    }

    // Embed block: ![embed](url) or @[embed](url)
    const embedMatch = line.match(/^(?:!\[embed\]|@\[embed\])\((.+)\)$/);
    if (embedMatch) {
      blocks.push({ type: "embed", content: embedMatch[1], embedUrl: embedMatch[1] });
      i++;
      continue;
    }

    // Callout: > [!info], > [!warning], > [!tip]
    const calloutMatch = line.match(/^>\s*\[!(info|warning|tip)\]\s*(.*)/);
    if (calloutMatch) {
      const calloutType = calloutMatch[1] as "info" | "warning" | "tip";
      const contentParts = [calloutMatch[2]];
      i++;
      while (i < lines.length && lines[i].startsWith("> ")) {
        contentParts.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "callout", content: contentParts.join("\n"), calloutType });
      continue;
    }

    // Headings
    if (line.startsWith("### ")) { blocks.push({ type: "h3", content: line.slice(4) }); i++; continue; }
    if (line.startsWith("## ")) { blocks.push({ type: "h2", content: line.slice(3) }); i++; continue; }
    if (line.startsWith("# ")) { blocks.push({ type: "h1", content: line.slice(2) }); i++; continue; }

    // HR
    if (/^[-*_]{3,}$/.test(line.trim())) { blocks.push({ type: "hr", content: "" }); i++; continue; }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines = [line.slice(2)];
      i++;
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", content: quoteLines.join("\n") });
      continue;
    }

    // Checkbox
    const checkMatch = line.match(/^- \[([ xX])\]\s+(.*)/);
    if (checkMatch) {
      blocks.push({ type: "checkbox", content: checkMatch[2], checked: checkMatch[1] !== " " });
      i++;
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(line)) { blocks.push({ type: "bullet", content: line.replace(/^[-*]\s+/, "") }); i++; continue; }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) { blocks.push({ type: "numbered", content: line.replace(/^\d+\.\s+/, "") }); i++; continue; }

    // Empty line
    if (line.trim() === "") { blocks.push({ type: "empty", content: "" }); i++; continue; }

    // Paragraph
    blocks.push({ type: "paragraph", content: line });
    i++;
  }

  return blocks;
}

// ─── Inline formatting ────────────────────────────────────────────────────
function renderInline(text: string) {
  const parts: (string | ReactNode)[] = [];
  let remaining = text;
  let key = 0;

  // Process inline patterns: **bold**, *italic*, `code`, [text](url), ~~strikethrough~~
  const patterns: { regex: RegExp; render: (match: RegExpMatchArray) => ReactNode }[] = [
    {
      regex: /\*\*(.+?)\*\*/,
      render: (m) => <strong key={key++} className="font-semibold text-slate-900 dark:text-slate-100">{m[1]}</strong>,
    },
    {
      regex: /\*(.+?)\*/,
      render: (m) => <em key={key++} className="italic">{m[1]}</em>,
    },
    {
      regex: /~~(.+?)~~/,
      render: (m) => <del key={key++} className="line-through opacity-60">{m[1]}</del>,
    },
    {
      regex: /`([^`]+)`/,
      render: (m) => (
        <code key={key++} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-700 dark:bg-slate-800 dark:text-indigo-300">
          {m[1]}
        </code>
      ),
    },
    {
      regex: /\[([^\]]+)\]\(([^)]+)\)/,
      render: (m) => {
        const url = m[2];
        const safe = isUrlSafe(url);
        const trusted = isUrlTrustedDomain(url);
        if (!safe) {
          return (
            <span key={key++} className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
              <Shield className="inline h-3 w-3" />Blocked link
            </span>
          );
        }
        return (
          <a
            key={key++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-0.5 font-medium underline decoration-1 underline-offset-2 transition ${
              trusted
                ? "text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                : "text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
            }`}
          >
            {m[1]}
            <ExternalLink className="inline h-3 w-3 opacity-50" />
            {!trusted && <Shield className="inline h-3 w-3 opacity-40" />}
          </a>
        );
      },
    },
  ];

  while (remaining.length > 0) {
    let earliestIdx = Infinity;
    let earliestPattern: (typeof patterns)[number] | null = null;
    let earliestMatch: RegExpMatchArray | null = null;

    for (const p of patterns) {
      const m = remaining.match(p.regex);
      if (m && m.index !== undefined && m.index < earliestIdx) {
        earliestIdx = m.index;
        earliestPattern = p;
        earliestMatch = m;
      }
    }

    if (!earliestPattern || !earliestMatch || earliestIdx === Infinity) {
      parts.push(remaining);
      break;
    }

    if (earliestIdx > 0) parts.push(remaining.slice(0, earliestIdx));
    parts.push(earliestPattern.render(earliestMatch));
    remaining = remaining.slice(earliestIdx + earliestMatch[0].length);
  }

  return parts;
}

// ─── Embed renderer ───────────────────────────────────────────────────────
function EmbedBlock({ url }: { url: string }) {
  const [dismissed, setDismissed] = useState(false);
  const provider = getEmbedProvider(url);

  if (dismissed) return null;

  if (!isUrlSafe(url)) {
    return (
      <div className="my-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        <Shield className="h-4 w-4 flex-shrink-0" />
        <span>Blocked embed: unsafe URL detected</span>
      </div>
    );
  }

  if (!provider) {
    // Unknown provider — show as link card
    return (
      <div className="my-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Unsupported embed source</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-amber-600 underline dark:text-amber-400">{url}</a>
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-600"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  const Icon = provider.icon;
  const embedSrc = provider.toEmbed(url);

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
        <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{provider.name}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <Link2 className="h-3 w-3" />Open
        </a>
      </div>
      <iframe
        src={embedSrc}
        className="h-[380px] w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="lazy"
        referrerPolicy="no-referrer"
        allow={provider.allow ?? ""}
        title={`${provider.name} embed`}
      />
    </div>
  );
}

// ─── Callout box ──────────────────────────────────────────────────────────
function Callout({ type, children }: { type: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const styles = {
    info: { bg: "bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/30", text: "text-sky-800 dark:text-sky-300", icon: <Lightbulb className="h-4 w-4" /> },
    warning: { bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30", text: "text-amber-800 dark:text-amber-300", icon: <AlertTriangle className="h-4 w-4" /> },
    tip: { bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30", text: "text-emerald-800 dark:text-emerald-300", icon: <Lightbulb className="h-4 w-4" /> },
  };
  const s = styles[type];
  return (
    <div className={`my-3 flex gap-3 rounded-lg border px-4 py-3 ${s.bg}`}>
      <span className={`mt-0.5 flex-shrink-0 ${s.text}`}>{s.icon}</span>
      <div className={`text-sm leading-relaxed ${s.text}`}>{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────
export function RichContent({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);
  let numberedIdx = 0;

  return (
    <div className="rich-content space-y-1">
      {blocks.map((block, i) => {
        // Reset numbered list counter when not a numbered block
        if (block.type !== "numbered") numberedIdx = 0;

        switch (block.type) {
          case "h1":
            return <h1 key={i} className="mt-6 mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{renderInline(block.content)}</h1>;
          case "h2":
            return <h2 key={i} className="mt-5 mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{renderInline(block.content)}</h2>;
          case "h3":
            return <h3 key={i} className="mt-4 mb-1.5 text-base font-semibold text-slate-800 dark:text-slate-200">{renderInline(block.content)}</h3>;
          case "paragraph":
            return <p key={i} className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{renderInline(block.content)}</p>;
          case "bullet":
            return (
              <div key={i} className="flex gap-2 pl-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                <span>{renderInline(block.content)}</span>
              </div>
            );
          case "numbered":
            numberedIdx++;
            return (
              <div key={i} className="flex gap-2 pl-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="w-5 flex-shrink-0 text-right font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">{numberedIdx}.</span>
                <span>{renderInline(block.content)}</span>
              </div>
            );
          case "checkbox":
            return (
              <div key={i} className="flex items-start gap-2 pl-1 text-sm text-slate-600 dark:text-slate-300">
                <span className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                  block.checked
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 dark:border-slate-600"
                }`}>
                  {block.checked && <span className="text-[10px]">✓</span>}
                </span>
                <span className={block.checked ? "line-through opacity-60" : ""}>{renderInline(block.content)}</span>
              </div>
            );
          case "blockquote":
            return (
              <blockquote key={i} className="my-2 border-l-3 border-indigo-300 bg-indigo-50/50 py-2 pl-4 pr-3 text-sm italic text-slate-600 dark:border-indigo-500/50 dark:bg-indigo-500/5 dark:text-slate-400">
                {renderInline(block.content)}
              </blockquote>
            );
          case "code":
            return (
              <div key={i} className="my-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                {block.lang && (
                  <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                    <Code2 className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{block.lang}</span>
                  </div>
                )}
                <pre className="overflow-x-auto bg-slate-900 p-4 text-[13px] leading-relaxed text-slate-200 dark:bg-slate-950">
                  <code>{block.content}</code>
                </pre>
              </div>
            );
          case "hr":
            return <hr key={i} className="my-4 border-slate-200 dark:border-slate-700" />;
          case "embed":
            return <EmbedBlock key={i} url={block.embedUrl!} />;
          case "callout":
            return <Callout key={i} type={block.calloutType!}>{renderInline(block.content)}</Callout>;
          case "empty":
            return <div key={i} className="h-2" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
