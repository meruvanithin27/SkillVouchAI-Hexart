import { connectDB } from './db.js';

async function testConnection() {
  console.log('🔌 Testing MongoDB connection...\n');
  
  try {
    await connectDB();
    console.log('\n✅ MongoDB connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB connection test failed:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Hint: Check your username and password in MONGODB_URI');
    }
    if (error.message.includes('getaddrinfo') || error.message.includes('ENETUNREACH')) {
      console.error('\n💡 Hint: Check your cluster hostname in MONGODB_URI');
    }
    process.exit(1);
  }
}

testConnection();
