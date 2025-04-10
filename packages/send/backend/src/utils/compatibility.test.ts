import { describe, expect, it } from 'vitest';
import { checkCompatibility } from './compatibility';

describe('checkCompatibility', () => {
  it('should return FORCE_UPDATE when major versions differ', () => {
    const result = checkCompatibility('2.0', '1.0');
    expect(result).toBe('FORCE_UPDATE');
  });

  it('should return PROMPT_UPDATE when major versions are the same but minor versions differ', () => {
    const result = checkCompatibility('1.2', '1.3');
    expect(result).toBe('PROMPT_UPDATE');
  });

  it('should return COMPATIBLE when major and minor versions are the same', () => {
    const result = checkCompatibility('1.2', '1.2');
    expect(result).toBe('COMPATIBLE');
  });

  it('should handle versions with patch numbers correctly', () => {
    const result = checkCompatibility('1.2.3', '1.2.4');
    expect(result).toBe('COMPATIBLE');
  });

  it('should handle major version incompatibility', () => {
    const result = checkCompatibility('0.2.3', '1.2.4');
    expect(result).toBe('FORCE_UPDATE');
  });

  it('should return PROMPT_UPDATE on minor version difference', () => {
    const result = checkCompatibility('0.2.3', '0.3.3');
    expect(result).toBe('PROMPT_UPDATE');
  });

  it('should handle multiple different version scenarios', () => {
    expect(checkCompatibility('1.0', '1.0')).toBe('COMPATIBLE');
    expect(checkCompatibility('1.0', '1.1')).toBe('PROMPT_UPDATE');
    expect(checkCompatibility('1.0', '2.0')).toBe('FORCE_UPDATE');
    expect(checkCompatibility('2.1', '2.1')).toBe('COMPATIBLE');
  });
});
