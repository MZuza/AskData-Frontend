import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, defer, finalize, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ChatContext,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatRole,
  Source,
  errorMessage,
} from '../models';

/** Rozmowa ze sprawozdaniami: historia wiadomości w signals + wysyłanie pytań. */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/chat`;

  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _pending = signal(false);
  private readonly _error = signal<string | null>(null);
  private conversationId: string | null = null;
  private nextId = 0;

  readonly messages = this._messages.asReadonly();
  /** Czy czekamy na odpowiedź modelu. */
  readonly pending = this._pending.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Dodaje pytanie do historii od razu, a odpowiedź – gdy przyjdzie.
   * Puste pytanie jest ignorowane.
   */
  send(question: string, context: ChatContext = {}): Observable<ChatResponse> {
    return defer(() => {
      const text = question.trim();
      if (!text) {
        return EMPTY;
      }

      this.append('user', text, []);
      this._pending.set(true);
      this._error.set(null);

      const body: ChatRequest = {
        question: text,
        conversationId: this.conversationId,
        ...context,
      };

      return this.http.post<ChatResponse>(this.url, body).pipe(
        tap({
          next: (res) => {
            this.conversationId = res.conversationId;
            this.append('assistant', res.answer, res.sources);
          },
          error: (err: unknown) => this._error.set(errorMessage(err)),
        }),
        finalize(() => this._pending.set(false)),
      );
    });
  }

  /** Zaczyna nową rozmowę. */
  reset(): void {
    this._messages.set([]);
    this._error.set(null);
    this.conversationId = null;
  }

  private append(role: ChatRole, content: string, sources: Source[]): void {
    const message: ChatMessage = {
      id: `m${++this.nextId}`,
      role,
      content,
      sources,
      createdAt: new Date().toISOString(),
    };
    this._messages.update((list) => [...list, message]);
  }
}
