import { ReportDetails } from '../models';

const PAGE_WIDTH = 595; // A4 w punktach
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const LINE_HEIGHT = 16;
const MAX_CHARS = 85;

/**
 * Buduje prosty, poprawny PDF z treścią sprawozdania – po jednej stronie PDF na każdą stronę
 * sprawozdania, z sekcjami i tabelami na właściwych stronach. Tylko dla mocków.
 */
export function mockReportPdf(report: ReportDetails): Blob {
  const pageCount = Math.max(1, report.pageCount ?? 1);
  const pages: string[][] = [];

  for (let page = 1; page <= pageCount; page++) {
    const lines = [`${report.filename}  -  strona ${page} z ${pageCount}`, ''];
    if (page === 1) {
      lines.push(report.topic ?? '', report.authors.map((a) => a.name).join(', '), '');
    }
    for (const section of report.sections) {
      if (section.pageStart <= page && page <= section.pageEnd) {
        lines.push(section.title.toUpperCase(), ...wrap(section.content), '');
      }
    }
    for (const table of report.tables.filter((t) => t.page === page)) {
      lines.push(table.caption ?? 'Tabela', table.headers.join('  |  '));
      lines.push(...table.rows.map((row) => row.join('  |  ')), '');
    }
    pages.push(lines);
  }

  return new Blob([buildPdf(pages)], { type: 'application/pdf' });
}

/** Minimalny PDF 1.4: katalog, drzewo stron, font Helvetica, strony z tekstem. */
export function buildPdf(pages: string[][]): string {
  const objects: string[] = [];
  const fontId = 3;
  const pageIds = pages.map((_, i) => 4 + i * 2);

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((lines, i) => {
    const pageId = pageIds[i];
    const contentId = pageId + 1;
    const stream = textStream(lines);
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

function textStream(lines: string[]): string {
  const maxLines = Math.floor((PAGE_HEIGHT - 2 * MARGIN) / LINE_HEIGHT);
  const body = lines
    .slice(0, maxLines)
    .map((line, i) => `${i === 0 ? '' : `0 -${LINE_HEIGHT} Td `}(${escape(line)}) Tj`)
    .join('\n');
  return `BT\n/F1 11 Tf\n${MARGIN} ${PAGE_HEIGHT - MARGIN} Td\n${body}\nET`;
}

/** Zawija tekst do linii o długości `MAX_CHARS`. */
function wrap(text: string): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    if (current && current.length + word.length + 1 > MAX_CHARS) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  return current ? [...lines, current] : lines;
}

/** Standardowy font PDF nie zna polskich znaków – zamieniamy je na ASCII i escapujemy nawiasy. */
function escape(text: string): string {
  return text
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e]/g, '?')
    .replace(/[\\()]/g, (c) => `\\${c}`);
}
