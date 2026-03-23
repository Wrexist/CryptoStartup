import { fmt, fmtHash, fmtCoin } from '@/lib/format';

describe('fmt', () => {
  it('formats billions', () => {
    expect(fmt(2_500_000_000)).toBe('$2.50B');
  });

  it('formats millions', () => {
    expect(fmt(1_250_000)).toBe('$1.25M');
  });

  it('formats thousands', () => {
    expect(fmt(42_500)).toBe('$42.5K');
  });

  it('formats small values', () => {
    expect(fmt(850)).toBe('$850');
  });

  it('formats zero', () => {
    expect(fmt(0)).toBe('$0');
  });
});

describe('fmtHash', () => {
  it('formats terahash', () => {
    expect(fmtHash(1500)).toBe('1.50 TH/s');
  });

  it('formats gigahash', () => {
    expect(fmtHash(150)).toBe('150.00 GH/s');
  });

  it('formats small hash', () => {
    expect(fmtHash(10)).toBe('10.00 GH/s');
  });
});

describe('fmtCoin', () => {
  it('formats zero', () => {
    expect(fmtCoin(0, 'BTC')).toBe('0 BTC');
  });

  it('formats very small amounts with scientific notation', () => {
    expect(fmtCoin(0.00001, 'BTC')).toBe('1.00e-5 BTC');
  });

  it('formats very tiny amounts with scientific notation', () => {
    expect(fmtCoin(0.00000001, 'BTC')).toMatch(/e/);
  });

  it('formats normal amounts', () => {
    expect(fmtCoin(1.5, 'BTC')).toBe('1.500000 BTC');
  });
});
