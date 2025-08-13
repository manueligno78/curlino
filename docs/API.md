# cUrlino API Documentation

This document describes the internal API structure and service interfaces of the cUrlino application.

## Core Services

### ApiService

The `ApiService` handles HTTP requests and responses for API testing.

#### Methods

- `makeRequest(request: ApiRequest): Promise<ApiResponse>`
- `validateRequest(request: ApiRequest): boolean`
- `parseResponse(response: any): ApiResponse`

### StorageService

Manages persistent storage for collections, environments, and settings.

#### Methods

- `saveCollections(collections: Collection[]): void`
- `loadCollections(): Collection[]`
- `saveEnvironments(environments: Environment[]): void`
- `loadEnvironments(): Environment[]`
- `saveSettings(settings: AppSettings): void`
- `loadSettings(): AppSettings`

### AuthService

Handles authentication for API requests.

#### Methods

- `authenticate(type: AuthType, credentials: any): Promise<AuthToken>`
- `refreshToken(token: AuthToken): Promise<AuthToken>`
- `validateToken(token: AuthToken): boolean`

### CollectionService

Manages collection operations and organization.

#### Methods

- `createCollection(name: string): Collection`
- `updateCollection(id: string, updates: Partial<Collection>): void`
- `deleteCollection(id: string): void`
- `importCollection(data: any): Collection`
- `exportCollection(id: string): any`

## Data Models

### ApiRequest

```typescript
interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  auth?: AuthConfig;
  timeout?: number;
}
```

### ApiResponse

```typescript
interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
  size: number;
}
```

### Collection

```typescript
interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: ApiRequest[];
  folders: Folder[];
  auth?: AuthConfig;
  variables?: Variable[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Environment

```typescript
interface Environment {
  id: string;
  name: string;
  variables: Variable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Variable

```typescript
interface Variable {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}
```

## Authentication Types

### Basic Auth

```typescript
interface BasicAuth {
  type: 'basic';
  username: string;
  password: string;
}
```

### Bearer Token

```typescript
interface BearerAuth {
  type: 'bearer';
  token: string;
}
```

### API Key

```typescript
interface ApiKeyAuth {
  type: 'apikey';
  key: string;
  value: string;
  in: 'header' | 'query';
}
```

## Error Handling

All services use structured error handling with the following error types:

- `NetworkError`: Connection or network-related errors
- `ValidationError`: Request validation failures
- `AuthenticationError`: Authentication-related errors
- `StorageError`: Data persistence errors
- `ParseError`: Response parsing errors

## Events

The application uses an event-driven architecture with the following events:

- `request:sent`: Fired when an API request is sent
- `request:completed`: Fired when an API request completes
- `collection:created`: Fired when a new collection is created
- `collection:updated`: Fired when a collection is modified
- `environment:changed`: Fired when the active environment changes
- `settings:updated`: Fired when application settings are changed

## Usage Examples

### Making an API Request

```typescript
const request: ApiRequest = {
  id: 'req-123',
  name: 'Get Users',
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: {
    'Content-Type': 'application/json',
  },
};

const response = await ApiService.makeRequest(request);
console.log(response.status, response.body);
```

### Creating a Collection

```typescript
const collection = CollectionService.createCollection('My API Collection');
collection.requests.push(request);
StorageService.saveCollections([collection]);
```

### Managing Environments

```typescript
const environment: Environment = {
  id: 'env-123',
  name: 'Development',
  variables: [{ key: 'baseUrl', value: 'https://dev-api.example.com', enabled: true }],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

StorageService.saveEnvironments([environment]);
```
