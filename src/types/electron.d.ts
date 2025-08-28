interface FileSystemOptions {
  encoding?: BufferEncoding;
  flag?: string;
}

// SVG imports
declare module '*.svg' {
  const content: string;
  export default content;
}

interface HttpRequestData {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  rejectUnauthorized?: boolean;
}

interface HttpResponse {
  status: string;
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  responseTime: number;
}

interface HttpResult {
  success: boolean;
  data?: HttpResponse;
  error?: {
    error: string;
    code?: string;
    responseTime?: number;
  };
}

declare global {
  interface Window {
    electron?: {
      send: (channel: string, data?: unknown) => void;
      receive: (channel: string, func: (...args: unknown[]) => void) => void;
      path: {
        join: (...args: string[]) => string;
        resolve: (...args: string[]) => string;
      };
      fs: {
        readFileSync: (path: string, options?: FileSystemOptions) => string;
        writeFileSync: (path: string, data: string, options?: FileSystemOptions) => void;
      };
      openFolder: (path: string) => void;
      getAppDataPath: () => string;
      getPlatform: () => string;
      httpRequest: (requestData: HttpRequestData) => Promise<HttpResult>;
    };
    electronStorage?: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    };
  }
}

export {};
