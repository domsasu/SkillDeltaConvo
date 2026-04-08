import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let workerSet = false;

function ensurePdfWorker(): void {
  if (!workerSet) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
    workerSet = true;
  }
}

/**
 * Extract plain text from a resume file (PDF or .txt). .doc/.docx are not supported in v1.
 */
export async function extractTextFromResumeFile(file: File): Promise<string> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.txt')) {
    return file.text();
  }

  if (lower.endsWith('.pdf')) {
    ensurePdfWorker();
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      parts.push(strings.join(' '));
    }
    const text = parts.join('\n\n').replace(/\s+/g, ' ').trim();
    if (!text) {
      throw new Error(
        'No text could be read from this PDF. It may be scanned images—try pasting plain text instead.'
      );
    }
    return text;
  }

  if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
    throw new Error('Word documents are not supported yet. Please upload a PDF or .txt file, or paste your resume as text.');
  }

  throw new Error('Unsupported file type. Use PDF or .txt.');
}
