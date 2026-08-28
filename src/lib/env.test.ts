import { describe, expect, it } from 'vitest';
import { resolveAppCheckProvider } from './env';

describe('resolveAppCheckProvider', () => {
  it('preserves v3 as the default for existing environments', () => {
    expect(resolveAppCheckProvider(undefined)).toBe('v3');
    expect(resolveAppCheckProvider('v3')).toBe('v3');
  });

  it('selects Enterprise only when configured explicitly', () => {
    expect(resolveAppCheckProvider('enterprise')).toBe('enterprise');
    expect(() => resolveAppCheckProvider('recaptcha-v3')).toThrow('VITE_APPCHECK_PROVIDER');
  });
});
