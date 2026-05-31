#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push Notifications
 * 
 * Usage: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('\n🔑 Generating VAPID Keys for Web Push Notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('✅ VAPID Keys Generated Successfully!');
console.log('=======================================\n');

console.log('📋 Add these to your Netlify Environment Variables:\n');

console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY:');
console.log(vapidKeys.publicKey);
console.log('');

console.log('VAPID_PRIVATE_KEY:');
console.log(vapidKeys.privateKey);
console.log('');

console.log('VAPID_SUBJECT:');
console.log('mailto:admin@yourdomain.com');
console.log('');

console.log('=======================================');
console.log('📝 Instructions:');
console.log('=======================================');
console.log('1. Go to Netlify Dashboard → Site Settings → Environment Variables');
console.log('2. Add the three variables above');
console.log('3. Redeploy your site');
console.log('4. Test notifications by creating an order');
console.log('');
console.log('⚠️  Keep the private key secret! Do not commit it to git.');
console.log('');
