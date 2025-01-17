import { getDaysUntilDate } from '@/lib/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('getDaysUntilDate', () => {
  beforeEach(() => {
    // Set fixed date to January 15, 2024
    vi.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return positive days for future date', () => {
    const futureDate = new Date('2024-01-20'); // 5 days in future
    expect(getDaysUntilDate(futureDate)).toBe(5);
  });

  it('should return zero for current date', () => {
    const currentDate = new Date('2024-01-15');
    expect(getDaysUntilDate(currentDate)).toBe(0);
  });

  it('should return negative days for past date', () => {
    const pastDate = new Date('2024-01-10'); // 5 days ago
    expect(getDaysUntilDate(pastDate)).toBe(-5);
  });

  it('should handle date at end of month correctly', () => {
    const endOfMonth = new Date('2024-01-31');
    expect(getDaysUntilDate(endOfMonth)).toBe(16);
  });

  it('should handle string dates correctly', () => {
    expect(getDaysUntilDate('2024-01-20')).toBe(5);
  });

  it('should handle ISO format dates correctly', () => {
    expect(getDaysUntilDate('2024-01-20T15:30:00.000Z')).toBe(6);
  });

  it('should handle timezone differences correctly', () => {
    const dateWithTimezone = '2024-01-16T00:00:00+02:00'; // One day ahead but with timezone
    expect(getDaysUntilDate(dateWithTimezone)).toBe(1);
  });

  it('should not return fractional days', () => {
    const laterInDay = '2024-01-15T23:59:59.999Z';
    expect(getDaysUntilDate(laterInDay)).toBe(1);
  });

  it('should handle invalid date strings', () => {
    expect(() => getDaysUntilDate('invalid-date')).not.toThrow();
  });

  it('should handle invalid date strings', () => {
    expect(getDaysUntilDate('invalid-date')).toBe(NaN);
  });
});
