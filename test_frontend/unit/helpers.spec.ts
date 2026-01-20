import { describe, expect, it } from 'vitest';

import {
  cleanText,
  formatSize,
  getTextForComparison,
  toggleCleanMode,
  toggleOpen,
} from '../../src/app/__common/helper';
import type { UploadedTextFile } from '../../src/app/core/plagiarism-session';

describe('helper utilities', () => {
  it('cleans text and normalizes whitespace', () => {
    const raw = 'Hello,   World!!!';
    expect(cleanText(raw)).toBe('hello world');
  });

  it('formats sizes in bytes, KB, and MB', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(1536)).toBe('1.5 KB');
    expect(formatSize(1024 * 1024)).toBe('1.0 MB');
  });

  it('returns cleaned content when enabled', () => {
    const item: UploadedTextFile = {
      file: {} as File,
      content: 'raw',
      cleanedContent: 'clean',
      useCleaned: true,
      isLoading: false,
    };
    expect(getTextForComparison(item)).toBe('clean');
  });

  it('returns raw content when cleaned is disabled', () => {
    const item: UploadedTextFile = {
      file: {} as File,
      content: 'raw',
      cleanedContent: 'clean',
      useCleaned: false,
      isLoading: false,
    };
    expect(getTextForComparison(item)).toBe('raw');
  });

  it('toggles boolean helpers', () => {
    const item: UploadedTextFile = {
      file: {} as File,
      content: 'raw',
      isLoading: false,
      isOpen: false,
      useCleaned: false,
    };
    toggleCleanMode(item);
    toggleOpen(item);
    expect(item.useCleaned).toBe(true);
    expect(item.isOpen).toBe(true);
  });
});
