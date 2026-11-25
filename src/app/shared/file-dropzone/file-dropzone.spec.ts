import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FileDropzone } from './file-dropzone';

@Component({
  imports: [FileDropzone],
  template: `<app-file-dropzone
    [maxSizeMb]="maxSizeMb()"
    [disabled]="disabled()"
    (filesSelected)="selected.push($event)"
  />`,
})
class Host {
  readonly maxSizeMb = signal(20);
  readonly disabled = signal(false);
  readonly selected: File[][] = [];
}

function pdf(name: string, content = '%PDF-1.4'): File {
  return new File([content], name, { type: 'application/pdf' });
}

/** jsdom nie ma `DataTransfer`, więc podstawiamy samą listę plików. */
function drop(target: Element, files: File[]): void {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  target.dispatchEvent(event);
}

describe('FileDropzone', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      zone: el.querySelector('app-file-dropzone')!,
    };
  }

  it('emituje upuszczone PDF-y, a pozostałe pokazuje jako odrzucone', async () => {
    const { fixture, host, zone } = await render();

    drop(zone, [pdf('a.pdf'), new File(['x'], 'notatki.docx'), pdf('b.PDF')]);
    await fixture.whenStable();

    expect(host.selected.map((files) => files.map((f) => f.name))).toEqual([['a.pdf', 'b.PDF']]);
    expect(zone.querySelector('.rejected')?.textContent).toContain('notatki.docx');
    expect(zone.querySelector('.rejected')?.textContent).toContain('to nie jest plik PDF');
  });

  it('odrzuca za duże pliki', async () => {
    const { fixture, host, zone } = await render();
    host.maxSizeMb.set(0.00001); // ~10 bajtów
    await fixture.whenStable();

    drop(zone, [pdf('duzy.pdf', '%PDF-1.4 bardzo długa treść')]);
    await fixture.whenStable();

    expect(host.selected).toEqual([]);
    expect(zone.querySelector('.rejected')?.textContent).toContain('większy niż');
  });

  it('ignoruje pliki, gdy jest wyłączone', async () => {
    const { fixture, host, zone } = await render();
    host.disabled.set(true);
    await fixture.whenStable();

    drop(zone, [pdf('a.pdf')]);
    expect(host.selected).toEqual([]);
    expect(zone.querySelector('input')?.disabled).toBe(true);
  });
});
