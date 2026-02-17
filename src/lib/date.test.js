import { describe, it, expect } from 'vitest';
import { formatDateShort, formatDateSmart } from './date.js';

describe('formatDateShort runtime assert', () => {
  it('should reject ISO datetime strings with T', () => {
    expect(() => formatDateShort('2026-02-16T08:00:00Z')).toThrow(/pure date/i);
  });

  it('should accept pure date strings', () => {
    expect(formatDateShort('2026-02-16')).toBe('2月16日');
  });

  it('should handle empty/null gracefully', () => {
    expect(formatDateShort('')).toBe('');
    expect(formatDateShort(null)).toBe('');
  });
});

describe('formatDateSmart', () => {
  it('should handle pure date strings', () => {
    expect(formatDateSmart('2026-02-16')).toBe('2月16日');
  });

  it('should handle ISO datetime strings without throwing', () => {
    const result = formatDateSmart('2026-02-16T08:00:00+08:00');
    expect(result).toMatch(/2月16日/);
  });

  it('should handle empty/null gracefully', () => {
    expect(formatDateSmart('')).toBe('');
    expect(formatDateSmart(null)).toBe('');
  });
});
