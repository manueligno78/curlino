# Contributing to Curlino

Thank you for your interest in contributing to Curlino! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 18.x or 20.x
- npm
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/your-username/curlino.git
   cd curlino
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run the development version:
   ```bash
   npm start
   ```

### Development Scripts

- `npm start` - Build and run the Electron app
- `npm run dev` - Start webpack in watch mode
- `npm run build` - Build for development
- `npm run build-prod` - Build for production
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run quality` - Run all quality checks (lint + format + test)

## Code Quality Standards

### Code Style

- We use **Prettier** for code formatting
- We use **ESLint** for code quality and consistency
- All code must pass quality checks before merging

### Pre-commit Hooks

- Quality checks run automatically before each commit
- Failed checks will prevent commits until issues are resolved

### Testing

- Write tests for new features and bug fixes
- Maintain or improve test coverage
- All tests must pass before merging

## Pull Request Process

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our code standards

3. **Run quality checks**:

   ```bash
   npm run quality
   ```

4. **Commit your changes** with a clear commit message:

   ```bash
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** using our PR template

### Commit Message Format

We follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Maintenance tasks

## Architecture Guidelines

### File Structure

```
src/
├── components/     # React components
├── models/         # Data models
├── services/       # Business logic services
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── renderer/       # Main renderer process files
```

### Code Organization

- Keep components small and focused
- Use TypeScript for type safety
- Follow the existing patterns for consistency
- Add tests for new functionality

### Logging

- Use the structured logging system (`BrowserLogger`)
- Include appropriate context in log messages
- Use appropriate log levels (ERROR, WARN, INFO, DEBUG)

## Reporting Issues

### Bug Reports

- Use the bug report template
- Include steps to reproduce
- Provide system information
- Include relevant logs if available

### Feature Requests

- Use the feature request template
- Explain the problem you're trying to solve
- Describe your proposed solution
- Consider alternative approaches

## Security

If you discover a security vulnerability, please email us directly instead of opening a public issue.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing to Curlino! 🚀
