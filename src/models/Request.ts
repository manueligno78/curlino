export interface RequestInterface {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  description?: string;
}

export class Request implements RequestInterface {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  description?: string;

  constructor(
    id: string,
    name: string,
    url: string,
    method: string = 'GET',
    headers: Record<string, string> = {},
    body: string = '',
    description: string = ''
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.method = method;
    this.headers = headers;
    this.body = body;
    this.description = description;
  }

  setName(name: string): void {
    this.name = name;
  }

  setUrl(url: string): void {
    this.url = url;
  }

  setMethod(method: string): void {
    this.method = method;
  }

  setHeaders(headers: Record<string, string>): void {
    this.headers = headers;
  }

  setBody(body: string): void {
    this.body = body;
  }

  setDescription(description: string): void {
    this.description = description;
  }

  getRequestOptions(): {
    method: string;
    headers: Record<string, string>;
    body?: string;
  } {
    const options = {
      method: this.method,
      headers: this.headers,
    };

    if (this.method !== 'GET' && this.body) {
      return { ...options, body: this.body };
    }

    return options;
  }

  toJSON(): RequestInterface {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      method: this.method,
      headers: this.headers,
      body: this.body,
      description: this.description,
    };
  }
}
