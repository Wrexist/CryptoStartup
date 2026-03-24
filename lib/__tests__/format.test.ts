import { fmt, fmtHash, fmtCoin } from '../format';

describe('fmt', () => {
  it('formats billions', () => {
    expect(fmt(1_500_000_000)).toBe('$1.50B');
    expect(fmt(1_000_000_000)).toBe('$1.00B');
  });

  it('formats millions', () => {
    expect(fmt(2_500_000)).toBe('$2.50M');
    expect(fmt(1_000_000)).toBe('$1.00M');
  });

  it('formats thousands', () => {
    expect(fmt(12_000)).toBe('$12.0K');
    expect(fmt(1_000)).toBe('$1.0K');
  });

  it('formats small numbers', () => {
    expect(fmt(500)).toBe('$500');
    expect(fmt(0)).toBe('$0');
  });
});

describe('fmtHash', () => {
  it('formats terahash', () => {
    expect(fmtHash(1500)).toBe('1.50 TH/s');
    expect(fmtHash(1000)).toBe('1.00 TH/s');
  });

  it('formats gigahash', () => {
    expect(fmtHash(500)).toBe('500.00 GH/s');
    expect(fmtHash(10)).toBe('10.00 GH/s');
  });
});

describe('fmtCoin', () => {
  it('formats zero', () => {
    expect(fmtCoin(0, 'BTC')).toBe('0 BTC');
  });

  it('formats very small amounts in exponential notation', () => {
    expect(fmtCoin(0.00001, 'BTC')).toBe('1.00e-5 BTC');
    expect(fmtCoin(0.00001, 'ETH')).toBe('1.00e-5 ETH');
  });

  it('formats amounts above threshold with decimals', () => {
    expect(fmtCoin(0.0001, 'BTC')).toBe('0.000100 BTC');
    expect(fmtCoin(0.001, 'DOGE')).toBe('0.001000 DOGE');
  });

  it('formats normal amounts', () => {
    expect(fmtCoin(1.5, 'BTC')).toBe('1.500000 BTC');
  });
});
