import { Request, RequestInterface } from './Request';

export interface CollectionInterface {
  id: string;
  name: string;
  description?: string;
  requests: Request[];
}

export class Collection implements CollectionInterface {
  id: string;
  name: string;
  description?: string;
  requests: Request[];

  constructor(id: string, name: string, description: string = '', requests: Request[] = []) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.requests = requests;
  }

  addRequest(request: Request): void {
    this.requests.push(request);
  }

  removeRequest(requestId: string): void {
    this.requests = this.requests.filter(request => request.id !== requestId);
  }

  getRequests(): Request[] {
    return this.requests;
  }

  findRequest(requestId: string): Request | undefined {
    return this.requests.find(request => request.id === requestId);
  }

  toJSON(): Omit<CollectionInterface, 'requests'> & { requests: RequestInterface[] } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      requests: this.requests.map(r =>
        typeof r === 'object' &&
        r !== null &&
        'toJSON' in r &&
        typeof (r as { toJSON: () => RequestInterface }).toJSON === 'function'
          ? (r as { toJSON: () => RequestInterface }).toJSON()
          : (r as RequestInterface)
      ),
    };
  }
}
