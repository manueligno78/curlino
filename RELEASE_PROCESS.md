# Release Process for Curlino

This document explains how to create proper releases with working autoupdate functionality.

## 🎯 Overview

Curlino uses `electron-updater` for automatic updates. For this to work correctly, releases must include metadata files (`latest.yml` for Windows, `latest-mac.yml` for macOS) that contain information about the available updates.

## 🔧 Current Issue (v1.0.11 and earlier)

Release v1.0.11 and earlier were created with GitHub Actions using `--publish never`, which means:
- ❌ No `latest.yml` file was generated
- ❌ Autoupdate returns 404 errors
- ❌ Users cannot automatically update

## ✅ Fixed Workflow (v1.0.12+)

The GitHub Actions workflow has been updated to use `--publish always`, which:
- ✅ Generates `latest.yml` and `latest-mac.yml` files
- ✅ Uploads all necessary files to GitHub releases
- ✅ Enables working autoupdate for users

## 📝 Release Methods

### Method 1: Automatic via Git Tag (Recommended)

1. **Update version in package.json** (if needed):
   ```bash
   npm version patch  # or minor, major
   ```

2. **Push the tag**:
   ```bash
   git push --tags
   ```

3. **GitHub Actions will automatically**:
   - Build for Windows and macOS
   - Generate autoupdate metadata files
   - Create a GitHub release with all assets
   - Include `latest.yml` and `latest-mac.yml`

### Method 2: Manual Local Release

If you need to create a release manually:

1. **Build and publish**:
   ```bash
   npm run build
   npx electron-builder --publish always
   ```

2. **Set GitHub token** (if not set):
   ```bash
   export GH_TOKEN=your_github_token
   ```

## 📁 Required Release Assets

A complete release should contain:

### Windows
- `Curlino.Setup.1.0.X.exe` - Windows installer
- `Curlino.Setup.1.0.X.exe.blockmap` - Block map for delta updates
- `latest.yml` - **REQUIRED for autoupdate**

### macOS
- `Curlino-1.0.X.dmg` - macOS installer (x64)
- `Curlino-1.0.X-arm64.dmg` - macOS installer (ARM64)
- `latest-mac.yml` - **REQUIRED for autoupdate**

## 🔍 Verifying a Release

After creating a release, verify it contains autoupdate files:

1. **Check GitHub release page**:
   - Visit: https://github.com/manueligno78/curlino/releases/latest
   - Verify `latest.yml` is listed in assets

2. **Test autoupdate URL**:
   ```bash
   curl https://github.com/manueligno78/curlino/releases/download/v1.0.X/latest.yml
   ```
   Should return YAML content, not 404.

3. **Test in app**:
   - Install previous version
   - Click "Check for Updates"
   - Should detect new version (not show 404 error)

## 🚨 Troubleshooting

### "Cannot find latest.yml" Error

This error occurs when:
- Release was created without autoupdate metadata
- The workflow used `--publish never`
- Files were uploaded manually without proper naming

**Solution**: Create a new release using the updated workflow.

### Version Mismatch

If `latest.yml` shows wrong version:
- Ensure `package.json` version matches Git tag
- Rebuild with correct version: `npm version X.Y.Z --no-git-tag-version`

## 📋 Pre-Release Checklist

Before creating a release:

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` (if exists)
- [ ] Run tests: `npm test`
- [ ] Run quality checks: `npm run quality`
- [ ] Test build locally: `npm run build`
- [ ] Push all changes
- [ ] Create and push Git tag
- [ ] Monitor GitHub Actions workflow
- [ ] Verify release assets include `*.yml` files
- [ ] Test autoupdate from previous version

## 🔄 Migration for Existing Users

Users on v1.0.11 and earlier will see "Cannot find latest.yml" errors until they manually update to v1.0.12+. After that, autoupdate will work normally.

Consider notifying users about this one-time manual update requirement.