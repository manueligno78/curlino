# Security Policy

## Security Architecture

Curlino is designed with **privacy and security by design** principles:

### 🔒 Offline-First Architecture
- **Zero Data Collection**: Curlino does not collect, store, or transmit any user data to external servers
- **Local Storage Only**: All requests, groups, environments, and settings are stored locally on your machine
- **No Analytics**: No telemetry, usage tracking, or analytics are collected
- **No Cloud Sync**: All data remains on your device - we never see your API keys, requests, or responses

### 🛡️ Security Measures
- **Content Security Policy (CSP)**: Strict CSP implementation prevents XSS attacks
- **Context Isolation**: Electron context isolation ensures secure IPC communication
- **Sandboxed Renderer**: Renderer processes are sandboxed for additional security
- **No Remote Code Execution**: Application does not execute remote or dynamic code
- **Secure Defaults**: SSL/TLS verification enabled by default

### 📋 Data Handling
- **API Keys**: Stored locally, never transmitted to Curlino servers (we don't have any)
- **Request History**: Kept locally, user-controlled retention settings
- **Environment Variables**: Stored in local application data directory
- **Settings**: All preferences stored locally using Electron's secure storage

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

If you discover a security vulnerability in Curlino, please help us protect our users by following responsible disclosure:

### 📧 How to Report
- **Email**: curlino@gmail.com
- **GitHub**: Create a private security advisory at https://github.com/manueligno78/curlino/security/advisories/new
- **Expected Response**: We will acknowledge receipt within 48 hours and provide updates every 72 hours

### 🔍 What to Include
- **Description**: Clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue  
- **Impact Assessment**: Potential impact of the vulnerability
- **Suggested Fix**: If you have ideas for remediation

### ⏱️ Response Timeline
- **Initial Response**: Within 48 hours
- **Status Updates**: Every 72 hours until resolved
- **Fix Timeline**: Critical issues within 7 days, others within 30 days
- **Public Disclosure**: After fix is released and users have had time to update

### 🏆 Recognition
We appreciate security researchers who help keep Curlino secure:
- **Hall of Fame**: Security researchers will be credited in our SECURITY_THANKS.md (with permission)
- **Release Notes**: Acknowledgment in release notes for significant findings

## Security Best Practices for Users

### 🔐 Protecting Your Data
- **Keep Updated**: Always use the latest version of Curlino
- **Secure Your Machine**: Use full disk encryption and strong passwords
- **API Key Management**: Rotate API keys regularly, use environment variables for sensitive data
- **Review Permissions**: Regularly audit which APIs and environments you have configured

### 🌐 Network Security
- **HTTPS Only**: Use HTTPS endpoints when possible
- **Certificate Validation**: Keep SSL verification enabled unless absolutely necessary for development
- **VPN Usage**: Consider using a VPN when testing against internal APIs

## Development Security

### 🔧 Secure Development Practices
- **Dependency Scanning**: Automated dependency vulnerability scanning with Dependabot
- **Code Analysis**: Static code analysis with CodeQL and ESLint security rules
- **Regular Audits**: `npm audit` run on every build
- **Security Testing**: Security-focused tests in our test suite

### 📦 Supply Chain Security
- **Verified Dependencies**: All dependencies are verified and regularly updated
- **Lock Files**: Package-lock.json committed to ensure reproducible builds
- **Automated Updates**: Dependabot monitors and updates vulnerable dependencies

## Compliance and Standards

### 📋 Security Standards
- **OWASP**: Following OWASP Application Security Verification Standard (ASVS)
- **Electron Security**: Implementing Electron security best practices
- **Privacy by Design**: Zero data collection architecture

### 🌍 Privacy Compliance
- **GDPR**: Compliant by design (no data processing = no GDPR obligations)
- **CCPA**: Not applicable (no data collection)
- **SOC 2**: Not required (no data processing)

## Contact Information

For security-related inquiries:
- **Security Email**: curlino@gmail.com
- **GitHub Security**: https://github.com/manueligno78/curlino/security
- **General Contact**: https://github.com/manueligno78/curlino/issues

---

**Last Updated**: December 2024  
**Next Review**: March 2025