import { describe, expect, it } from 'vitest';
import { guvenliDonus } from '../src/lib/yonlendirme';

describe('guvenliDonus', () => {
  it('site içi yolları kabul eder', () => {
    expect(guvenliDonus('/sepet')).toBe('/sepet');
    expect(guvenliDonus('/siparisler/3?yeni=1')).toBe('/siparisler/3?yeni=1');
  });

  it('dış adresleri ve hileli yolları reddeder', () => {
    for (const kotu of ['https://kotu.com', '//kotu.com', '/\\kotu.com', 'javascript:alert(1)', '', null, 42]) {
      expect(guvenliDonus(kotu)).toBe('/');
    }
  });
});
