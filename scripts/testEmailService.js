// scripts/testEmailService.js
// Test script for email service - run with: node scripts/testEmailService.js

const { testEmailService } = require('../services/EmailService');

async function runTests() {
  console.log('🚀 Starting Email Service Tests...\n');

  // Test 1: Basic functionality
  console.log('Test 1: Basic email service test');
  const result1 = await testEmailService();
  console.log('Result:', result1);
  console.log('');

  // Test 2: With custom email
  console.log('Test 2: Custom email test');
  const result2 = await testEmailService('developer@example.com');
  console.log('Result:', result2);
  console.log('');

  console.log('✅ Tests completed!');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };