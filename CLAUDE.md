# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Curlino is a modern desktop REST API client built with Electron, React, and TypeScript. It provides a cross-platform solution for creating, managing, and testing API requests with features like collections, environments, and response handling.

## Development Commands

### Core Development
- `npm run dev` - Start development build with file watching (rebuilds on changes)
- `npm start` - Build production bundle and launch Electron app
- `npm run build` - Create production webpack bundle
- `npm run electron` - Launch Electron app (requires existing bundle)

### Code Quality
- `npm run lint` - Run ESLint on src/ directory
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm test` - Run Jest test suite
- `npm test:watch` - Run tests in watch mode

### Packaging
- `npm run pack` - Create platform-specific app bundle (development)
- `npm run dist` - Create distributable packages (.app, .dmg, etc.)

## Architecture

### Core Structure
- **Entry Point**: `src/renderer/index.tsx` (React app entry)
- **Main Process**: `electron.js` (Electron main process)
- **Preload**: `preload.js` (Electron preload script for IPC)

### Directory Organization
- `src/components/` - React UI components (modals, panels, forms)
- `src/services/` - Business logic (ApiService, StorageService, etc.)
- `src/models/` - TypeScript interfaces and data models
- `src/utils/` - Utility functions (logging, error handling, formatters, platform detection, interaction managers)
- `src/types/` - Type definitions
- `src/styles/` - Modern CSS design system with optimization and responsive design

### Key Services
- **ApiService** - HTTP request handling and processing
- **StorageService** - Data persistence for collections/environments
- **SettingsService** - Application configuration management
- **HistoryService** - Request history tracking

### Modern UI Architecture (2025 Refactor)
- **Design System**: Comprehensive CSS design tokens with light/dark themes
- **Interactive Systems**: Advanced drag&drop, resize, keyboard shortcuts, context menus
- **Platform Detection**: Cross-platform optimization (macOS/Windows/Linux)
- **Responsive Design**: Mobile-first approach with 4 breakpoints
- **Performance**: Optimized CSS with tree shaking and conditional loading

### State Management
Uses React hooks and context for state management. No external state library (Redux, Zustand) is used.

## Build System

### Webpack Configuration
- Development: `webpack.config.js` with source maps and hot reload
- Production: `webpack.prod.js` with optimization
- TypeScript compilation via `ts-loader`
- CSS modules support
- Path alias: `@/` maps to `src/`

### CSS Architecture (2025)
- **Modular Imports**: `src/styles/index.css` - Optimized import system
- **Design Tokens**: `design-tokens.css` - Comprehensive design system
- **Interactions**: `interactions.css` - Advanced animations and transitions
- **Responsive**: Conditional loading for mobile/tablet/desktop
- **Performance**: Tree shaking, conditional imports, GPU acceleration

### TypeScript
- Strict TypeScript configuration in `tsconfig.json`
- Type definitions in `src/types/`
- Component interfaces in respective model files

## Testing

### Framework
- **Jest** with React Testing Library
- Tests located in `__tests__/` directories within relevant folders
- Configuration in `jest.config.js`

### Coverage
Tests focus on:
- Service layer business logic
- Utility functions
- Error handling
- Component rendering and interactions

## Code Quality

### ESLint Configuration
- Modern ESLint flat config in `eslint.config.mjs`
- TypeScript, React, and React Hooks plugins
- Prettier integration for formatting
- Custom rules for console usage and unused variables

### Key Rules
- No unused variables (except prefixed with `_`)
- Prefer const over let/var
- Allow console methods: error, warn, info, debug
- React JSX without React import (React 17+)

## Logging System

The application uses a structured logging system:
- **Levels**: ERROR, WARN, INFO, DEBUG
- **Runtime control**: `window.logger?.setLogLevel('level')`
- **Categories**: Component-based logging (ApiService, StorageService, etc.)
- **Format**: Timestamp, level, component, message, context

## Development Workflow

### File Watching
Use `npm run dev` for development - it watches files and rebuilds automatically.

### Type Checking
TypeScript compilation happens during webpack build. Run `npm run build` to check types.

### Before Committing
1. Run `npm run lint` to check code quality
2. Run `npm test` to ensure tests pass
3. Run `npm run build` to verify production build

## Platform-Specific Notes

### Electron Security
- Content Security Policy implemented
- Preload script for secure IPC communication
- Context isolation enabled

### Build Targets
- macOS: `.app` and `.dmg` files
- Windows: `.exe` installer
- Linux: AppImage and deb packages

## Modern UI System (2025 Refactor)

### Design System
- **Color Palette**: Modern neutral colors with accent support
- **Typography**: Optimized for readability and code display
- **Spacing**: Consistent 8pt grid system
- **Shadows**: Layered depth system for visual hierarchy
- **Border Radius**: Consistent radius scale for modern aesthetics

### Interactive Systems
- **Drag & Drop**: Universal system for collections, requests, file imports
- **Keyboard Shortcuts**: Context-aware shortcuts with visual feedback
- **Resize Panels**: Advanced resize with persistence and constraints
- **Context Menus**: Smart positioning with submenu support
- **Tooltips**: Rich content with auto-positioning

### Cross-Platform Optimization
- **Platform Detection**: Automatic OS/browser detection and adaptation
- **Font Rendering**: Platform-specific optimization (macOS/Windows/Linux)
- **Scrollbars**: Native-style custom scrollbars
- **Window Controls**: Platform-appropriate spacing and behavior

### Responsive Design
- **Breakpoints**: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)
- **Adaptive UI**: Context-aware sidebar and panel behavior
- **Touch Support**: Touch-optimized interactions for tablets/mobile
- **Safe Areas**: iOS safe area support for modern devices

### Performance Features
- **CSS Tree Shaking**: Conditional loading based on features used
- **GPU Acceleration**: Hardware acceleration for smooth animations
- **Reduced Motion**: Accessibility support for motion preferences
- **High Contrast**: Enhanced accessibility for visual impairments

### Component Architecture
- **RequestPanel**: Modern form design with keyboard shortcuts and cURL import
- **ResponsePanel**: Advanced data visualization with filtering and copy actions
- **SettingsModal**: Redesigned with sidebar navigation and theme integration
- **Sidebar**: Collapsible design with smooth animations

### Keyboard Shortcuts
- `⌘+Enter` (macOS) / `Ctrl+Enter` (Windows/Linux): Send request
- `⌘+N` / `Ctrl+N`: New request
- `⌘+S` / `Ctrl+S`: Save request
- `⌘+B` / `Ctrl+B`: Toggle sidebar
- `⌘+L` / `Ctrl+L`: Focus URL input
- `?`: Show keyboard shortcuts help

### Browser Compatibility
- Full compatibility with modern browsers (Chrome, Firefox, Safari, Edge)
- No Electron-specific dependencies in UI code
- Graceful degradation for older browsers