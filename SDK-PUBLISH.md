# x402 SDK Publishing Guide

Step-by-step instructions for publishing the @agent-bazaar/x402-sdk to npm and creating the GitHub repository.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Pre-Publishing Checklist

✅ **Code Quality**
- [x] All TypeScript errors fixed
- [x] Comprehensive JSDoc documentation added
- [x] Build passes successfully (`npm run build`)
- [x] All source files cleaned up and production-ready
- [x] README.md enhanced with comprehensive documentation

✅ **Package Configuration**
- [x] `package.json` has correct metadata
- [x] Version number is appropriate (currently 0.1.0)
- [x] Entry points (`main`, `types`) are correct
- [x] `files` array includes only `dist` directory
- [x] License is set to MIT
- [x] Keywords are relevant and discoverable

## Step 1: Final Code Review

### 1.1 Verify Build Output
```bash
cd /Users/tylerkenney/Desktop/agent-bazaar/packages/x402-sdk
npm run build
ls -la dist/
```

Expected output:
- `dist/index.js` - Main entry point
- `dist/index.d.ts` - TypeScript declarations
- `dist/*.js` - All compiled source files
- `dist/*.d.ts` - All type declaration files

### 1.2 Test the Package Locally
```bash
# Pack the package to test installation
npm pack

# This creates a .tgz file - test installing it in a separate project
cd /tmp
mkdir test-x402-sdk
cd test-x402-sdk
npm init -y
npm install /Users/tylerkenney/Desktop/agent-bazaar/packages/x402-sdk/agent-bazaar-x402-sdk-0.1.0.tgz

# Test imports work correctly
node -e "console.log(require('@agent-bazaar/x402-sdk'))"
```

## Step 2: GitHub Repository Setup

### 2.1 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `x402-sdk`
3. Description: Use the short description from `GITHUB_REPO_DESCRIPTION.md`
4. Set to **Public**
5. **Don't** initialize with README (we have our own)
6. Create repository

### 2.2 Configure Repository Settings
1. Go to repository **Settings**
2. **General** → Repository name and description
3. **Topics** → Add all tags from `GITHUB_REPO_DESCRIPTION.md`
4. **Features** → Enable Issues, Projects, Wiki as needed

### 2.3 Push Code to GitHub
```bash
cd /Users/tylerkenney/Desktop/agent-bazaar/packages/x402-sdk

# Initialize git if not already done
git init
git add .
git commit -m "Initial release: x402 SDK v0.1.0

- Express/Connect middleware for payment-gated APIs
- Client SDK for discovering and calling paid capabilities
- Registry functions for capability management
- Full TypeScript support with comprehensive JSDoc
- Multi-chain payment support (Base, Ethereum)
- Usage analytics and monitoring
- Production-ready with custom payment validation"

# Add GitHub remote (replace with your actual repo URL)
git remote add origin https://github.com/agent-bazaar/x402-sdk.git
git branch -M main
git push -u origin main
```

### 2.4 Create GitHub Release
1. Go to **Releases** → **Create a new release**
2. Tag version: `v0.1.0`
3. Release title: `v0.1.0 - Initial Release`
4. Description: Use the release notes template from `GITHUB_REPO_DESCRIPTION.md`
5. **Publish release**

## Step 3: npm Publishing

### 3.1 Setup npm Account
```bash
# Login to npm (create account at npmjs.com if needed)
npm login
```

### 3.2 Verify Package Details
```bash
cd /Users/tylerkenney/Desktop/agent-bazaar/packages/x402-sdk

# Check what will be published
npm publish --dry-run

# Verify package.json details
cat package.json
```

Expected package.json should include:
```json
{
  "name": "@agent-bazaar/x402-sdk",
  "version": "0.1.0",
  "description": "x402 payment protocol SDK for Agent Bazaar — middleware for providers, client for agents",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "keywords": ["x402", "agent", "payment", "middleware", "bazaar"],
  "license": "MIT"
}
```

### 3.3 Publish to npm
```bash
# Publish the package
npm publish

# If this is the first scoped package for @agent-bazaar, you may need:
npm publish --access public
```

### 3.4 Verify Publication
```bash
# Check the package exists and is installable
npm view @agent-bazaar/x402-sdk

# Test installation in a clean directory
cd /tmp
mkdir verify-npm-publish
cd verify-npm-publish
npm init -y
npm install @agent-bazaar/x402-sdk
node -e "console.log(Object.keys(require('@agent-bazaar/x402-sdk')))"
```

## Step 4: Post-Publishing Tasks

### 4.1 Update Package Documentation
1. **npm page**: Verify the README displays correctly at https://www.npmjs.com/package/@agent-bazaar/x402-sdk
2. **GitHub README**: Ensure badges are working and links are correct
3. **Documentation site**: If applicable, update docs.agentbazaar.xyz

### 4.2 Social Media Announcement
Use the social media copy from `GITHUB_REPO_DESCRIPTION.md`:

**Twitter/X:**
```
🚀 Just released the x402 SDK! Turn any API into a paid service that AI agents can discover and use automatically. 

💰 5-minute setup with Express middleware
🤖 TypeScript-first for full type safety  
⛓️ Multi-chain payment support
📊 Built-in analytics and monitoring

https://github.com/agent-bazaar/x402-sdk
https://www.npmjs.com/package/@agent-bazaar/x402-sdk

#AI #SDK #Micropayments
```

### 4.3 Community Outreach
- Post in relevant Discord servers
- Share on Reddit (r/typescript, r/nodejs, r/ethereum)
- Submit to Product Hunt
- Add to awesome lists and resource collections

## Step 5: Maintenance Setup

### 5.1 GitHub Actions (Optional)
Create `.github/workflows/ci.yml`:
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm test
```

### 5.2 Dependabot (Optional)
Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 5.3 Issue Templates
Create `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md` for better issue management.

## Future Releases

### Version Numbering
- **Patch (0.1.1)**: Bug fixes, documentation updates
- **Minor (0.2.0)**: New features, backwards compatible
- **Major (1.0.0)**: Breaking changes

### Release Process
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Commit changes
4. Create git tag: `git tag v0.1.1`
5. Push: `git push origin main --tags`
6. Publish to npm: `npm publish`
7. Create GitHub release

## Troubleshooting

### Common Issues

**npm publish fails with "package already exists"**
- Increment version number in package.json
- Use `npm version patch/minor/major` to auto-increment

**TypeScript build fails**
- Check all imports and exports
- Ensure all dependencies are installed
- Verify tsconfig.json is correct

**Package not installing correctly**
- Check `files` array in package.json
- Verify `main` and `types` point to correct files
- Test with `npm pack` and local installation

**GitHub push fails**
- Check repository permissions
- Verify remote URL is correct
- Ensure you're authenticated with GitHub

## Success Metrics

Track these metrics post-launch:
- **npm downloads**: https://npm-stat.com/charts.html?package=@agent-bazaar/x402-sdk
- **GitHub stars**: Watch the repository star count
- **Issues/PRs**: Monitor community engagement
- **Community adoption**: Track mentions on social media and in projects

---

**Ready to publish?** Follow these steps in order and your x402 SDK will be available to developers worldwide! 🚀
