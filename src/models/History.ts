import { Request } from './Request';
import { ApiResponseBody } from '../types/api';

export interface HistoryEntry {
  id: string;
  request: Request;
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: ApiResponseBody;
    time: number; // tempo di risposta in ms
  };
  timestamp: Date;
}

export class History {
  private static MAX_ENTRIES = 50;
  private entries: HistoryEntry[] = [];

  constructor(entries: HistoryEntry[] = []) {
    this.entries = entries;
  }

  getEntries(): HistoryEntry[] {
    return [...this.entries];
  }

  addEntry(entry: HistoryEntry): void {
    // Aggiungi la nuova voce all'inizio della lista
    this.entries.unshift(entry);

    // Limita il numero di voci nella cronologia
    if (this.entries.length > History.MAX_ENTRIES) {
      this.entries = this.entries.slice(0, History.MAX_ENTRIES);
    }
  }

  clearHistory(): void {
    this.entries = [];
  }

  deleteEntry(id: string): void {
    this.entries = this.entries.filter(entry => entry.id !== id);
  }

  searchEntries(query: string): HistoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.entries.filter(
      entry =>
        entry.request.url.toLowerCase().includes(lowerQuery) ||
        entry.request.method.toLowerCase().includes(lowerQuery)
    );
  }
}
