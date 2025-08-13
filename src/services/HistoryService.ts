import { v4 as uuidv4 } from 'uuid';
import { History, HistoryEntry } from '../models/History';
import { Request } from '../models/Request';
import { StorageService } from './StorageService';
import { HistoryResponseData } from '../types/api';

export class HistoryService {
  private history: History;
  private storageService: StorageService;
  private static readonly STORAGE_KEY = 'cUrlino_history';

  constructor() {
    this.storageService = new StorageService();
    const savedHistory =
      this.storageService.getItem<HistoryEntry[]>(HistoryService.STORAGE_KEY) || [];
    this.history = new History(savedHistory);
  }

  getHistory(): HistoryEntry[] {
    return this.history.getEntries();
  }

  addToHistory(request: Request, response?: HistoryResponseData): HistoryEntry {
    const entry: HistoryEntry = {
      id: uuidv4(),
      request: request, // HistoryEntry contiene il riferimento all'oggetto Request completo
      timestamp: new Date(),
      response: response
        ? {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
            time: response.time || 0,
          }
        : undefined,
    };

    this.history.addEntry(entry);
    this._saveHistory();
    return entry;
  }

  clearHistory(): void {
    this.history.clearHistory();
    this._saveHistory();
  }

  deleteHistoryEntry(id: string): void {
    this.history.deleteEntry(id);
    this._saveHistory();
  }

  searchHistory(query: string): HistoryEntry[] {
    return this.history.searchEntries(query);
  }

  private _saveHistory(): void {
    this.storageService.setItem(HistoryService.STORAGE_KEY, this.history.getEntries());
  }
}
