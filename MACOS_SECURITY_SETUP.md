# macOS Security Setup Guide

This document explains how to resolve macOS security warnings when distributing Curlino.

## Issue Description

When users download and try to run Curlino on macOS, they encounter a security warning:
> "Apple non è in grado di verificare che Curlino.app non contenga malware che potrebbero danneggiare il mac o compromettere la tua privacy"

This happens because the app is not code-signed with an Apple Developer Certificate.

## Solutions Implemented

### 1. Hardened Runtime Configuration

Added to `package.json` build configuration:
- `hardenedRuntime: true` - Enables Apple's Hardened Runtime
- `gatekeeperAssess: false` - Disables automatic Gatekeeper assessment during build
- Entitlements file for secure permissions

### 2. Entitlements Configuration

Created `build/entitlements.mac.plist` with:
- **Network Access**: Allows HTTP/HTTPS requests (essential for API client)
- **File System**: Read/write access for user-selected files and downloads
- **Security**: Disabled camera/microphone for privacy
- **JIT & Memory**: Allows JavaScript execution (required for Electron)

### 3. Build Scripts

Added new npm scripts:
- `npm run dist:mac` - Build signed macOS app (requires certificate)
- `npm run dist:mac:unsigned` - Build unsigned app for testing

## For End Users (Temporary Solution)

Until code signing is implemented, users can bypass the security warning:

### Method 1: Right-click and Open
1. Right-click on Curlino.app
2. Select "Open" from context menu
3. Click "Open" in the security dialog

### Method 2: System Preferences
1. Try to open the app (will show security warning)
2. Go to System Preferences → Security & Privacy
3. Click "Open Anyway" next to the Curlino message

### Method 3: Terminal Command
```bash
sudo xattr -rd com.apple.quarantine /path/to/Curlino.app
```

## For Developers (Complete Solution)

### Prerequisites
1. **Apple Developer Account** ($99/year)
2. **Developer ID Certificate** from Apple Developer Portal
3. **Notarization** setup with Apple

### Code Signing Process

1. **Get Developer ID Certificate**:
   - Log into Apple Developer Portal
   - Generate Developer ID Application Certificate
   - Download and install in Keychain

2. **Set Environment Variables**:
   ```bash
   export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"
   export CSC_KEY_PASSWORD="your_certificate_password"
   ```

3. **Build Signed App**:
   ```bash
   npm run dist:mac
   ```

4. **Notarization** (automated with electron-builder):
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_ID_PASS="app-specific-password"
   export APPLE_TEAM_ID="your_team_id"
   npm run dist:mac
   ```

### Verification

After signing and notarization:
```bash
# Check code signature
codesign -dv --verbose=4 dist/mac/Curlino.app

# Check notarization
spctl -a -t exec -vv dist/mac/Curlino.app
```

## Security Considerations

- **Minimal Permissions**: Only requests necessary entitlements
- **Network Security**: HTTPS-only for sensitive operations
- **No Sandboxing**: Required for full API client functionality
- **File Access**: Limited to user-selected files only

## Testing

Test unsigned builds with:
```bash
npm run dist:mac:unsigned
```

This creates a build that can be tested locally while development continues.

## Future Improvements

1. **Automatic Notarization**: Set up CI/CD pipeline with certificates
2. **App Store Distribution**: Consider Mac App Store deployment
3. **Security Hardening**: Regular security audits and updates