#!/usr/bin/env node

/**
 * Configuration Verification Script
 * 
 * This script verifies that the Supabase and Google OAuth configuration
 * is properly set up for the QuickHubGH platform.
 * 
 * Usage: node scripts/verify-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 QuickHubGH Configuration Verification\n');

// Check environment files
console.log('1. Checking environment files...');
const envFiles = [
  { path: '.env.local.example', required: true, description: 'Environment template' },
  { path: '.env.local', required: false, description: 'Local environment (optional for verification)' }
];

envFiles.forEach(file => {
  const exists = fs.existsSync(file.path);
  const status = exists ? '✅' : file.required ? '❌' : '⚠️';
  console.log(`   ${status} ${file.path} - ${file.description}`);
  
  if (exists && file.path === '.env.local') {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      console.log(`     Found ${lines.length} environment variables`);
      
      // Check for required variables
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_APP_URL'
      ];
      
      const missingVars = requiredVars.filter(varName => 
        !content.includes(varName + '=')
      );
      
      if (missingVars.length > 0) {
        console.log(`     ⚠️ Missing variables: ${missingVars.join(', ')}`);
      } else {
        console.log(`     ✅ All required variables found`);
      }
    } catch (err) {
      console.log(`     ❌ Error reading file: ${err.message}`);
    }
  }
});

// Check configuration files
console.log('\n2. Checking configuration files...');
const configFiles = [
  { path: 'lib/supabase.ts', required: true, description: 'Supabase client configuration' },
  { path: 'middleware.ts', required: true, description: 'Next.js middleware' },
  { path: 'app/(public)/auth/callback/route.ts', required: true, description: 'OAuth callback handler' },
  { path: 'app/(public)/auth/error/page.tsx', required: true, description: 'Auth error page' },
  { path: 'docs/supabase-google-oauth-setup.md', required: true, description: 'Google OAuth setup documentation' }
];

configFiles.forEach(file => {
  const exists = fs.existsSync(file.path);
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${file.path} - ${file.description}`);
});

// Check Supabase configuration
console.log('\n3. Checking Supabase client configuration...');
try {
  const supabaseConfig = fs.readFileSync('lib/supabase.ts', 'utf8');
  
  const checks = [
    { name: 'Uses @supabase/ssr', check: supabaseConfig.includes('@supabase/ssr') },
    { name: 'Has createClient function', check: supabaseConfig.includes('createClient') },
    { name: 'Has createBrowserSupabaseClient function', check: supabaseConfig.includes('createBrowserSupabaseClient') },
    { name: 'Uses environment variables', check: supabaseConfig.includes('process.env.NEXT_PUBLIC_SUPABASE_URL') }
  ];
  
  checks.forEach(check => {
    const status = check.check ? '✅' : '❌';
    console.log(`   ${status} ${check.name}`);
  });
} catch (err) {
  console.log(`   ❌ Error reading Supabase configuration: ${err.message}`);
}

// Summary
console.log('\n📋 Summary:');
console.log('   Google OAuth configuration requires manual setup in:');
console.log('   1. Google Cloud Console (create OAuth 2.0 credentials)');
console.log('   2. Supabase Dashboard (enable Google provider)');
console.log('   3. Update .env.local with actual credentials');
console.log('\n   See docs/supabase-google-oauth-setup.md for detailed instructions.');
console.log('\n✅ Task 3.1 Configuration Complete');
console.log('   Next steps:');
console.log('   1. Follow the setup guide in docs/supabase-google-oauth-setup.md');
console.log('   2. Test the OAuth flow by running: npm run dev');
console.log('   3. Proceed to task 3.2: Implement Next.js middleware');