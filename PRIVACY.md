# Privacy Policy

## TL;DR - Zero Data Collection 🚫📊

**Curlino collects ZERO data. Everything stays on your machine. We can't see your API keys, requests, or any other data because we never receive it.**

---

## Privacy Philosophy

Curlino is built on a **privacy-first, offline-first** architecture. Your privacy isn't just protected by policy—it's protected by design.

### 🔐 What This Means
- **No Servers**: Curlino doesn't connect to our servers (we don't have any for data collection)
- **No Analytics**: No usage tracking, crash reporting, or telemetry
- **No Accounts**: No user accounts, sign-ins, or profiles
- **No Cloud Storage**: Your data never leaves your device

## Data Collection: None ✅

### 📊 Analytics & Telemetry
**What we collect**: Nothing  
**What we track**: Nothing  
**What we analyze**: Nothing

### 🔑 API Keys & Credentials
**Where stored**: Locally on your machine only  
**Who can access**: Only you  
**Encryption**: Stored in your system's secure keychain when possible

### 📝 Request Data
**Where stored**: Local application data directory  
**Who can access**: Only you  
**Retention**: Under your complete control

### 🌐 Network Requests
**Who sees your requests**: Only the APIs you're testing  
**Curlino's involvement**: Zero - we never proxy or intercept  
**Logs**: None on our end (no servers to log to)

## Data Storage: Local Only 💾

### 📁 Where Your Data Lives
- **macOS**: `~/Library/Application Support/curlino/`
- **Windows**: `%APPDATA%\curlino\`
- **Linux**: `~/.config/curlino/`

### 🗃️ What's Stored Locally
- ✅ Your API requests and responses
- ✅ Environment variables and configurations  
- ✅ Application preferences
- ✅ Request history (if enabled)
- ✅ Groups and collections

### 🗑️ Data Deletion
**How to delete**: Simply uninstall the application or delete the data directory  
**What happens**: All data is immediately and permanently deleted  
**Recovery**: Not possible (we have no copies)

## Third-Party Services: None 🚫

### 📡 External Connections
Curlino only makes connections to:
- ✅ **Your APIs**: The endpoints you're testing (obviously)
- ✅ **Update Checks**: GitHub releases (can be disabled)
- ❌ **Analytics Services**: None
- ❌ **Error Reporting**: None
- ❌ **Advertising**: None

### 🔌 No Third-Party Integrations
- No Google Analytics
- No crash reporting services  
- No user behavior tracking
- No advertising networks
- No social media integrations

## Your Rights: Complete Control 👑

### 🎛️ What You Control
- **All data retention**: Keep or delete anything
- **Update checks**: Enable/disable in settings
- **Request history**: Configure retention period or disable
- **All preferences**: Fully customizable

### 📤 Data Portability
- **Export**: Built-in export features for requests and environments
- **Format**: Standard JSON format for easy migration
- **Backup**: Copy your data directory for full backup

## Legal Compliance 📋

### 🇪🇺 GDPR Compliance
**Status**: Compliant by design  
**Reason**: No data processing = no GDPR obligations  
**Your rights**: N/A (we have no data about you)

### 🇺🇸 CCPA Compliance  
**Status**: Not applicable  
**Reason**: No data collection = no covered business under CCPA

### 🌍 Other Privacy Laws
**Status**: Compliant globally  
**Reason**: Zero data collection model complies with all privacy regulations

## Technical Implementation 🔧

### 🏗️ Privacy by Design
- **Local Storage**: SQLite database stored locally
- **No Network Stack**: No code for transmitting user data
- **No Identifiers**: No user IDs, session IDs, or tracking identifiers
- **Secure Defaults**: Privacy-preserving settings out of the box

### 🔒 Security Measures
- **Content Security Policy**: Prevents data exfiltration
- **Context Isolation**: Sandboxed execution environment
- **No Remote Code**: Cannot execute remotely loaded code
- **Minimal Permissions**: Requests only necessary system permissions

## Updates to This Policy 📝

### 📅 Change Process
**How we update**: Only if we fundamentally change the application architecture  
**Notification**: Updated policy published with version releases  
**Backwards compatibility**: Changes will never reduce privacy protections

### 🔍 Current Version
**Version**: 1.0  
**Effective Date**: December 2024  
**Last Updated**: December 2024  
**Next Review**: December 2025

## Contact & Questions ❓

### 📧 Privacy Questions
**Email**: curlino@gmail.com  
**GitHub**: https://github.com/manueligno78/curlino/issues  
**Response Time**: Best effort within 7 days

### 🔍 Verification
Want to verify our claims? 
- ✅ **Source Code**: Fully open source - audit our code
- ✅ **Network Monitoring**: Monitor network traffic while using Curlino
- ✅ **Data Directory**: Check what's stored locally

## Trust But Verify 🕵️

### 🔍 How to Verify Our Claims
1. **Network Monitoring**: Use Wireshark or similar to monitor Curlino's network activity
2. **Source Code Audit**: Review our open source code on GitHub  
3. **Data Directory Inspection**: Check what files Curlino creates on your system
4. **Firewall Testing**: Block internet access - Curlino continues to work normally

### 📊 Transparency Report
**Data Requests Received**: 0 (impossible - we have no user data)  
**Data Shared with Authorities**: 0 (nothing to share)  
**Government Requests**: 0 (no data to request)  
**Data Breaches**: 0 (no data to breach)

---

**Bottom Line**: If you're concerned about privacy, Curlino is designed for you. We literally cannot access your data because our architecture makes it impossible. Your API testing remains completely private and under your control.

**Questions?** Open an issue on GitHub or contact us directly. We're happy to explain any aspect of our privacy approach in detail.