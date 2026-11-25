/** Fragment sprawozdania, na którym opiera się odpowiedź. */
export interface Source {
  reportId: string;
  filename: string;
  page: number;
  fragment: string;
}

/** Body `POST /chat`. */
export interface ChatRequest {
  question: string;
  /** Brak = wszystkie sprawozdania. */
  reportIds?: string[];
  /** Zawężenie do grupy laboratoryjnej. */
  group?: string | null;
  /** Brak = nowa rozmowa. */
  conversationId?: string | null;
}

/** Odpowiedź `POST /chat`. */
export interface ChatResponse {
  conversationId: string;
  /** Markdown. */
  answer: string;
  sources: Source[];
}

/** Zakres sprawozdań, o które pytamy w czacie. */
export interface ChatContext {
  reportIds?: string[];
  group?: string | null;
}

export type ChatRole = 'user' | 'assistant';

/** Wiadomość w historii rozmowy (stan frontendu). */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources: Source[];
  /** ISO 8601 */
  createdAt: string;
}
