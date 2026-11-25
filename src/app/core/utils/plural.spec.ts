import { plural } from './plural';

describe('plural', () => {
  it.each([
    [0, 'plików'],
    [1, 'plik'],
    [2, 'pliki'],
    [4, 'pliki'],
    [5, 'plików'],
    [12, 'plików'],
    [14, 'plików'],
    [22, 'pliki'],
    [25, 'plików'],
    [112, 'plików'],
  ])('%i → %s', (n, expected) => {
    expect(plural(n, 'plik', 'pliki', 'plików')).toBe(expected);
  });
});
