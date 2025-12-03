import { UploadedTextFile } from '../core/plagiarism-session';

export function cleanText(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function getTextForComparison(item: UploadedTextFile): string {
  if (item.useCleaned && item.cleanedContent) {
    return item.cleanedContent;
  }
  return item.content ?? '';
}

export function toggleCleanMode(item: UploadedTextFile): void {
  item.useCleaned = !item.useCleaned;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function toggleOpen(item: UploadedTextFile): void {
  item.isOpen = !item.isOpen;
}
