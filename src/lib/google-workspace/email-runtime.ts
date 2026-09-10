import "server-only";

import sanitizeHtml from "sanitize-html";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { decryptGoogleRefreshCredential } from "@/lib/google-workspace/crypto";
import { refreshGoogleAccessToken } from "@/lib/google-workspace/oauth";
import { getOwnedGoogleEmailDetail, getOwnedGoogleEmailSource, type Actor } from "@/lib/google-workspace/repository";

type GmailHeader = { name?: string; value?: string };
type GmailPart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { data?: string; attachmentId?: string };
  parts?: GmailPart[];
};

type EmailAction = "summarize_email" | "explain_email_relevance" | "prepare_email_followup" | "ask_about_email";

function decode(value: string | undefined) {
  if (!value) return "";
  try { return Buffer.from(value, "base64url").toString("utf8"); } catch { return ""; }
}

function htmlParts(part: GmailPart | undefined, output: Array<{ data?: string; attachmentId?: string }>) {
  if (!part) return;
  if (part.mimeType === "text/html") output.push(part.body ?? {});
  for (const child of part.parts ?? []) htmlParts(child, output);
}

async function googleJson<T>(url: string, accessToken: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      headers: { authorization: "Bearer " + accessToken, accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(response.status === 401 ? "google_refresh_invalid" : "google_email_html_unavailable");
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

const REMOTE_IMAGE_LIMIT = 24;
const REMOTE_IMAGE_BYTES = 2_000_000;
const REMOTE_IMAGE_TOTAL_BYTES = 10_000_000;
const REMOTE_IMAGE_TIMEOUT_MS = 6_000;
const INLINE_IMAGE_LIMIT = 24;
const INLINE_IMAGE_BYTES = 2_500_000;
const TRANSPARENT_GIF = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
const cssLengthPattern = /^(?:0|auto|none|normal|inherit|initial|unset|(?:-?\d+(?:\.\d+)?)(?:px|pt|pc|em|rem|ex|ch|vw|vh|vmin|vmax|%)?)(?:\s*!important)?$/i;

function privateIpv4(value: string) {
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19));
}

function privateIpv6(value: string) {
  const normalized = value.toLowerCase();
  return normalized === "::" || normalized === "::1"
    || normalized.startsWith("fc") || normalized.startsWith("fd")
    || normalized.startsWith("fe8") || normalized.startsWith("fe9")
    || normalized.startsWith("fea") || normalized.startsWith("feb")
    || normalized.startsWith("ff")
    || normalized.startsWith("::ffff:127.")
    || normalized.startsWith("::ffff:10.")
    || normalized.startsWith("::ffff:192.168.")
    || normalized.startsWith("::ffff:169.254.");
}

function headerValue(part: GmailPart, name: string) {
  return part.headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value?.trim() ?? null;
}

function normalizedContentId(value: string | null) {
  if (!value) return null;
  return value.trim().replace(/^<|>$/g, "").replace(/^cid:/i, "").trim() || null;
}

function collectInlineImageParts(part: GmailPart | undefined, output: GmailPart[]) {
  if (!part) return;
  const mime = part.mimeType?.toLowerCase() ?? "";
  const contentId = normalizedContentId(headerValue(part, "content-id"));
  if (mime.startsWith("image/") && mime !== "image/svg+xml" && contentId) output.push(part);
  for (const child of part.parts ?? []) collectInlineImageParts(child, output);
}

async function gmailInlineImageMap(part: GmailPart | undefined, providerId: string, accessToken: string) {
  const candidates: GmailPart[] = [];
  collectInlineImageParts(part, candidates);
  const result: Record<string, string> = {};

  for (let index = 0; index < Math.min(candidates.length, INLINE_IMAGE_LIMIT); index += 1) {
    const candidate = candidates[index];
    const contentId = normalizedContentId(headerValue(candidate, "content-id"));
    const mime = candidate.mimeType?.toLowerCase() ?? "";
    if (!contentId || !mime.startsWith("image/") || mime === "image/svg+xml") continue;

    let encoded = candidate.body?.data ?? "";
    if (!encoded && candidate.body?.attachmentId) {
      try {
        const attachment = await googleJson<{ data?: string }>(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/"
            + providerId
            + "/attachments/"
            + encodeURIComponent(candidate.body.attachmentId),
          accessToken
        );
        encoded = attachment.data ?? "";
      } catch {
        continue;
      }
    }

    if (!encoded) continue;
    try {
      const buffer = Buffer.from(encoded, "base64url");
      if (!buffer.length || buffer.length > INLINE_IMAGE_BYTES) continue;
      result[contentId] = `data:${mime};base64,${buffer.toString("base64")}`;
    } catch {
      continue;
    }
  }

  return result;
}

