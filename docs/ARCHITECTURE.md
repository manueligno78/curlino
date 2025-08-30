# cUrlino Architecture Documentation

This document describes the overall architecture and design patterns used in the cUrlino application.

## Overview

cUrlino is a cross-platform desktop application built with Electron, React, and TypeScript. It follows a modular architecture with clear separation of concerns between UI components, business logic, and data management.

## Technology Stack

- **Frontend**: React 18.x with TypeScript
- **Desktop Runtime**: Electron 32.x
- **Build System**: Webpack 5.x
- **Testing**: Jest with React Testing Library
- **Code Quality**: ESLint + Prettier
- **CI/CD**: GitHub Actions

## Application Structure

```
src/
├── components/         # React UI components
├── models/            # Data models and interfaces
├── services/          # Business logic services
├── utils/             # Utility functions and helpers
├── types/             # TypeScript type definitions
└── renderer/          # Main application entry points
```

## Architecture Patterns

### Model-View-Service (MVS)

The application follows an MVS pattern:

- **Models**: Define data structures and interfaces (`src/models/`)
- **Views**: React components for UI presentation (`src/components/`)
- **Services**: Business logic and data management (`src/services/`)

### Service Layer Architecture

Core business logic is organized into dedicated services:

#### ApiService

- Handles HTTP requests and responses
- Manages request/response transformations
- Implements retry logic and error handling

#### StorageService

- Manages persistent data storage
- Handles groups, environments, and settings
- Provides data synchronization

#### AuthService

- Manages authentication for API requests
- Supports multiple auth types (Basic, Bearer, API Key)
- Handles token refresh and validation

#### GroupService

- Manages group operations
- Handles import/export functionality
- Provides group organization features

### Component Architecture

React components are organized by feature and responsibility:

#### Layout Components

- `Header`: Application navigation and branding
- `Sidebar`: Group and environment navigation
- `TabSystem`: Multi-request tab management

#### Feature Components

- `RequestPanel`: API request configuration
- `ResponsePanel`: API response display
- `SettingsModal`: Application configuration
- `ImportModal`: Group import functionality

#### Utility Components

- Reusable UI elements and form controls
- Common input validation and formatting

## Data Flow

### Request Lifecycle

1. **User Input**: User configures request in RequestPanel
2. **Validation**: Request data validated by ApiService
3. **Processing**: Request sent via ApiService
4. **Response**: Response processed and displayed in ResponsePanel
5. **Storage**: Request/response optionally saved to history

### Group Management

1. **Creation**: Groups created via GroupService
2. **Storage**: Data persisted via StorageService
3. **Synchronization**: UI updated via React state management
4. **Export**: Groups exported in standard formats

## State Management

### Local Component State

- Individual component state managed with React hooks
- Form state handled with controlled components
- UI state (modals, tabs) managed locally

### Application State

- Global state managed through context providers
- Settings and preferences stored persistently
- Environment variables managed centrally

### Data Persistence

- Groups and environments stored in local files
- Settings persisted in application data directory
- History and cache managed automatically

## Error Handling

### Service Layer Errors

- Network errors handled with retry logic
- Validation errors presented to user
- Service errors logged with structured logging

### UI Error Boundaries

- React error boundaries catch component errors
- Graceful error display with recovery options
- Error reporting to logging system

### Logging System

- Structured logging with multiple levels (ERROR, WARN, INFO, DEBUG)
- Component-specific log categories
- Development vs production log filtering

## Security Considerations

### Content Security Policy

- Strict CSP implemented in HTML
- Script and style sources controlled
- External resource access limited

### Data Protection

- Sensitive data (auth tokens) encrypted at rest
- No data transmitted to external services
- Local-only data storage

### Input Validation

- All user inputs validated at service layer
- XSS protection in UI components
- SQL injection prevention (not applicable - no SQL)

## Performance Optimizations

### Build Optimization

- Code splitting for vendor libraries
- Bundle size optimization with webpack
- Development vs production builds

### Runtime Performance

- React memoization for expensive operations
- Lazy loading of non-critical components
- Efficient re-rendering patterns

### Memory Management

- Proper cleanup of event listeners
- Request/response data garbage group
- Limited history retention

## Testing Strategy

### Unit Testing

- Service layer methods with Jest
- Utility functions with comprehensive coverage
- Mock external dependencies

### Integration Testing

- Component interaction testing
- Service integration with React Testing Library
- End-to-end workflow validation

### Performance Testing

- Bundle size monitoring
- Runtime performance profiling
- Memory leak detection

## Development Workflow

### Code Quality

- ESLint for code quality enforcement
- Prettier for consistent formatting
- Pre-commit hooks prevent bad commits

### Continuous Integration

- Automated testing on pull requests
- Multi-platform build verification
- Dependency security scanning

### Release Process

- Automated releases with GitHub Actions
- Multi-platform electron builds
- Semantic versioning

## Extension Points

### Plugin Architecture

The application is designed to support future plugin development:

- Service interfaces can be extended
- Component slots for custom UI elements
- Event system for plugin communication

### Custom Authentication

New authentication methods can be added by:

- Implementing AuthProvider interface
- Registering with AuthService
- Adding UI components for configuration

### Export Formats

Additional export formats supported through:

- Implementing ExportProvider interface
- Registering with GroupService
- Adding format-specific transformations

## Deployment

### Development

- Local development with hot reload
- Source maps for debugging
- Development-specific logging

### Production

- Optimized builds with minification
- Source maps for error tracking
- Production logging configuration

### Distribution

- Electron Builder for native packages
- Code signing for security
- Auto-updater for maintenance releases

## Future Considerations

### Scalability

- Database integration for large datasets
- Cloud synchronization capabilities
- Team collaboration features

### Performance

- Virtual scrolling for large groups
- Background request processing
- Response caching strategies

### Features

- GraphQL support
- WebSocket testing
- API documentation generation
