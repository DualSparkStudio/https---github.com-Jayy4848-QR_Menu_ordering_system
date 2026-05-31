#!/usr/bin/env node
/**
 * Sync Prisma schemas across the monorepo
 * Source of truth: whole/backend/prisma/schema.prisma
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '../whole/backend/prisma/schema.prisma');
const TARGETS = [
  path.join(__dirname, '../whole/guest-app/prisma/schema.prisma'),
  path.join(__dirname, '../netlify/functions/prisma/schema.prisma'),
];

console.log('🔄 Syncing Prisma schemas...\n');

// Read source schema
const sourceContent = fs.readFileSync(SOURCE, 'utf8');
console.log(`✓ Read source: ${SOURCE}`);

// Copy to targets
let syncedCount = 0;
for (const target of TARGETS) {
  try {
    // Ensure directory exists
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write schema
    fs.writeFileSync(target, sourceContent, 'utf8');
    console.log(`✓ Synced to: ${target}`);
    syncedCount++;
  } catch (error) {
    console.error(`✗ Failed to sync ${target}:`, error.message);
  }
}

console.log(`\n✅ Synced ${syncedCount}/${TARGETS.length} schemas`);
console.log('\n💡 Remember to run "npx prisma generate" in each project after schema changes');
