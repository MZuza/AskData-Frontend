import { buildPdf } from './mock-pdf';

describe('buildPdf', () => {
  it('tworzy tabelę xref wskazującą dokładnie na początki obiektów', () => {
    const pdf = buildPdf([['Strona 1', 'Zażółć (gęślą) jaźń'], ['Strona 2']]);

    const xrefStart = Number(/startxref\n(\d+)/.exec(pdf)![1]);
    expect(pdf.slice(xrefStart, xrefStart + 4)).toBe('xref');

    const entries = pdf
      .slice(xrefStart)
      .split('\n')
      .filter((line) => / 00000 n $/.test(line))
      .map((line) => Number(line.slice(0, 10)));

    expect(entries).toHaveLength(7); // katalog, strony, font, 2 × (strona + treść)
    entries.forEach((offset, i) => {
      expect(pdf.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true);
    });
  });

  it('zamienia polskie znaki na ASCII i escapuje nawiasy', () => {
    const pdf = buildPdf([['Zażółć (gęślą) jaźń']]);
    expect(pdf).toContain('(Zazolc \\(gesla\\) jazn) Tj');
    expect(/[^\x00-\x7f]/.test(pdf)).toBe(false);
  });
});
