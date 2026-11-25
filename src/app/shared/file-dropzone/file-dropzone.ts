import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export interface RejectedFile {
  name: string;
  reason: string;
}

let nextId = 0;

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Pole do wgrywania PDF-ów: przeciąganie albo wybór z dysku.
 * Emituje tylko poprawne pliki; odrzucone pokazuje pod polem.
 */
@Component({
  selector: 'app-file-dropzone',
  templateUrl: './file-dropzone.html',
  styleUrl: './file-dropzone.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.dragging]': 'dragging()',
    '[class.disabled]': 'disabled()',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'dragging.set(false)',
    '(drop)': 'onDrop($event)',
  },
})
export class FileDropzone {
  readonly maxSizeMb = input(20);
  readonly disabled = input(false);
  readonly filesSelected = output<File[]>();

  protected readonly dragging = signal(false);
  protected readonly rejected = signal<RejectedFile[]>([]);
  protected readonly inputId = `file-dropzone-${nextId++}`;

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(!this.disabled());
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (!this.disabled()) {
      this.accept(Array.from(event.dataTransfer?.files ?? []));
    }
  }

  protected onPick(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    this.accept(Array.from(fileInput.files ?? []));
    // Pozwala wybrać ten sam plik ponownie.
    fileInput.value = '';
  }

  private accept(files: File[]): void {
    const maxBytes = this.maxSizeMb() * 1024 * 1024;
    const valid: File[] = [];
    const rejected: RejectedFile[] = [];

    for (const file of files) {
      if (!isPdf(file)) {
        rejected.push({ name: file.name, reason: 'to nie jest plik PDF' });
      } else if (file.size > maxBytes) {
        rejected.push({ name: file.name, reason: `plik jest większy niż ${this.maxSizeMb()} MB` });
      } else {
        valid.push(file);
      }
    }

    this.rejected.set(rejected);
    if (valid.length) {
      this.filesSelected.emit(valid);
    }
  }
}
