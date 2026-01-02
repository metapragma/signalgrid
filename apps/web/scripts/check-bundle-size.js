#!/usr/bin/env node

/**
 * Performance Budget Validator
 * Checks that the production build stays within size limits.
 *
 * Usage: node scripts/check-bundle-size.js
 * Run after: pnpm build
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Budget limits (in KB)
const BUDGET = {
  // Total JS budget (all chunks combined)
  totalJs: 500,
  // Total CSS budget
  totalCss: 100,
  // Individual chunk limit
  maxChunk: 250,
  // Total assets (everything)
  totalAssets: 1000,
};

const DIST_DIR = join(__dirname, '..', 'dist');
const ASSETS_DIR = join(DIST_DIR, 'assets');

function getFileSizeKB(filePath) {
  return statSync(filePath).size / 1024;
}

function getAllFiles(dir, files = []) {
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = join(dir, item.name);
      if (item.isDirectory()) {
        getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return files;
}

function checkBudget() {
  console.log('📊 Checking bundle size budget...\n');

  const files = getAllFiles(DIST_DIR);

  if (files.length === 0) {
    console.error('❌ No build output found. Run `pnpm build` first.');
    process.exit(1);
  }

  let totalJs = 0;
  let totalCss = 0;
  let totalAssets = 0;
  let maxChunkSize = 0;
  let maxChunkName = '';
  const violations = [];

  for (const file of files) {
    const size = getFileSizeKB(file);
    const relativePath = file.replace(DIST_DIR + '/', '');
    totalAssets += size;

    if (file.endsWith('.js')) {
      totalJs += size;
      if (size > maxChunkSize) {
        maxChunkSize = size;
        maxChunkName = relativePath;
      }
      if (size > BUDGET.maxChunk) {
        violations.push(`Chunk ${relativePath} is ${size.toFixed(1)}KB (max: ${BUDGET.maxChunk}KB)`);
      }
    } else if (file.endsWith('.css')) {
      totalCss += size;
    }
  }

  // Report
  console.log('Bundle Sizes:');
  console.log(`  Total JS:     ${totalJs.toFixed(1)}KB / ${BUDGET.totalJs}KB`);
  console.log(`  Total CSS:    ${totalCss.toFixed(1)}KB / ${BUDGET.totalCss}KB`);
  console.log(`  Total Assets: ${totalAssets.toFixed(1)}KB / ${BUDGET.totalAssets}KB`);
  console.log(`  Largest Chunk: ${maxChunkName} (${maxChunkSize.toFixed(1)}KB / ${BUDGET.maxChunk}KB)`);
  console.log('');

  // Check violations
  if (totalJs > BUDGET.totalJs) {
    violations.push(`Total JS is ${totalJs.toFixed(1)}KB (max: ${BUDGET.totalJs}KB)`);
  }
  if (totalCss > BUDGET.totalCss) {
    violations.push(`Total CSS is ${totalCss.toFixed(1)}KB (max: ${BUDGET.totalCss}KB)`);
  }
  if (totalAssets > BUDGET.totalAssets) {
    violations.push(`Total assets is ${totalAssets.toFixed(1)}KB (max: ${BUDGET.totalAssets}KB)`);
  }

  if (violations.length > 0) {
    console.log('❌ Budget violations:');
    violations.forEach((v) => console.log(`   - ${v}`));
    console.log('\nConsider:');
    console.log('  - Code splitting for large chunks');
    console.log('  - Tree shaking unused imports');
    console.log('  - Lazy loading routes');
    process.exit(1);
  }

  console.log('✅ All budgets passed!\n');
  process.exit(0);
}

checkBudget();
