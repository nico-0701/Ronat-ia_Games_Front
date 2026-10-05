import { describe, expect, it } from 'vitest';
import { compareVersions } from './version';

describe('compareVersions', () => {
  it.each([
    ['1.0.0', '1.0.0', 0],
    ['1.2.0', '1.10.0', -8],
    ['2.0.0', '1.9.9', 1],
    ['1.0', '1.0.0', 0],
    ['0.1.0-beta.1', '0.1.0', 0],
  ])('%s versus %s', (a, b, expected) => {
    expect(Math.sign(compareVersions(a, b))).toBe(Math.sign(expected));
  });
});
