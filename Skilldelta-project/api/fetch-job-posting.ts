import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500_000);
}

function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error('Invalid URL');
  }

  if (url.protocol !== 'https:') {
    throw new Error('Only https:// URLs are allowed');
  }

  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host.endsWith('.local')
  ) {
    throw new Error('This host is not allowed');
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 10) throw new Error('Private network URLs are not allowed');
    if (a === 127) throw new Error('Private network URLs are not allowed');
    if (a === 0) throw new Error('Private network URLs are not allowed');
    if (a === 169 && b === 254) throw new Error('Private network URLs are not allowed');
    if (a === 192 && b === 168) throw new Error('Private network URLs are not allowed');
    if (a === 172 && b >= 16 && b <= 31) throw new Error('Private network URLs are not allowed');
  }

  if (host.includes(':') && host.startsWith('[')) {
    const inner = host.slice(1, -1).toLowerCase();
    if (inner === '::1' || inner.startsWith('fe80:') || inner.startsWith('fc') || inner.startsWith('fd')) {
      throw new Error('Private network URLs are not allowed');
    }
  }

  return url;
}

function guessTitleFromHtml(html: string): string | undefined {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!m) return undefined;
  return htmlToPlainText(m[1]).slice(0, 200) || undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body: { url?: string };
  try {
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body) as { url?: string };
    } else {
      body = (req.body ?? {}) as { url?: string };
    }
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const rawUrl = body?.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    res.status(400).json({ error: 'Missing url' });
    return;
  }

  let url: URL;
  try {
    url = assertSafeUrl(rawUrl);
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Bad URL' });
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialmotivationJobFetcher/1.0; +https://vercel.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) {
      res.status(502).json({ error: `Upstream returned ${response.status}` });
      return;
    }

    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
      res.status(415).json({ error: 'URL did not return HTML' });
      return;
    }

    const buf = await response.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      res.status(413).json({ error: 'Page is too large' });
      return;
    }

    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    const titleGuess = guessTitleFromHtml(html);
    const text = htmlToPlainText(html);

    if (!text || text.length < 50) {
      res.status(422).json({
        error: 'Could not extract enough text. Try pasting the job description instead.',
        titleGuess,
        text: text || '',
      });
      return;
    }

    res.status(200).json({ text, titleGuess: titleGuess ?? null });
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : 'Fetch failed';
    if (msg.includes('abort')) {
      res.status(504).json({ error: 'Request timed out' });
      return;
    }
    res.status(502).json({ error: msg });
  }
}