function injectInlineImages(rawHtml: string, inlineImages: Record<string, string>) {
  let output = rawHtml;
  Object.entries(inlineImages).forEach(([contentId, dataUri]) => {
    const candidates = [
      `cid:${contentId}`,
      `CID:${contentId}`,
      `cid:${encodeURIComponent(contentId)}`,
      `CID:${encodeURIComponent(contentId)}`
    ];
    candidates.forEach((candidate) => {
      output = output.split(candidate).join(dataUri);
    });
  });
  return output;
}

async function safeRemoteImageUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  if (url.port && !["80", "443"].includes(url.port)) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".home.arpa")) return null;

  const family = isIP(host);
  if (family) {
    if ((family === 4 && privateIpv4(host)) || (family === 6 && privateIpv6(host))) return null;
    return url;
  }

  try {
    const addresses = await lookup(host, { all: true, verbatim: true });
    if (!addresses.length) return null;
    for (const entry of addresses) {
      if ((entry.family === 4 && privateIpv4(entry.address)) || (entry.family === 6 && privateIpv6(entry.address))) return null;
    }
  } catch {
    return null;
  }
  return url;
}

async function remoteImageDataUri(raw: string) {
  let target = await safeRemoteImageUrl(raw);
  if (!target) return null;

  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REMOTE_IMAGE_TIMEOUT_MS);
    try {
      const response = await fetch(target, {
        redirect: "manual",
        cache: "force-cache",
        signal: controller.signal,
        headers: {
          accept: "image/avif,image/webp,image/apng,image/png,image/jpeg,image/gif,image/*;q=0.9,*/*;q=0.1",
          "accept-language": "en-US,en;q=0.9",
          "cache-control": "no-cache",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145 Safari/537.36"
        }
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirect === 3) return null;
        target = await safeRemoteImageUrl(new URL(location, target).toString());
        if (!target) return null;
        continue;
      }

      if (!response.ok) return null;
      const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      if (!type.startsWith("image/") || type === "image/svg+xml") return null;
      const declared = Number(response.headers.get("content-length") ?? "0");
      if (Number.isFinite(declared) && declared > REMOTE_IMAGE_BYTES) return null;

      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > REMOTE_IMAGE_BYTES) return null;
      return { uri: `data:${type};base64,${buffer.toString("base64")}`, bytes: buffer.length };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

async function inlineRemoteImages(cleanHtml: string) {
  const matches = Array.from(cleanHtml.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi));
  const unique = Array.from(new Set(
    matches
      .map((match) => match[1])
      .filter((src) => /^https?:\/\//i.test(src))
  )).slice(0, REMOTE_IMAGE_LIMIT);

  const replacements = new Map<string, string>();
  let total = 0;

  for (let index = 0; index < unique.length; index += 4) {
    const batch = unique.slice(index, index + 4);
    const results = await Promise.all(batch.map(async (src) => [src, await remoteImageDataUri(src)] as const));
    for (let item = 0; item < results.length; item += 1) {
      const [src, fetched] = results[item];
      if (!fetched || total + fetched.bytes > REMOTE_IMAGE_TOTAL_BYTES) continue;
      total += fetched.bytes;
      replacements.set(src, fetched.uri);
    }
    if (total >= REMOTE_IMAGE_TOTAL_BYTES) break;
  }

  let output = cleanHtml;
  replacements.forEach((data, src) => {
    output = output.split(`src="${src}"`).join(`src="${data}"`);
  });

  output = output.replace(/src="https?:\/\/[^"]+"/gi, `src="${TRANSPARENT_GIF}"`);
  return output;
}

async function safeDocument(rawHtml: string, loadRemoteImages: boolean, inlineImages: Record<string, string>) {
  const withInlineImages = injectInlineImages(rawHtml, inlineImages);
  const clean = sanitizeHtml(withInlineImages.slice(0, 650_000), {
    allowedTags: [
      "a", "abbr", "address", "article", "aside", "b", "blockquote", "br", "caption", "center", "code",
      "col", "colgroup", "dd", "del", "details", "div", "dl", "dt", "em", "figcaption", "figure", "font",
      "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "ins", "kbd", "li",
      "main", "ol", "p", "pre", "s", "section", "small", "span", "strong", "style", "sub", "summary", "sup",
      "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul"
    ],
    allowedAttributes: {
      "*": ["class", "id", "style", "dir", "lang", "role", "title", "aria-label", "aria-hidden"],
      a: ["href", "title", "target", "rel", "class", "id", "style"],
      img: loadRemoteImages
        ? ["src", "alt", "title", "width", "height", "class", "id", "style", "border", "align"]
        : ["alt", "title", "width", "height", "class", "id", "style", "border", "align"],
      table: ["width", "height", "align", "valign", "bgcolor", "border", "cellpadding", "cellspacing", "role", "class", "id", "style"],
      tbody: ["align", "valign", "bgcolor", "class", "id", "style"],
      thead: ["align", "valign", "bgcolor", "class", "id", "style"],
      tfoot: ["align", "valign", "bgcolor", "class", "id", "style"],
      tr: ["width", "height", "align", "valign", "bgcolor", "class", "id", "style"],
      td: ["width", "height", "align", "valign", "bgcolor", "colspan", "rowspan", "class", "id", "style"],
      th: ["width", "height", "align", "valign", "bgcolor", "colspan", "rowspan", "class", "id", "style"],
      col: ["width", "span", "class", "style"],
      font: ["color", "face", "size", "class", "style"],
      span: ["data-blocked-image", "title", "class", "id", "style"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowedStyles: {
      "*": {
        color: [/^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|[a-z]+)$/i],
        "background-color": [/^(?:transparent|#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|[a-z]+)$/i],
        "font-family": [/^[\w\s"',.-]{1,160}$/],
        "font-size": [cssLengthPattern],
        "font-weight": [/^(?:normal|bold|bolder|lighter|[1-9]00)(?:\s*!important)?$/i],
        "font-style": [/^(?:normal|italic|oblique)(?:\s*!important)?$/i],
        "text-decoration": [/^[\w\s-]{1,80}(?:\s*!important)?$/i],
        "text-align": [/^(?:left|right|center|justify|start|end)(?:\s*!important)?$/i],
        "line-height": [cssLengthPattern],
        "letter-spacing": [cssLengthPattern],
        display: [/^(?:none|block|inline|inline-block|table|table-row|table-cell|flex|inline-flex)(?:\s*!important)?$/i],
        width: [cssLengthPattern], "max-width": [cssLengthPattern], "min-width": [cssLengthPattern],
        height: [cssLengthPattern], "max-height": [cssLengthPattern], "min-height": [cssLengthPattern],
        margin: [/^[\d\s.%a-z!-]{1,90}$/i], "margin-top": [cssLengthPattern], "margin-right": [cssLengthPattern], "margin-bottom": [cssLengthPattern], "margin-left": [cssLengthPattern],
        padding: [/^[\d\s.%a-z!-]{1,90}$/i], "padding-top": [cssLengthPattern], "padding-right": [cssLengthPattern], "padding-bottom": [cssLengthPattern], "padding-left": [cssLengthPattern],
        border: [/^[#(),.\d\s%a-z!-]{1,140}$/i],
        "border-top": [/^[#(),.\d\s%a-z!-]{1,140}$/i],
        "border-right": [/^[#(),.\d\s%a-z!-]{1,140}$/i],
        "border-bottom": [/^[#(),.\d\s%a-z!-]{1,140}$/i],
        "border-left": [/^[#(),.\d\s%a-z!-]{1,140}$/i],
        "border-radius": [/^[\d\s.%a-z!-]{1,90}$/i],
        "border-collapse": [/^(?:collapse|separate)(?:\s*!important)?$/i],
        "border-spacing": [/^[\d\s.%a-z!-]{1,90}$/i],
        "vertical-align": [/^(?:baseline|sub|super|top|text-top|middle|bottom|text-bottom|[-\d.]+(?:px|%|em|rem)?)(?:\s*!important)?$/i],
        "white-space": [/^(?:normal|nowrap|pre|pre-wrap|pre-line|break-spaces)(?:\s*!important)?$/i],
        overflow: [/^(?:visible|hidden|auto|scroll)(?:\s*!important)?$/i],
        "overflow-wrap": [/^(?:normal|break-word|anywhere)(?:\s*!important)?$/i],
        "word-break": [/^(?:normal|break-all|keep-all|break-word)(?:\s*!important)?$/i]
      }
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: "a",
        attribs: { ...attributes, target: "_blank", rel: "noopener noreferrer nofollow" }
      }),
      img: (_tagName, attributes) => loadRemoteImages
        ? { tagName: "img", attribs: attributes }
        : {
            tagName: "span",
            attribs: {
              "data-blocked-image": "true",
              title: attributes.alt || "Imagine externă protejată"
            }
          }
    }
  });

  const rendered = loadRemoteImages ? await inlineRemoteImages(clean) : clean;
  const imagePolicy = loadRemoteImages ? "img-src data:" : "img-src 'none'";
  return "<!doctype html><html><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; "
    + imagePolicy
    + "; style-src 'unsafe-inline'; font-src 'none'; media-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; connect-src 'none'\"><meta name=\"referrer\" content=\"no-referrer\"><style>"
    + "html{color-scheme:light;background:#fff}body{margin:0;color:#171717;background:#fff;font:14px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;overflow-wrap:anywhere}"
    + ".rn-email-stage{min-height:100%;padding:24px 28px;box-sizing:border-box}"
    + "img{max-width:100%;height:auto}table{max-width:100%}a{color:#1a5fd0}blockquote{margin-left:0;padding-left:14px;border-left:3px solid #ddd;color:#555}"
    + "[data-blocked-image]{display:inline-block;padding:6px 9px;border:1px solid #ddd;border-radius:8px;color:#777;background:#fafafa;font:12px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}"
    + "[data-blocked-image]:before{content:'Imagine protejată'}"
    + "</style></head><body><div class=\"rn-email-stage\">" + rendered + "</div></body></html>";
}

export async function getOwnedGoogleEmailHtml(actor: Actor, messageId: string, loadRemoteImages: boolean) {
  const source = await getOwnedGoogleEmailSource(actor, messageId);
  if (!source) return null;
  const refresh = decryptGoogleRefreshCredential(source.connection.encrypted_refresh_credential as string);
  const token = await refreshGoogleAccessToken(refresh);
  const providerId = encodeURIComponent(source.message.provider_message_id);
  const payload = await googleJson<{ payload?: GmailPart }>("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + providerId + "?format=full", token.access_token);
  const parts: Array<{ data?: string; attachmentId?: string }> = [];
  htmlParts(payload.payload, parts);
  const html: string[] = [];
  for (const part of parts.slice(0, 8)) {
    if (part.data) html.push(decode(part.data));
    else if (part.attachmentId) {
      const attachment = await googleJson<{ data?: string }>("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + providerId + "/attachments/" + encodeURIComponent(part.attachmentId), token.access_token);
      html.push(decode(attachment.data));
    }
  }
  if (!html.some(Boolean)) return { html: null, hasHtml: false };

  const inlineImages = loadRemoteImages
    ? await gmailInlineImageMap(payload.payload, providerId, token.access_token)
    : {};

  return {
    html: await safeDocument(html.join("\n"), loadRemoteImages, inlineImages),
    hasHtml: true
  };
}

function conciseSummary(body: string) {
  const sentences = body.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3);
  return sentences.join(" ").slice(0, 900) || "Mesajul nu conține suficient text normalizat pentru un rezumat sigur.";
}

export async function runOwnedGoogleEmailAction(actor: Actor, messageId: string, action: EmailAction, question?: string) {
  const [detail, source] = await Promise.all([
    getOwnedGoogleEmailDetail(actor, messageId),
    getOwnedGoogleEmailSource(actor, messageId)
  ]);
  if (!detail || !source) return null;
  const sourceId = "email:" + detail.id;
  if (action === "summarize_email") {
    return { action, answer: conciseSummary(detail.body), sourceId, preparedAction: null };
  }
  if (action === "explain_email_relevance") {
    const linked = detail.relatedRecords.map((item) => item.label);
    const answer = linked.length
      ? "Mesajul este relevant deoarece are legături CRM determinate cu: " + linked.join(", ") + "."
      : "Nu există o legătură CRM deterministă confirmată. Mesajul rămâne context privat autorizat și nu este clasificat speculativ.";
    return { action, answer, sourceId, preparedAction: null };
  }
  if (action === "prepare_email_followup") {
    const recipient = detail.direction === "inbound" ? detail.sender : detail.recipients[0] ?? null;
    return {
      action,
      answer: "Am pregătit un draft exclusiv din mesajul selectat și contextul său autorizat. Nu a fost trimis.",
      sourceId,
      preparedAction: {
        status: "prepared_not_executed",
        editable: true,
        recipientName: recipient?.name ?? null,
        recipientEmail: recipient?.email ?? null,
        subject: detail.subject ? "Re: " + detail.subject.replace(/^re:\s*/i, "") : "Următorul pas",
        body: "Bună ziua,\n\nVă mulțumesc pentru mesaj. Revin pentru a confirma următorul pas și informațiile necesare pentru continuare.\n\nCu bine,",
        contextUsed: ["Email selectat · " + new Date(detail.sentAt).toISOString(), source.thread.length > 1 ? "Thread Gmail · " + source.thread.length + " mesaje autorizate" : null, ...detail.relatedRecords.map((item) => item.label)].filter(Boolean)
      }
    };
  }
  const safeQuestion = (question ?? "").normalize("NFKC").trim().slice(0, 240);
  return {
    action,
    answer: safeQuestion
      ? "Pentru întrebarea „" + safeQuestion + "”, mesajul selectat indică: " + conciseSummary(detail.body)
      : conciseSummary(detail.body),
    sourceId,
    preparedAction: null
  };
}
