// API response types

export type ApiResponseBody = string | object | null;

export interface HistoryResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: ApiResponseBody;
  time: number;
}
