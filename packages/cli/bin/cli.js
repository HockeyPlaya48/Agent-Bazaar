#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Check if we're running from source or built
const srcPath = path.join(__dirname, '../src/cli.ts');
const distPath = path.join(__dirname, '../dist/cli.js');

if (fs.existsSync(distPath)) {
  // Production: use compiled version
  require(distPath);
} else if (fs.existsSync(srcPath)) {
  // Development: use ts-node
  require('ts-node/register');
  require(srcPath);
} else {
  console.error('CLI not found. Please run `npm run build` first.');
  process.exit(1);
}